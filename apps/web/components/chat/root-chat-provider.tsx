"use client"

import { useState, useRef, useEffect } from "react"
import { 
  MessageSquare, 
  X, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  User,
  FileUp,
  Plus,
  Send,
  Eye,
  PlusCircle,
  Loader2
} from "lucide-react"
import { cn } from "@kit/ui/utils"
import { Button } from "@kit/ui/button"
import { Badge } from "@kit/ui/badge"
import { Card, CardContent } from "@kit/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@kit/ui/dialog"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@kit/ui/command"
import { Textarea } from "@kit/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip"
import { toast } from "@kit/ui/sonner"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { FloatingChat } from "./floating-chat"
import { MessageList } from "./message-list"
import { ContextQueue } from "./context-queue"
import { PatientContextModal } from "./patient-context-modal"
import { useContextQueueStore } from "~/store/chat/contextQueueStore"
import { usePatientStore } from "~/store/patient/patientStore"
import { useSidebarStore } from "~/store/sidebarStore"
import { useChatStore } from "~/store/chat/chatStore"
import { useChat } from "~/hooks/useChat"
import { ContextItem, ModelConfig, ModelProvider } from "types/chat"


// Add keyframes for slide-up animation
const slideUpKeyframes = `
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

type ModalType = "upload" | "patient" | "documents" | null

export function RootChatProvider() {
  const [currentResponse, setCurrentResponse] = useState("")
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [isContextQueueOpen, setIsContextQueueOpen] = useState(false)
  const [isContextBarExpanded, setIsContextBarExpanded] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isNewChatMenuOpen, setIsNewChatMenuOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [hasMounted, setHasMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)

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

  // Get sidebar state
  const { isDesktopSidebarCollapsed } = useSidebarStore();

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
      // create hook for fetching user's default model selection

      createSession({
        provider: "openai",
        modelName: "gpt-4o",
      }).then(id => {
        setCurrentSession(id)
      })
    } else if (!currentSessionId && sessions.length > 0) {
      // Explicitly check if the first session exists before accessing its ID
      const firstSession = sessions[0];
      if (firstSession) {
        setCurrentSession(firstSession.id);
      }
    }
  }, [sessions, currentSessionId, createSession, setCurrentSession])

  // Add the keyframes to the document
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.textContent = slideUpKeyframes
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Simplified handleSendMessage using the hook
  const handleSendMessage = () => {
    const content = currentMessage.trim();
    if (!content || !getCurrentSession()) return;

    setCurrentMessage(""); // Clear input immediately

    // Get context content if any items are selected
    const contextContent = selectedContextItems.length > 0 ? getSelectedContent() : undefined;

    // Call the handler from the hook
    sendMessageHandler(content, contextContent).catch((err: unknown) => {
      console.error("[RootChatProvider] Send message handler failed:", err);
    });
  };

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  // Prevent rendering until mounted on the client to avoid hydration errors
  if (!hasMounted) {
    return null;
  }

  const currentSession = getCurrentSession()

  // If no session exists after mounting (e.g., initial load failed), show loading or error
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Minimized Chat Tab */}
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 rounded-b-none rounded-t-lg shadow-lg z-50"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      )}

      {/* Main Chat Component */}
      {isVisible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[80%] md:w-4/5 max-w-6xl z-50">
          <div className="relative bg-background rounded-xl shadow-lg border border-border/50 backdrop-blur-sm overflow-hidden">
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-6 w-10 rounded-t-none rounded-b-lg bg-muted/50"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            {/* Chat Messages Area (hidden by default) */}
            {isExpanded && (
              <div className="h-64 p-4 overflow-y-auto">
                <MessageList
                  messages={currentSession.messages}
                  isLoading={isProcessing}
                  loadingMessage={currentResponse || "Thinking..."}
                />
              </div>
            )}

            {/* Context Bar - Now part of the floating input bar */}
            {hasSelectedContextItems && isContextBarExpanded && (
              <div
                className={cn(
                  "p-2 border-t border-border/50 bg-muted/30"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 hover:bg-accent/50"
                  title="New Chat"
                  onClick={() => setIsModelDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
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
                <Textarea
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
        </div>
      )}
        
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
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
            </DialogHeader>
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
            <DialogHeader>
              <DialogTitle>Documents</DialogTitle>
            </DialogHeader>
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

      <CommandDialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>

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
                    modelName: option.name 
                  });
                  setIsModelDialogOpen(false);
                }}
              >
                {option.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
