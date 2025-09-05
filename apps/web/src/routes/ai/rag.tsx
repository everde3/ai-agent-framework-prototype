import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { RAGInterface } from '@/features/ai-playground/components/RAGInterface'

function RAGPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Retrieval-Augmented Generation</h1>
            <p className="text-muted-foreground mt-1">
              AI responses enhanced with your documents and knowledge base
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Document-Enhanced AI
          </CardTitle>
          <CardDescription>
            Upload your documents and ask questions. The AI will search through your content to provide accurate, contextual answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RAGInterface />
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/ai/rag')({
  component: RAGPage,
})