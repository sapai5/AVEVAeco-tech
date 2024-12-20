"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer } from "recharts"

interface DataPoint {
  timestamp: number
  value: number
}

export function LiveRevenueCard() {
  const [data, setData] = useState<DataPoint[]>([])
  const [revenue, setRevenue] = useState(15231.89)
  const [percentageChange, setPercentageChange] = useState(20.1)

  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (19 - i) * 500,
      value: 150 + Math.random() * 40
    }))
    setData(initialData)

    const interval = setInterval(() => {
      setData(currentData => {
        const newValue = currentData[currentData.length - 1].value + (Math.random() - 0.5) * 5
        return [
          ...currentData.slice(1),
          { timestamp: Date.now(), value: newValue }
        ]
      })

      setRevenue(prev => prev + (Math.random() - 0.5) * 50)
      setPercentageChange(prev => prev + (Math.random() - 0.5) * 0.25)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold transition-all duration-500 ease-in-out">
          ${revenue.toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground transition-all duration-500 ease-in-out">
          {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% from last month
        </p>
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
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

