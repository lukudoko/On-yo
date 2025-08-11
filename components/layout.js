import Header from './header';
import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>On&apos;yo!</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <Header />
      <main className='font-noto bg-[#f6eee3] min-h-screen pt-28 px-4 md:px-8'>{children}</main>
    </>
  );
}