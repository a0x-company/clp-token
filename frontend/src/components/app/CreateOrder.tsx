// react
import React, { useState } from "react";

// components
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { UploadIcon } from "lucide-react";
import { Input } from "../ui/input";

// translations
import { useTranslations } from "next-intl";
import axios from "axios";
import { web3AuthInstance } from "@/provider/WagmiConfig";
import { FlagIcon } from "react-flag-kit";
import { LoadingSpinner } from "../ui/spinner";

interface CreateOrderProps {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ handleFileChange, file }) => {
  const t = useTranslations("deposit");

  return (
    <div className="grid gap-4 py-4">
      <div className="grid w-full items-center gap-1.5">
        <label htmlFor="proof" className="font-helvetica font-bold text-xl">
          {t("proof")}
        </label>
        <div className="flex items-center gap-4">
          <Input
            id="proof"
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="proof"
            className="flex h-40 bg-white w-full cursor-pointer items-center justify-center rounded-md border border-Input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-dashed"
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            {file ? file.name : t("upload")}
          </label>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
