import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalysisSummaryProps {
  summary: string
}

export default function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{summary}</p>
      </CardContent>
    </Card>
  )
}

