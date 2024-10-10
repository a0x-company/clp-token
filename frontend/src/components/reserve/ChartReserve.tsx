"use client";

// recharts
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

// date-fns
import { format } from "date-fns";
import { es } from "date-fns/locale";

// react
import { useEffect, useState } from "react";

// translations
import { useTranslations } from "next-intl";

const ChartReserve = ({ activeData }: { activeData: any }) => {
  const t = useTranslations("reserve");
  const [domain, setDomain] = useState<number[]>([0, 0]);

  useEffect(() => {
    if (activeData) {
      const values = activeData.map((entry: any) => entry[1]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const padding = range * 0.8;

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
      label: "Reserva",
      color: "#0066FF",
    },
  } satisfies ChartConfig;

  return (
    <div className="relative bg-white rounded-[32px] max-md:w-[90vw] max-lg:w-[860px] w-[1080px] p-8 flex flex-col gap-y-4 items-center h-full border-2 border-black shadow-brutalist mx-auto mb-[120px]">
      <h3 className="text-black font-helvetica text-[48px] font-[700] self-start">
        {t("history")}
      </h3>

      {activeData && (
        <ChartContainer config={chartConfig} className="min-h-[370px] h-[370px] w-full flex-1">
          <AreaChart data={activeData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0066FF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value).getTime();
                const formattedDate = format(date, "MMM d", { locale: es });
                return formattedDate;
              }}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip
              cursor
              content={<ChartTooltipContent indicator="dot" />}
              wrapperStyle={{
                backgroundColor: "white",
                width: "fit-content",
                borderRadius: "8px",
                color: "black",
              }}
              label={<span className="text-black">Reserva</span>}
              formatter={(value) => {
                return [`Reserva $${value} CLP`];
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={domain}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              tick={{ fontSize: 10 }}
              width={35}
            />
            <Area
              type="monotone"
              dataKey={(entry) => entry.balance}
              stroke="#0066FF"
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
};

export default ChartReserve;
