import "@/styles/globals.css";
import Layout from '@/components/layout';
import { HeroUIProvider } from "@heroui/react";
import { Noto_Sans_JP, M_PLUS_Rounded_1c, Mochiy_Pop_One } from 'next/font/google';
import { SessionProvider } from "next-auth/react";
import { StatsProvider } from '@/contexts/stats';
import { useRouter } from "next/router";

const noto = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
});
const jp = Mochiy_Pop_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jp',
});
const jp2 = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['500', '800',],
  variable: '--font-jp-round',
});

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  return (
    <div className={`${noto.variable} ${jp.variable} ${jp2.variable}`}>
      <SessionProvider session={session}>
        <HeroUIProvider navigate={router.push}>
          <StatsProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </StatsProvider>
        </HeroUIProvider>
      </SessionProvider>
    </div>
  )
}