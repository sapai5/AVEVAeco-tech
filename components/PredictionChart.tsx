"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Scatter } from "recharts"

interface PredictionChartProps {
  sequenceData: Array<{ timeStep: number; pH: number }>
  predictedValue: number
}

export function PredictionChart({ sequenceData, predictedValue }: PredictionChartProps) {
  // Add the prediction point to the data
  const allData = [
    ...sequenceData,
    { timeStep: 30, pH: null, predicted: predictedValue }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Actual Data vs Predicted Value</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={allData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timeStep"
                label={{ value: "Time Step", position: "bottom" }}
              />
              <YAxis
                label={{ value: "pH", angle: -90, position: "insideLeft" }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [value?.toFixed(2), 'pH']}
              />
              <Line
                type="monotone"
                dataKey="pH"
                stroke="#3b82f6"
                name="Actual Data (pH)"
                dot={false}
                strokeWidth={2}
              />
              <Scatter
                data={[{ timeStep: 30, pH: predictedValue }]}
                fill="#ef4444"
                name="Predicted Value"
              >
                {/* Custom shape for the prediction point */}
                {(props: any) => {
                  const { cx, cy } = props
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#ef4444"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )
                }}
              </Scatter>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

