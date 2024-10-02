import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

interface HeroProps {}

const Hero: React.FC<HeroProps> = () => {
  return (
    <section className="flex flex-col items-center justify-center h-screen w-full overflow-hidden bg-gradient-to-b from-brand-blue to-white">
      <div className="flex relative overflow-hidden mb-auto py-10 [mask-image:_linear-gradient(to_right,_transparent_0,_white_128px,white_calc(100%-128px),_transparent_100%)]">
        <h1 className="text-[240px] font-romaben text-nowrap font-bold animate-infinite-scroll inline-block w-max mr-[4rem]">
          * Chile Stable Coin * Chile Stable Coin * Chile Stable Coin{" "}
        </h1>
        <h1
          className="text-[240px] font-romaben text-nowrap font-bold animate-infinite-scroll inline-block w-max before:content-['*']"
          aria-hidden="true"
        >
          {" "}
          Chile Stable Coin * Chile Stable Coin * Chile Stable Coin
        </h1>
      </div>

      <div className="w-full place-content-end -mb-14 z-10">
        {Array.from({ length: 4 }).map((_, index) => (
          <Image
            src="/images/landing/araucaria-vector.svg"
            alt="Araucaria"
            width={386}
            height={422}
            className={cn("absolute", {
              "-bottom-[1.25rem] -left-[8rem]": index === 0,
              "bottom-[7rem] left-[18rem]": index === 1,
              "bottom-[0rem] right-[35rem] max-md:hidden": index === 2,
              "bottom-[0rem] right-[0rem] max-md:hidden": index === 3,
            })}
            key={index}
          />
        ))}

        <Image
          src="/images/landing/mountain-vector.svg"
          alt="Mountain Divider"
          width={1441}
          height={190}
          className="w-full h-auto"
        />
      </div>
    </section>
  );
};

export default Hero;
