// react
import React from "react";

// next
import Image from "next/image";

// components
import CLPFlag from "../CLPFlag";

// translations
import { useTranslations } from "next-intl";

const EarnSection: React.FC = () => {
  const t = useTranslations("landing");
  return (
    <section className="flex flex-col-reverse md:flex-row items-center justify-center relative px-8 lg:px-16 xl:px-32 py-[180px] gap-16">
      <div className="flex flex-col flex-1 gap-4 w-full">
        <div className="bg-black text-white rounded-xl p-4 flex justify-between items-center w-full">
          <div>
            <p className="text-xl font-bold">{t("save")}</p>
            <p className="text-[28px] font-bold">1 Peso</p>
          </div>

          <CLPFlag type="CLP" />
        </div>

        <div className="flex justify-center rotate-90">
          <Image src="/images/landing/swap-vector.svg" alt="Swap" width={48} height={48} />
        </div>

        <div className="bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center w-full">
          <div>
            <p className="text-xl font-bold">{t("receive")}</p>
            <p className="text-[22px] 2xl:text-[28px] text-brand-blue font-bold flex items-center gap-2">
              <Image src="/images/landing/arrow-vector.svg" alt="Arrow" width={32} height={32} />
              {t("feeCLPD")}
            </p>
          </div>

          <CLPFlag type="CLPD" />
        </div>
      </div>

      <div className="flex flex-col flex-[1.5] gap-4 w-full">
        <h2 className="text-[64px] font-romaben">{t("earn.title")}</h2>
        <p className="text-[32px]">{t("earn.description")}</p>
      </div>
    </section>
  );
};

export default EarnSection;
