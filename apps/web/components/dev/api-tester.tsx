"use client"

import { useState } from "react"
import { Button } from "@kit/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card"
import { llmService } from "~/lib/llm-service"
import { Loader2 } from "lucide-react"

export function ApiTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testOpenAI = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)
    
    try {
      console.log("🧪 Starting OpenAI API test...")
      const success = await llmService.testOpenAIConnection()
      
      if (success) {
        setResult("OpenAI API connection successful! Check console for details.")
      } else {
        setError("OpenAI API test failed. Check console for error details.")
      }
    } catch (err) {
      console.error("Error testing API:", err)
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>API Connection Tester</CardTitle>
        <CardDescription>Test if the LLM APIs are properly configured</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={testOpenAI} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing OpenAI...
              </>
            ) : (
              "Test OpenAI Connection"
            )}
          </Button>
          
          {result && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              {result}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        This component helps diagnose API configuration issues
      </CardFooter>
    </Card>
  )
}
