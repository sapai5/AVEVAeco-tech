import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ForecastTableProps {
  data: {
    date: string
    mercuryForecast: number
    zincForecast: number
  }[]
}

export default function ForecastTable({ data }: ForecastTableProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Forecast Table</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Mercury Forecast (%)</TableHead>
              <TableHead className="text-muted-foreground">Zinc Forecast (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.mercuryForecast.toFixed(4)}</TableCell>
                <TableCell>{row.zincForecast.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

