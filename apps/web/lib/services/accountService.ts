// lib/user/service/profile.ts
import 'server-only'; // Ensure this only runs on the server
import { createServer } from '~/utils/supabase/server'; // Corrected import
import { z } from 'zod';
import { complianceConfigSchema, ComplianceConfig } from '~/types/complianceConfig';

// Define the expected shape of the profile data we need
interface UserProfile {
    username: string | null;
    avatar_url: string | null; // Add avatar_url field
    // Add other profile fields if needed later
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) {
        console.error("getUserProfile called with no userId");
        return null;
    }

    // const cookieStore = cookies(); // No longer needed here
    const supabase = await createServer(); // Await the promise and remove argument

    try {
        const { data, error } = await supabase
            .from('accounts') // Use the actual table name 'accounts'
            .select('username, avatar_url') // Select username and avatar_url
            .eq('id', userId) // Corrected column name for filter
            .single(); // Expect only one row

        if (error) {
            // Log error but don't throw, might be a new user without a profile yet
            console.error('Error fetching user profile:', error.message);
            return null;
        }

        if (!data) {
            console.warn(`No profile found for userId: ${userId}`);
            return null;
        }

        // Ensure the fetched data matches our expected interface
        const profile: UserProfile = {
            username: data.username || null,
            avatar_url: data.avatar_url || null, // Assign avatar_url
        };

        return profile;

    } catch (err) {
        console.error('Unexpected error in getUserProfile:', err);
        return null;
    }
}



const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  admission: [
    { evalType: 'BIO', count: 1 },
    { evalType: 'NURSING', count: 1 },
    { evalType: 'PSYCH', count: 1 },
  ],
  daily: [
    { evalType: 'GROUP', count: 1 }
  ],
  cycle: [
    { evalType: 'TREATMENT_PLAN_UPDATE', count: 1 }
  ],
  cycleLength: 7
};

// --- Compliance Config Service Functions ---

/**
 * Fetch compliance config for a given account (facility). Falls back to default if not set.
 */
export async function getComplianceConfig(accountId: string): Promise<ComplianceConfig> {
  const supabase = await createServer();
  const { data, error } = await supabase
    .from('compliance_configs')
    .select('config')
    .eq('account_id', accountId)
    .single();

  if (error || !data) {
    // Could log error here if needed
    return DEFAULT_COMPLIANCE_CONFIG;
  }

  // Validate config from DB
  const parsed = complianceConfigSchema.safeParse(data.config);
  if (!parsed.success) {
    // Invalid config in DB; fall back to default
    return DEFAULT_COMPLIANCE_CONFIG;
  }
  return parsed.data;
}

/**
 * Set (insert or update) compliance config for a given account (facility).
 * Throws if validation fails.
 */
export async function setComplianceConfig(userId: string, config: ComplianceConfig): Promise<void> {
  // Validate config
  complianceConfigSchema.parse(config);
  const supabase = await createServer();
  // Upsert config
  const { error } = await supabase
    .from('compliance_configs')
    .upsert([
      {
        account_id: userId,
        config,
        updated_at: new Date().toISOString(),
      }
    ], { onConflict: 'account_id' });
  if (error) {
    throw new Error('Failed to save compliance config: ' + error.message);
  }
}

export async function getComplianceConfigForUser(facilityId: string, userId: string): Promise<ComplianceConfig | null> {
    if (!facilityId) {
        console.error("getComplianceConfigForUser called with no facilityId");
        return null;
    }
    
    const supabase = await createServer();
    const { data, error } = await supabase
    .from('compliance_config')
    .select('*')
    .eq('facility_id', facilityId)
    .eq('account_id', userId)
    .single();
    
    if (error) {
        console.error('Error fetching compliance config:', error.message);
        return null;
    }
    
    if (!data) {
        console.warn(`No compliance config found for facilityId: ${facilityId}`);
        return null;
    }
    
    return data as ComplianceConfig;
}

export async function setComplianceConfigForUser(facilityId: string, userId: string, config: ComplianceConfig) {
    // (validate with your Zod schema)
    
    const supabase = await createServer();
    const { data, error } = await supabase
    .from('compliance_config')
    .insert({
        facility_id: facilityId,
        account_id: userId,
        ...config
    })
    .single();
    
    if (error) {
        console.error('Error setting compliance config:', error.message);
        return null;
    }
    
    return data as ComplianceConfig;
}