// react
import React from "react";

// next
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";

// components
import ConversionCard from "./ConversionCard";

interface HeroProps {}

const Hero: React.FC<HeroProps> = () => {
  return (
    <section className="flex flex-col items-center justify-center h-screen w-full overflow-hidden bg-gradient-to-b from-brand-blue to-white">
      <div className="flex relative overflow-hidden [mask-image:_linear-gradient(to_right,_transparent_0,_white_128px,white_calc(100%-128px),_transparent_100%)]">
        <h1 className="text-[120px] md:text-[240px] text-white font-romaben text-nowrap font-bold animate-infinite-scroll inline-block w-max mr-[4rem]">
          * Chile Stable Coin * Chile Stable Coin * Chile Stable Coin{" "}
        </h1>
        <h1
          className="text-[120px] md:text-[240px] text-white font-romaben text-nowrap font-bold animate-infinite-scroll inline-block w-max before:content-['*']"
          aria-hidden="true"
        >
          {" "}
          Chile Stable Coin * Chile Stable Coin * Chile Stable Coin
        </h1>
      </div>

      <ConversionCard />

      <div className="w-full place-content-end -mb-14 z-10">
        {Array.from({ length: 4 }).map((_, index) => (
          <Image
            src="/images/landing/araucaria-vector.svg"
            alt="Araucaria"
            width={386}
            height={422}
            className={cn("absolute", {
              "-bottom-[6rem] xl:-bottom-[4rem] 2xl:-bottom-[4rem] -left-[8rem]": index === 0,
              "-bottom-[6rem] xl:bottom-[0rem] 2xl:bottom-[0rem] left-[18rem]": index === 1,
              "hidden xl:block xl:-bottom-[5rem] 2xl:-bottom-[2rem] right-[25rem] max-md:hidden":
                index === 2,
              "bottom-[0rem] xl:-bottom-[2rem] 2xl:-bottom-[1rem] right-[0rem] max-md:hidden":
                index === 3,
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
