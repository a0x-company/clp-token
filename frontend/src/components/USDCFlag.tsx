// next
import Image from "next/image";

// utils
import { cn } from "@/lib/utils";

interface USDCFlagProps {
  baseIcon: boolean;
}

const USDCFlag: React.FC<USDCFlagProps> = ({ baseIcon = false }) => {
  return (
    <div className={cn("relative self-end", !baseIcon ? "w-24" : "w-max")}>
      <Image
        src="/images/app/usdc-icon.svg"
        alt="USDC"
        width={48}
        height={48}
        unoptimized
        className={cn("rounded-full overflow-hidden h-12 w-12 object-cover object-left")}
      />
      {!baseIcon ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 bg-white px-2 rounded-full border-2 border-black text-sm font-bold"
          )}
        >
          USDC
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

export default USDCFlag;
