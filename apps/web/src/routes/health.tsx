import { createFileRoute } from '@tanstack/react-router'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { HealthDashboard } from '@/features/health'

function HealthPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">System Health Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring of system health, API status, and performance metrics
            </p>
          </div>
        </div>
      </div>

      <HealthDashboard />
    </div>
  )
}

export const Route = createFileRoute('/health')({
  component: HealthPage,
})