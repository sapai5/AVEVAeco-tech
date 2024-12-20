"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ExplorationData {
  date: string
  mineralA: number
  mineralB: number
  depth: number
  quality: number
}

export function LiveDataTable() {
  const [data, setData] = useState<ExplorationData[]>([])

  useEffect(() => {
    // Initialize with some data
    const initialData = Array.from({ length: 8 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (7 - i))
      return {
        date: date.toISOString().split('T')[0],
        mineralA: Number((2 + Math.random() * 4).toFixed(2)),
        mineralB: Number((1 + Math.random() * 8).toFixed(2)),
        depth: Math.round(60 + Math.random() * 60),
        quality: Math.round((0.5 + Math.random() * 0.5) * 100)
      }
    })
    setData(initialData)

    // Update last row every 500ms
    const interval = setInterval(() => {
      setData(currentData => {
        const newData = [...currentData]
        const lastRow = newData[newData.length - 1]
        newData[newData.length - 1] = {
          ...lastRow,
          mineralA: Number((lastRow.mineralA + (Math.random() - 0.5) * 0.2).toFixed(2)),
          mineralB: Number((lastRow.mineralB + (Math.random() - 0.5) * 0.2).toFixed(2)),
          depth: Math.max(60, Math.min(120, lastRow.depth + Math.round((Math.random() - 0.5) * 5))),
          quality: Math.max(50, Math.min(100, lastRow.quality + Math.round((Math.random() - 0.5) * 3)))
        }
        return newData
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Mineral Exploration Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Mineral A (%)</TableHead>
              <TableHead>Mineral B (%)</TableHead>
              <TableHead>Depth (m)</TableHead>
              <TableHead>Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.mineralA.toFixed(2)}</TableCell>
                <TableCell>{row.mineralB.toFixed(2)}</TableCell>
                <TableCell>{row.depth}</TableCell>
                <TableCell>{row.quality}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

