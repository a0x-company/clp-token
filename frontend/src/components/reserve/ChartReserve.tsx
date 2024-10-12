"use client";

// recharts
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartConfig, ChartContainer } from "../ui/chart";

// date-fns
import { format } from "date-fns";
import { es } from "date-fns/locale";

// react
import { useEffect, useState, useMemo } from "react";

// translations
import { useTranslations } from "next-intl";

// framer-motion
import { motion } from "framer-motion";

// react-responsive
import { useMediaQuery } from "react-responsive";

const ChartReserve = ({ activeData }: { activeData: any }) => {
  const t = useTranslations("reserve");
  const [domain, setDomain] = useState<number[]>([0, 0]);
  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    if (activeData) {
      const values = activeData.map((entry: any) => entry.balance);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const padding = range * 0.1;

      let adjustedMin = Math.max(0, min - padding);
      let adjustedMax = max + padding;

      const maxLimit = 10000;
      if (adjustedMax > maxLimit) {
        adjustedMax = maxLimit;
        adjustedMin = Math.max(0, adjustedMax - range * 1.2);
      }
      setDomain([adjustedMin, adjustedMax]);
    }
  }, [activeData]);

  const chartConfig = {
    portfolio: {
      label: t("reserve"),
      color: "#0066FF",
    },
  } satisfies ChartConfig;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg"
        >
          <p className="font-bold">
            {format(new Date(label), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
          <p className="text-[#0066FF]">{`${t("reserve")}: ${formatCurrency(payload[0].value)}`}</p>
        </motion.div>
      );
    }
    return null;
  };

  const gradientOffset = useMemo(() => {
    if (activeData) {
      const dataMax = Math.max(...activeData.map((i: any) => i.balance));
      const dataMin = Math.min(...activeData.map((i: any) => i.balance));

      if (dataMax <= 0) {
        return 0;
      }
      if (dataMin >= 0) {
        return 1;
      }

      return dataMax / (dataMax - dataMin);
    }
    return 0;
  }, [activeData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-[32px] max-md:w-[90vw] max-lg:w-[860px] w-[1080px] p-8 flex flex-col gap-y-4 items-center h-full border-2 border-black shadow-brutalist mx-auto mb-[120px]"
    >
      <h3 className="text-black font-helvetica text-[48px] font-[700] self-start">
        {t("history")}
      </h3>

      {activeData && (
        <ChartContainer config={chartConfig} className="min-h-[370px] h-[370px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="#0066FF" stopOpacity={0.8} />
                  <stop offset={gradientOffset} stopColor="#FF0000" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => format(new Date(value), "MMM d", { locale: es })}
                tick={{ fontSize: isMobile ? 8 : 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={domain}
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: isMobile ? 8 : 10 }}
                width={isMobile ? 50 : 70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#0066FF"
                strokeWidth={2}
                fill="url(#splitColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </motion.div>
  );
};

export default ChartReserve;
