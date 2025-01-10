import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts'

interface DataPoint {
  entry: number;
  actual: number;
  predicted: number;
}

interface DataChartProps {
  data: DataPoint[];
  targetColumn: string;
}

const DataChart: React.FC<DataChartProps> = ({ data, targetColumn }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Visualization for {targetColumn}</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="entry" 
                label={{ value: 'Number of Samples', position: 'insideBottom', offset: -22 }}
                allowDataOverflow={true}
                tickMargin={10}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                label={{ value: targetColumn, angle: -90, position: 'insideLeft', offset: -10 }}
                allowDataOverflow={true}
                tickMargin={10}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual" dot={false} connectNulls />
              <Line type="monotone" dataKey="predicted" stroke="#82ca9d" name="Predicted" dot={false} connectNulls />
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

