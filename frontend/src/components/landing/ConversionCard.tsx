import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";
import CLPFlag from "../CLPFlag";

const ConversionCard: React.FC = () => {
  const t = useTranslations("landing");
  return (
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
  );
};

export default ConversionCard;
