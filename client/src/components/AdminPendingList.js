// client/components/AdminPendingList.js
import React, { useEffect, useState } from 'react';
import ReservationService from '../services/ReservationService';
import './AdminPendingList.css';

export default function AdminPendingList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setRequests(await ReservationService.listPendingRequests());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handle = async (id, decision) => {
    try {
      if (decision === 'approve') {
        await ReservationService.approveRequest(id);
      } else {
        await ReservationService.rejectRequest(id);
      }
      await load();                 // refresh list after success
    } catch (err) {
      // Show a friendly message on conflict; fall back to generic error otherwise
      if (err.response?.status === 409) {
        console.error('Conflict details:', err.response.data.conflict);
        alert(
          'Cannot approve – overlaps with:\n' +
          JSON.stringify(err.response.data.conflict, null, 2)
        );
      } else {
        alert(err.message || 'Action failed, check console for details.');
      }
      console.error(err);
    }
  };

  if (loading) return <p>Loading pending requests…</p>;
  if (!requests.length) return <p>No pending requests 🎉</p>;

  return (
    <table className="admin-pending">
      <thead>
        <tr>
          <th>User</th><th>Spot</th><th>Type</th>
          <th>Range / Semester</th><th></th>
        </tr>
      </thead>
      <tbody>
        {requests.map(r => (
          <tr key={r._id}>
            <td>{r.user.email}</td>
            <td>
              {typeof r.spot === 'string'
                ? r.spot.substring(0, 8)          /* raw ObjectId */
                : r.spot.spotId || '—'}
            </td>
            <td>{r.type}</td>
            <td>
              {r.type === 'daily'
                ? `${new Date(r.startDate).toLocaleDateString()} → ${new Date(r.endDate).toLocaleDateString()} (${r.startTime}-${r.endTime})`
                : r.semester.charAt(0).toUpperCase() + r.semester.slice(1)}
            </td>
            <td>
              <button onClick={() => handle(r._id, 'approve')}>Approve</button>
              <button onClick={() => handle(r._id, 'reject')}>Reject</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
