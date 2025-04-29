import { z } from 'zod';

const complianceConfigSchema = z.object({
    admission: z.array(z.object({
      evalType: z.string(),     // e.g. 'BIO', 'PSYCH', etc.
      count: z.number().min(1)
    })),
    daily: z.array(z.object({
      evalType: z.string(),
      count: z.number().min(1)
    })),
    cycle: z.array(z.object({
      evalType: z.string(),
      count: z.number().min(1)
    })),
    cycleLength: z.number().min(1), // e.g. 7 for a 7-day cycle
  });

  export const complianceConfig = {
    admission: [
      { evalType: 'Administrative', count: 2 },
      { evalType: 'Assessment', count: 10 },
      { evalType: 'Screening', count: 3 },
      { evalType: 'Consent', count: 2 },
      { evalType: 'TreatmentPlan', count: 5 },
      { evalType: 'Medical', count: 2 },
    ],
    daily: [
      { evalType: 'Group', count: 1 }
    ],
    cycle: [
      { evalType: 'Assessment', count: 1 }
    ],
    cycleLength: 7,
    admissionEvaluations: [],
    dailyEvaluations: [],
    cyclicEvaluations: [],
    dischargeEvaluations: []
  }

  