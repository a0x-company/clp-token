import { Check, Clipboard } from "lucide-react";
import React, { useState } from "react";

interface CopyButtonProps {
  text: string | undefined;
  setCopied: React.Dispatch<React.SetStateAction<boolean>>;
  copied: boolean;
}

export const copyToClipboard = async (
  text: string | undefined,
  setCopied?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (text) {
    try {
      await navigator.clipboard.writeText(text);
      if (setCopied) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
    }
  }
};

const CopyButton: React.FC<CopyButtonProps> = ({ text, setCopied, copied }) => {
  return (
    <button
      onClick={() => copyToClipboard(text, setCopied)}
      className="ml-2 p-1 rounded-full transition-colors duration-200 group-hover:opacity-100 opacity-0"
      title="Copiar al portapapeles"
    >
      {copied ? (
        <Check className="h-4 w-4 text-white" />
      ) : (
        <Clipboard className="h-4 w-4 text-white" />
      )}
    </button>
  );
};

export default CopyButton;
