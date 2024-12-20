"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Scatter } from "recharts"

interface PHPredictionChartProps {
  sequenceData: Array<{ timeStep: number; pH: number }>
  predictedValue: number
}

export function PHPredictionChart({ sequenceData, predictedValue }: PHPredictionChartProps) {
  // Combine sequence data with prediction point
  const chartData = [
    ...sequenceData,
    { timeStep: 30, pH: null, predicted: predictedValue }
  ]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timeStep"
            type="number"
            domain={[0, 30]}
            ticks={[0, 5, 10, 15, 20, 25, 30]}
            label={{ value: "Time Step", position: "bottom" }}
            stroke="#9CA3AF"
          />
          <YAxis
            domain={['auto', 'auto']}
            label={{ value: "pH", angle: -90, position: "insideLeft" }}
            stroke="#9CA3AF"
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
            dot={false}
            name="Actual Data (pH)"
            strokeWidth={2}
          />
          <Scatter
            name="Predicted Value"
            data={[{ timeStep: 30, pH: predictedValue }]}
            fill="#ef4444"
          >
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
  )
}

