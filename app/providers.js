"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";

export default function Providers({ children, initialStats }) {
  const router = useRouter();

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <Layout initialStats={initialStats}>{children}</Layout>
      </HeroUIProvider>
    </SessionProvider>
  );
}