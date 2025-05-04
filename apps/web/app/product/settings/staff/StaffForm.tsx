// --- app/product/settings/staff/StaffForm.tsx ---
'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '~/utils/supabase/client'; // Use client Supabase for fetching facilities
import { getCurrentUserId } from '~/utils/supabase/user';

// Import UI components from @kit/ui
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select'; // Assuming Select exists
import { Checkbox } from '@kit/ui/checkbox'; // Assuming Checkbox exists
import { Alert, AlertDescription } from '@kit/ui/alert'; // For potential errors
import { Loader2 } from 'lucide-react'; // For loading indicator

// Define Facility type based on expected data
interface Facility {
  id: string;
  name: string;
  // Add other relevant fields if needed
}

export default function StaffForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'counselor', // Default role
    facility_ids: [] as string[],
  });
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const supabase = createClient(); // Initialize Supabase client

  // Fetch Account ID on mount
  useEffect(() => {
    getCurrentUserId()
      .then((id) => {
        if (!id) throw new Error('User not logged in.');
        setAccountId(id);
      })
      .catch((err) => {
        console.error('Account ID resolution failed:', err);
        setError('Failed to identify current user. Please ensure you are logged in.');
      });
  }, []);

  // Fetch Facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      // Ensure accountId is available before fetching facilities tied to it
      if (!accountId) return; 

      try {
        // Fetch facilities associated with the current account
        const { data, error } = await supabase
          .from('facilities') // Adjust table name if different
          .select('id, name') // Select necessary fields
          .eq('account_id', accountId); // Filter by account_id

        if (error) throw error;

        if (Array.isArray(data)) {
          setFacilities(data as Facility[]);
        } else {
          console.error('Unexpected facility response:', data);
          setFacilities([]);
          setError('Failed to load facilities.');
        }
      } catch (err: any) {
        console.error('Error fetching facilities:', err);
        setFacilities([]);
        setError(err.message || 'An error occurred while fetching facilities.');
      }
    };

    fetchFacilities();
  }, [accountId, supabase]); // Re-run if accountId or supabase client changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setForm({ ...form, role: value });
  };

  const handleFacilityToggle = (facility_id: string) => {
    setForm((prev) => ({
      ...prev,
      facility_ids: prev.facility_ids.includes(facility_id)
        ? prev.facility_ids.filter((id) => id !== facility_id)
        : [...prev.facility_ids, facility_id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (!accountId) {
      setError('Cannot create staff member: User account ID is missing.');
      return;
    }
    if (form.facility_ids.length === 0) {
      setError('Please select at least one facility for the staff member.');
      return;
    }

    setLoading(true);
    setError(null); // Clear previous errors
    console.log('Sending account_id to API:', accountId, typeof accountId);

    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          account_id: accountId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to create staff: ${res.statusText}`);
      }

      // Reset form and trigger callback on success
      setForm({ email: '', full_name: '', role: 'counselor', facility_ids: [] });
      onCreated();

    } catch (err: any) {
      console.error("Staff creation failed:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add New Staff Member</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="staff@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            {/* Using @kit/ui/select */}
            <Select name="role" value={form.role} onValueChange={handleRoleChange} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="counselor">Counselor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {/* Add other roles as needed */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Facility Access</Label>
             {facilities.length === 0 && !error && <p className="text-sm text-muted-foreground">Loading facilities...</p>}
             {facilities.length === 0 && error && <p className="text-sm text-destructive">Could not load facilities.</p>}
            <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border p-2">
              {facilities.map((facility) => (
                <div key={facility.id} className="flex items-center space-x-2">
                   {/* Using @kit/ui/checkbox */}
                  <Checkbox
                    id={`facility-${facility.id}`}
                    checked={form.facility_ids.includes(facility.id)}
                    onCheckedChange={() => handleFacilityToggle(facility.id)}
                  />
                  <Label htmlFor={`facility-${facility.id}`} className="font-normal">
                    {facility.name}
                  </Label>
                </div>
              ))}
            </div>
             {form.facility_ids.length === 0 && !error && (
                 <p className="text-sm text-muted-foreground">Select at least one facility.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !accountId || facilities.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Staff Member'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
