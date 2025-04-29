'use client'

import { createClient } from '~/utils/supabase/client';
import { useModels } from '~/hooks/useModels';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { useState } from 'react';

export default function ModelsSettings() {


  const { data: models, isLoading: modelsLoading, error: modelsError } = useModels();


  // AI model settings
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o');
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [modelSaveSuccess, setModelSaveSuccess] = useState(false);
  const [modelSaveError, setModelSaveError] = useState('');

  // Load model settings from Supabase
  const loadModelSettings = async () => {
    try {
      const supabase = await createClient();

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = await user?.id;

      console.log('api settings] userid: ', userId);
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Get the user model settings 
      const { data, error } = await supabase
        .from('user_preferences')
        .select('default_model_id')
        .eq('account_id', userId)
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
        .from('user_preferences')
        .select('account_id')
        .eq('account_id', user.id)
        .maybeSingle();

      let saveError;

      if (existingPrefs) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({ default_model_id: selectedModelId })
          .eq('account_id', user.id);

        saveError = error;
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            account_id: user.id,
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
    <Card>
      <CardHeader>
        <CardTitle>Model Selection</CardTitle>
        <CardDescription>Select your preferred language model for chat and evaluations.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedModelId} onValueChange={setSelectedModelId}>
          {models?.map((model) => (
            <RadioGroupItem key={model.id} value={String(model.id)}>
              {model.label}
              </RadioGroupItem>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button disabled={!selectedModelId}>Save Model</Button>
      </CardFooter>
    </Card>
  );
}