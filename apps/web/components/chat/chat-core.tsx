"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { useChatStore } from "~/store/chat/chatStore"
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import { ModelAdapterFactory } from "~/lib/models"
import type { Message, ModelConfig } from "types/chat"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { ModelSelector } from "./model-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Loader2, Settings, MessageSquare } from "lucide-react"
import { ContextQueue } from "./context-queue"

interface ChatCoreProps {
  showContextQueue?: boolean;
  compact?: boolean;
  className?: string;
  fixedLayout?: boolean;
}

/**
 * Core chat functionality that can be used in both full page and floating modes
 */
export function ChatCore({ 
  showContextQueue = false, 
  compact = false, 
  className = "",
  fixedLayout = true
}: ChatCoreProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResponse, setCurrentResponse] = useState("")

  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    getCurrentSession,
    sendMessage: storeSendMessage,
    updateModelSelection,
  } = useChatStore()

  const { getSelectedContent } = useContextQueueStore()

  // Create a default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession({ provider: 'openai', modelName: 'gpt-4o' }).then(id => {
        setCurrentSession(id)
      })
    } else if (!currentSessionId && sessions.length > 0) {
      setCurrentSession(sessions[0].id)
    }
  }, [sessions, currentSessionId, createSession, setCurrentSession])

  const currentSession = getCurrentSession()

  const handleSendMessage = async (message: string) => {
    if (!currentSessionId || !currentSession) return

    setIsProcessing(true)
    
    try {
      // Get context from context queue
      const contextContent = getSelectedContent()
      const contextualMessage = contextContent 
        ? `${message}\n\nContext:\n${contextContent}`
        : message

      // Send message to the store
      await storeSendMessage(currentSessionId, contextualMessage)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleModelChange = (modelConfig: ModelConfig) => {
    if (!currentSessionId) return
    
    // Format the model ID as provider:modelName
    const modelId = `${modelConfig.provider}:${modelConfig.modelName}`
    updateModelSelection(currentSessionId, modelId)
  }

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className={className}>
      {showContextQueue ? (
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Context</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="m-0">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">Chat</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className={fixedLayout ? "flex flex-col h-[calc(100vh-250px)]" : "flex flex-col h-full"}>
                  <div className="mb-4">
                    <ModelSelector
                      provider={currentSession.modelConfig.provider}
                      modelName={currentSession.modelConfig.modelName}
                      onChange={handleModelChange}
                    />
                  </div>
                  
                  <div className={fixedLayout ? "flex-1 overflow-y-auto mb-4 border rounded-md" : "flex-1 overflow-y-auto border rounded-md"}>
                    <MessageList 
                      messages={currentSession.messages} 
                      compact={compact}
                    />
                  </div>
                  
                  <MessageInput 
                    onSend={handleSendMessage} 
                    isDisabled={isProcessing}
                    compact={compact}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="context" className="m-0">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">Context</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ContextQueue compact={compact} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className={fixedLayout ? "flex flex-col h-full" : "flex flex-col h-full"}>
          <div className="mb-4">
            <ModelSelector
              provider={currentSession.modelConfig.provider}
              modelName={currentSession.modelConfig.modelName}
              onChange={handleModelChange}
            />
          </div>
          
          <div className={fixedLayout ? "flex-1 overflow-y-auto mb-4 border rounded-md" : "flex-1 overflow-y-auto border rounded-md"}>
            <MessageList 
              messages={currentSession.messages} 
              compact={compact}
            />
          </div>
          
          <div className={fixedLayout ? "" : "sticky bottom-0 bg-white py-4 border-t z-10"}>
            <MessageInput 
              onSend={handleSendMessage} 
              isDisabled={isProcessing}
              compact={compact}
            />
          </div>
        </div>
      )}
    </div>
  )
}
