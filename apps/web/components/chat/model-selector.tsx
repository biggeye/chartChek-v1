"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@kit/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@kit/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@kit/ui/popover"
import { cn } from "@kit/ui/utils"
import { useModels } from "~/hooks/useModels"

interface ModelSelectorProps {
  provider: string
  modelName: string
  onChange: (config: { provider: string; modelName: string }) => void
}

export function ModelSelector({ provider, modelName, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
    const models = useModels();

  // Find the current model option
  const currentModel = models.data?.find(
    (option) => option.provider === provider && option.value === modelName
  ) || models.data?[0]:null;
  
  const displayValue = models.data?.find(
    (option) => option.provider === provider && option.value === modelName
  )?.label || "";

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
              {models.data?.map((option) => (
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
