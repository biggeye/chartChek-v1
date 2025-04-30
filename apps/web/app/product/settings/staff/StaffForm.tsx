// --- app/product/settings/staff/StaffForm.tsx ---
'use client';
import React, { useState, useEffect } from 'react';
import { createServer } from '~/utils/supabase/server';
import { getCurrentUserId } from '~/utils/supabase/user';

export default function StaffForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'counselor',
    facility_ids: [] as string[],
  });
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const accountId = getCurrentUserId();

  useEffect(() => {
    fetch('/api/facilities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFacilities(data);
        } else {
          console.error('Unexpected facility response:', data);
          setFacilities([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching facilities:', err);
        setFacilities([]);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFacilityToggle = (facility_id: string) => {
    setForm((prev) => {
      const current = new Set(prev.facility_ids);
      if (current.has(facility_id)) {
        current.delete(facility_id);
      } else {
        current.add(facility_id);
      }
      return { ...prev, facility_ids: Array.from(current) };
    });
  };

  const handleSubmit = async () => {
    if (!accountId) return alert('Unable to resolve account ID');

    setLoading(true);
    const res = await fetch('/api/staff/create', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        account_id: accountId,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    setLoading(false);
    if (!res.ok) return alert('Error creating staff');
    setForm({ email: '', full_name: '', role: 'counselor', facility_ids: [] });
    onCreated();
  };

  return (
    <div className="mb-6 border p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-2">Add Staff Member</h2>
      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="input"
      />
      <input
        name="full_name"
        value={form.full_name}
        onChange={handleChange}
        placeholder="Full Name"
        className="input"
      />
      <select name="role" value={form.role} onChange={handleChange} className="input">
        <option value="counselor">Counselor</option>
        <option value="admin">Admin</option>
      </select>

      <div className="my-3">
        <p className="font-medium mb-1">Facility Access</p>
        {facilities.map((f) => (
          <label key={f.id} className="block">
            <input
              type="checkbox"
              checked={form.facility_ids.includes(f.id)}
              onChange={() => handleFacilityToggle(f.id)}
              className="mr-2"
            />
            {f.name}
          </label>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading} className="btn mt-2">
        {loading ? 'Creating...' : 'Create Staff'}
      </button>
    </div>
  );
}