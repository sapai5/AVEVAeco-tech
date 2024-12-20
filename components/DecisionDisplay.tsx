import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle } from 'lucide-react'

interface DecisionDisplayProps {
  decision: string
}

export default function DecisionDisplay({ decision }: DecisionDisplayProps) {
  const isPositive = decision.toLowerCase().includes('should continue')

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Mining Decision</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant={isPositive ? 'default' : 'destructive'} className="bg-card border-primary">
          {isPositive ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
          <AlertTitle className="text-foreground">AI Decision</AlertTitle>
          <AlertDescription className="text-muted-foreground">{decision}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

