import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, MessageCircle, Search, Edit3, Activity, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

function IndexPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-4 rounded-xl bg-primary/10">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Agent Framework
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A powerful, production-ready framework for building AI-powered applications with modern tooling and best practices
        </p>
        <div className="flex justify-center gap-2 flex-wrap mt-6">
          <Badge variant="default" className="gap-1 text-sm px-3 py-1">
            <Sparkles className="w-4 h-4" />
            Production Ready
          </Badge>
          <Badge variant="secondary" className="gap-1 text-sm px-3 py-1">
            <Brain className="w-4 h-4" />
            AI-Powered
          </Badge>
          <Badge variant="outline" className="gap-1 text-sm px-3 py-1">
            <Activity className="w-4 h-4" />
            Health Monitoring
          </Badge>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="group hover:shadow-lg transition-shadow border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              AI Playground
            </CardTitle>
            <CardDescription>
              Interactive environment for testing AI capabilities including chat, RAG, and prompt engineering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full group">
              <Link to="/ai">
                Explore AI Features
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              Health Monitoring
            </CardTitle>
            <CardDescription>
              Real-time monitoring of system health, API status, and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group">
              <Link to="/health">
                View System Health
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow border-primary/20 bg-card/50 backdrop-blur md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              Framework
            </CardTitle>
            <CardDescription>
              Built with modern technologies: React, TanStack Query & Router, TypeScript, Tailwind CSS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">React 18</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">TanStack</Badge>
              <Badge variant="secondary">Tailwind</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Chat Interface
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mb-3">
              Direct conversation with AI for questions and assistance
            </CardDescription>
            <Button size="sm" variant="ghost" asChild className="text-primary hover:text-primary">
              <Link to="/ai/chat">Try Chat →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              RAG System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mb-3">
              AI responses enhanced with your documents and knowledge base
            </CardDescription>
            <Button size="sm" variant="ghost" asChild className="text-primary hover:text-primary">
              <Link to="/ai/rag">Try RAG →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Prompt Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mb-3">
              Design and test prompt templates with variables
            </CardDescription>
            <Button size="sm" variant="ghost" asChild className="text-primary hover:text-primary">
              <Link to="/ai/prompt">Try Prompts →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})