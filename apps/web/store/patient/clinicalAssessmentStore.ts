import { create } from 'zustand';
import {
    KipuCiwaAr,
    KipuCiwaB,
    KipuCows,
    KipuVitalSigns,
    KipuOrthostaticVitalSigns
} from '../../lib/kipu/service/clinical-assessment-service';

export interface ClinicalAssessmentStore {
    ciwaArs: KipuCiwaAr[];
    ciwaBs: KipuCiwaB[];
    cows: KipuCows[];
    vitalSigns: KipuVitalSigns[];
    orthostaticVitalSigns: KipuOrthostaticVitalSigns[];
    isLoading: boolean;
    error: string | null;

    // Setters for each assessment type
    setCiwaArs: (assessments: KipuCiwaAr[]) => void;
    setCiwaBs: (assessments: KipuCiwaB[]) => void;
    setCows: (assessments: KipuCows[]) => void;
    setVitalSigns: (signs: KipuVitalSigns[]) => void;
    setOrthostaticVitalSigns: (signs: KipuOrthostaticVitalSigns[]) => void;

    // Common state management
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    clearStore: () => void;
}

export const useClinicalAssessmentStore = create<ClinicalAssessmentStore>((set) => ({
    ciwaArs: [],
    ciwaBs: [],
    cows: [],
    vitalSigns: [],
    orthostaticVitalSigns: [],
    isLoading: false,
    error: null,

    setCiwaArs: (assessments) => set({ ciwaArs: assessments }),
    setCiwaBs: (assessments) => set({ ciwaBs: assessments }),
    setCows: (assessments) => set({ cows: assessments }),
    setVitalSigns: (signs) => set({ vitalSigns: signs }),
    setOrthostaticVitalSigns: (signs) => set({ orthostaticVitalSigns: signs }),

    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearStore: () => set({
        ciwaArs: [],
        ciwaBs: [],
        cows: [],
        vitalSigns: [],
        orthostaticVitalSigns: [],
        isLoading: false,
        error: null
    }),
})); 