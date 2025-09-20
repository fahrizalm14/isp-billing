// components/ui/select.tsx
"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export function Select({
  items,
  value,
  onValueChange,
  placeholder = "Select an option",
}: {
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger className="inline-flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md w-full">
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="z-50 bg-white border border-gray-300 rounded-md shadow-md">
          <RadixSelect.Viewport className="p-1">
            {items.map((item) => (
              <RadixSelect.Item
                key={item.value}
                value={item.value}
                className="flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-gray-100"
              >
                <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check className="h-4 w-4 text-primary" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
