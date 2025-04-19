"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Skeleton } from "@kit/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert"
import { AlertCircle } from "lucide-react"
import type { KipuCredentials } from "types/kipu/kipuAdapter"
import { createKipuClient } from "~/lib/kipu/auth/client"
import type { FacilityStatistics, DateRange, PatientStatistics } from "~/lib/kipu/stats/types"
import { PatientStatsCard } from "./PatientStatsCard"
import { TreatmentStatsCard } from "./TreatmentStatsCard"
import { OperationalStatsCard } from "./OperationalStatsCard"
import { OutcomeStatsCard } from "./OutcomeStatsCard"

// Create a custom statistics service since we can't import the original one
class KipuStatsService {
  private client: any

  constructor(credentials: KipuCredentials) {
    this.client = createKipuClient(credentials)
  }

  async getFacilityStatistics(facilityId: string, dateRange: DateRange): Promise<FacilityStatistics> {
    try {
      // Return mock data for the demo
      return this.getMockStatistics();
    } catch (error) {
      console.error("Error fetching facility statistics:", error)
      // Return mock data for demonstration
      return this.getMockStatistics()
    }
  }

  private getMockStatistics(): FacilityStatistics {
    return {
      patient: {
        census: {
          current_count: 42,
          admissions_daily: 3,
          admissions_weekly: 15,
          admissions_monthly: 58,
          discharges_daily: 2,
          discharges_weekly: 12,
          discharges_monthly: 52,
          avg_length_of_stay: 28.5,
        },
        demographics: {
          age_distribution: {
            under_18: 5,
            "18_24": 12,
            "25_34": 18,
            "35_44": 15,
            "45_54": 8,
            "55_64": 6,
            "65_plus": 2,
          },
          gender_distribution: {
            male: 38,
            female: 28,
            other: 2,
          },
          insurance_distribution: {
            private: 35,
            medicare: 15,
            medicaid: 12,
            self_pay: 6,
          },
        },
        clinical: {
          diagnosis_distribution: {
            substance_use: 42,
            depression: 28,
            anxiety: 22,
            bipolar: 12,
            ptsd: 18,
          },
          medication_adherence_rate: 85.2,
          treatment_completion_rate: 78.5,
        },
        bed_utilization: {
          occupancy_rate: 82.5,
          available_beds: 18,
          reserved_beds: 5,
          projected_availability: {
            "7_days": 13,
            "14_days": 10,
            "30_days": 8,
          },
        },
      },
      operational: {
        staff_utilization: {
          clinician_patient_ratio: 8.5,
          avg_patients_per_provider: {
            therapist: 12.5,
            psychiatrist: 25.0,
            nurse: 15.0,
            case_manager: 20.0,
          },
          staff_availability: {
            therapist: 85.0,
            psychiatrist: 75.0,
            nurse: 90.0,
            case_manager: 82.0,
          },
        },
        resource_utilization: {
          therapy_room_usage: 78.5,
          group_session_attendance: 82.0,
          assessment_completion_rate: 92.5,
        },
        financial_metrics: {
          avg_daily_revenue: 12500.0,
          insurance_claim_status: {
            pending: 45,
            approved: 120,
            denied: 15,
            appealed: 8,
          },
          outstanding_balances: 185000.0,
        },
      },
      treatment: {
        treatment_duration: {
          avg_length_of_stay: 28.5,
          duration_by_diagnosis: {
            substance_use: 32.5,
            depression: 24.0,
            anxiety: 21.0,
            bipolar: 35.0,
            ptsd: 30.0,
          },
          duration_by_program: {
            residential: 35.0,
            php: 21.0,
            iop: 14.0,
            outpatient: 45.0,
          },
        },
        level_of_care: {
          distribution: {
            residential: 25,
            php: 18,
            iop: 32,
            outpatient: 15,
          },
          transitions: {
            residential: {
              php: 15,
              iop: 5,
              discharge: 5,
            },
            php: {
              iop: 12,
              residential: 2,
              discharge: 4,
            },
          },
          avg_time_in_level: {
            residential: 14.5,
            php: 10.0,
            iop: 21.0,
            outpatient: 30.0,
          },
        },
        treatment_plan: {
          goal_completion_rate: 78.5,
          intervention_usage: {
            cbt: 85,
            dbt: 45,
            motivational: 65,
            group: 120,
            family: 35,
          },
          plan_adherence: 82.5,
        },
      },
      outcomes: {
        treatment_outcomes: {
          completion_rate: 78.5,
          early_discharge_rate: 12.5,
          readmission_rate: 15.0,
        },
        clinical_outcomes: {
          symptom_reduction: {
            depression: 45.0,
            anxiety: 38.5,
            substance_craving: 52.0,
            ptsd: 32.0,
          },
          functional_improvement: {
            social: 35.0,
            occupational: 28.0,
            self_care: 42.0,
            overall: 38.5,
          },
          patient_satisfaction: 8.5,
        },
        follow_up_metrics: {
          aftercare_attendance: 72.5,
          medication_compliance: 85.0,
          recovery_maintenance: 68.0,
        },
      },
      last_updated: new Date().toISOString(),
    }
  }
}

interface StatsModuleProps {
  facilityId: string
  credentials: KipuCredentials
}

export function StatsModule({ facilityId, credentials }: StatsModuleProps) {
  const [statistics, setStatistics] = useState<FacilityStatistics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("patient")

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create date ranges for statistics
        const now = new Date()
        const today = now.toISOString().split("T")[0]

        // Calculate date ranges
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const monthAgo = new Date(now)
        monthAgo.setDate(monthAgo.getDate() - 30)
// ADD TYPE DEFINITION LATER AI
        const dateRange: any = {
          daily: {
            start: yesterday.toISOString().split("T")[0],
            end: today,
          },
          weekly: {
            start: weekAgo.toISOString().split("T")[0],
            end: today,
          },
          monthly: {
            start: monthAgo.toISOString().split("T")[0],
            end: today,
          },
        }

        // Initialize the statistics service with our custom implementation
        const statsService = new KipuStatsService(credentials)

        // Fetch facility statistics
        const stats = await statsService.getFacilityStatistics(facilityId, dateRange)
        setStatistics(stats)
      } catch (err) {
        console.error("Error fetching statistics:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch statistics")
      } finally {
        setLoading(false)
      }
    }

    if (facilityId && credentials) {
      fetchStatistics()
    }
  }, [facilityId, credentials])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load statistics: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Facility Statistics Dashboard</CardTitle>
          <CardDescription>Comprehensive statistics for your facility</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="patient" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="treatment">Treatment</TabsTrigger>
              <TabsTrigger value="operational">Operational</TabsTrigger>
              <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="mt-4">
              {loading ? <StatsLoadingSkeleton /> : statistics && <PatientStatsCard statistics={statistics.patient} />}
            </TabsContent>

            <TabsContent value="treatment" className="mt-4">
              {loading ? (
                <StatsLoadingSkeleton />
              ) : (
                statistics && <TreatmentStatsCard statistics={statistics.treatment} />
              )}
            </TabsContent>

            <TabsContent value="operational" className="mt-4">
              {loading ? (
                <StatsLoadingSkeleton />
              ) : (
                statistics && <OperationalStatsCard statistics={statistics.operational} />
              )}
            </TabsContent>

            <TabsContent value="outcomes" className="mt-4">
              {loading ? <StatsLoadingSkeleton /> : statistics && <OutcomeStatsCard statistics={statistics.outcomes} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {statistics && (
        <div className="text-xs text-muted-foreground text-right">
          Last updated: {new Date(statistics.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  )
}

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
