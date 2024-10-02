"use client";
import { useEffect } from "react";
import { useUserStore } from "@/context/global-store";

export function UserInitializer({ userData }: { userData: any }) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (userData) {
      setUser({
        email: userData.email || null,
        name: userData.name || null,
        profileImage: userData.profileImage || null,
        address: userData.address || null,
        balance: userData.balance || null,
      });
    }
  }, [userData, setUser]);

  return null;
}
