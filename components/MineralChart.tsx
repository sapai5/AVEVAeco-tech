import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MineralChartProps {
  data: {
    date: string
    mercury: number | null
    zinc: number | null
    mercuryForecast: number | null
    zincForecast: number | null
  }[]
}

export default function MineralChart({ data }: MineralChartProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Mineral Concentration Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
            <Legend />
            <Line type="monotone" dataKey="mercury" name="Mercury (Actual)" stroke="#10b981" />
            <Line type="monotone" dataKey="mercuryForecast" name="Mercury (Forecast)" stroke="#10b981" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="zinc" name="Zinc (Actual)" stroke="#6366f1" />
            <Line type="monotone" dataKey="zincForecast" name="Zinc (Forecast)" stroke="#6366f1" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

