import { useState } from "react"
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

interface StaticTechnicalMineralChartProps {
  data: any[]
}

function calculateMA(data: number[], period: number): number[] {
  return data.map((_, index) => 
    index < period - 1
      ? null
      : data.slice(index - period + 1, index + 1).reduce((sum, value) => sum + value, 0) / period
  )
}

export function StaticTechnicalMineralChart({ data }: StaticTechnicalMineralChartProps) {
  const [timeFrame, setTimeFrame] = useState('All')

  const chartData = data.map(row => ({
    date: new Date(row.Date).getTime(),
    mineralA: parseFloat(parseFloat(row['Mercury (%)']).toFixed(2)) || 0,
  }))

  const mineralAValues = chartData.map(d => d.mineralA)
  const ma20 = calculateMA(mineralAValues, 20)
  const ma50 = calculateMA(mineralAValues, 50)

  chartData.forEach((point, i) => {
    point.ma20 = ma20[i]
    point.ma50 = ma50[i]
  })

  const getDataPointsForTimeFrame = (tf: string) => {
    switch (tf) {
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      case 'All':
      default: return chartData.length;
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
        {['1M', '3M', '6M', '1Y', 'All'].map((tf) => (
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
            <ComposedChart data={chartData.slice(-getDataPointsForTimeFrame(timeFrame))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
              <XAxis
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
                stroke="#666666"
              />
              <YAxis stroke="#666666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1C',
                  border: '1px solid #333333',
                  borderRadius: '4px'
                }}
                labelFormatter={(value) => [parseFloat(value).toFixed(2), name]}
              />
              <Area
                type="monotone"
                dataKey="mineralA"
                name="Mineral A"
                fill="rgba(34, 197, 94, 0.1)"
                stroke="#22C55E"
              />
              <Line
                type="monotone"
                dataKey="ma20"
                name="MA(20)"
                stroke="#22C55E"
                dot={false}
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="ma50"
                name="MA(50)"
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

