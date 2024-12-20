import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StaticAnalysisSummaryProps {
  data: any[]
}

export function StaticAnalysisSummary({ data }: StaticAnalysisSummaryProps) {
  const calculateAverages = () => {
    const sum = data.reduce((acc, row) => ({
      pH: acc.pH + row['pH'],
      ec: acc.ec + row['EC mS/cm'],
      om: acc.om + row['O.M. %'],
      sand: acc.sand + row['Sand %'],
      clay: acc.clay + row['Clay %'],
      silt: acc.silt + row['Silt %']
    }), { pH: 0, ec: 0, om: 0, sand: 0, clay: 0, silt: 0 })

    return {
      pH: sum.pH / data.length,
      ec: sum.ec / data.length,
      om: sum.om / data.length,
      sand: sum.sand / data.length,
      clay: sum.clay / data.length,
      silt: sum.silt / data.length
    }
  }

  const averages = calculateAverages()

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Soil Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold">pH Level</h3>
            <p className="text-muted-foreground">
              Average: {averages.pH.toFixed(2)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">EC (mS/cm)</h3>
            <p className="text-muted-foreground">
              Average: {averages.ec.toFixed(3)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Organic Matter</h3>
            <p className="text-muted-foreground">
              Average: {averages.om.toFixed(2)}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Sand Content</h3>
            <p className="text-muted-foreground">
              Average: {averages.sand.toFixed(2)}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Clay Content</h3>
            <p className="text-muted-foreground">
              Average: {averages.clay.toFixed(2)}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Silt Content</h3>
            <p className="text-muted-foreground">
              Average: {averages.silt.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

