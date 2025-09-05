import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, Edit3, Sparkles, Brain, FileText } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import { RAGInterface } from "./RAGInterface";
import { PromptInterface } from "./PromptInterface";

export function AIPlayground() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Playground
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experiment with different AI capabilities including chat, retrieval-augmented generation, and prompt engineering
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="default" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Interactive Demo
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Brain className="w-3 h-3" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="gap-1">
              <FileText className="w-3 h-3" />
              Production Ready
            </Badge>
          </div>
        </div>

        {/* Main Playground */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="chat" className="flex items-center gap-2 py-3">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="rag" className="flex items-center gap-2 py-3">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">RAG</span>
                </TabsTrigger>
                <TabsTrigger value="prompt" className="flex items-center gap-2 py-3">
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Prompt Testing</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-4 mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-primary" />
                    AI Chat Interface
                  </h2>
                  <p className="text-muted-foreground">
                    Have a conversation with the AI assistant. Ask questions, get explanations, or just chat about anything.
                  </p>
                </div>
                <ChatInterface />
              </TabsContent>

              <TabsContent value="rag" className="space-y-4 mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                    <Search className="w-6 h-6 text-primary" />
                    Retrieval-Augmented Generation
                  </h2>
                  <p className="text-muted-foreground">
                    Upload your documents and ask questions. The AI will search through your content to provide accurate, contextual answers.
                  </p>
                </div>
                <RAGInterface />
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4 mt-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                    <Edit3 className="w-6 h-6 text-primary" />
                    Prompt Engineering & Testing
                  </h2>
                  <p className="text-muted-foreground">
                    Design, test, and refine your prompts with variables. Perfect for creating reusable templates and optimizing AI interactions.
                  </p>
                </div>
                <PromptInterface />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="bg-card/30 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Direct conversation with AI for general questions and assistance
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  RAG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  AI responses enhanced with your own documents and knowledge base
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Prompt Testing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Design and test prompt templates with variables for consistent results
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}