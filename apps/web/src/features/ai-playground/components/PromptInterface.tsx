import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit3, Play, Copy, Plus, Trash2, Variable } from "lucide-react";
import { testPrompt } from "@/lib/api";
// import { cn } from "@/lib/utils";

interface PromptVariable {
  id: string;
  name: string;
  value: string;
}

export function PromptInterface() {
  const [template, setTemplate] = useState(`You are a helpful assistant. Please answer the following question:

Question: {{question}}

Additional context: {{context}}

Please provide a detailed and accurate response.`);
  
  const [variables, setVariables] = useState<PromptVariable[]>([
    { id: '1', name: 'question', value: 'What is machine learning?' },
    { id: '2', name: 'context', value: 'The user is a beginner in AI/ML' }
  ]);
  
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string>('');

  // Update preview whenever template or variables change
  const updatePreview = () => {
    let preview = template;
    variables.forEach((variable) => {
      const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      preview = preview.replace(regex, variable.value || `{{${variable.name}}}`);
    });
    setPreviewTemplate(preview);
  };

  const handleTestPrompt = async () => {
    if (!template.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const variableMap = variables.reduce((acc, variable) => {
        acc[variable.name] = variable.value;
        return acc;
      }, {} as Record<string, string>);

      const result = await testPrompt(template, variableMap);
      setResponse(result.message);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addVariable = () => {
    const newVariable: PromptVariable = {
      id: Date.now().toString(),
      name: `variable${variables.length + 1}`,
      value: ''
    };
    setVariables([...variables, newVariable]);
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const updateVariable = (id: string, field: 'name' | 'value', newValue: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, [field]: newValue } : v
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const detectVariables = (text: string): string[] => {
    const matches = text.match(/{{\s*([^}]+)\s*}}/g);
    if (!matches) return [];
    
    return matches.map(match => 
      match.replace(/{{\s*|\s*}}/g, '')
    ).filter((value, index, self) => self.indexOf(value) === index);
  };

  const foundVariables = detectVariables(template);
  const definedVariables = variables.map(v => v.name);
  const missingVariables = foundVariables.filter(v => !definedVariables.includes(v));

  // Update preview when template or variables change
  useEffect(() => {
    updatePreview();
  }, [template, variables]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Prompt Template
            </CardTitle>
            <CardDescription>
              Create and edit your prompt template with variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Template</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(template)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Enter your prompt template here. Use {{variableName}} for variables."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            {foundVariables.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Detected Variables
                </label>
                <div className="flex flex-wrap gap-2">
                  {foundVariables.map((variable) => (
                    <Badge 
                      key={variable} 
                      variant={definedVariables.includes(variable) ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
                {missingVariables.length > 0 && (
                  <p className="text-xs text-destructive">
                    Missing variable definitions: {missingVariables.join(', ')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variables Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Variable className="w-5 h-5" />
              Template Variables
            </CardTitle>
            <CardDescription>
              Define values for your template variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {variables.map((variable) => (
                <div key={variable.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Input
                      value={variable.name}
                      onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                      placeholder="Variable name"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeVariable(variable.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={variable.value}
                    onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                    placeholder="Variable value"
                    className="min-h-[80px] text-sm"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={addVariable}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Variable
            </Button>

            <Button
              onClick={handleTestPrompt}
              disabled={isLoading || missingVariables.length > 0}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Testing Prompt...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Test Prompt
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>
              How your prompt will look with variables replaced
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {previewTemplate || 'Enter a template to see preview...'}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Response Section */}
        <Card>
          <CardHeader>
            <CardTitle>AI Response</CardTitle>
            <CardDescription>
              Response from testing your prompt template
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Testing your prompt...</span>
                </div>
              </div>
            ) : response ? (
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
                    {response}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(response)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Response
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Test your prompt to see the AI response</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}