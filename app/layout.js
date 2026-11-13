import "@/styles/globals.css";
import { Noto_Sans_JP, M_PLUS_Rounded_1c, Mochiy_Pop_One } from "next/font/google";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/utils/dashboard";
import Providers from "@/app/providers";


const noto = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto",
});
const jp = Mochiy_Pop_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jp",
});
const jp2 = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-jp-round",
});

export const metadata = {
  title: "On'yo!",
  description: "Kanji learning app",
};

export const viewport = {
  themeColor: "#f9f4ed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  const session = await getSession();
  let headerStats = null;

  if (session) {
    headerStats = await getDashboardData(session.user.id);
  }

  return (
    <html
      lang="en"
      className={`${noto.variable} ${jp.variable} ${jp2.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers initialStats={headerStats}>{children}</Providers>
      </body>
    </html>
  );
}