"use client"

import { useState, useEffect, useRef } from "react"
import { 
  MessageSquare, 
  X, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Maximize2,
  Minimize2,
  FileUp,
  User,
  Send,
  Eye,
  PlusCircle
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog"
import { ContextQueue } from "./context-queue"
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import { PatientContextModal } from "./patient-context-modal"
import { useChatStore } from "~/store/chat/chatStore"
import { useChat } from "~/hooks/useChat"
import { MessageList } from "./message-list"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ModelConfig, ModelProvider } from "~/types/chat"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { ContextItem } from "~/types/chat"

// CSS for animations
const animationStyles = `
  @keyframes slideUp {
    from {
      transform: translateY(10px);
      opacity: 0.8;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`

type ModalType = "upload" | "patient" | "documents" | null;

export function FloatingChat() {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [isContextQueueOpen, setIsContextQueueOpen] = useState(false)
  const [isContextBarExpanded, setIsContextBarExpanded] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [isNewChatMenuOpen, setIsNewChatMenuOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get chat store state and actions
  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    getCurrentSession,
    availableModels,
  } = useChatStore()

  // Get context queue items
  const {
    items: contextItems,
    getSelectedContent,
    toggleItem,
    removeItem
  } = useContextQueueStore()

  // Use the chat hook
  const {
    isProcessing,
    error,
    sendMessageHandler
  } = useChat();

  // Get selected context items for the context bar
  const selectedContextItems = contextItems.filter(item => item.selected)
  const hasSelectedContextItems = selectedContextItems.length > 0

  // Effect to set hasMounted to true after component mounts on client
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  // Toggle visibility of the chat widget
  const toggleVisibility = () => {
    setIsVisible(!isVisible)
    if (!isVisible) {
      setIsExpanded(true)
    }
  }

  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  // Toggle the context bar expansion
  const toggleContextBar = () => {
    setIsContextBarExpanded(!isContextBarExpanded)
  }

  // Handle sending a message
  const handleSendMessage = () => {
    const content = currentMessage.trim();
    if (!content || !getCurrentSession()) return;

    setCurrentMessage(""); // Clear input immediately

    // Get context content if any items are selected
    const contextContent = selectedContextItems.length > 0 ? getSelectedContent() : undefined;

    // Call the handler from the hook
    sendMessageHandler(content, contextContent).catch(err => {
      console.error("[FloatingChat] Send message handler failed:", err);
    });
  };

  // Handle creating a new chat
  const handleNewChat = async (modelConfig?: ModelConfig) => {
    try {
      // Create a new session with provided settings or defaults
      const newSessionId = await createSession({
        provider: modelConfig?.provider || "openai",
        modelName: modelConfig?.modelName || "gpt-4o",
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

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    const icon = item.type === 'document' ? <FileText className="h-3 w-3" /> :
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

  // Add animation styles
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.textContent = animationStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Prevent rendering until mounted on the client to avoid hydration errors
  if (!hasMounted) {
    return null;
  }

  // Get the current chat session
  const currentSession = getCurrentSession()

  // If no session exists after mounting (e.g., initial load failed), show loading or error
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed z-50 transition-all duration-200",
        isFullScreen ? "inset-0" : "bottom-4 right-4"
      )}
    >
      {/* Chat Widget */}
      {isVisible && (
        <div 
          className={cn(
            "bg-background border rounded-lg shadow-lg transition-all duration-200 flex flex-col",
            isExpanded ? (isFullScreen ? "w-full h-full" : "w-96 h-[500px]") : "w-auto h-auto"
          )}
          style={isExpanded ? { animation: "slideUp 0.2s ease-out forwards" } : {}}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-2 border-b">
            {isExpanded ? (
              <>
                <h3 className="font-medium">Chat</h3>
                <div className="flex items-center space-x-1">
                  <Popover open={isNewChatMenuOpen} onOpenChange={setIsNewChatMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="New Chat"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[220px] p-0" align="end">
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
                                    modelName: option.name,
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
                    className="h-6 w-6"
                    onClick={() => setIsContextQueueOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    {contextItems.length > 0 && (
                      <span className="absolute top-0 right-0 bg-primary text-primary-foreground rounded-full text-xs w-4 h-4 flex items-center justify-center">
                        {contextItems.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleFullScreen}
                  >
                    {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleExpand}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={toggleExpand}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Chat Content - Only shown when expanded */}
          {isExpanded && (
            <>
              {/* Context Bar */}
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
              
              {/* Collapsed context bar indicator */}
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

              {/* Messages Area */}
              <div className="flex-1 p-2 overflow-y-auto">
                <MessageList
                  messages={currentSession.messages}
                  isLoading={isProcessing}
                  loadingMessage="Thinking..."
                />
              </div>

              {/* Input Area */}
              <div className="p-2 border-t">
                <div className="flex items-center">
                  {/* Magic Icons */}
                  <div className="flex items-center gap-1">
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
                  <div className="relative flex-1 px-2">
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
                    className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle Visibility Button - Only shown when chat is hidden */}
      {!isVisible && (
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={toggleVisibility}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Context Queue Dialog */}
      <Dialog open={isContextQueueOpen} onOpenChange={setIsContextQueueOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogTitle>Context Queue</DialogTitle>
          <ContextQueue />
        </DialogContent>
      </Dialog>

      {/* Patient Modal */}
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

      {/* Upload Modal */}
      {activeModal === "upload" && (
        <Dialog open={activeModal === "upload"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent>
            <DialogTitle>Upload File</DialogTitle>
            <div className="py-6">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                <FileUp className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Drag and drop files here or click to browse</p>
                <Button size="sm" onClick={() => setActiveModal(null)}>
                  Browse Files
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Documents Modal */}
      {activeModal === "documents" && (
        <Dialog open={activeModal === "documents"} onOpenChange={(open) => !open && setActiveModal(null)}>
          <DialogContent className="max-w-3xl">
            <DialogTitle>Documents</DialogTitle>
            <div className="py-4">
              <ul className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-md cursor-pointer"
                    onClick={() => setActiveModal(null)}
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Document {i + 1}</p>
                        <p className="text-sm text-muted-foreground">
                          {["Patient Records", "Lab Results", "Imaging", "Assessments", "Treatment Plans"][i % 5]}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
