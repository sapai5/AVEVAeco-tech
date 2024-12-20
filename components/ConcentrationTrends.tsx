import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ConcentrationTrendsProps {
  data: {
    period: string
    mercury: number
    zinc: number
  }[]
}

export default function ConcentrationTrends({ data }: ConcentrationTrendsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Concentration Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="mercury" name="Mercury" fill="#8884d8" />
            <Bar dataKey="zinc" name="Zinc" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

