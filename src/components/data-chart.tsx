import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps, Legend, ResponsiveContainer, Brush } from 'recharts'
import { Tooltip as RechartsTooltip, TooltipProps as TooltipPropsRecharts } from 'recharts';

interface DataPoint {
  entry: number;
  actual: number | null;
  predicted: number;
}

interface DataChartProps {
  data: DataPoint[];
  targetColumn: string;
}

const CustomTooltip: React.FC<TooltipPropsRecharts<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">Entry: {label}</p>
        {payload.map((pld) => (
          <div key={pld.dataKey} className="flex justify-between items-center gap-4">
            <span style={{ color: pld.color }}>{pld.name}:</span>
            <span className="font-mono">{pld.value?.toFixed(4) ?? 'N/A'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DataChart: React.FC<DataChartProps> = ({ data, targetColumn }) => {
  // Prepare the data series
  const pastData = data.filter(point => point.actual !== null);
  const futureStartIndex = pastData.length;
  const futureData = data.slice(futureStartIndex);

  // Create combined data for smooth transition
  const combinedPastData = pastData.map(point => ({
    ...point,
    futurePredicted: null
  }));

  const combinedFutureData = futureData.map(point => ({
    ...point,
    actual: null,
    predicted: null,
    futurePredicted: point.predicted
  }));

  // Add transition point
  if (pastData.length > 0 && futureData.length > 0) {
    combinedFutureData[0] = {
      ...combinedFutureData[0],
      futurePredicted: pastData[pastData.length - 1].predicted
    };
  }

  const combinedData = [...combinedPastData, ...combinedFutureData];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Visualization for {targetColumn}</CardTitle>
      </CardHeader>
      <CardContent>
        {combinedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={combinedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="entry" 
                label={{ value: 'Number of Samples', position: 'insideBottom', offset: -22 }}
                allowDataOverflow={true}
                tickMargin={10}
                interval={49}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                label={{ value: targetColumn, angle: -90, position: 'insideLeft', offset: -10 }}
                allowDataOverflow={true}
                tickMargin={10}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">Entry: {label}</p>
                        {payload.map((pld) => (
                          <div key={pld.dataKey} className="flex justify-between items-center gap-4">
                            <span style={{ color: pld.color }}>{pld.name}:</span>
                            <span className="font-mono">{pld.value?.toFixed(4) ?? 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#8884d8" 
                name="Actual" 
                dot={false} 
                connectNulls 
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#82ca9d" 
                name="Predicted (Past)" 
                dot={false} 
                connectNulls 
              />
              <Line 
                type="monotone" 
                dataKey="futurePredicted" 
                stroke="#ff7300" 
                name="Predicted (Future)" 
                dot={false} 
                connectNulls 
              />
              <Brush 
                dataKey="entry"
                height={30}
                stroke="#8884d8"
                y={440}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground">No data available for chart</p>
        )}
      </CardContent>
    </Card>
  )
}

export default DataChart

