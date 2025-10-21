import Header from '@/components/header';
import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>On&apos;yo!</title>
        <meta name="theme-color" content="#f9f4ed" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <Header />
      <main className='font-noto bg-[#f9f4ed] min-h-screen pt-20 px-2 md:px-8'>{children}</main>
    </>
  );
}