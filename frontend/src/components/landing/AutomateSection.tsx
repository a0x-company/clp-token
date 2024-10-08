// react
import React from "react";

// next
import Image from "next/image";

// components
import CLPFlag from "../CLPFlag";

// translations
import { useTranslations } from "next-intl";

const AutomateSection: React.FC = () => {
  const t = useTranslations("landing");
  return (
    <section className="flex flex-col md:flex-row items-center justify-center relative px-8 lg:px-16 xl:px-32 py-[180px] gap-16">
      <div className="flex flex-col flex-[1.5] gap-4 w-full">
        <h2 className="text-[64px] font-romaben">{t("automate.title")}</h2>
        <p className="text-[32px]">{t("automate.description")}</p>
      </div>

      <div className="flex flex-col flex-1 gap-8 w-full">
        <div className="flex justify-center items-center gap-8">
          <Image src="/images/landing/box-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/gear-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/box-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/gear-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/box-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/gear-vector.svg" alt="Box" width={48} height={48} />
        </div>

        <Image
          src="/images/landing/clpa-logo-white.svg"
          alt="Logo CLPD"
          width={60}
          height={60}
          className="rounded-full overflow-hidden border-2 border-black h-16 w-16 bg-brand-blue-dark p-1 mx-auto"
        />

        <div className="flex justify-center items-center gap-8">
          <Image src="/images/landing/gear-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/box-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/gear-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/box-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/gear-vector.svg" alt="Box" width={48} height={48} />
          <Image src="/images/landing/box-vector.svg" alt="Box" width={48} height={48} />
        </div>
      </div>

      <div className="absolute top-0 w-full flex justify-center">
        <Image
          src="/images/landing/divider-vector.svg"
          alt="Divider"
          width={1080}
          height={7}
          className="absolute right-1/2 translate-x-1/2 -bottom-[calc(7px/2)] max-md:hidden md:w-[500px] lg:w-[980px] 2xl:w-[1280px]"
        />

        <Image
          src="/images/landing/divider-sm-vector.svg"
          alt="Divider"
          width={307}
          height={7}
          className="absolute right-1/2 translate-x-1/2 -bottom-[calc(7px/2)] w-[307px] max-md:block hidden"
        />
      </div>
    </section>
  );
};

export default AutomateSection;
