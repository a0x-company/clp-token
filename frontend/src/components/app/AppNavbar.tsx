"use client";

import { useEffect, useState } from "react";

// next
import Image from "next/image";

// translations
import { useTranslations } from "next-intl";

// icons
import DepositIcon from "../icons/DepositIcon";
import WithdrawIcon from "../icons/WithdrawIcon";
import InvestIcon from "../icons/InvestIcon";
import ChangeIcon from "../icons/ChangeIcon";

// context
import { useUserStore } from "@/context/global-store";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAccount } from "wagmi";
import CopyButton, { copyToClipboard } from "./CopyButton";

type NavOption = "deposit" | "withdraw" | "invest" | "change";

const getTabColor = (option: NavOption, selectedOption: NavOption) => {
  return selectedOption === option ? "white" : "black";
};

const tabs: { href: string; label: NavOption; icon: (color: string) => React.ReactNode }[] = [
  {
    href: "/app?tab=deposit",
    label: "deposit",
    icon: (color) => <DepositIcon color={color} />,
  },
  {
    href: "/app?tab=withdraw",
    label: "withdraw",
    icon: (color) => <WithdrawIcon color={color} />,
  },
  {
    href: "/app?tab=invest",
    label: "invest",
    icon: (color) => <InvestIcon color={color} />,
  },
  {
    href: "/app?tab=change",
    label: "change",
    icon: (color) => <ChangeIcon color={color} />,
  },
];

const AppNavbar = () => {
  const [selectedOption, setSelectedOption] = useState<NavOption>("deposit");
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { address } = useAccount();

  const currentLang = pathname.startsWith("/es") ? "es" : "en";
  const t = useTranslations("navbar");
  const { user } = useUserStore();

  const getButtonStyle = (option: NavOption) => {
    const baseStyle =
      "flex w-[192px] py-3 px-4 justify-center items-center gap-[8px] rounded-[12px] cursor-pointer transition-all duration-300";
    const selectedStyle = "bg-black text-white";
    const unselectedStyle = "border-[2px] border-transparent hover:border-black";

    return `${baseStyle} ${selectedOption === option ? selectedStyle : unselectedStyle} ${
      (option === "invest" || option === "change") && "opacity-50"
    }`;
  };

  useEffect(() => {
    if (searchParams.size === 0) {
      setSelectedOption("deposit");
      return;
    }
    const tab = searchParams.get("tab") as NavOption;
    setSelectedOption(tab);
  }, [searchParams]);

  return (
    <div className="flex flex-row py-[32px] px-[48px] justify-between items-center">
      <Link href={`/${currentLang}`} className="content-center items-center gap-[10px]">
        <Image src="/images/clpa-logo.svg" alt="CLPD logo" width={64} height={64} />
      </Link>

      <div className="flex flex-row max-w-3xl p-[16px] items-center gap-[16px] rounded-[12px]  absolute left-1/2 -translate-x-1/2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/${currentLang}${tab.href}`}
            className={getButtonStyle(tab.label)}
            onClick={() => setSelectedOption(tab.label)}
          >
            {tab.icon(getTabColor(tab.label, selectedOption))}
            <p className="text-center font-helvetica text-[20px] font-[700]">{t(tab.label)}</p>
          </Link>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-row content-center items-center gap-[8px] rounded-[12px] hover:bg-brand-blue transition-all duration-300 p-2">
          <Image
            src={user?.profileImage || ""}
            alt="profile"
            width={40}
            height={40}
            className="rounded-[12px] border-[2px] border-black"
          />
          <p className="text-center font-helvetica text-[20px] font-[700] text-black">
            {user?.name?.split(" ")[0]}
          </p>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-60 bg-brand-blue border-2 border-black shadow-brutalist p-4"
          align="end"
        >
          <div className="flex flex-col gap-2 items-start relative">
            <Image
              src="/images/clpa-logo-white.svg"
              alt="CLPD logo"
              width={182}
              height={182}
              className="absolute -rotate-[20deg] -top-12 -right-16 z-0 opacity-50"
            />

            <Image
              src={user?.profileImage || ""}
              alt="profile"
              width={110}
              height={110}
              className="rounded-[12px] border-[2px] border-white z-10"
            />
            <p className="font-helvetica text-xl font-[700] text-white">{user?.name}</p>
            <p className="font-helvetica text-base font-[700] text-white">{user?.email}</p>

            <Image
              src="/images/reserve/divider-mobile.svg"
              alt="divider"
              width={140}
              height={2}
              className="w-full my-4"
            />

            <p className="font-helvetica text-xl font-[700] text-white">Saldo:</p>
            <p className="font-helvetica text-xl font-[700] text-white">0 CLPD</p>
            <p
              onClick={() => {
                copyToClipboard(address, setCopied);
              }}
              className="font-helvetica text-xl font-[700] text-white/40 flex items-center justify-between w-full gap-2 group cursor-pointer"
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
              <CopyButton text={address} setCopied={setCopied} copied={copied} />
            </p>
          </div>
          <DropdownMenuItem className="p-0 my-4">
            <button className="flex items-center justify-center bg-brand-orange-pastel p-4 border-2 border-white rounded-md w-full text-start text-white gap-2 font-helvetica text-base leading-none font-[700] h-16">
              <Image src="/images/app/logout-vector.svg" alt="logout" width={32} height={32} />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem className="p-0">
            <button className="flex items-center justify-center bg-black p-4 border-2 border-white rounded-md w-full text-start text-white gap-2 font-helvetica text-base leading-none font-[700] h-16">
              Volver a la página
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AppNavbar;
