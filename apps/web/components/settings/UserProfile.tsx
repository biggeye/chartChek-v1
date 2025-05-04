'use client'

import React, { useState, useEffect, FormEvent, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '~/utils/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs'
import { Button } from '@kit/ui/button'
import { Input } from '@kit/ui/input'
import { Label } from '@kit/ui/label'
import { Textarea } from '@kit/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar'

interface ProfileData {
  account_id: string;            // Foreign key to auth.users.id
  first_name: string | null;  // Changed to nullable based on typical schema
  last_name: string | null;   // Changed to nullable based on typical schema
  email: string | null;
  is_owner: boolean | null;   // Changed to nullable
  title: string | null;
  phone: string | null;       // Renamed from phone_number
  about: string | null;
  avatar_url: string | null;
  facility_id: string | null;
  street_address: string | null; // Renamed from address
  city: string | null;
  state: string | null;
  postal_code: string | null; // Renamed from zip_code
  country: string | null;
  username: string | null;
  created_at: string;         // Assuming string representation is fine
  updated_at: string;         // Assuming string representation is fine
  preferred_language: string | null; // Added
}

interface UserProfileProps {
  userId: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const supabase = createClient()
  
  // State management
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [threadRuns, setThreadRuns] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarFile, setAvatarFile] = useState<File | null>(null) // State for selected file
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) // State for preview URL
  const [uploading, setUploading] = useState(false) // State for upload status

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone: '',
    about: '',
    avatar_url: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    preferred_language: '',
  })

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);

    // Create a preview URL
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview); // Clean up previous preview
    }
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError

        // Fetch conversations
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .eq('account_id', userId)
          .order('created_at', { ascending: false })

        if (conversationsError) throw conversationsError

        setProfile(profileData)
        setFormData({
          first_name: profileData?.first_name || '',
          last_name: profileData?.last_name || '',
          email: profileData?.email || '',
          title: profileData?.title || '',
          phone: profileData?.phone || '',
          about: profileData?.about || '',
          avatar_url: profileData?.avatar_url || '',
          street_address: profileData?.street_address || '',
          city: profileData?.city || '',
          state: profileData?.state || '',
          postal_code: profileData?.postal_code || '',
          country: profileData?.country || '',
          preferred_language: profileData?.preferred_language || '',
        })
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId, supabase])

  const handleThreadRefresh = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/openai/threads/enrich')
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Update the threads with the enriched data
      
      // Fetch the updated runs to refresh the runs data
      const { data: runsData, error: runsError } = await supabase
        .from('thread_runs')
        .select('*')
        .eq('account_id', userId)
        .order('created_at', { ascending: false })
        
      if (runsError) throw runsError
      
      // Organize runs by thread_id
      const runsByThread: Record<string, any[]> = {}
      runsData.forEach((run) => {
        if (run && typeof run.thread_id === 'string') { 
          const threadId = run.thread_id;
          if (!runsByThread[threadId]) {
            runsByThread[threadId] = []
          }
          runsByThread[threadId].push(run)
        } else {
           // Optional: Handle or log runs without a thread_id if necessary
           if (run && run.id) {
             console.warn(`Run with ID ${run.id} is missing a thread_id.`);
           } else {
             console.warn('Encountered a run object without an ID or thread_id.');
           }
        }
      })
      

      setSuccessMessage('Thread data refreshed successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error refreshing thread data:', error)
      setError('Failed to refresh thread data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    let uploadedAvatarUrl: string | null = formData.avatar_url;

    // Handle avatar upload if a new file is selected
    if (avatarFile) {
      setUploading(true);
      try {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload the file to the avatars bucket
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          uploadedAvatarUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setError('Failed to upload avatar. Please try again.');
        setIsSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    try {
      // Update profile data including the new avatar URL
      const { data, error: updateError } = await supabase
        .from('accounts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          title: formData.title,
          phone: formData.phone,
          about: formData.about,
          avatar_url: uploadedAvatarUrl,
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
          preferred_language: formData.preferred_language,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSuccessMessage('Profile updated successfully!');
      
      // Update form data with the new values
      if (data) {
        setFormData({
          ...formData,
          avatar_url: uploadedAvatarUrl || ''
        });
      }

      // Clear the file input
      setAvatarFile(null);
      
      // Keep the preview URL until a new file is selected
      if (uploadedAvatarUrl) {
        setAvatarPreview(uploadedAvatarUrl);
      }

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="history">Chat History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-8">
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Your first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Your last name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Your professional title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    name="about"
                    value={formData.about || ''}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2 flex flex-col items-center">
                  <Label>Profile Picture</Label>
                  <Avatar className="h-24 w-24 my-2">
                    <AvatarImage 
                      src={avatarPreview || formData.avatar_url || undefined} 
                      alt="Profile Avatar" 
                    />
                    <AvatarFallback>{formData.first_name?.[0]}{formData.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full max-w-xs"
                    disabled={uploading} // Disable during upload
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>} 
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    name="street_address"
                    value={formData.street_address}
                    onChange={handleInputChange}
                    placeholder="Your street address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Your city"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Your state"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="Your postal code"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Your country"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Input
                    id="preferred_language"
                    name="preferred_language"
                    value={formData.preferred_language}
                    onChange={handleInputChange}
                    placeholder="Your preferred language"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isSaving || uploading}>
                {isSaving || uploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-8">
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chat Threads</h2>
                <Button 
                  onClick={handleThreadRefresh} 
                  className="text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Thread Data'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User Settings</h2>
            </div>
            
            <div className="space-y-4">
              <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update Settings'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
