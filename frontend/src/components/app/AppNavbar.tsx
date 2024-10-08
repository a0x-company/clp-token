"use client";

import { useState } from "react";

// next
import Image from "next/image";

// translations
import { useTranslations } from "next-intl";

// context
import { useUserStore } from "@/context/global-store";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavOption = "deposit" | "withdraw" | "invest" | "change";

const tabs: { href: string; label: NavOption }[] = [
  {
    href: "/app?tab=deposit",
    label: "deposit",
  },
  {
    href: "/app?tab=withdraw",
    label: "withdraw",
  },
  {
    href: "/app?tab=invest",
    label: "invest",
  },
  {
    href: "/app?tab=change",
    label: "change",
  },
];

const AppNavbar = () => {
  const [selectedOption, setSelectedOption] = useState<NavOption>("deposit");
  const pathname = usePathname();

  const currentLang = pathname.startsWith("/es") ? "es" : "en";
  const t = useTranslations("navbar");
  const { user } = useUserStore();

  const getButtonStyle = (option: NavOption) => {
    const baseStyle =
      "flex w-[192px] p-[16px] justify-center items-center gap-[8px] rounded-[12px] cursor-pointer transition-all duration-300";
    const selectedStyle = "border-[2px] border-black bg-[#FBC1CF]";
    const unselectedStyle = "border-[2px] border-transparent hover:border-black";

    return `${baseStyle} ${selectedOption === option ? selectedStyle : unselectedStyle}`;
  };

  return (
    <div className="flex flex-row py-[32px] px-[48px] justify-between items-center">
      <Link href={`/${currentLang}`} className="content-center items-center gap-[10px]">
        <Image src="/images/clpa-logo.svg" alt="CLPD logo" width={64} height={64} />
      </Link>

      <div className="flex flex-row max-w-3xl p-[16px] items-center gap-[16px] rounded-[12px] border-[2px] border-black absolute left-1/2 -translate-x-1/2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/${currentLang}${tab.href}`}
            className={getButtonStyle(tab.label)}
            onClick={() => setSelectedOption(tab.label)}
          >
            <p className="text-black text-center font-helvetica text-[24px] font-[700]">
              {t(tab.label)}
            </p>
          </Link>
        ))}
      </div>

      <div className="flex flex-row p-4 content-center items-center gap-[8px] rounded-[12px] border-[2px] border-black bg-black">
        <Image
          src={user?.profileImage || ""}
          alt="profile"
          width={40}
          height={40}
          className="rounded-[12px]"
        />
        <p className="text-white text-center font-helvetica text-[24px] font-[700]">
          {user?.name?.split(" ")[0]}
        </p>
      </div>
    </div>
  );
};

export default AppNavbar;
