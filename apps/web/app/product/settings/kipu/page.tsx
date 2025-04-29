'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Info, Key, Lock, User, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert as CustomAlert, AlertTitle, AlertDescription } from '@kit/ui/alert';
import { createClient } from '~/utils/supabase/client';
import { useFacilityStore } from '~/store/patient/facilityStore';
import type { UserApiSettings } from 'types/store/user';

export default function KipuSettings() {

  
  const currentFacilityId = useFacilityStore((state) => state.currentFacilityId);
  const [apiSettings, setApiSettings] = useState<UserApiSettings>({
    kipu_access_id: '',
    kipu_secret_key: '',
    kipu_app_id: '',
    kipu_api_endpoint: '',
    has_api_key_configured: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadApiSettings();
  }, []);

  const loadApiSettings = async () => {
    try {
      const response = await fetch('/api/kipu/config');
      if (!response.ok) throw new Error(response.statusText);
      const data: UserApiSettings = await response.json();
      setApiSettings(data);
    } catch (err) {
      console.warn('Failed to load KIPU settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const supabase = createClient();
      const user = await supabase.auth.getUser();
      const res = await fetch('/api/kipu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiSettings),
      });
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      // sync facilities
      const facRes = await fetch('/api/kipu/facilities');
      if (!facRes.ok) throw new Error(facRes.statusText);
      const facData = await facRes.json();
      const locations = facData?.data?.data?.locations || [];

      // upsert into Supabase
      const facilities = locations.map((loc: any) => ({
        name: loc.location_name,
        kipu_id: Number(loc.location_id),
        metadata: { enabled: loc.enabled, buildings: loc.buildings || [] },
        account_id: user.data.user?.id,
      }));

      if (facilities.length > 0) {
        await supabase
          .from('facilities')
          .upsert(facilities, { onConflict: 'kipu_id' });
        setSuccessMessage(
          `Settings saved and ${locations.length} facilities synced from KIPU.`
        );
      } else {
        setSuccessMessage('Settings saved, but no facilities found in KIPU.');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error: any) {
      console.error(error);
      setSaveError(error.message || 'Unexpected error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!currentFacilityId) {
      setTestConnectionResult({ success: false, message: 'Select a facility first.' });
      return;
    }
    setTestingConnection(true);
    setTestConnectionResult(null);
    try {
      const res = await fetch(
        `/api/kipu/test-connection?facilityId=${currentFacilityId}`
      );
      const json = await res.json();
      setTestConnectionResult({ success: res.ok, message: json.message || res.statusText });
    } catch (err: any) {
      setTestConnectionResult({ success: false, message: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>KIPU API Settings</CardTitle>
        <CardDescription>
          Obtain credentials from your KIPU EMR administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 mr-2 text-blue-500" />
          <div>
            <p>
              These credentials allow ChartChek to access patient data across your
              KIPU facilities.
            </p>
          </div>
        </div>

        {saveError && (
          <CustomAlert variant="destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <AlertDescription>{saveError}</AlertDescription>
          </CustomAlert>
        )}

        {saveSuccess && (
          <CustomAlert variant="success">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <AlertDescription>{successMessage}</AlertDescription>
          </CustomAlert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kipu_access_id" className="flex items-center">
              <Key className="h-4 w-4 mr-1" /> Access ID
            </Label>
            <Input
              id="kipu_access_id"
              value={apiSettings.kipu_access_id}
              onChange={(e) =>
                setApiSettings({ ...apiSettings, kipu_access_id: e.target.value })
              }
              placeholder="Enter Access ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kipu_secret_key" className="flex items-center">
              <Lock className="h-4 w-4 mr-1" /> Secret Key
            </Label>
            <Input
              id="kipu_secret_key"
              type="password"
              value={apiSettings.kipu_secret_key}
              onChange={(e) =>
                setApiSettings({ ...apiSettings, kipu_secret_key: e.target.value })
              }
              placeholder="Enter Secret Key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kipu_app_id" className="flex items-center">
              <User className="h-4 w-4 mr-1" /> App ID
            </Label>
            <Input
              id="kipu_app_id"
              value={apiSettings.kipu_app_id}
              onChange={(e) =>
                setApiSettings({ ...apiSettings, kipu_app_id: e.target.value })
              }
              placeholder="Enter App ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kipu_api_endpoint" className="flex items-center">
              <Globe className="h-4 w-4 mr-1" /> API Endpoint URL
            </Label>
            <Input
              id="kipu_api_endpoint"
              value={apiSettings.kipu_api_endpoint}
              onChange={(e) =>
                setApiSettings({ ...apiSettings, kipu_api_endpoint: e.target.value })
              }
              placeholder="Enter API Endpoint"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testingConnection || !apiSettings.kipu_access_id || !currentFacilityId}
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </Button>

          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>

      {testConnectionResult && (
        <CardContent className="mt-4">
          <CustomAlert variant={testConnectionResult.success ? 'success' : 'destructive'}>
            {testConnectionResult.success ? <CheckCircle2 className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
            <AlertTitle>{testConnectionResult.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{testConnectionResult.message}</AlertDescription>
          </CustomAlert>
        </CardContent>
      )}
    </Card>
  );
}
