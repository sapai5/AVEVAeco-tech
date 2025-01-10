import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { Socket } from 'socket.io-client'
import { Checkbox } from "@/components/ui/checkbox"
import Link from 'next/link'

interface StaticPerformanceChartProps {
  socket: Socket | null;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">Sample ID: {label}</p>
        {payload.map((pld) => (
          <div key={pld.dataKey} className="flex justify-between items-center gap-4">
            <span style={{ color: pld.color }}>{pld.name}:</span>
            <span className="font-mono">{pld.value?.toFixed(4) ?? 'N/A'}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function StaticPerformanceChart({ socket }: StaticPerformanceChartProps) {
  const [showTable, setShowTable] = useState(false)
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [visibleLines, setVisibleLines] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [windowedData, setWindowedData] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected');
      socket.emit('request_full_dataset');
      setError(null);
    };

    const handleFullDataset = (receivedData) => {
      console.log('Received data:', receivedData);
      if (receivedData && receivedData.columns && Array.isArray(receivedData.data)) {
        setData(receivedData.data);
        setColumns(receivedData.columns);
        
        // Initialize visible lines
        const numericColumns = receivedData.columns.filter(column =>
          column !== 'ID' && typeof receivedData.data[0][column] === 'number'
        );
        setVisibleLines(numericColumns.reduce((acc, column) => {
          acc[column] = true;
          return acc;
        }, {}));
        
        setIsLoading(false);
      } else {
        console.error('Invalid data format received:', receivedData);
        setError('Invalid data format received from server');
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setError(typeof error === 'string' ? error : error.message || 'An unknown error occurred');
      setIsLoading(false);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setError('Disconnected from server');
    };

    socket.on('connect', handleConnect);
    socket.on('full_dataset', handleFullDataset);
    socket.on('error', handleError);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      socket.emit('request_full_dataset');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('full_dataset', handleFullDataset);
      socket.off('error', handleError);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (data.length === 0) return;

    const animationInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % data.length;
        const windowEnd = nextIndex + 100 > data.length ? data.length : nextIndex + 100;
        const newWindowedData = data.slice(nextIndex, windowEnd);
        
        if (nextIndex + 100 > data.length) {
          newWindowedData.push(...data.slice(0, 100 - newWindowedData.length));
        }
        
        setWindowedData(newWindowedData);
        return nextIndex;
      });
    }, 100); // Adjust this value to control animation speed

    return () => clearInterval(animationInterval);
  }, [data]);

  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
  ];

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available. Please check your connection.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setShowTable(!showTable)}>
            {showTable ? 'Show Graph' : 'Show Table'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="https://github.com/sapai5/AVEVAeco-tech/blob/main/SOIL%20DATA%20GR.csv">View Dataset</Link>
          </Button>
        </div>
      </div>

      {showTable ? (
        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sample ID</TableHead>
                {columns.filter(col => col !== 'ID').map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.ID}>
                  <TableCell>{row.ID}</TableCell>
                  {columns.filter(col => col !== 'ID').map((column) => (
                    <TableCell key={column}>
                      {typeof row[column] === 'number' ? row[column].toFixed(4) : row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <div className="flex">
          <div className="w-3/4">
            <div className="mb-4 flex flex-wrap justify-center">
              {Object.entries(visibleLines).map(([column, isVisible], index) => (
                isVisible && column !== 'ID' && (
                  <div key={column} className="flex items-center mr-4 mb-2">
                    <div className="w-3 h-3 mr-1" style={{ backgroundColor: colors[index % colors.length] }}></div>
                    <span className="text-sm">{column}</span>
                  </div>
                )
              ))}
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={windowedData}
                  margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ID"
                    label={{ value: 'Sample ID', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'Value', angle: -90, position: 'insideLeft', offset: -40 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {Object.entries(visibleLines).map(([column, isVisible], index) => (
                    isVisible && column !== 'ID' && (
                      <Line
                        key={column}
                        type="monotone"
                        dataKey={column}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        name={column}
                        isAnimationActive={false}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="w-1/4 pl-4 overflow-y-auto max-h-[400px]">
            <div className="space-y-2">
              {Object.keys(visibleLines).map((column, index) => (
                column !== 'ID' && (
                  <label key={column} className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleLines[column]}
                      onCheckedChange={(checked) => {
                        setVisibleLines(prev => ({
                          ...prev,
                          [column]: checked === true
                        }));
                      }}
                    />
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {column}
                    </span>
                  </label>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

