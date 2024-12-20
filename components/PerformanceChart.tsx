"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer } from "recharts"

const performanceData = [
  { mercury: 165, zinc: 145 },
  { mercury: 140, zinc: 142 },
  { mercury: 180, zinc: 145 },
  { mercury: 170, zinc: 148 },
  { mercury: 150, zinc: 146 },
  { mercury: 155, zinc: 142 },
  { mercury: 152, zinc: 147 },
  { mercury: 155, zinc: 145 },
]

export function PerformanceChart() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <Line
                type="monotone"
                dataKey="mercury"
                stroke="#10b981"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "#10b981",
                  strokeWidth: 0,
                }}
              />
              <Line
                type="monotone"
                dataKey="zinc"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "#6366f1",
                  strokeWidth: 0,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

