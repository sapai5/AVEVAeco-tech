"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts"

interface DataPoint {
  timestamp: string
  mineralA: number
  mineralB: number
  volume: number
  ma20: number
  ma50: number
  rsi: number
}

function calculateMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1]
  const slice = data.slice(-period)
  return slice.reduce((sum, val) => sum + val, 0) / period
}

function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = data.length - period; i < data.length; i++) {
    const difference = data[i] - data[i - 1]
    if (difference >= 0) {
      gains += difference
    } else {
      losses -= difference
    }
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100

  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

export function TechnicalMineralChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [timeFrame, setTimeFrame] = useState('1D')

  const getInitialDataForTimeFrame = (tf: string) => {
    const now = Date.now()
    const getInterval = () => {
      switch (tf) {
        case '1D': return 30 * 60 * 1000; // 30 minutes
        case '1W': return 3 * 60 * 60 * 1000; // 3 hours
        case '1M': return 12 * 60 * 60 * 1000; // 12 hours
        case '3M': return 24 * 60 * 60 * 1000; // 1 day
        case 'YTD': return 7 * 24 * 60 * 60 * 1000; // 1 week
        default: return 30 * 60 * 1000;
      }
    }
    
    return Array.from({ length: 100 }, (_, i) => {
      const baseValue = 50 + Math.sin(i * 0.1) * 10 + Math.random() * 5
      return {
        timestamp: new Date(now - (100 - i) * getInterval()).toISOString(),
        mineralA: baseValue + Math.random() * 2,
        mineralB: baseValue - 10 + Math.random() * 2,
        volume: 1000 + Math.random() * 1000,
        ma20: 0,
        ma50: 0,
        rsi: 0
      }
    })
  }

  useEffect(() => {
    const initialData = getInitialDataForTimeFrame(timeFrame)
    // Calculate moving averages and RSI
    const mineralAValues = initialData.map(d => d.mineralA)
    initialData.forEach((point, i) => {
      point.ma20 = calculateMA(mineralAValues.slice(0, i + 1), 20)
      point.ma50 = calculateMA(mineralAValues.slice(0, i + 1), 50)
      point.rsi = calculateRSI(mineralAValues.slice(0, i + 1))
    })

    setData(initialData)

    const interval = setInterval(() => {
      setData(currentData => {
        const lastPoint = currentData[currentData.length - 1]
        const newMineralA = lastPoint.mineralA + (Math.random() - 0.5) * 0.5
        const newMineralB = lastPoint.mineralB + (Math.random() - 0.5) * 0.5
        
        const newPoint: DataPoint = {
          timestamp: new Date().toISOString(),
          mineralA: newMineralA,
          mineralB: newMineralB,
          volume: 1000 + Math.random() * 1000,
          ma20: 0,
          ma50: 0,
          rsi: 0
        }

        const newData = [...currentData.slice(1), newPoint]
        const mineralAValues = newData.map(d => d.mineralA)
        
        // Update technical indicators
        newData.forEach((point, i) => {
          point.ma20 = calculateMA(mineralAValues.slice(0, i + 1), 20)
          point.ma50 = calculateMA(mineralAValues.slice(0, i + 1), 50)
          point.rsi = calculateRSI(mineralAValues.slice(0, i + 1))
        })

        return newData
      })
    }, 500)

    return () => clearInterval(interval)
  }, [timeFrame])

  const getDataPointsForTimeFrame = (tf: string) => {
    switch (tf) {
      case '1D': return 24 * 2; // Assuming data points every 30 minutes
      case '1W': return 7 * 24 * 2;
      case '1M': return 30 * 24 * 2;
      case '3M': return 90 * 24 * 2;
      case 'YTD': return data.length; // Show all available data
      default: return data.length;
    }
  }

  return (
    <Card className="bg-[#1C1C1C] border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mineral A Technical Analysis</span>
          <div className="text-sm font-normal space-x-4">
            <span className="text-green-500">MA(20)</span>
            <span className="text-blue-500">MA(50)</span>
          </div>
        </CardTitle>
      </CardHeader>
      <div className="flex justify-end space-x-2 mb-4">
        {['1D', '1W', '1M', '3M', 'YTD'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeFrame(tf)}
            className={`px-2 py-1 text-sm rounded ${
              timeFrame === tf ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.slice(-getDataPointsForTimeFrame(timeFrame))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(time) => {
                  const date = new Date(time)
                  switch (timeFrame) {
                    case '1D':
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    case '1W':
                      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit' })}`
                    case '1M':
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
                    case '3M':
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
                    case 'YTD':
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
                    default:
                      return date.toLocaleTimeString()
                  }
                }}
                interval="preserveStartEnd"
                minTickGap={50}
                stroke="#666666"
              />
              <YAxis stroke="#666666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1C',
                  border: '1px solid #333333',
                  borderRadius: '4px'
                }}
                labelFormatter={(label) => {
                  const date = new Date(label)
                  switch (timeFrame) {
                    case '1D':
                      return date.toLocaleTimeString()
                    default:
                      return date.toLocaleString()
                  }
                }}
                formatter={(value, name) => [parseFloat(value).toFixed(2), name]}
              />
              <Area
                type="monotone"
                dataKey="mineralA"
                fill="rgba(34, 197, 94, 0.1)"
                stroke="#22C55E"
              />
              <Line
                type="monotone"
                dataKey="ma20"
                stroke="#22C55E"
                dot={false}
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="ma50"
                stroke="#3B82F6"
                dot={false}
                strokeWidth={1}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

