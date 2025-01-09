'use client'

import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import ColumnSelector from '../components/ColumnSelector'
import ConsoleOutput from '../components/ConsoleOutput'
import AccuracyDisplay from '../components/AccuracyDisplay'
import DataChart from '../components/DataChart'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

interface DataPoint {
  entry: number;
  actual: number;
  predicted: number;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [consoleOutput, setConsoleOutput] = useState<string>('')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [targetColumn, setTargetColumn] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to the websocket server.')
    })

    newSocket.on('available_columns', (data: { columns: string[] }) => {
      setColumns(data.columns)
    })

    newSocket.on('console_output', (data: { message?: string; error?: string }) => {
      setConsoleOutput(data.message || data.error || '')
    })

    newSocket.on('model_mae', (data: { mae: number }) => {
      setAccuracy(data.mae)
    })

    newSocket.on('new_plot', (data: { data: DataPoint[], column: string }) => {
      setChartData(data.data)
      setTargetColumn(data.column)
    })

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message)
    })

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const handleSubmit = (column: string) => {
    if (socket) {
      socket.emit('process_data', { target_column: column })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold">MiningAI</h1>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-6">
            <ColumnSelector columns={columns} onSubmit={handleSubmit} />
            <ConsoleOutput output={consoleOutput} />
            <AccuracyDisplay accuracy={accuracy} />
            <DataChart data={chartData} targetColumn={targetColumn} />
          </div>
        </div>
      </main>
    </div>
  )
}

