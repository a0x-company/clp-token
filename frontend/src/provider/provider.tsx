"use client";
// wagmi
import WagmiConfig from "./WagmiConfig";

// react-query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// react
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig>{mounted && children}</WagmiConfig>
    </QueryClientProvider>
  );
}
