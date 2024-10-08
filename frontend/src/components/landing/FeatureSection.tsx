// react
import React from "react";

// translations
import { useTranslations } from "next-intl";
import Image from "next/image";

const FeatureSection: React.FC = () => {
  const t = useTranslations("landing");
  return (
    <section className="min-h-screen max-[420px]:h-[158vh] max-[768px]:h-[140vh] flex flex-col items-start justify-start bg-white pt-12 lg:pt-16 px-8 lg:px-16 xl:px-32 relative overflow-hidden gap-16">
      <div className="flex flex-col items-start justify-center gap-8">
        <h2 className="text-[48px] lg:text-[64px] font-romaben text-black text-start">
          {t("features.title")}
        </h2>
        <p className="text-[24px] lg:text-[32px] text-start text-black">
          {t("features.description1")}
        </p>
        <p className="text-[24px] lg:text-[32px] text-start text-black">
          {t("features.description2")}
        </p>
      </div>

      <Image
        src="/images/landing/deposit-image.png"
        alt="Deposit image"
        width={1024}
        height={1024}
        className="h-auto rounded-xl max-[1280px]:w-[980px] w-[1080px] self-center border border-gray-300 shadow-2xl"
      />
    </section>
  );
};

export default FeatureSection;
