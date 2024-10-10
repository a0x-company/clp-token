// next
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";

interface CLPFlagProps {
  type: "CLP" | "CLPD";
}

const CLPFlag: React.FC<CLPFlagProps> = ({ type }) => {
  return (
    <div className="relative self-end w-24">
      <Image
        src={`/images/landing/${type === "CLP" ? "chile-flag.png" : "clpa-logo-white.svg"}`}
        alt={`${type === "CLP" ? "Bandera de Chile" : "Logo CLPD"}`}
        width={48}
        height={48}
        unoptimized
        className={cn(
          "rounded-full overflow-hidden border-2 border-black h-12 w-12 object-cover object-left",
          type === "CLPD" && "bg-brand-blue-dark p-1"
        )}
      />
      <span className="absolute bottom-0 right-0 bg-white px-2 rounded-full border-2 border-black text-sm font-bold text-gray-600">
        {type}
      </span>
    </div>
  );
};

export default CLPFlag;
