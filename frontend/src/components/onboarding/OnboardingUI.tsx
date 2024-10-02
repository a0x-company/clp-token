"use client";

// next
import Image from "next/image";
import Link from "next/link";

// react
import { useCallback, useEffect, useState } from "react";

// web3auth
import { useWeb3Auth } from "@web3auth/no-modal-react-hooks";

// context
import { useUserStore } from "@/context/global-store";

// components

import KYCSynapsis from "@/components/kyc/KYCSynapsis";
import { Button } from "@/components/ui/button";
import ConnectWithGoogle from "@/components/onboarding/ConnectWithGoogle";

// confetti
import { BadgeCheck } from "lucide-react";
import Pride from "react-canvas-confetti/dist/presets/pride";
import { TConductorInstance } from "react-canvas-confetti/dist/types";

enum OnboardingStep {
  SignIn,
  KYC,
  Finish,
}

export enum KYCStatus {
  STARTED = "STARTED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

interface OnboardingUIProps {
  kycStatus: {
    status: KYCStatus | null;
    sessionId: string | null;
    email?: string;
  };
}

export default function OnboardingUI({ kycStatus }: OnboardingUIProps) {
  const { isConnected, userInfo, isInitialized } = useWeb3Auth();
  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.SignIn);
  const [kycStatusState, setKycStatusState] = useState(kycStatus.status);
  const [sessionId, setSessionId] = useState(kycStatus.sessionId);

  /* Confetti */
  const [conductor1, setConductor1] = useState<TConductorInstance>();
  const [conductor2, setConductor2] = useState<TConductorInstance>();

  const onInit1 = ({ conductor }: { conductor: TConductorInstance }) => {
    console.log("onInit1");
    setConductor1(conductor);
  };

  const onInit2 = ({ conductor }: { conductor: TConductorInstance }) => {
    setConductor2(conductor);
  };

  const onOnceConductor1 = useCallback(() => {
    conductor1?.run({ speed: 30, duration: 1200 });
  }, [conductor1]);

  const onOnceConductor2 = useCallback(() => {
    conductor2?.run({ speed: 30, duration: 1200 });
  }, [conductor2]);

  useEffect(() => {
    setKycStatusState(kycStatus.status);
    setSessionId(kycStatus.sessionId);
  }, [kycStatus.status, kycStatus.sessionId]);

  useEffect(() => {
    if (isConnected && isInitialized && userInfo && kycStatusState) {
      console.log(kycStatusState);
      if (
        kycStatusState === KYCStatus.APPROVED ||
        kycStatusState === KYCStatus.PENDING_VERIFICATION
      ) {
        setStep(OnboardingStep.Finish);
        onOnceConductor1();
        onOnceConductor2();
      } else {
        setStep(OnboardingStep.KYC);
      }
    }
  }, [
    isConnected,
    isInitialized,
    userInfo,
    kycStatusState,
    conductor1,
    conductor2,
    onOnceConductor1,
    onOnceConductor2,
  ]);

  const renderStep = () => {
    switch (step) {
      case OnboardingStep.SignIn:
        return <ConnectWithGoogle />;
      case OnboardingStep.KYC:
        return (
          <KYCSynapsis
            statusKyc={kycStatusState}
            setStatusKyc={setKycStatusState}
            sessionId={sessionId}
          />
        );
      case OnboardingStep.Finish:
        return (
          <>
            <div className="bg-white text-black flex flex-col items-center justify-center w-full max-w-md rounded-b-lg p-4 gap-2">
              <div className="flex items-center justify-center relative">
                <Image
                  src={userInfo?.profileImage || ""}
                  alt="profile"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
                <BadgeCheck
                  size={24}
                  className="text-green-500 absolute -bottom-2 bg-white rounded-full p-px"
                />
              </div>
              <h1 className="text-2xl font-bold">{userInfo?.name}</h1>
              <h2>Congratulations, your profile is ready to go!</h2>
              <Button variant="outline">
                <Link href="/">Go to the app</Link>
              </Button>
              <Button variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>

            {[...Array(2)].map((_, index) => (
              <Pride
                key={index}
                onInit={index === 0 ? onInit1 : onInit2}
                decorateOptions={() => {
                  return {
                    particleCount: 3,
                    angle: index === 0 ? 60 : 120,
                    spread: 55,
                    origin: { x: index === 0 ? 0 : 1 },
                    colors: ["#69E9FF", "#4682B4"],
                  };
                }}
              />
            ))}
          </>
        );
    }
  };

  return (
    <main className="bg-zinc-100 flex flex-col items-center justify-center min-h-screen">
      {/* Progress bar */}
      <div className="max-w-md w-full h-2 bg-zinc-200 rounded-full mt-20">
        <div
          className="h-full bg-black rounded-t-full transition-all duration-300 ease-in-out"
          style={{ width: `${((step + 1) / 3) * 100}%` }}
        ></div>
      </div>
      {renderStep()}
    </main>
  );
}
