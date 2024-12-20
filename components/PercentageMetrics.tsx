import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PercentageMetricsProps {
  data: {
    averageMercury: number
    averageZinc: number
    mercuryChange: number
    zincChange: number
  }
}

export default function PercentageMetrics({ data }: PercentageMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Percentage Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold">Mercury</h3>
            <p>Average: {data.averageMercury.toFixed(2)}%</p>
            <p>Change: {data.mercuryChange > 0 ? '+' : ''}{data.mercuryChange.toFixed(2)}%</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Zinc</h3>
            <p>Average: {data.averageZinc.toFixed(2)}%</p>
            <p>Change: {data.zincChange > 0 ? '+' : ''}{data.zincChange.toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

