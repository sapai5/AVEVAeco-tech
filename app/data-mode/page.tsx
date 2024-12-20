"use client"

import { useState } from 'react'
import { CSVUpload } from '@/components/CSVUpload'
import { StaticRevenueCard } from '@/components/StaticRevenueCard'
import { StaticPerformanceChart } from '@/components/StaticPerformanceChart'
import { StaticAnalysisSummary } from '@/components/StaticAnalysisSummary'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

export default function DataMode() {
  const [csvData, setCsvData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCSVUpload = (data: any[]) => {
    setError(null)
    
    try {
      const formattedData = data.map((row, index) => ({
        index,
        ...Object.keys(row).reduce((acc, key) => {
          acc[key] = parseFloat(row[key]) || 0
          return acc
        }, {} as { [key: string]: number })
      }))

      setCsvData(formattedData)
    } catch (error) {
      console.error('CSV processing error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while processing the CSV')
    }
  }

  return (
    <main className="min-h-screen bg-[#121212] p-8">
      <h1 className="text-4xl font-bold mb-8 text-foreground">MiningAI - Data Mode</h1>
      
      <div className="space-y-8">
        <CSVUpload onUpload={handleCSVUpload} />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {csvData && (
          <div className="space-y-8">
            <div className="flex gap-8">
              <StaticRevenueCard data={csvData} />
              <StaticPerformanceChart data={csvData} className="flex-grow" />
            </div>
            
            <StaticAnalysisSummary data={csvData} />
          </div>
        )}
      </div>
    </main>
  )
}

