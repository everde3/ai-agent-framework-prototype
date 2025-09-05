import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/react-query'
import { Brain, Home, Activity, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/common'

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <nav className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-xl font-bold">AI Framework</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/ai" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    AI Playground
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/health" className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Health
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      
      {/* Development Tools */}
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools initialIsOpen={false} />
          <TanStackRouterDevtools />
        </>
      )}
    </QueryClientProvider>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})