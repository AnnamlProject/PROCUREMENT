
import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLookups } from "@/api/hooks/useLookups"
import { Badge } from "../ui/badge"

interface VendorPickerProps {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

export function VendorPicker({ value, onChange, disabled }: VendorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { data: lookups, isLoading } = useLookups();

  const vendors = lookups?.vendors ?? [];
  
  const handleSelect = (vendorId: string) => {
    const newValue = value.includes(vendorId)
      ? value.filter((id) => id !== vendorId)
      : [...value, vendorId];
    onChange(newValue);
  };
  
  const selectedVendors = vendors.filter(vendor => value.includes(vendor.id));

  return (
    <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto"
            disabled={disabled || isLoading}
            >
            <div className="flex flex-wrap gap-1">
                {selectedVendors.length > 0 ? selectedVendors.map(vendor => (
                   <Badge variant="secondary" key={vendor.id}>{vendor.name}</Badge>
                )) : "Pilih vendor..."}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
            <CommandInput placeholder="Cari vendor..." />
            <CommandList>
                <CommandEmpty>Vendor tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                {vendors.map((vendor) => (
                    <CommandItem
                    key={vendor.id}
                    value={vendor.name}
                    onSelect={() => handleSelect(vendor.id)}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(vendor.id) ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {vendor.name}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
            </Command>
        </PopoverContent>
        </Popover>
    </div>
  )
}
