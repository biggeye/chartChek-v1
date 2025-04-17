'use client';

import { useState, useEffect } from 'react';
import { useFacilityStore } from '~/store/patient/facilityStore';
import { UserApiSettings } from '~/types/store/user';
import { createClient } from '~/utils/supabase/client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { AlertCircle, CheckCircle2, Info, Key, Globe, User, Lock, BrainCircuit } from 'lucide-react';
import { cn } from '~/lib/utils';
import UserProfile from '~/components/profile/UserProfile';
import { LLM_OPTIONS, type LLMOption } from '~/lib/llm-service';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { CardTitle, CardDescription, CardFooter } from '~/components/ui/card-extensions';
import { CustomAlert, AlertTitle, AlertDescription } from '~/components/ui/custom-alert';

export default function SettingsPage() {
  const [userId, setUserId] = useState<string>('');
  const { currentFacilityId } = useFacilityStore();
  
  // Add client-side only rendering state
  const [isClient, setIsClient] = useState(false);
  
  const [apiSettings, setApiSettings] = useState<UserApiSettings>({
    kipu_access_id: '',
    kipu_secret_key: '',
    kipu_app_id: '',
    kipu_api_endpoint: 'https://api.kipuapi.com',
    has_api_key_configured: false
  });
  
  // AI model settings
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o');
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [modelSaveSuccess, setModelSaveSuccess] = useState(false);
  const [modelSaveError, setModelSaveError] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{success: boolean; message: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const getSupabaseClient = () => {
    const supabase = createClient();
    return supabase;
  };

  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || '');
    };
    
    fetchUserId();
  }, []);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    loadApiSettings();
    loadModelSettings();
  }, []);

  const loadApiSettings = async () => {
    try {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      console.log('API Settings userId: ', userId);
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      // Get the user API settings
      const { data, error } = await supabase
        .from('user_api_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching user API settings:', error);
        // Set default values
        setApiSettings({
          kipu_access_id: '',
          kipu_secret_key: '',
          kipu_app_id: '',
          kipu_api_endpoint: 'https://api.kipuapi.com',
          has_api_key_configured: false
        });
        return;
      }
      
      if (data) {
        setApiSettings({
          kipu_access_id: data.kipu_access_id || '',
          kipu_secret_key: data.kipu_secret_key || '',
          kipu_app_id: data.kipu_app_id || '',
          kipu_api_endpoint: data.kipu_api_endpoint || 'https://api.kipuapi.com',
          has_api_key_configured: Boolean(
            data.kipu_access_id && 
            data.kipu_secret_key && 
            data.kipu_app_id && 
            data.kipu_api_endpoint
          )
        });
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
    }
  };

  // Load model settings from Supabase
  const loadModelSettings = async () => {
    try {
      const supabase = await createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = await user?.id;

      console.log ('api settings] userid: ', userId);
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      // Get the user model settings 
      const { data, error } = await supabase
        .from('user_preferences')
        .select('default_model_id')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching user model settings:', error);
        // Set default model
        setSelectedModelId('gpt-4o');
        return;
      }
      
      if (data && data.default_model_id) {
        setSelectedModelId(data.default_model_id);
      }
    } catch (error) {
      console.error('Error loading model settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSaveError('No authenticated user found');
        setIsSaving(false);
        return;
      }
      
      // Validate required fields
      if (!apiSettings.kipu_access_id || !apiSettings.kipu_secret_key || !apiSettings.kipu_app_id) {
        setSaveError('Please fill in all required fields');
        setIsSaving(false);
        return;
      }
      
      // Check if API settings are configured
      const hasApiKeyConfigured = !!(
        apiSettings.kipu_access_id && 
        apiSettings.kipu_secret_key && 
        apiSettings.kipu_app_id
      );
      
      // Create the API settings object to save
      const apiSettingsToSave = {
        user_id: user.id,
        kipu_access_id: apiSettings.kipu_access_id,
        kipu_secret_key: apiSettings.kipu_secret_key,
        kipu_app_id: apiSettings.kipu_app_id,
        kipu_api_endpoint: apiSettings.kipu_api_endpoint || 'https://api.kipuapi.com',
        has_api_key_configured: hasApiKeyConfigured
      };
      
      // Save API settings to Supabase
      // First check if the user already has settings
      const { data: existingSettings } = await supabase
        .from('user_api_settings')
        .select('api_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      let saveError;
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_api_settings')
          .update(apiSettingsToSave)
          .eq('user_id', user.id);
        
        saveError = error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('user_api_settings')
          .insert(apiSettingsToSave);
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Error saving API settings:', saveError);
        setSaveError(`Failed to save API settings: ${saveError.message}`);
        setIsSaving(false);
        return;
      }
      
      // If API settings were saved successfully and credentials are configured,
      // fetch and store facilities using the KIPU API
      if (hasApiKeyConfigured) {
        console.log('API key configured, syncing facilities from KIPU');
        
        try {
          // Make a direct API call to fetch facilities
          const response = await fetch('/api/kipu/facilities', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch facilities: ${response.statusText}`);
          }
          
          const data = await response.json();
          const kipuFacilities = data?.data?.data?.locations || [];
          
          if (kipuFacilities.length > 0) {
            // Now store these facilities in our Supabase database
            const facilitiesToUpsert = kipuFacilities.map((facility: any) => ({
              name: facility.location_name,
              kipu_id: Number(facility.location_id),
              metadata: { 
                enabled: facility.enabled,
                buildings: facility.buildings || []
              }
            }));
            
            // First, check for existing facilities with these KIPU IDs
            const kipuIds = facilitiesToUpsert.map((f: any) => f.kipu_id);
            const { data: existingFacilities } = await supabase
              .from('facilities')
              .select('id, kipu_id')
              .in('kipu_id', kipuIds);
            
            // Create maps for updates and inserts
            const existingFacilityMap = new Map();
            if (existingFacilities && existingFacilities.length > 0) {
              existingFacilities.forEach((facility: any) => {
                existingFacilityMap.set(Number(facility.kipu_id), facility.id);
              });
            }
            
            // Split into updates and inserts
            const facilitiesToUpdate: any[] = [];
            const facilitiesToInsert: any[] = [];
            
            facilitiesToUpsert.forEach((facility: any) => {
              if (existingFacilityMap.has(facility.kipu_id)) {
                // It's an update
                facilitiesToUpdate.push({
                  id: existingFacilityMap.get(facility.kipu_id),
                  user_id: user.id,
                  ...facility
                });
              } else {
                // It's an insert
                facilitiesToInsert.push({
                  user_id: user.id,
                  ...facility
                });
              }
            });
            
            // Perform updates if needed
            let updateError: any = null;
            if (facilitiesToUpdate.length > 0) {
              const { error } = await supabase
                .from('facilities')
                .upsert(facilitiesToUpdate);
              
              updateError = error;
            }
            
            // Perform inserts if needed
            let insertError: any = null;
            if (facilitiesToInsert.length > 0) {
              const { error } = await supabase
                .from('facilities')
                .insert(facilitiesToInsert);
              
              insertError = error;
            }
            
            if (updateError || insertError) {
              console.error('Error syncing facilities:', updateError || insertError);
              setSaveSuccess(true);
              setSuccessMessage('Your API settings have been saved successfully, but there was an issue syncing facilities: ' + 
                ((updateError || insertError)?.message || 'Unknown error'));
            } else {
              setSaveSuccess(true);
              setSuccessMessage(`Your API settings have been saved successfully and ${kipuFacilities.length} facilities have been synced from KIPU.`);
              
              // Refresh the facilities in the store
              const facilityStore = useFacilityStore.getState();
              await facilityStore.fetchFacilities();
            }
          } else {
            setSaveSuccess(true);
            setSuccessMessage('Your API settings have been saved successfully, but no facilities were found in KIPU.');
          }
        } catch (syncError) {
          console.error('Error syncing facilities:', syncError);
          setSaveSuccess(true);
          setSuccessMessage('Your API settings have been saved successfully, but there was an issue syncing facilities: ' + 
            (syncError instanceof Error ? syncError.message : 'Unknown error'));
        }
      } else {
        setSaveSuccess(true);
        setSuccessMessage('Your API settings have been saved successfully.');
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error saving API settings:', error);
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!currentFacilityId) {
      setTestConnectionResult({
        success: false,
        message: 'Please select a facility first'
      });
      return;
    }
    
    setTestingConnection(true);
    setTestConnectionResult(null);
    
    try {
      // Test the connection by calling the KIPU API
      const response = await fetch(`/api/kipu/test-connection?facilityId=${currentFacilityId}`);
      const result = await response.json();
      
      if (response.ok) {
        setTestConnectionResult({
          success: true,
          message: 'Connection successful! Your API credentials are working correctly.'
        });
      } else {
        setTestConnectionResult({
          success: false,
          message: result.error || 'Connection failed. Please check your API credentials.'
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestConnectionResult({
        success: false,
        message: 'Connection test failed due to a network error. Please try again.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Save model settings to Supabase
  const handleSaveModelSettings = async () => {
    setIsSavingModel(true);
    setModelSaveError('');
    setModelSaveSuccess(false);
    
    try {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setModelSaveError('No authenticated user found');
        setIsSavingModel(false);
        return;
      }
      
      // Check if user preferences exist
      const { data: existingPrefs } = await supabase
        .from('user_api_settings')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      let saveError;
      
      if (existingPrefs) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_api_settings')
          .update({ default_model_id: selectedModelId })
          .eq('user_id', user.id);
        
        saveError = error;
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from('user_api_settings')
          .insert({
            user_id: user.id,
            default_model_id: selectedModelId,
          });
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Error saving model settings:', saveError);
        setModelSaveError(`Failed to save model settings: ${saveError.message}`);
        setIsSavingModel(false);
        return;
      }
      
      setModelSaveSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setModelSaveSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error saving model settings:', error);
      setModelSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSavingModel(false);
    }
  };

  return (
    <div className="container py-8">
      {isClient ? (
        <>
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="ai-models">AI Models</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>KIPU EMR API Configuration</CardTitle>
                  <CardDescription>
                    Configure your KIPU EMR API credentials to enable integration with ChartChek.
                    These credentials will be used to access all facilities you have permission for.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {saveSuccess && (
                    <CustomAlert variant="success">
                      <div className="flex">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>{successMessage}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  )}
                  
                  {saveError && (
                    <CustomAlert variant="destructive">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{saveError}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  )}
                  
                  <CustomAlert>
                    <div className="flex">
                      <Info className="h-4 w-4 mr-2 mt-0.5" />
                      <div>
                        <AlertTitle>About KIPU API Credentials</AlertTitle>
                        <AlertDescription>
                          You need to obtain API credentials from your KIPU EMR administrator.
                          These credentials will allow ChartChek to securely access patient data
                          across all facilities you have permission to access in KIPU.
                        </AlertDescription>
                      </div>
                    </div>
                  </CustomAlert>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_access_id" className="flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        Access ID
                      </Label>
                      <Input
                        id="kipu_access_id"
                        value={apiSettings.kipu_access_id}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_access_id: e.target.value})}
                        placeholder="Enter your KIPU Access ID"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_secret_key" className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Secret Key
                      </Label>
                      <Input
                        id="kipu_secret_key"
                        type="password"
                        value={apiSettings.kipu_secret_key}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_secret_key: e.target.value})}
                        placeholder="Enter your KIPU Secret Key"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_app_id" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        App ID (Recipient ID)
                      </Label>
                      <Input
                        id="kipu_app_id"
                        value={apiSettings.kipu_app_id}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_app_id: e.target.value})}
                        placeholder="Enter your KIPU App ID"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_api_endpoint" className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        API Endpoint URL
                      </Label>
                      <Input
                        id="kipu_api_endpoint"
                        value={apiSettings.kipu_api_endpoint}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_api_endpoint: e.target.value})}
                        placeholder="Enter the KIPU API endpoint URL"
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiSettings.has_api_key_configured || !currentFacilityId}
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardFooter>
              </Card>
              
              {testConnectionResult && (
                <Card>
                  <CardContent className="pt-6">
                    <CustomAlert variant={testConnectionResult.success ? 'success' : 'destructive'}>
                      <div className="flex">
                        {testConnectionResult.success ? (
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                        )}
                        <div>
                          <AlertTitle>{testConnectionResult.success ? 'Success' : 'Error'}</AlertTitle>
                          <AlertDescription>{testConnectionResult.message}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="ai-models">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>AI Model Configuration</CardTitle>
                  <CardDescription>
                    Select your preferred AI model for chat interactions. Different models have varying capabilities and performance characteristics.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {modelSaveSuccess && (
                    <CustomAlert variant="success">
                      <div className="flex">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>Your AI model preferences have been saved successfully.</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  )}
                  
                  {modelSaveError && (
                    <CustomAlert variant="destructive">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{modelSaveError}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  )}
                  
                  <CustomAlert>
                    <div className="flex">
                      <Info className="h-4 w-4 mr-2 mt-0.5" />
                      <div>
                        <AlertTitle>About AI Models</AlertTitle>
                        <AlertDescription>
                          The selected model will be used as your default for all new chat sessions.
                          You can still change models for individual sessions within the chat interface.
                        </AlertDescription>
                      </div>
                    </div>
                  </CustomAlert>
                  
                  <div className="space-y-6">
                    <Label className="flex items-center text-base font-medium">
                      <BrainCircuit className="h-5 w-5 mr-2" />
                      Select Default AI Model
                    </Label>
                    
                    <RadioGroup value={selectedModelId} onValueChange={setSelectedModelId} className="space-y-4">
                      {LLM_OPTIONS.map((model) => (
                        <div key={model.id} className="flex items-start space-x-2 border rounded-md p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={model.id} id={`model-${model.id}`} className="mt-1" />
                          <div className="grid gap-1.5 leading-none">
                            <Label htmlFor={`model-${model.id}`} className="text-base font-medium">
                              {model.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {model.description}
                            </p>
                            <div className="flex space-x-4 mt-1 text-xs text-muted-foreground">
                              <span>Provider: {model.provider}</span>
                              <span>Max Tokens: {model.maxTokens.toLocaleString()}</span>
                              <span>Cost: {model.costPer1KTokens}/1K tokens</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    onClick={handleSaveModelSettings}
                    disabled={isSavingModel}
                    className="ml-auto"
                  >
                    {isSavingModel ? 'Saving...' : 'Save Model Preferences'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <UserProfile userId={userId} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>User Preferences</CardTitle>
                  <CardDescription>
                    Customize your experience with ChartChek.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    User preferences will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        // Loading state while client-side rendering is not ready
        <div>Loading settings...</div>
      )}
    </div>
  );
}
