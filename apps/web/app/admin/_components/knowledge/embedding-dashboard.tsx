"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Cpu, FileText, Database, AlertCircle, Info, FileType, Calendar, Tag, ChevronRight } from "lucide-react"
import { processDocumentEmbeddings } from "@/lib/rag/embedding-service"
import { format } from "date-fns"

type DocumentStats = {
  corpusId: string
  corpusName: string
  documentId: string
  documentTitle: string
  fileType: string
  pageCount: number
  documentMetadata: Record<string, any>
  totalChunks: number
  chunksWithoutEmbeddings: number
  createdAt: string
  updatedAt: string
}

export default function EmbeddingDashboard() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<DocumentStats | null>(null)
  const [apiKey, setApiKey] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const [documentChunks, setDocumentChunks] = useState<any[]>([])
  const [loadingChunks, setLoadingChunks] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const supabase = await createClient()
      
      // Get all documents with their corpus info and chunk counts
      const { data, error } = await supabase
        .rpc('get_document_embedding_stats')
      
      if (error) throw error
      
      // Map the database field names to our component field names
      const formattedData = (data || []).map((doc: any) => ({
        corpusId: doc.corpus_id,
        corpusName: doc.corpus_name,
        documentId: doc.document_id,
        documentTitle: doc.document_title,
        fileType: doc.file_type,
        pageCount: doc.page_count,
        documentMetadata: doc.document_metadata,
        totalChunks: doc.total_chunks,
        chunksWithoutEmbeddings: doc.chunks_without_embeddings,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }))
      
      setDocuments(formattedData)
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch document statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentChunks = async (documentId: string) => {
    setLoadingChunks(true)
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('document_chunks')
        .select('id, content, metadata, embedding')
        .eq('document_id', documentId)
        .order('id')
        .limit(100) // Limit to avoid loading too many chunks
      
      if (error) throw error
      
      setDocumentChunks(data || [])
    } catch (error) {
      console.error("Error fetching document chunks:", error)
      toast({
        title: "Error",
        description: "Failed to fetch document chunks",
        variant: "destructive",
      })
    } finally {
      setLoadingChunks(false)
    }
  }

  const handleGenerateEmbeddings = async () => {
    if (!selectedDocument) return
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    setProgress(0)

    try {
      const result = await processDocumentEmbeddings(
        selectedDocument.documentId,
        apiKey,
        (processed, total) => {
          const progressPercent = Math.round((processed / total) * 100)
          setProgress(progressPercent)
        }
      )
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${result.success} chunks. Failed: ${result.failed}`,
        variant: result.failed > 0 ? "destructive" : "default",
      })
      
      // Refresh document list to show updated counts
      await fetchDocuments()
    } catch (error) {
      console.error("Error processing embeddings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process embeddings",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
      setDialogOpen(false)
    }
  }

  const handleViewDetails = (doc: DocumentStats) => {
    setSelectedDocument(doc)
    fetchDocumentChunks(doc.documentId)
    setDetailsOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch (e) {
      return 'Unknown date'
    }
  }

  const renderMetadataValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
  }

  const filteredDocuments = documents.filter(doc => 
    (doc.documentTitle?.toLowerCase() || '').includes(filter.toLowerCase()) ||
    (doc.corpusName?.toLowerCase() || '').includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            embeddings
          </CardTitle>
          <CardDescription>
            generate / manage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Filter by document or corpus name..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button onClick={fetchDocuments} variant="outline">
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden lg:table-cell">Corpus</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Pages</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Total Chunks</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Missing Embeddings</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No documents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.documentId}>
                        <TableCell className="font-medium">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewDetails(doc)}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.documentTitle}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => e.stopPropagation()}>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-2">
                                  <h4 className="font-medium">Document Details</h4>
                                  <div className="grid grid-cols-2 gap-1 text-sm">
                                    <div className="text-muted-foreground">Type:</div>
                                    <div>{doc.fileType || 'Unknown'}</div>
                                    <div className="text-muted-foreground">Created:</div>
                                    <div>{formatDate(doc.createdAt)}</div>
                                    <div className="text-muted-foreground">Updated:</div>
                                    <div>{formatDate(doc.updatedAt)}</div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{doc.corpusName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-right">{doc.pageCount || 'N/A'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-right">{doc.totalChunks}</TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          {doc.chunksWithoutEmbeddings > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {doc.chunksWithoutEmbeddings}
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {doc.chunksWithoutEmbeddings === 0 ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900">
                              Complete
                            </Badge>
                          ) : doc.chunksWithoutEmbeddings === doc.totalChunks ? (
                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900">
                              No Embeddings
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900">
                              Partial
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={dialogOpen && selectedDocument?.documentId === doc.documentId} 
                                  onOpenChange={(open) => {
                                    setDialogOpen(open);
                                    if (!open) setSelectedDocument(null);
                                  }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={doc.chunksWithoutEmbeddings === 0}
                                  onClick={() => {
                                    setSelectedDocument(doc);
                                    setDialogOpen(true);
                                    setProgress(0);
                                  }}
                                >
                                  <Cpu className="h-3.5 w-3.5 mr-1" />
                                  Generate
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Generate Embeddings</DialogTitle>
                                  <DialogDescription>
                                    Generate embeddings for {doc.chunksWithoutEmbeddings} chunks in document "{doc.documentTitle}"
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="apiKey">OpenAI API Key</Label>
                                    <Input
                                      id="apiKey"
                                      type="password"
                                      value={apiKey}
                                      onChange={(e) => setApiKey(e.target.value)}
                                      placeholder="Enter your OpenAI API key"
                                      disabled={processing}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Your API key will only be used client-side and not stored
                                    </p>
                                  </div>

                                  {processing && (
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Processing embeddings...</span>
                                        <span>{progress}%</span>
                                      </div>
                                      <Progress value={progress} />
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setDialogOpen(false);
                                      setSelectedDocument(null);
                                    }}
                                    disabled={processing}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleGenerateEmbeddings}
                                    disabled={processing || !apiKey}
                                  >
                                    {processing ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      "Generate Embeddings"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[90%] sm:max-w-[900px]" side="right">
          {selectedDocument && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedDocument.documentTitle}
                </SheetTitle>
                <SheetDescription>
                  Document details and chunk information
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileType className="h-4 w-4" />
                        Document Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <dl className="space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Type:</dt>
                          <dd className="col-span-2">{selectedDocument.fileType || 'Unknown'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Pages:</dt>
                          <dd className="col-span-2">{selectedDocument.pageCount || 'N/A'}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Corpus:</dt>
                          <dd className="col-span-2">{selectedDocument.corpusName}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Created:</dt>
                          <dd className="col-span-2">{formatDate(selectedDocument.createdAt)}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Updated:</dt>
                          <dd className="col-span-2">{formatDate(selectedDocument.updatedAt)}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Chunk Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <dl className="space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Total Chunks:</dt>
                          <dd className="col-span-2">{selectedDocument.totalChunks}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">With Embeddings:</dt>
                          <dd className="col-span-2">
                            {selectedDocument.totalChunks - selectedDocument.chunksWithoutEmbeddings}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Missing Embeddings:</dt>
                          <dd className="col-span-2 text-amber-600 dark:text-amber-400 font-medium">
                            {selectedDocument.chunksWithoutEmbeddings}
                          </dd>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <dt className="text-muted-foreground">Completion:</dt>
                          <dd className="col-span-2">
                            {selectedDocument.totalChunks === 0 ? '0%' : 
                              `${Math.round(((selectedDocument.totalChunks - selectedDocument.chunksWithoutEmbeddings) / selectedDocument.totalChunks) * 100)}%`}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      {selectedDocument.documentMetadata && Object.keys(selectedDocument.documentMetadata).length > 0 ? (
                        <dl className="space-y-2">
                          {Object.entries(selectedDocument.documentMetadata).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-1">
                              <dt className="text-muted-foreground">{key}:</dt>
                              <dd className="col-span-2 truncate" title={renderMetadataValue(value)}>
                                {renderMetadataValue(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-muted-foreground">No metadata available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Tabs defaultValue="chunks">
                  <TabsList>
                    <TabsTrigger value="chunks">Document Chunks</TabsTrigger>
                    <TabsTrigger value="embeddings">Embedding Status</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chunks" className="space-y-4">
                    <div className="border rounded-md">
                      {loadingChunks ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : documentChunks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No chunks found for this document
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Chunk ID</TableHead>
                              <TableHead>Content Preview</TableHead>
                              <TableHead className="text-right">Embedding</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documentChunks.map((chunk) => (
                              <TableRow key={chunk.id}>
                                <TableCell className="font-mono text-xs">{chunk.id}</TableCell>
                                <TableCell>
                                  <div className="max-h-20 overflow-hidden text-ellipsis">
                                    {chunk.content?.substring(0, 100)}
                                    {chunk.content?.length > 100 ? '...' : ''}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {chunk.embedding ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      Generated
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                      Missing
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="embeddings">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Embedding Generation</h3>
                            <p className="text-muted-foreground">
                              Generate embeddings for chunks that don't have them yet.
                            </p>
                          </div>
                          
                          {selectedDocument.chunksWithoutEmbeddings > 0 ? (
                            <div className="space-y-4">
                              <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-950/30">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-amber-800 dark:text-amber-300">Missing Embeddings</h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                      This document has {selectedDocument.chunksWithoutEmbeddings} chunks without embeddings.
                                      Generate them to enable semantic search for this content.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="apiKeyDetails">OpenAI API Key</Label>
                                <Input
                                  id="apiKeyDetails"
                                  type="password"
                                  value={apiKey}
                                  onChange={(e) => setApiKey(e.target.value)}
                                  placeholder="Enter your OpenAI API key"
                                  disabled={processing}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Your API key will only be used client-side and not stored
                                </p>
                              </div>
                              
                              {processing && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Processing embeddings...</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <Progress value={progress} />
                                </div>
                              )}
                              
                              <Button
                                onClick={handleGenerateEmbeddings}
                                disabled={processing || !apiKey}
                                className="w-full"
                              >
                                {processing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing Embeddings...
                                  </>
                                ) : (
                                  "Generate Embeddings"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="p-4 border rounded-md bg-green-50 dark:bg-green-950/30">
                              <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-medium text-green-800 dark:text-green-300">All Embeddings Generated</h4>
                                  <p className="text-sm text-green-700 dark:text-green-400">
                                    All chunks in this document have embeddings. The document is ready for semantic search.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
