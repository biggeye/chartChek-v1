'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card"
import type { OutcomeStatistics } from "~/lib/kipu/stats/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface OutcomeStatsCardProps {
  statistics: OutcomeStatistics
}

export function OutcomeStatsCard({ statistics }: OutcomeStatsCardProps) {
  // Process symptom reduction data for chart
  const symptomReductionData = Object.entries(statistics.clinical_outcomes.symptom_reduction).map(([key, value]) => ({
    name: key,
    value: Number.parseFloat(value.toFixed(1)),
  }))

  // Process functional improvement data for chart
  const functionalImprovementData = Object.entries(statistics.clinical_outcomes.functional_improvement).map(
    ([key, value]) => ({
      name: key,
      value: Number.parseFloat(value.toFixed(1)),
    }),
  )

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B"]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.treatment_outcomes.completion_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Early Discharge Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.treatment_outcomes.early_discharge_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Readmission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.treatment_outcomes.readmission_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.clinical_outcomes.patient_satisfaction.toFixed(1)}/10</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Symptom Reduction</CardTitle>
            <CardDescription>Average reduction in symptoms by assessment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomReductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Reduction Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Functional Improvement</CardTitle>
            <CardDescription>Average improvement in functional domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={functionalImprovementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" name="Improvement Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Metrics</CardTitle>
          <CardDescription>Post-treatment follow-up statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium">Aftercare Attendance</h4>
              <p className="text-2xl font-bold">{statistics.follow_up_metrics.aftercare_attendance.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Percentage of patients attending aftercare appointments</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Medication Compliance</h4>
              <p className="text-2xl font-bold">{statistics.follow_up_metrics.medication_compliance.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Percentage of patients compliant with medication</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Recovery Maintenance</h4>
              <p className="text-2xl font-bold">{statistics.follow_up_metrics.recovery_maintenance.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Percentage of patients maintaining recovery</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
