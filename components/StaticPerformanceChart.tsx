"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface StaticPerformanceChartProps {
  data: any[]
  className?: string
}

const forecast = (data: number[], steps: number = 1): number[] => {
  if (data.length < 2) return new Array(steps).fill(data[0] || 0);
  const lastValue = data[data.length - 1];
  const secondLastValue = data[data.length - 2];
  const slope = lastValue - secondLastValue;
  return new Array(steps).fill(0).map((_, i) => lastValue + slope * (i + 1));
}

export function StaticPerformanceChart({ data, className }: StaticPerformanceChartProps) {
  const [visibleLines, setVisibleLines] = useState<{ [key: string]: boolean }>({})
  const [animationIndex, setAnimationIndex] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 'auto']);
  const numericColumnsRef = useRef<string[]>([])

  // Determine which columns are numeric
  useEffect(() => {
    numericColumnsRef.current = Object.keys(data[0] || {}).filter(key => 
      typeof data[0][key] === 'number' && key !== 'index'
    )

    // Initialize visible lines
    setVisibleLines(numericColumnsRef.current.reduce((acc, column) => {
      acc[column] = true
      return acc
    }, {} as { [key: string]: boolean }))
  }, [data])

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationIndex(prev => (prev + 1) % data.length)
    }, 100)
    return () => clearInterval(interval)
  }, [data.length])

  const chartData = useMemo(() => {
    const currentData = data.slice(0, animationIndex + 1).map((row, index) => ({
      index,
      ...numericColumnsRef.current.reduce((acc, column) => {
        acc[column] = row[column]
        return acc
      }, {} as { [key: string]: number })
    }))

    // Add forecast data
    const lastDataPoint = currentData[currentData.length - 1];
    if (lastDataPoint) {
      const forecastData = numericColumnsRef.current.reduce((acc, column) => {
        const columnData = currentData.map(d => d[column]);
        const [forecastValue] = forecast(columnData);
        acc[`${column}Forecast`] = forecastValue;
        return acc;
      }, {} as { [key: string]: number });

      currentData.push({
        ...lastDataPoint,
        ...forecastData,
        index: lastDataPoint.index + 1
      });
    }

    return currentData;
  }, [data, animationIndex, numericColumnsRef])

  // Calculate accuracy
  useEffect(() => {
    if (chartData.length > 1) {
      const currentValues = chartData[chartData.length - 2];
      const forecastValues = chartData[chartData.length - 1];
      let totalError = 0;
      let totalValue = 0;
      numericColumnsRef.current.forEach(column => {
        const actual = currentValues[column];
        const forecast = forecastValues[`${column}Forecast`];
        if (actual !== undefined && forecast !== undefined) {
          totalError += Math.abs(actual - forecast);
          totalValue += Math.abs(actual);
        }
      });
      const newAccuracy = totalValue > 0 ? (1 - totalError / totalValue) * 100 : 100;
      setAccuracy(newAccuracy);
    }
  }, [chartData, numericColumnsRef]);

  const getMaxValue = () => {
    return Math.max(...chartData.flatMap(dataPoint => 
      numericColumnsRef.current.flatMap(column => [
        dataPoint[column],
        dataPoint[`${column}Forecast`]
      ])
    ).filter(Boolean))
  }

  const fitYAxis = () => {
    const maxValue = Math.max(
      ...chartData.flatMap(dataPoint =>
        numericColumnsRef.current
          .filter(column => visibleLines[column])
          .flatMap(column => [dataPoint[column], dataPoint[`${column}Forecast`]])
      ).filter(Boolean)
    );
    setYAxisDomain([0, Math.ceil(maxValue * 1.1)]);
  };

  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
  ]

  return (
    <Card className={`bg-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Live Data Visualization</span>
          <span className="text-sm font-normal">
            Accuracy: {accuracy.toFixed(2)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="flex justify-end mb-2">
            <button
              onClick={fitYAxis}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Fit Y-Axis
            </button>
          </div>
          <div className="flex">
            <div className="w-3/4 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  baseValue={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="index"
                    stroke="#9CA3AF"
                    label={{ value: "Sample Index", position: "bottom" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    label={{ value: "Value", angle: -90, position: "insideLeft" }}
                    domain={yAxisDomain}
                    allowDataOverflow={true}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '6px'
                    }}
                  />
                  {numericColumnsRef.current.map((column, index) => (
                    visibleLines[column] && (
                      <Line
                        key={column}
                        type="monotone"
                        dataKey={column}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    )
                  ))}
                  {numericColumnsRef.current.map((column, index) => (
                    visibleLines[column] && (
                      <Line
                        key={`${column}Forecast`}
                        type="monotone"
                        dataKey={`${column}Forecast`}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/4 pl-4 overflow-y-auto max-h-[400px]">
              <div className="space-y-2">
                {numericColumnsRef.current.map((column, index) => (
                  <label key={column} className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleLines[column]}
                      onCheckedChange={(checked) => {
                        setVisibleLines(prev => ({
                          ...prev,
                          [column]: checked === true
                        }))
                      }}
                    />
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {column}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

