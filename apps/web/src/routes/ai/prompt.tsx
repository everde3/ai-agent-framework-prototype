import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit3 } from 'lucide-react'
import { PromptInterface } from '@/features/ai-playground/components/PromptInterface'

function PromptPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Edit3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Prompt Engineering & Testing</h1>
            <p className="text-muted-foreground mt-1">
              Design, test, and refine your prompts with variables
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Prompt Designer
          </CardTitle>
          <CardDescription>
            Create reusable prompt templates with variables. Perfect for optimizing AI interactions and ensuring consistent results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromptInterface />
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/ai/prompt')({
  component: PromptPage,
})