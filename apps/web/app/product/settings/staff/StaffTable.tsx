// --- app/product/settings/staff/StaffTable.tsx ---
'use client';
import React from 'react';

export default function StaffTable({ staff }: { staff: any[] }) {
  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th>Email</th>
          <th>Full Name</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {staff.map((s) => (
          <tr key={s.id}>
            <td>{s.email}</td>
            <td>{s.full_name}</td>
            <td>{s.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}