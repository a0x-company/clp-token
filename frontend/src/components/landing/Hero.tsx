"use client";

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
    <section className="flex flex-col items-center justify-center h-screen w-full overflow-hidden bg-gradient-to-b from-brand-blue to-white gap-16">
      <div className="flex relative max-lg:mt-16 [mask-image:_linear-gradient(to_right,_transparent_0,_white_128px,white_calc(100%-128px),_transparent_100%)]">
        <h1 className="text-[120px] leading-none md:text-[240px] text-white font-beauford text-nowrap font-bold animate-infinite-scroll inline-block w-max mr-[4rem]">
          * CLPD El Peso Digital * CLPD El Peso Digital * CLPD El Peso Digital{" "}
        </h1>
        <h1
          className="text-[120px] leading-none md:text-[240px] text-white font-beauford text-nowrap font-bold animate-infinite-scroll inline-block w-max before:content-['*']"
          aria-hidden="true"
        >
          {" "}
          CLPD El Peso Digital * CLPD El Peso Digital * CLPD El Peso Digital
        </h1>
      </div>

      <ConversionCard />

      <div className="w-full absolute overflow-hidden -mb-14 z-10 h-full">
        {Array.from({ length: 4 }).map((_, index) => (
          <Image
            src="/images/landing/araucaria-vector.svg"
            alt="Araucaria"
            width={386}
            height={422}
            className={cn("absolute", {
              "-bottom-[2rem] md:-bottom-[2rem] lg:-bottom-[1rem] xl:-bottom-[0rem] 2xl:bottom-[3rem] -left-20 md:-left-20":
                index === 0,
              "bottom-[3rem] xl:bottom-[4rem] 2xl:bottom-[10rem] left-[40%] md:left-[20%]":
                index === 1,
              "hidden xl:block xl:bottom-[5rem] 2xl:bottom-[8rem] right-[20%] max-md:hidden":
                index === 2,
              "bottom-[0rem] xl:bottom-[2rem] 2xl:bottom-[6rem] right-0 max-md:hidden": index === 3,
            })}
            key={index}
          />
        ))}

        <Image
          src="/images/landing/mountain-vector.svg"
          alt="Mountain Divider"
          width={1441}
          height={190}
          className="absolute w-full h-auto max-md:h-[190px] bottom-0"
        />
      </div>
    </section>
  );
};

export default Hero;
