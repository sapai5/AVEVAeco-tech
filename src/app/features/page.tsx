import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChartIcon as ChartBar, LineChart, Brain, Database } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 text-center">Platform Features</h1>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Predictive Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Advanced machine learning and artificial intelligence models for accurate predictions of mining metrics</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Interactive Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Dynamic charts and graphs with zoom capabilities and detailed tooltips.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Efficient handling of large datasets with real-time processing capabilities using AWS S3 cloud storage.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-5 w-5" />
              Statistical Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Comprehensive statistical tools for in-depth data analysis and reporting.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

