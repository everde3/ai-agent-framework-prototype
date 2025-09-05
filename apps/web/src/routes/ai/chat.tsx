import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import { ChatInterface } from '@/features/ai-playground/components/ChatInterface'

function ChatPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Chat Interface</h1>
            <p className="text-muted-foreground mt-1">
              Have a conversation with the AI assistant
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Chat Assistant
          </CardTitle>
          <CardDescription>
            Ask questions, get explanations, or just chat about anything. The AI is here to help!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/ai/chat')({
  component: ChatPage,
})