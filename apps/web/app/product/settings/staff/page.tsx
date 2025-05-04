// --- app/product/settings/staff/page.tsx ---
'use client';
import React, { useEffect, useState } from 'react';
import StaffForm from './StaffForm';
import StaffTable from './StaffTable';

export default function StaffSettingsPage() {
  const [staff, setStaff] = useState([]);

  const fetchStaff = async () => {
    const res = await fetch('/api/staff');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setStaff(data);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6">
      <StaffForm onCreated={fetchStaff} />
      <StaffTable staff={staff} />
    </div>
  );
}