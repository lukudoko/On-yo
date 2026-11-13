import Header from '@/components/header';
import { motion } from 'framer-motion';

export default function Layout({ children, initialStats }) {
  return (
    <div className="min-h-[100dvh] bg-[#f9f4ed]">
      <Header initialStats={initialStats} />
      <motion.main
        className="font-noto pt-20 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.main>
    </div>
  );
}