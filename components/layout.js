import Header from '@/components/header';
import Head from 'next/head';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>On&apos;yo!</title>
        <meta name="theme-color" content="#f9f4ed" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </Head>

      <div>
        <Header />
        <motion.main
          className='font-noto pt-16 sm:pt-20 px-4 sm:px-8'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </>
  );
}