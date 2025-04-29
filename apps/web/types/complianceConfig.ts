import { z } from "zod";

const categoryEnum = z.enum([
  'assessments',
  'screenings',
  'treatmentPlans',
  'consents',
  'administrative',
  'medical',
  'other'
]);

export const complianceConfigSchema = z.object({
  admission: z.array(z.object({
    evalType: categoryEnum,
    count: z.number().min(1)
  })),
  daily: z.array(z.object({
    evalType: categoryEnum,
    count: z.number().min(1)
  })),
  cycle: z.array(z.object({
    evalType: categoryEnum,
    count: z.number().min(1)
  })),
  cycleLength: z.number().min(1),
  admissionEvaluations: z.array(z.string()).default([]),
  dailyEvaluations: z.array(z.string()).default([]),
  cyclicEvaluations: z.array(z.string()).default([]),
  dischargeEvaluations: z.array(z.string()).default([]),
});

export type ComplianceConfig = z.infer<typeof complianceConfigSchema>;
