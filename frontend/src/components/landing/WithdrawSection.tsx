// react
import React from "react";

// next
import Image from "next/image";

// components
import CLPFlag from "../CLPFlag";

// translations
import { useTranslations } from "next-intl";

const WithdrawSection: React.FC = () => {
  const t = useTranslations("landing");
  return (
    <section className="flex items-center justify-center relative px-16 xl:px-32 py-[180px] gap-16">
      <div className="flex flex-col flex-[1.5] gap-4 w-full">
        <h2 className="text-[64px] font-romaben">{t("withdraw.title")}</h2>
        <p className="text-[32px]">{t("withdraw.description")}</p>
      </div>

      <div className="flex flex-col flex-1 gap-4">
        <div className="bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center w-full">
          <div>
            <div className="text-xl font-bold">{t("receive")}</div>
            <div className="text-[28px] font-bold">1 CLPa</div>
          </div>

          <CLPFlag type="CLP" />
        </div>

        <div className="flex justify-center ">
          <Image src="/images/landing/withdraw-vector.svg" alt="Withdraw" width={48} height={48} />
        </div>

        <div className="bg-black text-white rounded-xl p-4 flex justify-between items-center w-full">
          <div>
            <div className="text-xl font-bold">{t("redeem")}</div>
            <div className="text-[28px] font-bold">1 Peso</div>
          </div>

          <CLPFlag type="CLPa" />
        </div>
      </div>

      <div className="absolute bottom-0 w-full flex justify-center">
        <Image
          src="/images/landing/circle-vector.svg"
          alt="Circle"
          width={150}
          height={255}
          className="absolute right-0 -top-[calc(255px/2)]"
        />
        <Image
          src="/images/landing/divider-vector.svg"
          alt="Divider"
          width={1080}
          height={7}
          className="absolute right-1/2 translate-x-1/2 -bottom-[calc(7px/2)] max-[1280px]:w-[980px]"
        />
      </div>
    </section>
  );
};

export default WithdrawSection;
