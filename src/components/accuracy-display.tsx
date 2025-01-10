import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface AccuracyDisplayProps {
  accuracy: number | null
}

const AccuracyDisplay: React.FC<AccuracyDisplayProps> = ({ accuracy }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Accuracy</CardTitle>
      </CardHeader>
      <CardContent>
        {accuracy !== null ? (
          <p className="text-2xl font-bold">
            Model Accuracy (MAEP): {accuracy.toFixed(4)}%
          </p>
        ) : (
          <p className="text-muted-foreground">Waiting for model accuracy...</p>
        )}
      </CardContent>
    </Card>
  )
}

export default AccuracyDisplay

