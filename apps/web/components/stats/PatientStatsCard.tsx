'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card"
import type { PatientStatistics } from "~/lib/kipu/stats/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface PatientStatsCardProps {
  statistics: PatientStatistics
}

export function PatientStatsCard({ statistics }: PatientStatsCardProps) {
  // Process age distribution data for chart
  const ageDistributionData = Object.entries(statistics.demographics.age_distribution).map(([key, value]) => ({
    name: key.replace("_", "-").replace("plus", "+"),
    value,
  }))

  // Process gender distribution data for chart
  const genderDistributionData = Object.entries(statistics.demographics.gender_distribution).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }))

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B"]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Census</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.census.current_count}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.census.admissions_daily > 0 && `+${statistics.census.admissions_daily} today`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.census.admissions_monthly}</div>
            <p className="text-xs text-muted-foreground">{statistics.census.admissions_weekly} in the last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Discharges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.census.discharges_monthly}</div>
            <p className="text-xs text-muted-foreground">{statistics.census.discharges_weekly} in the last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Length of Stay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.census.avg_length_of_stay.toFixed(1)} days</div>
            <p className="text-xs text-muted-foreground">
              Occupancy rate: {statistics.bed_utilization.occupancy_rate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>Patient demographics by age group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Patient demographics by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bed Utilization</CardTitle>
          <CardDescription>Current and projected bed availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <h4 className="text-sm font-medium">Occupancy Rate</h4>
              <p className="text-2xl font-bold">{statistics.bed_utilization.occupancy_rate.toFixed(1)}%</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Available Beds</h4>
              <p className="text-2xl font-bold">{statistics.bed_utilization.available_beds}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">7-Day Projection</h4>
              <p className="text-2xl font-bold">{statistics.bed_utilization.projected_availability["7_days"]}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">30-Day Projection</h4>
              <p className="text-2xl font-bold">{statistics.bed_utilization.projected_availability["30_days"]}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
