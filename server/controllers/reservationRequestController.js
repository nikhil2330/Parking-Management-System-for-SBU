// server/controllers/reservationRequestController.js
const ReservationRequest = require('../models/ReservationRequest');
const Reservation = require('../models/Reservation');
const ParkingSpot = require('../models/ParkingSpot');
const mongoose = require('mongoose');

// helper – returns array of Dates for each day in [start,end] (inclusive)
function enumerateDates(start, end) {
  const arr = [], cur = new Date(start);
  while (cur <= end) { arr.push(new Date(cur)); cur.setUTCDate(cur.getUTCDate() + 1); }
  return arr;
}

/* ──────────────────────────────────────────────────────────────── */
/*  1.  USER submits a daily / semester *request*                   */
/* ──────────────────────────────────────────────────────────────── */
exports.createRequest = async (req, res) => {
  const { spotId, type, startDate, endDate, startTime, endTime, semester } = req.body;
  const userId = req.user.id;

  /* ── resolve spot _id ────────────────────────────────────────── */
  let spotObjectId;
  if (mongoose.Types.ObjectId.isValid(spotId)) {
    spotObjectId = spotId;
  } else {
    const spotDoc = await ParkingSpot.findOne({ spotId });
    if (!spotDoc) return res.status(404).json({ error: 'Parking spot not found' });
    spotObjectId = spotDoc._id;
  }

  /* ── 15-day guard for daily ─────────────────────────────────── */
  if (type === 'daily') {
    const sDate = new Date(startDate), eDate = new Date(endDate);
    if ((eDate - sDate) / 864e5 > 15) {
      return res.status(400).json({ error: 'Daily reservations limited to 15 days' });
    }
  }

  /* ── pre-flight overlap check ───────────────────────────────── */
  const clashes = await findOverlaps(
    spotObjectId,
    type,
    { startDate, endDate, startTime, endTime, semester }
  );
  if (clashes.length) {
    return res.status(409).json({
      error: 'Spot already reserved for one or more requested windows',
      conflicts: clashes            // ← array of {startTime,endTime}
    });
  }

  /* ── create pending request ─────────────────────────────────── */
  const doc = await ReservationRequest.create({
    user: userId,
    spot: spotObjectId,
    type,
    startDate,
    endDate,
    startTime,
    endTime,
    semester
  });
  res.json(doc);
};

/* ---------- helper: return *all* conflicting windows ----------- */
async function findOverlaps(spotId, type, p) {
  if (type === 'semester') {
    const { startDate, endDate } = semesterToDates(p.semester);
    return await Reservation
      .find({
        spot: spotId,
        status: { $in: ['pending', 'active'] },
        startTime: { $lt: endDate },
        endTime: { $gt: startDate }
      })
      .select('startTime endTime -_id');
  }

  // daily
  const windows = [];
  const days = enumerateDates(p.startDate, p.endDate);
  for (const d of days) {
    const s = new Date(`${d.toISOString().slice(0, 10)}T${p.startTime}:00Z`);
    const e = new Date(`${d.toISOString().slice(0, 10)}T${p.endTime}:00Z`);
    const hit = await Reservation.findOne({
      spot: spotId,
      status: { $in: ['pending', 'active'] },
      startTime: { $lt: e },
      endTime: { $gt: s }
    }).select('startTime endTime -_id');
    if (hit) windows.push(hit);
  }
  return windows;
}

/* ──────────────────────────────────────────────────────────────── */
/*  2.  ADMIN approves / rejects                                   */
/* ──────────────────────────────────────────────────────────────── */
exports.listPending = async (_req, res) => {
  const docs = await ReservationRequest.find({ status: 'pending' })
    .populate('spot')
    .populate('user');
  res.json(docs);
};

exports.approve = async (req, res) => {
  const { id } = req.params;
  const reqDoc = await ReservationRequest.findById(id).populate('spot');
  if (!reqDoc) return res.status(404).json({ error: 'Not found' });
  if (reqDoc.status !== 'pending')
    return res.status(400).json({ error: 'Already decided' });

  let conflictDoc = null;                       // will capture any clash
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (reqDoc.type === 'semester') {
        /* ---------- SEMESTER branch ---------------------------- */
        const { startDate, endDate } = semesterToDates(reqDoc.semester);

        conflictDoc = await Reservation.findOne({
          spot: reqDoc.spot,
          status: { $in: ['pending', 'active'] },
          startTime: { $lt: endDate },
          endTime: { $gt: startDate }
        });

        if (conflictDoc) throw new Error('conflict');

        await Reservation.create([{ 
          user: reqDoc.user,
          spot: reqDoc.spot,
          lot: reqDoc.spot.lot,
          startTime: startDate,
          endTime: endDate,
          status: 'pending',
          reservationType: 'semester',
          parentRequest: reqDoc._id,
          totalPrice: (() => {                  // $2.50 × 24h × days
            const days = Math.ceil((endDate - startDate) / 864e5) + 1;
            return days * 24 * 2.5;
          })()
        }], { session });
        /* ────────── DAILY branch ────────── */
      } else {          // daily
        const dates = enumerateDates(reqDoc.startDate, reqDoc.endDate);

        /* -- compute once, reuse -- */
        const [sh, sm] = reqDoc.startTime.split(':').map(Number);
        const [eh, em] = reqDoc.endTime.split(':').map(Number);
        let minutes = (eh * 60 + em) - (sh * 60 + sm);
        if (minutes <= 0) minutes += 24 * 60;    // safety for cross-midnight
        const hoursPerDay = minutes / 60;
        const pricePerDay = hoursPerDay * 2.5;   // $2.50 / hour

        /* conflict pass */
        for (const d of dates) {
          const start = new Date(`${d.toISOString().slice(0, 10)}T${reqDoc.startTime}:00Z`);
          const end = new Date(`${d.toISOString().slice(0, 10)}T${reqDoc.endTime}:00Z`);
          const conflict = await Reservation.findOne({
            spot: reqDoc.spot,
            status: { $in: ['pending', 'active'] },
            $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }]
          });
          if (conflict) {
            conflictDoc = conflict;         
            throw new Error('conflict');
          }
        }

        /* insert pass */
        const bulk = dates.map(d => {
          const start = new Date(`${d.toISOString().slice(0, 10)}T${reqDoc.startTime}:00Z`);
          const end = new Date(`${d.toISOString().slice(0, 10)}T${reqDoc.endTime}:00Z`);
          return {
            user: reqDoc.user,
            spot: reqDoc.spot,
            lot: reqDoc.spot.lot,
            startTime: start,
            endTime: end,
            status: 'pending',
            reservationType: 'daily',
            parentRequest: reqDoc._id,
            totalPrice: pricePerDay
          };
        });
        await Reservation.insertMany(bulk, { session });
      }


      // mark request approved
      reqDoc.status = 'approved';
      await reqDoc.save({ session });
    });

    res.json({ ok: true });

  } catch (err) {
    if (err.message === 'conflict') {
      console.log('[APPROVE] conflict →', conflictDoc);
      return res.status(409).json({
        error: 'Spot conflict on at least one requested day',
        conflict: conflictDoc
      });
    }
    console.error('[APPROVE] unexpected error:', err);
    res.status(500).json({ error: 'Internal error' });
  } finally {
    session.endSession();
  }
};

exports.reject = async (req, res) => {
  const { id } = req.params;
  const doc = await ReservationRequest.findByIdAndUpdate(
    id,
    { status: 'rejected' },
    { new: true }
  );
  res.json(doc);
};

/* ──────────────────────────────────────────────────────────────── */
/*  helpers                                                        */
/* ──────────────────────────────────────────────────────────────── */
function semesterToDates(sem) {
  const year = new Date().getUTCFullYear();       // naive – current year
  switch (sem) {
    case 'spring': return {
      startDate: new Date(`${year}-01-20T00:00:00Z`),
      endDate: new Date(`${year}-05-15T23:59:59Z`)
    };
    case 'summer': return {
      startDate: new Date(`${year}-05-20T00:00:00Z`),
      endDate: new Date(`${year}-08-10T23:59:59Z`)
    };
    case 'fall': return {
      startDate: new Date(`${year}-08-20T00:00:00Z`),
      endDate: new Date(`${year}-12-20T23:59:59Z`)
    };
  }
}
