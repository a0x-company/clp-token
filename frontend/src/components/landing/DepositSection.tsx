// react
import React from "react";

// next
import Image from "next/image";

// components
import CLPFlag from "../CLPFlag";

// translations
import { useTranslations } from "next-intl";

const DepositSection: React.FC = () => {
  const t = useTranslations("landing");
  return (
    <section className="flex flex-col-reverse md:flex-row items-center justify-center -mt-56 relative px-8 lg:px-16 xl:px-32 py-[120px] gap-16 bg-white">
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

      <div className="flex flex-col flex-1 gap-4 w-full">
        <div className="bg-black text-white rounded-xl p-4 flex justify-between items-center w-full">
          <div>
            <div className="text-xl font-bold">{t("send")}</div>
            <div className="text-[28px] font-bold">1 Peso</div>
          </div>
          <CLPFlag type="CLP" />
        </div>

        <div className="flex justify-center">
          <Image src="/images/landing/deposit-vector.svg" alt="Deposit" width={48} height={48} />
        </div>

        <div className="bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center w-full">
          <div>
            <div className="text-xl font-bold">{t("receive")}</div>
            <div className="text-[28px] font-bold">1 CLPD</div>
          </div>
          <CLPFlag type="CLPD" />
        </div>
      </div>

      <div className="flex flex-col flex-[1.5] gap-4 w-full">
        <h2 className="text-[48px] lg:text-[64px] font-beauford font-bold text-black text-start">
          {t("deposit.title")}
        </h2>
        <p className="text-[24px] lg:text-[32px] text-start text-black">
          {t("deposit.description")}
        </p>
      </div>

      <div className="absolute bottom-0 w-full flex justify-center">
        <Image
          src="/images/landing/waves-vector.svg"
          alt="Waves"
          width={150}
          height={175}
          className="absolute left-0 -top-[calc(175px/2)]"
        />
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

export default DepositSection;
