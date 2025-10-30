"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minHeight?: number; // px
}

/**
 * Simplified editor that now relies on the native textarea element.
 */
export default function RichTextEditor({
  value,
  onChange,
  className,
  minHeight = 160,
}: Props) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
      style={{ minHeight }}
    />
  );
}
