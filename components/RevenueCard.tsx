"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer } from "recharts"

const data = [
  { value: 150 },
  { value: 160 },
  { value: 155 },
  { value: 153 },
  { value: 152 },
  { value: 154 },
  { value: 157 },
  { value: 190 },
]

export function RevenueCard() {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">$15,231.89</div>
        <p className="text-xs text-muted-foreground">
          +20.1% from last month
        </p>
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "#10b981",
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

