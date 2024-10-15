// next
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";

interface CLPFlagProps {
  type: "CLP" | "CLPD";
  baseIcon?: boolean;
}

const CLPFlag: React.FC<CLPFlagProps> = ({ type, baseIcon = false }) => {
  return (
    <div
      className={cn(
        "relative self-end w-24",
        type === "CLP" && !baseIcon && "w-20",
        baseIcon && "w-max"
      )}
    >
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
      {!baseIcon ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 bg-white px-2 rounded-full border-2 border-black text-sm font-bold"
          )}
        >
          {type}
        </span>
      ) : (
        <Image
          src="/images/app/base-logo.svg"
          alt="base"
          width={22}
          height={22}
          className="rounded-full overflow-hidden object-cover absolute bottom-0 -right-2"
        />
      )}
    </div>
  );
};

export default CLPFlag;
