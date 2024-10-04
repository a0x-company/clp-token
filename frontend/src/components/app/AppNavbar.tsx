"use client";

import { useState } from "react";

// next
import Image from "next/image";

type NavOption = "deposit" | "withdraw" | "invest" | "change";

const AppNavbar = () => {
  const [selectedOption, setSelectedOption] = useState<NavOption>("deposit");

  const getButtonStyle = (option: NavOption) => {
    const baseStyle =
      "flex w-[192px] p-[16px] justify-center items-center gap-[8px] rounded-[12px] cursor-pointer transition-all duration-300";
    const selectedStyle = "border-[2px] border-black bg-[#FBC1CF]";
    const unselectedStyle = "border-[2px] border-transparent hover:border-black";

    return `${baseStyle} ${selectedOption === option ? selectedStyle : unselectedStyle}`;
  };

  return (
    <div className="flex flex-row py-[32px] px-[48px] justify-between items-center">
      <div className="w-[169px] content-center items-center gap-[10px]">
        <Image src="/images/clpa-logo.svg" alt="CLPD logo" width={64} height={64} />
      </div>

      <div className="flex flex-row p-[16px] items-center gap-[16px] rounded-[12px] border-[2px] border-black">
        <div className={getButtonStyle("deposit")} onClick={() => setSelectedOption("deposit")}>
          <p className="text-black text-center font-helvetica text-[24px] font-[700]">Depositar</p>
        </div>

        <div className={getButtonStyle("withdraw")} onClick={() => setSelectedOption("withdraw")}>
          <p className="text-black text-center font-helvetica text-[24px] font-[700]">Retirar</p>
        </div>

        <div className={getButtonStyle("invest")} onClick={() => setSelectedOption("invest")}>
          <p className="text-black text-center font-helvetica text-[24px] font-[700]">Invierte</p>
        </div>

        <div className="flex w-[192px] p-[16px] content-center items-center gap-[8px] rounded-[12px] cursor-not-allowed opacity-50">
          <p className="text-black text-center font-helvetica text-[24px] font-[700]">Cambiar</p>
        </div>
      </div>

      <div className="flex flex-row py-[16px] px-[32px] content-center items-center gap-[8px] rounded-[12px] border-[2px] border-black bg-black">
        <p className="text-white text-center font-helvetica text-[24px] font-[700]">Conectar</p>
      </div>
    </div>
  );
};

export default AppNavbar;
