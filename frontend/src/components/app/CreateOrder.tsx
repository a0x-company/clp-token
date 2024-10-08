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
  open: boolean;
  setOpen: (open: boolean) => void;
  setTransferStatus: React.Dispatch<
    React.SetStateAction<"processing" | "initiated" | "completed" | null>
  >;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ open, setOpen, setTransferStatus }) => {
  const t = useTranslations("deposit");
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      let file = event.target.files[0];
      let extension = file.name.split(".").pop();
      let newName = file.name.replace(/\s+/g, "-").replace(/\.[^.]+$/, "") + "." + extension;
      let newFile = new File([file], newName, { type: file.type });
      console.log(newFile);
      setFile(newFile);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/[^0-9]/g, "");

    if (value.length > 1 && value.startsWith("0")) {
      value = value.replace(/^0+/, "");
    }

    setAmount(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    console.log("Archivo:", file);
    console.log("Monto:", amount);
    const userInfo = await web3AuthInstance.getUserInfo();
    const idToken = userInfo?.idToken;
    try {
      const response = await axios.post(
        "/api/create-order",
        { file, amount },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response);
      if (response.status === 201 || response.status === 200) {
        setFile(null);
        setAmount("");
        setOpen(false);
        setTransferStatus("processing");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl bg-white text-black font-helvetica rounded-3xl border-2 border-black">
        <DialogHeader>
          <DialogTitle className="text-black text-2xl font-bold">{t("createOrder")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="proof">{t("proof")}</label>
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
                  className="flex h-40 bg-white w-full cursor-pointer items-center justify-center rounded-md border border-Input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {file ? file.name : t("upload")}
                </label>
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="amount">{t("amount")}</label>
              <div className="flex items-center gap-4 relative">
                <Input
                  type="number"
                  id="amount"
                  placeholder={t("amountPlaceholder")}
                  value={amount}
                  onChange={handleAmountChange}
                  className="bg-white text-black text-2xl h-[64px]"
                />
                <p className="absolute right-14 top-1/2 -translate-y-1/2">CLP</p>
                <FlagIcon
                  code={"CL"}
                  size={32}
                  className="rounded-md absolute right-4 top-1/2 -translate-y-1/2 opacity-75 border border-black"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-black text-white" type="submit">
              {loading ? <LoadingSpinner /> : t("done")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrder;
