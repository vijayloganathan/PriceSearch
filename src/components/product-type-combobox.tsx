
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductType } from "@/types";

interface ProductTypeComboboxProps {
  productTypes: ProductType[];
  value: string;
  onChange: (value: string) => void;
}

export default function ProductTypeCombobox({ productTypes = [], value, onChange }: ProductTypeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  const options = React.useMemo(() => {
    const existingTypes = [...new Set((productTypes || []).map(pt => pt.name).filter(Boolean))];
    if (!existingTypes.find(t => t.toLowerCase() === 'other')) {
       return [...existingTypes, 'Other'].sort();
    }
    return existingTypes.sort();
  }, [productTypes]);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setOpen(false);
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {value ? <>{value}</> : <>Select type...</>}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Select Product Type</DrawerTitle>
            </DrawerHeader>
          <div className="mt-4 border-t">
            <TypeList options={options} selectedValue={value} onSelect={handleSelect} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find(
                (option) => option.toLowerCase() === value.toLowerCase()
              ) || "Select type..."
            : "Select type..."}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <TypeList options={options} selectedValue={value} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}

function TypeList({
  options,
  selectedValue,
  onSelect,
}: {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Search type..." />
      <CommandList>
        <CommandEmpty>No type found.</CommandEmpty>
        <CommandGroup>
          {options.map((option, index) => (
            <CommandItem
              key={`${option}-${index}`}
              value={option}
              onSelect={onSelect}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedValue.toLowerCase() === option.toLowerCase()
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              {option}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
