"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

/**
 * Copy the referral code to clipboard. Falls back to a manual copy
 * toast if the browser blocks writeText (rare on mobile inside
 * iframes / non-HTTPS contexts).
 */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Copy manually: ${code}`);
    }
  }

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleCopy}
      leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
    >
      {copied ? "Copied" : "Copy code"}
    </Button>
  );
}
