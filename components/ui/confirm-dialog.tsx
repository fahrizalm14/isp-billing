// components/ui/confirm-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as React from "react";

type MatchMode = "equals" | "iequals" | "includes";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: React.ReactNode;

  /** Teks yang harus diketik user (mis. nama item, atau 'DELETE') */
  requiredText?: string;
  /** Placeholder untuk input */
  inputPlaceholder?: string;
  /** Petunjuk di bawah input (opsional) */
  hint?: React.ReactNode;

  /** equals | iequals | includes (default: equals) */
  matchMode?: MatchMode;

  /** Label tombol */
  confirmLabel?: string;
  cancelLabel?: string;

  /** Gaya tombol konfirmasi */
  tone?: "default" | "danger"; // danger -> destructive button

  /** Dipanggil setelah valid dan user menekan Confirm. Boleh async. */
  onConfirm: () => void | Promise<void>;

  /** Opsional: render extra content di area body (di atas input) */
  children?: React.ReactNode;

  /** Nonaktifkan input (mis. jika hanya ingin konfirmasi tanpa ketikan) */
  disableInput?: boolean;

  /** className tambahan untuk <DialogContent> */
  className?: string;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  requiredText,
  inputPlaceholder,
  hint,
  matchMode = "equals",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  children,
  disableInput = false,
  className,
}: ConfirmDialogProps) {
  const [value, setValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset saat buka/tutup
  React.useEffect(() => {
    if (open) {
      setValue("");
      // autofocus input setelah dialog mount
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const valid = React.useMemo(() => {
    if (disableInput || !requiredText) return true;
    const v = value.trim();
    const target = requiredText.trim();
    if (matchMode === "iequals")
      return v.toLowerCase() === target.toLowerCase();
    if (matchMode === "includes")
      return v.toLowerCase().includes(target.toLowerCase());
    return v === target;
  }, [disableInput, requiredText, value, matchMode]);

  async function handleConfirm() {
    if (!valid || submitting) return;
    try {
      setSubmitting(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent
        className={cn(
          "max-w-sm w-full z-[100100] sm:max-w-md",
          // biar enak di mobile
          "max-h-[85svh] overflow-y-auto",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {children}

        {!disableInput && requiredText && (
          <div className="mt-2 space-y-2">
            <label className="text-sm">
              Ketik <span className="font-semibold">{requiredText}</span> untuk
              melanjutkan:
            </label>
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={inputPlaceholder ?? requiredText}
              autoComplete="off"
            />
            {!!hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {!valid && value.length > 0 && (
              <p className="text-xs text-destructive">Teks tidak cocok.</p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="hover:bg-secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!valid || submitting}
            className={cn(
              tone === "danger"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            )}
          >
            {submitting ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
