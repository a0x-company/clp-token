// next
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";

interface CLPFlagProps {
  type: "CLP" | "CLPa";
}

const CLPFlag: React.FC<CLPFlagProps> = ({ type }) => {
  return (
    <div className="relative self-end w-20">
      <Image
        src={`/images/landing/${type === "CLP" ? "chile-flag" : "clpa-logo-white"}.svg`}
        alt={`${type === "CLP" ? "Bandera de Chile" : "Logo CLPa"}`}
        width={48}
        height={48}
        className={cn(
          "rounded-full overflow-hidden border-2 border-black h-12 w-12",
          type === "CLPa" && "bg-brand-blue-dark p-1"
        )}
      />
      <span className="absolute bottom-0 right-0 bg-white px-2 rounded-full border-2 border-black text-sm font-bold text-gray-600">
        {type}
      </span>
    </div>
  );
};

export default CLPFlag;
