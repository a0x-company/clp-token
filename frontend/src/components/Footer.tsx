// react
import React from "react";
// next
import Image from "next/image";
import Link from "next/link";
// next-intl
import { useTranslations } from "next-intl";

const termsLink = "https://docs.google.com/document/d/127BPRsRSNolTrdZY4FpG3twdLQ2MStxb";

const Footer: React.FC = () => {
  const t = useTranslations("footer");
  return (
    <footer className="bg-white w-full h-max flex flex-col items-center justify-center pt-16 pb-8 relative">
      <Image
        src="/images/landing/stamp.svg"
        alt="Stamp Chilean"
        width={100}
        height={100}
        className="absolute -left-10 md:left-0 top-1/2 -translate-y-1/2"
      />
      <div className="flex items-center justify-center gap-2">
        <Image src="/images/landing/clpa-logo-blue.svg" alt="CLPD logo" width={64} height={64} />
        <h2 className="text-[64px] text-brand-blue font-beauford-bold leading-none mt-2.5">CLPD</h2>
      </div>
      <Link href={termsLink} target="_blank" className="hover:bg-gray-50 p-1 rounded-full mt-6">
        {t("termsOfUse")}
      </Link>
      <p className="text-black font-bold">{t("copyright")}</p>
    </footer>
  );
};

export default Footer;
