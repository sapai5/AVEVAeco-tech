"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface PerformanceData {
  timestamp: number
  mercury: number
  zinc: number
}

export function LivePerformanceChart() {
  const [data, setData] = useState<PerformanceData[]>([])

  useEffect(() => {
    const initialData = Array.from({ length: 40 }, (_, i) => ({
      timestamp: Date.now() - (39 - i) * 500,
      mercury: 165 + Math.random() * 20,
      zinc: 145 + Math.random() * 10
    }))
    setData(initialData)

    const interval = setInterval(() => {
      setData(currentData => {
        const lastData = currentData[currentData.length - 1]
        return [
          ...currentData.slice(1),
          {
            timestamp: Date.now(),
            mercury: lastData.mercury + (Math.random() - 0.5) * 2,
            zinc: lastData.zinc + (Math.random() - 0.5) * 1.5
          }
        ]
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="timestamp" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                tickFormatter={(unixTime) => {
                  const date = new Date(unixTime)
                  return date.getMinutes() % 5 === 0 ? // Only show timestamps every 5 minutes
                    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : ''
                }}
                interval="preserveStartEnd"
                minTickGap={50}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                formatter={(value, name) => [parseFloat(value).toFixed(2), name]}
              />
              <Line
                type="monotone"
                dataKey="mercury"
                name="Mercury"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="zinc"
                name="Zinc"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

