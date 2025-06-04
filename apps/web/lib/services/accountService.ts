// Client-side service layer
import { ComplianceConfig } from '~/types/complianceConfig';

// Define the expected shape of the profile data we need
interface UserProfile {
    username: string | null;
    avatar_url: string | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) {
        console.error("getUserProfile called with no userId");
        return null;
    }

    try {
        const response = await fetch(`/api/accounts/profile/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        return await response.json();
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return null;
    }
}

export async function getComplianceConfig(accountId: string): Promise<ComplianceConfig> {
    const response = await fetch(`/api/compliance/config/${accountId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch compliance config');
    }
    return await response.json();
}

export async function setComplianceConfig(userId: string, config: ComplianceConfig): Promise<void> {
    const response = await fetch(`/api/compliance/config/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });
    
    if (!response.ok) {
        throw new Error('Failed to save compliance config');
    }
}

export async function getComplianceConfigForUser(facilityId: string, userId: string): Promise<ComplianceConfig | null> {
    if (!facilityId) {
        console.error("getComplianceConfigForUser called with no facilityId");
        return null;
    }
    
    try {
        const response = await fetch(`/api/compliance/config/${facilityId}/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch compliance config');
        }
        return await response.json();
    } catch (err) {
        console.error('Error fetching compliance config:', err);
        return null;
    }
}

export async function setComplianceConfigForUser(facilityId: string, userId: string, config: ComplianceConfig): Promise<ComplianceConfig | null> {
    try {
        const response = await fetch(`/api/compliance/config/${facilityId}/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });
        
        if (!response.ok) {
            throw new Error('Failed to set compliance config');
        }
        
        return await response.json();
    } catch (err) {
        console.error('Error setting compliance config:', err);
        return null;
    }
}