// lib/user/service/profile.ts
import 'server-only'; // Ensure this only runs on the server
import { createServer } from '~/utils/supabase/server'; // Corrected import

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
            .from('profiles') // Use the actual table name 'profiles'
            .select('username, avatar_url') // Select username and avatar_url
            .eq('user_id', userId) // Corrected column name for filter
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
