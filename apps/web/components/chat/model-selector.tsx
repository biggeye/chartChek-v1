"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { cn } from "~/lib/utils"
import type { ModelConfig, ModelProvider } from "~/types/chat"

interface ModelOption {
  value: string
  label: string
  provider: ModelProvider
}

const modelOptions: ModelOption[] = [
  { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "openai" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "google" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "google" },
  { value: "gemini-2.0-flash-001", label: "Gemini 2.0 Flash", provider: "google" },
  { value: "gemini-2.5-pro-exp-03-25", label: "Gemini 2.5 Pro (experimental)", provider: "google" },
]

interface ModelSelectorProps {
  provider: ModelProvider
  modelName: string
  onChange: (config: ModelConfig) => void
}

export function ModelSelector({ provider, modelName, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  
  // Find the current model option
  const currentModel = modelOptions.find(
    (option) => option.provider === provider && option.value === modelName
  ) || modelOptions[0]
  
  const displayValue = currentModel.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {modelOptions.map((option) => (
                <CommandItem
                  key={`${option.provider}-${option.value}`}
                  value={`${option.provider}-${option.value}`}
                  onSelect={() => {
                    onChange({
                      provider: option.provider,
                      modelName: option.value,
                    })
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      provider === option.provider && modelName === option.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
