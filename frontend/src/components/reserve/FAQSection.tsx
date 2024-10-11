"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import Image from "next/image";

const items = [
  {
    title: "faq.title1",
    content: "faq.content1",
  },
  {
    title: "faq.title2",
    content: "faq.content2",
  },
  {
    title: "faq.title3",
    content: "faq.content3",
  },
  {
    title: "faq.title4",
    content: "faq.content4",
  },
  {
    title: "faq.title5",
    content: "faq.content5",
  },
  {
    title: "faq.title6",
    content: "faq.content6",
  },
];

const FAQSection = () => {
  const t = useTranslations("reserve.faq");
  const [openValue, setOpenValue] = useState<string | undefined>("0");

  return (
    <section className="flex flex-col items-center justify-center relative px-8 lg:px-16 xl:px-32 pt-[64px] pb-[120px] gap-16">
      <h2 className="font-extrabold font-beauford text-black text-9xl tracking-tighter text-start self-start">
        FAQ
      </h2>

      <Accordion
        type="single"
        collapsible
        className="flex flex-col w-full"
        value={openValue}
        onValueChange={(value: string) =>
          setOpenValue((prev) => (prev === value ? undefined : value))
        }
      >
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            value={index.toString()}
            className={cn("flex flex-col p-6 md:p-10 dashed-border my-8")}
          >
            <AccordionTrigger className="flex items-center justify-between gap-x-4">
              <h3 className="text-black text-3xl md:text-5xl font-helvetica font-[700] -tracking-[0.24px] text-left max-md:w-full w-5/6">
                {t(item.title)}
              </h3>
              <div className="flex items-center justify-center">
                <Image
                  src="/images/reserve/arrow-black.svg"
                  alt="arrow"
                  width={40}
                  height={40}
                  className={cn(
                    "transition-all duration-300",
                    openValue === index.toString() ? "-rotate-180" : "rotate-0"
                  )}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-black text-2xl font-helvetica font-normal w-full">
                {t(item.content)}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;
