import { LiveRevenueCard } from "@/components/LiveRevenueCard"
import { LivePerformanceChart } from "@/components/LivePerformanceChart"
import { TechnicalMineralChart } from "@/components/TechnicalMineralChart"
import { LiveAnalysisSummary } from "@/components/LiveAnalysisSummary"
import { PredictionUpload } from "@/components/PredictionUpload"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#121212] p-8">
      <h1 className="text-4xl font-bold mb-8 text-foreground">MiningAI</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <LiveRevenueCard />
        <LivePerformanceChart />
      </div>
      <div className="mt-8 space-y-8">
        <TechnicalMineralChart />
        <LiveAnalysisSummary />
        <PredictionUpload />
      </div>
    </main>
  )
}

