// react
import Image from "next/image";
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white w-full h-max flex flex-col items-center justify-center gap-10 pt-16 pb-8 relative">
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
      <p className="text-black font-bold">Un producto de A0x © 2024</p>
    </footer>
  );
};

export default Footer;
