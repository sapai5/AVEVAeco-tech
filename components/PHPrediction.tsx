"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PHPredictionChart } from './PHPredictionChart'

interface PredictionResult {
  predictedValue: number
  actualValue: number
  sequenceData: Array<{ timeStep: number; pH: number }>
}

export function PHPrediction() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handlePredict = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/predict-ph', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Prediction failed')
      }

      const result = await response.json()
      setPrediction(result)
    } catch (error) {
      console.error('Prediction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to process prediction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {prediction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted pH</p>
                <p className="text-2xl font-bold">{prediction.predictedValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actual pH</p>
                <p className="text-2xl font-bold">{prediction.actualValue.toFixed(2)}</p>
              </div>
            </div>
            <PHPredictionChart
              sequenceData={prediction.sequenceData}
              predictedValue={prediction.predictedValue}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

