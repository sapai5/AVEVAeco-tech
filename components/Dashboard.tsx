'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import FileUpload from './FileUpload'
import MineralChart from './MineralChart'
import DecisionDisplay from './DecisionDisplay'
import ForecastTable from './ForecastTable'
import { RevenueCard } from './RevenueCard'
import { PerformanceChart } from './PerformanceChart'

export default function Dashboard() {
  const [predictedFile, setPredictedFile] = useState<File | null>(null)
  const [actualFile, setActualFile] = useState<File | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePredictedFileUpload = (file: File) => {
    setPredictedFile(file)
    setError(null)
  }

  const handleActualFileUpload = (file: File) => {
    setActualFile(file)
    setError(null)
  }

  const handleAnalysis = async () => {
    if (!predictedFile || !actualFile) {
      setError('Please upload both predicted and actual values files.')
      return
    }

    setIsLoading(true)
    setError(null)
    setAnalysisData(null)

    const formData = new FormData()
    formData.append('predicted', predictedFile)
    formData.append('actual', actualFile)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      setAnalysisData(result)
    } catch (error) {
      console.error('Error during analysis:', error)
      setError(`An error occurred during analysis: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 p-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6">Mining AI Forecast</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RevenueCard />
        <div className="md:col-span-2">
          <PerformanceChart />
        </div>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload label="Upload Predicted Values File" onFileSelect={handlePredictedFileUpload} accept=".txt" />
          <FileUpload label="Upload Actual Values CSV" onFileSelect={handleActualFileUpload} accept=".csv" />
          <Button onClick={handleAnalysis} disabled={isLoading || !predictedFile || !actualFile}>
            {isLoading ? 'Analyzing...' : 'Compare and Process'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisData && (
        <>
          <MineralChart data={analysisData.mineralData} />
          <ForecastTable data={analysisData.forecast} />
          <DecisionDisplay decision={analysisData.decision} />
        </>
      )}
    </div>
  )
}

