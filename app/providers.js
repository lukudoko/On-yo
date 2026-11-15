"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function Providers({ children }) {
  const router = useRouter();
  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        {children}
      </HeroUIProvider>
    </SessionProvider>
  );
}