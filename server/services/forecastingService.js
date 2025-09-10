const OccupancySnapshot = require('../models/OccupancySnapshot');
const ParkingLot = require('../models/ParkingLot');
const Reservation = require('../models/Reservation');
const ParkingSpot = require('../models/ParkingSpot');

async function getPopularTimes(lotId) {
  const lot = await ParkingLot.findOne({ lotId });
  if (!lot) throw new Error(`Parking lot ${lotId} not found`);
  const capacity = lot.capacity || lot.availability?.total || 0;

  // 1. Get historical averages from snapshots
  const snapshots = await OccupancySnapshot.find({ lotId });

  // 2. Get future reservations for the next 7 days (overlay)
  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + (6 - now.getDay()) + 1);
  const lotSpots = await ParkingSpot.find({ lot: lot._id }).select('_id');
  const spotIds = lotSpots.map(s => s._id);
  const futureReservations = await Reservation.find({
    spot: { $in: spotIds },
    status: { $in: ['pending', 'active'] },
    startTime: { $lt: weekAhead },
    endTime: { $gt: now }
  }).select('startTime endTime');

  // 3. Build forecast for all 7 days
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const popularTimes = [];
  for (let offset = 0; offset < 7; offset++) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() + offset);
    const day = dayDate.getDay();
    const hoursArray = [];
    for (let hour = 0; hour < 24; hour++) {
      // Historical average from snapshot
      const snap = snapshots.find(s => Number(s.dayOfWeek) === Number(day) && Number(s.hour) === Number(hour)); 
      const histAvg = snap ? snap.avgReserved : 0;

      // Future reservations for this hour
      const hourStart = new Date(dayDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1);

      let futureReserved = 0;
      for (const res of futureReservations) {
        if (res.startTime < hourEnd && res.endTime > hourStart) {
          futureReserved++;
        }
      }

      // Forecast: max of historical average and future reservations
      const avgReserved = Math.max(histAvg, futureReserved);
      const avgAvailable = Math.max(0, capacity - avgReserved);
      hoursArray.push({
        hour,
        average: Math.round(avgAvailable)
      });
    }
    popularTimes.push({
      dayOfWeek: day,
      dayName: daysOfWeek[day],
      hours: hoursArray
    });
  }
  return popularTimes;
}

module.exports = {
  getPopularTimes
};