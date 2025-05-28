"use client"

import type React from "react"

import { Button } from "@kit/ui/button"
import { Input } from "@kit/ui/input"
import { Label } from "@kit/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select"
import { Progress } from "./progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card"
import { Loader2, Upload, FileText, Plus, Trash2, Book, Tag, Info, CheckCircle2 } from "lucide-react"
import { useDocumentUploader } from "~/hooks/useDocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs"
import { Switch } from "@kit/ui/switch"
import { Textarea } from "@kit/ui/textarea"
import { Badge } from "@kit/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@kit/ui/tooltip"

  /**
   * The DocumentUploader component.
   *
   * This component allows users to select a corpus, select files to upload, set chunking options, and upload the files.
   * It also provides a form for adding batch details (title and tags) and displays the progress of the upload.
   * The component is controlled by the `useDocumentUploader` hook, which provides the state and functions needed to manage the upload process.
   */
export default function DocumentUploader() {
  // Use the enhanced custom hook
  const {
    files,
    uploading,
    progress,
    selectedCorpus,
    setSelectedCorpus,
    chunkSize,
    setChunkSize,
    chunkOverlap,
    setChunkOverlap,
    isBatchMode,
    setIsBatchMode,
    handleFileChange,
    handleRemoveFile,
    handleUpload,
    // Destructure new state and functions
    volumeTitle,
    setVolumeTitle,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    processingFileIndex,
    completedFiles,
  } = useDocumentUploader();

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Document Uploader</CardTitle>
          <CardDescription>Upload documents to a selected corpus for processing and embedding.</CardDescription>
        </CardHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Options</TabsTrigger>
              <TabsTrigger value="batchDetails" disabled={!isBatchMode || uploading}>Batch Details</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <CardContent className="space-y-6 pt-6">
              {/* File Input & Batch Mode Toggle */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                      <Label htmlFor="batch-mode-switch">Batch Mode</Label>
                      <div className="flex items-center space-x-2">
                          <Switch
                              id="batch-mode-switch"
                              checked={isBatchMode}
                              onCheckedChange={(checked) => {
                                  setIsBatchMode(checked);
                                  // If switching to single mode with multiple files, keep only the first one
                                  if (!checked && files.length > 1) {
                                      handleRemoveFile(0); // Assuming setFiles allows keeping the first
                                  }
                              }}
                              disabled={uploading || (!isBatchMode && files.length > 0)} // Disable toggle if not in batch mode and a file exists
                          />
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Info size={16} className="text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{isBatchMode ? "Upload multiple files at once." : "Upload a single file."}</p>
                              </TooltipContent>
                          </Tooltip>
                      </div>
                  </div>
                  <div>
                      <Label htmlFor="file-upload" className={`flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}>
                          <span className="flex items-center space-x-2">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                              <span className="font-medium text-muted-foreground">
                                  {isBatchMode ? "Drag 'n' drop files here, or click to select files" : "Drag 'n' drop a file here, or click to select a file"}
                              </span>
                          </span>
                          <Input
                              id="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              multiple={isBatchMode}
                              accept=".pdf,.txt,.md,.docx" // Specify accepted file types if desired
                              disabled={uploading}
                          />
                      </Label>
                  </div>
              </div>

              {/* Selected Files Display */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected File{files.length > 1 ? 's' : ''}:</Label>
                  <ul className="space-y-1 max-h-40 overflow-y-auto rounded-md border p-2">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-sm gap-2">
                        <span className={`flex items-center space-x-2 truncate flex-1 ${completedFiles.includes(file.name) ? "text-muted-foreground line-through" : ""}`}>
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate" title={file.name}>{file.name}</span>
                          <span className="text-muted-foreground text-xs">({Math.round(file.size / 1024)} KB)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {processingFileIndex === index && !completedFiles.includes(file.name) && (
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Processing...</p>
                                  </TooltipContent>
                              </Tooltip>
                          )}
                          {completedFiles.includes(file.name) && (
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Completed</p>
                                  </TooltipContent>
                              </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveFile(index)}
                                  disabled={uploading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Remove file</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chunking Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chunk-size">Chunk Size (chars)</Label>
                  <Input
                    id="chunk-size"
                    type="number"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 0)}
                    min="100"
                    step="50"
                    disabled={uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chunk-overlap">Chunk Overlap (chars)</Label>
                  <Input
                    id="chunk-overlap"
                    type="number"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value, 10) || 0)}
                    min="0"
                    step="10"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                          {processingFileIndex !== null && files[processingFileIndex] ?
                              `Processing: ${files[processingFileIndex].name}` :
                              'Uploading and processing...'}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  <Progress value={progress} className="w-full" />
                  {(isBatchMode || files.length > 1) && (
                      <p className="text-xs text-muted-foreground text-center">
                          Completed {completedFiles.length} of {files.length} files
                      </p>
                  )}
                </div>
              )}
            </CardContent>
          </TabsContent>
          <TabsContent value="batchDetails">
              {/* Batch Details Form - Re-added */}
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="volumeTitle" className="flex items-center gap-1">
                      <Book className="h-4 w-4" />
                      Volume Title (Optional)
                  </Label>
                  <Input
                    id="volumeTitle"
                    value={volumeTitle}
                    onChange={(e) => setVolumeTitle(e.target.value)}
                    placeholder="Enter a title for this volume/batch"
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-1">
                      <Tag className="h-4 w-4"/>
                      Tags (Optional)
                  </Label>
                  <div className="flex gap-2">
                      <Input
                          id="tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add tags (e.g., research, notes)"
                          disabled={uploading}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTag();
                              }
                          }}
                      />
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={addTag}
                                  disabled={uploading || !tagInput.trim()}
                              >
                                  <Plus className="h-4 w-4" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Add tag</p>
                          </TooltipContent>
                      </Tooltip>
                  </div>
                  {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                          {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1 pl-2 pr-1">
                              {tag}
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <button
                                          onClick={() => removeTag(tag)}
                                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive disabled:opacity-50"
                                          disabled={uploading}
                                      >
                                          <Trash2 className="h-3 w-3" />
                                      </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Remove tag: {tag}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </Badge>
                          ))}
                      </div>
                  )}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={uploading || files.length === 0 || !selectedCorpus}
          >
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Upload Document{files.length > 1 || isBatchMode ? 's' : ''}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
