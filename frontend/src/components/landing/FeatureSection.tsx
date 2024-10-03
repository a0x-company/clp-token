// react
import React from "react";

// translations
import { useTranslations } from "next-intl";
import Image from "next/image";

const FeatureSection: React.FC = () => {
  const t = useTranslations("landing");
  return (
    <section className="h-[130vh] md:h-[calc(100vh-10rem)] lg:min-h-screen flex items-start justify-center bg-black py-12 lg:py-16 px-6 lg:px-32 relative overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-8">
        <h2 className="text-[48px] lg:text-[64px] font-romaben text-white text-center">
          {t("features.title")}
        </h2>
        <p className="text-[24px] lg:text-[32px] text-center text-white">
          {t("features.description1")}
        </p>
        <p className="text-[24px] lg:text-[32px] text-center text-white">
          {t("features.description2")}
        </p>
      </div>

      <Image
        src="/images/landing/deposit-image.png"
        alt="Deposit image"
        width={1024}
        height={1024}
        className="absolute -bottom-[5%] md:-bottom-28 lg:-bottom-72 right-1/2 translate-x-1/2 rounded-xl"
      />
    </section>
  );
};

export default FeatureSection;
