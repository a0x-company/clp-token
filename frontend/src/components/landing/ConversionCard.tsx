import { useTranslations } from "next-intl";
import { useGoogleConnect } from "@/hooks/useGoogleConnect";
import Image from "next/image";
import React from "react";
import CLPFlag from "../CLPFlag";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

const ConversionCard: React.FC = () => {
  const { isConnected } = useGoogleConnect();
  const t = useTranslations("landing");
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = pathname.startsWith("/es") ? "es" : "en";
  return (
    <div className="flex flex-col z-20 gap-4 mb-auto">
      <div className="bg-white rounded-xl shadow-brutalist p-4 flex flex-col md:flex-row items-center justify-between border-2 border-black z-20 gap-4 mb-auto">
        <div className="flex justify-center items-center bg-[#E7F1FF] rounded-xl p-4 border-2 border-black gap-4 shadow-brutalist-sm">
          <div className="flex flex-col items-start">
            <span className="font-semibold text-[20px] text-black mr-2">{t("send")}</span>
            <span className="font-bold text-[28px] text-black mr-2">1 Peso</span>
          </div>
          <CLPFlag type="CLP" />
        </div>
        <Image
          src="/images/landing/swap-vector.svg"
          alt="Swap"
          width={48}
          height={48}
          className="max-md:rotate-90"
        />
        <div className="flex justify-center items-center bg-[#E7F1FF] rounded-xl p-4 border-2 border-black gap-4 shadow-brutalist-sm">
          <div className="flex flex-col items-start">
            <span className="font-semibold text-[20px] text-black mr-2">{t("receive")}</span>
            <span className="font-bold text-[28px] text-black mr-2">1 CLPD</span>
          </div>
          <CLPFlag type="CLPD" />
        </div>
      </div>

      <button
        onClick={() => router.push(`/${currentLang}/app?tab=deposit`)}
        className={cn(
          "flex flex-col items-center justify-center gap-4 bg-brand-blue text-white p-4 rounded-xl border-2 border-black shadow-brutalist-sm hover:translate-y-[2px] hover:shadow-[0px_0px_2px_0px_#0267ff] transition-all duration-100 opacity-0",
          isConnected ? "opacity-100" : ""
        )}
      >
        <p className="text-lg font-medium">{t("enterApp")}</p>
      </button>
    </div>
  );
};

export default ConversionCard;
