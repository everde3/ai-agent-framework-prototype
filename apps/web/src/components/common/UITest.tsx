import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Code, Sparkles } from "lucide-react"

export function UITest() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-foreground">
            Modern UI Setup Complete
          </h1>
          <p className="text-lg text-muted-foreground">
            Tailwind CSS + shadcn/ui + OKLCH Colors
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="default">
              <Palette className="w-3 h-3 mr-1" />
              OKLCH Colors
            </Badge>
            <Badge variant="secondary">
              <Code className="w-3 h-3 mr-1" />
              Tailwind CSS
            </Badge>
            <Badge variant="outline">
              <Sparkles className="w-3 h-3 mr-1" />
              shadcn/ui
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="components" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                  <CardDescription>
                    Test different button styles and sizes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Badge Styles</CardTitle>
                  <CardDescription>
                    Various badge variants for status indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Components</CardTitle>
                <CardDescription>
                  Input and textarea components with proper styling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Text Input
                  </label>
                  <Input placeholder="Enter some text..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Textarea
                  </label>
                  <Textarea placeholder="Enter a longer message..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>OKLCH Color Palette</CardTitle>
                <CardDescription>
                  Testing the beautiful OKLCH color scheme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-primary"></div>
                    <p className="text-xs text-center text-muted-foreground">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-secondary"></div>
                    <p className="text-xs text-center text-muted-foreground">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-accent"></div>
                    <p className="text-xs text-center text-muted-foreground">Accent</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-md bg-muted"></div>
                    <p className="text-xs text-center text-muted-foreground">Muted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}