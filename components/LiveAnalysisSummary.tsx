"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalysisData {
  mineralAConcentration: number
  mineralBConcentration: number
  quality: number
  depth: number
}

export function LiveAnalysisSummary() {
  const [data, setData] = useState<AnalysisData>({
    mineralAConcentration: 4.25,
    mineralBConcentration: 4.57,
    quality: 78,
    depth: 89
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setData(current => ({
        mineralAConcentration: Number((current.mineralAConcentration + (Math.random() - 0.5) * 0.05).toFixed(2)),
        mineralBConcentration: Number((current.mineralBConcentration + (Math.random() - 0.5) * 0.05).toFixed(2)),
        quality: Math.min(100, Math.max(50, Math.round(current.quality + (Math.random() - 0.5) * 1))),
        depth: Math.round(current.depth + (Math.random() - 0.5) * 1.5)
      }))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Mineral Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold">Mineral A</h3>
            <p className="text-muted-foreground transition-all duration-500 ease-in-out">
              Average Concentration: {data.mineralAConcentration}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Mineral B</h3>
            <p className="text-muted-foreground transition-all duration-500 ease-in-out">
              Average Concentration: {data.mineralBConcentration}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quality</h3>
            <p className="text-muted-foreground transition-all duration-500 ease-in-out">
              Average Quality: {data.quality}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Depth</h3>
            <p className="text-muted-foreground transition-all duration-500 ease-in-out">
              Average Depth: {data.depth} meters
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

