"use client"

import { AlertTriangle } from "lucide-react"

export default function QueryMonitor() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
      <AlertTriangle className="h-12 w-12 text-yellow-500 animate-bounce" />
      <h2 className="text-2xl font-bold">Query Monitor Under Construction</h2>
      <p className="text-muted-foreground max-w-md">
        This feature is being built by Edward Flinsticks and will soon let you monitor and debug knowledgebase queries, search logs, and more. Check back soon!
      </p>
    </div>
  )
}
