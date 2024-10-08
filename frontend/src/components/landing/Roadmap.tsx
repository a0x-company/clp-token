"use client";

// react
import React from "react";

// next
import Image from "next/image";

// translations
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const LinesVector = ({ quarter }: { quarter: "q1" | "q2" | "q3" | "q4" }) => {
  return (
    <Image
      src={`/images/landing/lines-${
        quarter === "q1" || quarter === "q2" ? "white" : "blue"
      }-vector.svg`}
      alt="Lines"
      width={192}
      height={192}
      className={cn(
        "absolute -top-16 2xl:left-1/2 2xl:-translate-x-1/2",
        quarter === "q4" || quarter === "q2"
          ? "max-md:-left-[120px] md:-right-[40%] lg:-right-[10%] xl:-right-[10%]"
          : "max-md:-left-[120px] md:-left-[35%] lg:-left-[10%] xl:-left-[10%]"
      )}
    />
  );
};

const Quarter = ({
  title,
  children,
  side,
  quarter,
}: {
  title: string;
  children: React.ReactNode;
  side: "left" | "right";
  quarter: "q1" | "q2" | "q3" | "q4";
}) => {
  return (
    <div className="flex flex-col gap-4 relative">
      <LinesVector quarter={quarter} />
      <div
        className={cn(
          "flex items-center gap-4 bg-white rounded-xl px-8 py-4 w-max border-2 border-black shadow-brutalist",
          side === "left" ? "ml-auto" : "mr-auto"
        )}
      >
        <h3 className="text-[64px] font-romaben text-black">{title}</h3>
      </div>

      <ul className="list-disc list-outside text-[20px] text-black bg-white rounded-xl px-8 py-4 border-2 border-black shadow-brutalist">
        {children}
      </ul>
    </div>
  );
};
const Roadmap: React.FC = () => {
  const t = useTranslations("landing.roadmap");
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <section className="min-h-screen flex items-start justify-start bg-brand-orange-pastel py-16 px-8 lg:px-16 xl:px-32 relative overflow-hidden gap-8 lg:gap-16">
      <div className="flex flex-col flex-1 items-start gap-[160px]">
        <h2 className="text-[64px] font-romaben text-white">{t("title")}</h2>

        {isMobile && (
          /* Q4 */
          <Quarter title={t("q4")} side="left" quarter="q4">
            <li>
              <span className="font-bold">{t("q4-1.title")}:</span> {t("q4-1.description")}
            </li>
            <li>
              <span className="font-bold">{t("q4-2.title")}</span>
            </li>
          </Quarter>
        )}

        {/* Q1 */}
        <Quarter title={t("q1")} side="left" quarter="q1">
          <li>
            <span className="font-bold">{t("q1-1.title")}:</span> {t("q1-1.description")}
          </li>
          <li>
            <span className="font-bold">{t("q1-2.title")}:</span> {t("q1-2.description")}
          </li>
          <li>
            <span className="font-bold">{t("q1-3.title")}:</span> {t("q1-3.description")}
          </li>
        </Quarter>

        {isMobile && (
          /* Q2 */
          <Quarter title={t("q2")} side="left" quarter="q2">
            <li>
              <span className="font-bold">{t("q2-1.title")}:</span> {t("q2-1.description")}
            </li>
            <li>
              <span className="font-bold">{t("q2-2.title")}:</span> {t("q2-2.description")}
            </li>
          </Quarter>
        )}

        {/* Q3 */}
        <Quarter title={t("q3")} side="left" quarter="q3">
          <li>
            <span className="font-bold">{t("q3-1.title")}:</span> {t("q3-1.description")}
          </li>
          <li>
            <span className="font-bold">{t("q3-2.title")}:</span> {t("q3-2.description")}
          </li>
          <li>
            <span className="font-bold">{t("q3-3.title")}:</span> {t("q3-3.description")}
          </li>
        </Quarter>
      </div>

      <Image
        src="/images/landing/divider-vector-white.svg"
        alt="Divider"
        width={7}
        height={1080}
        className="max-md:hidden my-auto flex-0"
      />

      <div className="max-md:hidden flex flex-col flex-1 items-start gap-[160px] mt-16">
        {/* Q4 */}
        <Quarter title={t("q4")} side="right" quarter="q4">
          <li>
            <span className="font-bold">{t("q4-1.title")}:</span> {t("q4-1.description")}
          </li>
          <li>
            <span className="font-bold">{t("q4-2.title")}</span>
          </li>
        </Quarter>

        {/* Q2 */}
        <Quarter title={t("q2")} side="right" quarter="q2">
          <li>
            <span className="font-bold">{t("q2-1.title")}:</span> {t("q2-1.description")}
          </li>
          <li>
            <span className="font-bold">{t("q2-2.title")}:</span> {t("q2-2.description")}
          </li>
        </Quarter>

        <h2 className="text-[64px] font-romaben text-white absolute bottom-16 right-8 lg:right-16 xl:right-32">
          {t("title")}
        </h2>
      </div>
    </section>
  );
};

export default Roadmap;
