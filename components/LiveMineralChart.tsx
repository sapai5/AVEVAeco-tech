"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MineralDataPoint {
  date: string
  mineralA: number
  mineralB: number
}

export function LiveMineralChart() {
  const [data, setData] = useState<MineralDataPoint[]>([])

  useEffect(() => {
    const initialData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        date: date.toISOString().split('T')[0],
        mineralA: 2 + Math.random() * 4,
        mineralB: 1 + Math.random() * 8
      }
    })
    setData(initialData)

    const interval = setInterval(() => {
      setData(currentData => {
        const newDate = new Date()
        const lastData = currentData[currentData.length - 1]
        return [
          ...currentData.slice(1),
          {
            date: newDate.toISOString().split('T')[0],
            mineralA: Math.max(2, Math.min(6, lastData.mineralA + (Math.random() - 0.5) * 0.2)),
            mineralB: Math.max(1, Math.min(9, lastData.mineralB + (Math.random() - 0.5) * 0.3))
          }
        ]
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Mineral Concentration Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                domain={[0, 12]}
                ticks={[0, 3, 6, 9, 12]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#9CA3AF'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="mineralA" 
                name="Mineral A (%)" 
                stroke="#10b981" 
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="mineralB" 
                name="Mineral B (%)" 
                stroke="#6366f1" 
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

