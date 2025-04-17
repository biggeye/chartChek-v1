"use client"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { useChatStore } from "~/store/chat/chatStore"
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import { useSidebarStore } from "~/store/layout/sidebarStore"
import { useChat } from "~/hooks/useChat"
import { ModelAdapterFactory } from "~/lib/models"
import { getCurrentUserId } from "~/utils/supabase/user"
import type { Message, ModelConfig, ContextItem, ModelProvider } from "~/types/chat"
import { MessageList } from "~/components/chat/message-list"
import { MessageInput } from "~/components/chat/message-input"
import { ModelSelector } from "~/components/chat/model-selector"
import { ContextQueue } from "~/components/chat/context-queue"
import { PatientContextModal } from "~/components/chat/patient-context-modal"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import {
  Loader2,
  Settings,
  MessageSquare,
  FileUp,
  File,
  User,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  Send,
  FileText,
  PlusCircle,
  ChevronsUpDown
} from "lucide-react"
import { cn } from "~/lib/utils"
import { VisuallyHidden } from "../ui/visually-hidden"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"

export function ChatUI() {
  const [currentResponse, setCurrentResponse] = useState("")
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [isContextQueueOpen, setIsContextQueueOpen] = useState(false)
  const [isContextBarExpanded, setIsContextBarExpanded] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isNewChatMenuOpen, setIsNewChatMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Add state to track client-side mount
  const [hasMounted, setHasMounted] = useState(false);

  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    getCurrentSession,
    availableModels,
  } = useChatStore()

  const {
    items: contextItems,
    getSelectedContent,
    storeContextInQueue,
    toggleItem,
    removeItem
  } = useContextQueueStore()

  // Get sidebar state
  const { isDesktopSidebarCollapsed } = useSidebarStore();

  // Use the new hook
  const {
    isProcessing,
    error,
    sendMessageHandler
  } = useChat();

  // Create a default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession({
        provider: "openai",
        modelName: "gpt-4o",
      }).then(id => {
        setCurrentSession(id)
      })
    } else if (!currentSessionId && sessions.length > 0) {
      setCurrentSession(sessions[0].id)
    }
  }, [sessions, currentSessionId, createSession, setCurrentSession])

  // Effect to set hasMounted to true after component mounts on client
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const currentSession = getCurrentSession()

  // Get selected context items for the context bar
  const selectedContextItems = contextItems.filter(item => item.selected)
  const hasSelectedContextItems = selectedContextItems.length > 0

  // Simplified handleSendMessage using the hook
  const handleSendMessage = () => {
    const content = currentMessage.trim();
    if (!content || !currentSession) return;

    setCurrentMessage(""); // Clear input immediately

    // Get context content if any items are selected
    const contextContent = selectedContextItems.length > 0 ? getSelectedContent() : undefined;

    // Call the handler from the hook
    // The hook now handles adding messages, calling the API, and state updates
    sendMessageHandler(content, contextContent).catch(err => {
      // Error is already set within the hook, potentially log here if needed
      console.error("[ChatUI] Send message handler failed:", err);
      // UI could show a toast notification here based on the hook's error state
    });
  };

  const handleNewChat = async (modelConfig?: ModelConfig) => {
    try {
      // Create a new session with provided settings or defaults
      const newSessionId = await createSession({
        provider: modelConfig?.provider || "google",
        modelName: modelConfig?.modelName || "gemini-2.5-pro-exp-03-25",
      });
      
      // Switch to the new session
      setCurrentSession(newSessionId);
      
      // Clear the current message
      setCurrentMessage("");
      
      // Reset context-related state
      setIsContextBarExpanded(false);
      
      // Close the new chat menu if it was open
      setIsNewChatMenuOpen(false);
    } catch (error) {
      console.error("Error creating new chat session:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelChange = (config: ModelConfig) => {
    if (currentSession) {
      // updateModelSelection(currentSession.id, config.modelName)
    }
  }

  // Toggle the context bar expansion
  const toggleContextBar = () => {
    setIsContextBarExpanded(!isContextBarExpanded)
  }

  // Handle closing the patient modal
  const handleClosePatientModal = () => {
    setIsPatientModalOpen(false)
    setActiveModal(null)
    // Automatically expand the context bar if items were added
    if (selectedContextItems.length > 0) {
      setIsContextBarExpanded(true)
    }
  }

  // Render a compact context item for the context bar
  const renderCompactContextItem = (item: ContextItem) => {
    const icon = item.type === 'document' ? <File className="h-3 w-3" /> :
      item.type === 'evaluation' ? <User className="h-3 w-3" /> :
        <FileUp className="h-3 w-3" />

    return (
      <Badge
        key={item.id}
        variant="outline"
        className="flex items-center gap-1 py-1 px-2 max-w-[200px]"
      >
        {icon}
        <span className="truncate text-xs">{item.title}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1"
          onClick={() => removeItem(item.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    )
  }

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    
    // Set the height to the scrollHeight (content height)
    const newHeight = Math.min(textarea.scrollHeight, 120) // Cap at max-height
    textarea.style.height = `${newHeight}px`
  }, [currentMessage])

  // Add keyframes for slide up animation
  useEffect(() => {
    // Add the keyframes to the document if they don't exist
    if (!document.querySelector('#context-bar-keyframes')) {
      const style = document.createElement('style')
      style.id = 'context-bar-keyframes'
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Prevent rendering until mounted on the client to avoid hydration errors
  if (!hasMounted) {
    // Optionally return a loading skeleton component here
    return null;
  }

  // If no session exists after mounting (e.g., initial load failed), show loading or error
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col h-[calc(100vh-10rem)]",
        // Common outer card styling
        "border border-border rounded-md shadow-sm bg-background"
      )}
    >
      {/* We can rely on CardContent as our main scrollable area */}
      <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
        {/* Main scrollable message area - reduce bottom padding to extend closer to input */}
        <div className="flex-1 p-2 pt-0 pb-4 overflow-y-auto h-full">
          <MessageList
            messages={currentSession.messages}
            isLoading={isProcessing}
            loadingMessage={currentResponse || "Thinking..."}
          />
        </div>
      </CardContent>
      <div className={cn(
        "fixed bottom-4 bg-background border border-border rounded-lg shadow-md z-10 transition-all duration-300 ease-in-out",
        // Adjust left and right positioning based on sidebar state
        "left-4 right-4",
        // On large screens, adjust for sidebar and context sidebar
        "lg:left-4 lg:right-4",
        // Adjust left based on sidebar state (collapsed or expanded)
        isDesktopSidebarCollapsed ? "lg:left-24" : "lg:left-[calc(18rem+1rem)]",
        // Adjust right for context sidebar on xl screens
        "xl:right-[calc(24rem+1rem)]"
      )}>
        {/* Context Bar - Now part of the floating input bar */}
        {hasSelectedContextItems && isContextBarExpanded && (
          <div
            className={cn(
              "p-2 border-b border-border/50 bg-muted/30"
            )}
            style={{ 
              animation: 'slideUp 0.3s ease-out forwards',
              transformOrigin: 'bottom'
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">
                Context Items ({selectedContextItems.length})
              </span>
              <div className="flex gap-1">
                <Dialog
                  open={isContextQueueOpen}
                  onOpenChange={setIsContextQueueOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View All
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                    <DialogTitle>Context Queue</DialogTitle>
                    <ContextQueue />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={toggleContextBar}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {selectedContextItems.map(renderCompactContextItem)}
            </div>
          </div>
        )}
        
        {/* Collapsed context bar indicator - now inside the input bar */}
        {hasSelectedContextItems && !isContextBarExpanded && (
          <div className="px-2 pt-2 pb-1 border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center justify-center gap-1 text-xs h-6 w-full",
                "border rounded-md bg-muted/30 hover:bg-muted/50"
              )}
              onClick={toggleContextBar}
            >
              <span>{selectedContextItems.length} context items selected</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center">
          {/* Magic Icons */}
          <div className="flex items-center pl-2 gap-1">
            <Popover open={isNewChatMenuOpen} onOpenChange={setIsNewChatMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 hover:bg-accent/50"
                  title="New Chat"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search models..." />
                  <CommandList>
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup heading="Select model for new chat">
                      {availableModels.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.id}
                          onSelect={() => {
                            handleNewChat({
                              provider: option.provider as ModelProvider,
                              modelName: option.model,
                            });
                          }}
                        >
                          {option.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveModal("upload")}
              className={cn(
                "rounded-full h-8 w-8 hover:bg-accent/50",
                activeModal === "upload" && "bg-primary/20"
              )}
            >
              <FileUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPatientModalOpen(true)}
              className={cn(
                "rounded-full h-8 w-8 hover:bg-accent/50",
                activeModal === "patient" && "bg-primary/20"
              )}
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveModal("documents")}
              className={cn(
                "rounded-full h-8 w-8 hover:bg-accent/50",
                activeModal === "documents" && "bg-primary/20"
              )}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>

          {/* Textarea Input */}
          <div className="relative flex-1 px-2 py-2">
            <textarea
              ref={textareaRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className={cn(
                "text-sm relative w-full resize-none overflow-hidden min-h-[40px] max-h-[120px] px-2 py-2 rounded-md border border-input focus:border-primary focus:ring-1 focus:ring-primary focus-visible:outline-none"
              )}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 mr-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
      </div>
        
        <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <VisuallyHidden>
              <DialogTitle>
                PatientContext
              </DialogTitle>
   
            </VisuallyHidden>
            <PatientContextModal onClose={handleClosePatientModal} />
          </DialogContent>
        </Dialog>
      </div>
  )
}