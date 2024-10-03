"use client";

// react
import React from "react";

// next
import Link from "next/link";
import { usePathname } from "next/navigation";

// components
import { Button } from "./ui/button";

// translations
import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface NavbarProps {}

const currentPathStyle =
  "bg-white text-black h-auto px-6 py-2 text-xl rounded-[12px] border-2 border-black font-bold shadow-brutalist";

const Navbar: React.FC<NavbarProps> = () => {
  const t = useTranslations("navbar");
  const pathname = usePathname();

  const currentLang = pathname.startsWith("/es") ? "es" : "en";

  return (
    <nav className="bg-brand-blue px-6 py-2 lg:px-12 lg:py-4 flex justify-between items-center sticky top-0 z-50 h-auto lg:h-24">
      {/* Desktop */}
      <div className="hidden md:flex flex-1 space-x-4 items-center justify-evenly font-bold font-helvetica">
        <Link href="/">
          <Image src="/images/clpa-logo-white.svg" alt="CLPa logo" width={64} height={64} />
        </Link>
        <div className="flex flex-1 space-x-4 items-center justify-evenly font-bold font-helvetica">
          <Link
            href={`/${currentLang}/`}
            className={cn(
              pathname === `/${currentLang}`
                ? currentPathStyle
                : "text-white text-xl hover:text-blue-200"
            )}
          >
            {t("stableCoin")}
          </Link>
          <Link
            href={`/${currentLang}/earn`}
            className={cn(
              pathname === `/${currentLang}/earn`
                ? currentPathStyle
                : "text-white text-xl hover:text-blue-200"
            )}
          >
            {t("earnWithPesos")}
          </Link>
          <Link
            href={`/${currentLang}/about`}
            className={cn(
              pathname === `/${currentLang}/about`
                ? currentPathStyle
                : "text-white text-xl hover:text-blue-200"
            )}
          >
            {t("aboutUs")}
          </Link>
          <Link
            href={`/${currentLang}/reserve`}
            className={cn(
              pathname === `/${currentLang}/reserve`
                ? currentPathStyle
                : "text-white text-xl hover:text-blue-200"
            )}
          >
            {t("reserve")}
          </Link>
        </div>
        <Button className="bg-black text-white h-auto px-6 py-2 text-xl rounded-[12px] border-2 border-black font-bold shadow-brutalist">
          {t("login")}
        </Button>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-1 justify-between items-center space-x-4">
        <Link href="/">
          <Image src="/images/clpa-logo-white.svg" alt="CLPa logo" width={64} height={64} />
        </Link>

        <Button className="bg-black text-white h-auto px-6 py-2 text-xl rounded-[12px] border-2 border-black font-bold shadow-brutalist">
          {t("login")}
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
