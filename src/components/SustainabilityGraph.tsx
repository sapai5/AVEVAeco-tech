import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { io, Socket } from 'socket.io-client'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { databaseColumns } from "../lib/database"

interface SustainabilityScore {
  period: number;
  points: string;
  score: number;
  trend: number;
}

interface GraphMetadata {
  averageScore: number;
  overallTrend: number;
  totalPeriods: number;
  minScore: number;
  maxScore: number;
}

function roundToNearestTenth(number) {
  return Math.round(number * 10) / 10;
}

export function SustainabilityGraph() {
  const [showTable, setShowTable] = useState(false)
  const [data, setData] = useState<SustainabilityScore[]>([])
  const [metadata, setMetadata] = useState<GraphMetadata | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to websocket server');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to the server. Please ensure the backend is running and try again.');
    });

    newSocket.on('SustainabilityGraph', (newData: any) => {
      console.log('Received data:', newData);
      try {
        if (newData && newData.graphData) {
          setData(newData.graphData);
          setMetadata(newData.metadata);
        }
      } catch (err) {
        console.error('Error processing data:', err);
        setError('Failed to process sustainability data from server');
      }
      setIsLoading(false);
    })

    return () => {
      newSocket.disconnect();
    }
  }, [])

  const onRunAnalysis = () => {
    if (socket && socket.connected) {
      setIsLoading(true);
      setError(null);
      console.log('Requesting sustainability analysis for entire dataset');
      socket.emit('process_data', { target_column: 'pH' });
    } else {
      setError('Not connected to the server. Please try again.');
      // Attempt to reconnect
      if (socket) {
        socket.connect();
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 space-x-4">
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setShowTable(!showTable)}>
            {showTable ? 'Show Graph' : 'Show Table'}
          </Button>
          <Button onClick={onRunAnalysis} disabled={isLoading}>
            {isLoading ? 'Running Analysis...' : 'Run Analysis'}
          </Button>
          {error && (
            <Button onClick={() => socket?.connect()} variant="secondary">
              Reconnect
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Running analysis...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.length > 0 ? (
        showTable ? (
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry</TableHead>
                  <TableHead>Points Considered</TableHead>
                  <TableHead>Sustainability Score</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((score) => (
                  <TableRow key={score.period}>
                    <TableCell className="text-center">{score.period}</TableCell>
                    <TableCell className="text-center">{score.points}</TableCell>
                    <TableCell className="text-center">{score.score.toFixed(2)}</TableCell>
                    <TableCell className="text-center font-mono">
                      {score.trend !== 0 ? (
                        <span className={score.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                          {score.trend > 0 ? `+${score.trend}` : `${score.trend}`}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div>
            <div className="mb-4 flex justify-center">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 mr-1" style={{ backgroundColor: "hsl(210, 100%, 70%)" }}></div>
                <span className="text-sm">Sustainability Score</span>
              </div>
            </div>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    label={{ value: 'Period', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'Sustainability Score', angle: -90, position: 'insideLeft', offset: -40 }}
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SustainabilityScore;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">Period {data.period}</p>
                            <p>Points: {data.points}</p>
                            <p>Score: {data.score.toFixed(2)}</p>
                            {data.trend !== 0 && (
                              <p className={data.trend > 0 ? 'text-green-500' : 'text-red-500'}>
                                Trend: {data.trend > 0 ? `+${roundToNearestTenth(data.trend)}` : `${roundToNearestTenth(data.trend)}`}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(210, 100%, 70%)"
                    activeDot={{ r: 8 }}
                    name="Sustainability Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {data.length > 0 && metadata && !showTable && (
              <div className="mt-16 w-full grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-card text-card-foreground">
                <div>
                  <p className="font-medium">Average Score</p>
                  <p className="text-2xl">{metadata.averageScore.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Overall Trend</p>
                  <p className="text-2xl">{metadata.overallTrend > 0 ? '+' : ''}{metadata.overallTrend.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Periods</p>
                  <p className="text-2xl">{metadata.totalPeriods}</p>
                </div>
                <div>
                  <p className="font-medium">Min Score</p>
                  <p className="text-2xl">{metadata.minScore.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Max Score</p>
                  <p className="text-2xl">{metadata.maxScore.toFixed(2)}</p>
                </div>
              </div>
            )}
            <Alert className="mt-4">
              <AlertTitle>About the Sustainability Overview Graph</AlertTitle>
              <AlertDescription>
                This graph visualizes the predicted sustainability of mining operations over time. Each point represents a future period, with the score indicating the estimated environmental and economic sustainability (higher scores are better). The trend shows how sustainability is expected to change, helping in long-term planning and resource management.
              </AlertDescription>
            </Alert>
          </div>
        )
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No data available. Run the analysis to see results.
        </div>
      )}
    </div>
  )
}

