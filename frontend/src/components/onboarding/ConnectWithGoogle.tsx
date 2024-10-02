"use client";

// react
import React from "react";

// next
import Image from "next/image";

// components
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";

// icons
import { Loader2 } from "lucide-react";

// hooks
import { useGoogleConnect } from "@/hooks/useGoogleConnect";

interface ConnectWithGoogleProps {}

const ConnectWithGoogle: React.FC<ConnectWithGoogleProps> = () => {
  const { isConnected, loadingUser, handleConnect } = useGoogleConnect();

  return (
    <section className="bg-gray-300 rounded-b-lg text-black flex items-center justify-center max-w-md w-full">
      <div className="gap-4 flex flex-col items-center w-full">
        {loadingUser && (
          <Button
            className=" text-black/50 text-lg rounded-[10px] py-[15px] w-full"
            size="lg"
            disabled
          >
            <Loader2 className="animate-spin" />
            <p>Loading User...</p>
          </Button>
        )}
        {!isConnected && (
          <Button
            className=" text-black/50 text-lg rounded-t-0 rounded-b-[10px] py-[15px] hover:bg-white/90 w-full"
            size="lg"
            onClick={handleConnect}
          >
            <Image
              src="/icons/google-vector.svg"
              alt="google"
              width={20}
              height={20}
              className="mr-2"
            />
            Continue with Google
          </Button>
        )}
        {isConnected && !loadingUser && (
          <LoadingSpinner className="w-8 h-8" color="white" />
        )}
      </div>
    </section>
  );
};

export default ConnectWithGoogle;
