import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"
import { useState, useEffect } from 'react'

interface StaticRevenueCardProps {
  data: any[]
}

const calculateDailyRevenue = (row: any) => {
  const pH = parseFloat(row['pH']) || 7 // Default to neutral pH if not available
  const dirtAmount = parseFloat(row['Dirt Amount (kg)']) || 1000 // Default to 1000 kg if not available

  // Revenue increases as pH decreases (more acidic)
  const baseRevenue = 1000 // Base revenue per 1000 kg of dirt
  const pHFactor = Math.max(0, (7 - pH) / 7) // 0 at pH 7, 1 at pH 0
  return baseRevenue * (1 + pHFactor) * (dirtAmount / 1000)
}

const calculatePercentageChange = (prevData: any, currentData: any) => {
  if (!prevData) return 0

  const prevRevenue = calculateDailyRevenue(prevData)
  const currentRevenue = calculateDailyRevenue(currentData)

  return ((currentRevenue - prevRevenue) / prevRevenue) * 100
}

export function StaticRevenueCard({ data }: StaticRevenueCardProps) {
  const calculateTotalRevenue = () => {
    return data.reduce((sum, row) => sum + calculateDailyRevenue(row), 0)
  }

  const totalRevenue = calculateTotalRevenue()
  const percentageChange = calculatePercentageChange(data[0], data[data.length -1])

  return (
    <Card className="bg-card w-1/4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">Total Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <LiveRevenueDisplay 
          data={data} 
          calculateDailyRevenue={calculateDailyRevenue}
          calculatePercentageChange={calculatePercentageChange}
        />
      </CardContent>
    </Card>
  )
}

function LiveRevenueDisplay({ 
  data, 
  calculateDailyRevenue, 
  calculatePercentageChange 
}: { 
  data: any[], 
  calculateDailyRevenue: (row: any) => number,
  calculatePercentageChange: (prevData: any, currentData: any) => number
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length)
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [data])

  const currentData = data[currentIndex]
  const totalRevenue = calculateDailyRevenue(currentData)
  const prevRevenue = calculateDailyRevenue(data[Math.max(0, currentIndex - 1)])
  const percentageChange = ((totalRevenue - prevRevenue) / prevRevenue) * 100

  return (
    <>
      <div className="text-2xl font-bold mb-2">${totalRevenue.toFixed(2)}</div>
      <p className="text-xs text-muted-foreground mb-4">
        {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% change
      </p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data.slice(Math.max(0, currentIndex - 30), currentIndex + 1)}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey={(item) => calculateDailyRevenue(item)}
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

