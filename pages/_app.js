import "@/styles/globals.css";
import Layout from '@/components/layout';
import { HeroUIProvider } from "@heroui/react";
import { Noto_Sans_JP, M_PLUS_Rounded_1c, Mochiy_Pop_One } from 'next/font/google';
import { SessionProvider } from "next-auth/react";


const noto = Noto_Sans_JP({
  display: 'swap',
  variable: '--font-noto',
  preload: false,
});
const jp = Mochiy_Pop_One({
  subsets: ['japanese'],
  display: 'swap',
  weight: ['400'],
  variable: '--font-jp',
  preload: false,
});
const jp2 = M_PLUS_Rounded_1c({
  subsets: ['japanese'],
  display: 'swap',
  weight: ['800'],
  variable: '--font-jp-round',
  preload: false,
});

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <div className={`${noto.variable} ${jp.variable} ${jp2.variable}`}>
      <SessionProvider session={session}>
        <HeroUIProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </HeroUIProvider>
      </SessionProvider>
    </div>
  )
}