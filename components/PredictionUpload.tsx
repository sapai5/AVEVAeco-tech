"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { PredictionChart } from './PredictionChart'

interface PredictionData {
  predictedValue: number
  actualValue: number
  sequenceData: Array<{ timeStep: number; pH: number }>
}

export function PredictionUpload() {
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const result = await response.json()
      setPrediction(result)
    } catch (error) {
      console.error('Error during prediction:', error)
      setError(`An error occurred during prediction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full" />

      {prediction && (
        <PredictionChart
          sequenceData={prediction.sequenceData}
          predictedValue={prediction.predictedValue}
        />
      )}
    </div>
  )
}

