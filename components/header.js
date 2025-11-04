import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Popover, PopoverTrigger, PopoverContent, Button, Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { useStats } from '@/contexts/stats';

export default function Header() {
  const { data: session, status } = useSession();
  const { stats, loading: loadingStats, error, fetchStats } = useStats();
  const [isOpen, setIsOpen] = useState(false);
  const previousIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (status === "authenticated" && !stats && !loadingStats) {
      fetchStats();
    }
  }, [status, stats, loadingStats, fetchStats]);

  useEffect(() => {
    if (isOpen && !previousIsOpenRef.current && status === "authenticated") {
      fetchStats();
    }
    previousIsOpenRef.current = isOpen;
  }, [isOpen, status, fetchStats]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
  };

  const getHeaderStats = () => {
    if (!stats) return null;

    if (stats.track === 'jlpt') {
      return {
        primary: stats.jlptLevel,
        primaryLabel: 'JLPT Level',
        secondary: stats.progress.mastered,
        secondaryLabel: 'Mastered Kanji',
        tertiary: `${stats.progress.mastered}/${stats.progress.total}`,
        tertiaryLabel: 'Total Progress'
      };
    } else {
      return {
        primary: stats.trackSpecificStats.completedGroups || 0,
        primaryLabel: 'Groups Completed',
        secondary: stats.progress.mastered,
        secondaryLabel: 'Mastered Kanji',
        tertiary: `${stats.progress.mastered}/${stats.progress.total}`,
        tertiaryLabel: 'Total Progress'
      };
    }
  };

  const headerStats = getHeaderStats();

  return (
    <div className="fixed bg-[#f9f4ed] xl:bg-transparent z-50 flex w-full items-center justify-between top-0 py-3 px-8">
      <Link href="/">
        <p className="text-2xl font-jp font-bold w-12">On&apos; yo!</p>
      </Link>

      {status === "authenticated" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Popover placement="bottom-end" isOpen={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger>
              <div className="h-12 relative aspect-square  cursor-pointer">
                <Image
                  src={session.user.image || "/jblog.webp"}
                  alt="Profile Picture"
                  className="object-cover shadow-sm rounded-2xl"
                  fill
                  sizes="50px"
                />
              </div>
            </PopoverTrigger>

            <PopoverContent className="p-4 w-64 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 relative aspect-square">
                  <Image
                    src={session.user.image}
                    alt="Profile Picture"
                    className="object-cover border rounded-2xl"
                    fill
                    sizes="40px"
                  />
                </div>
                <div>
                  <p className="text-lg font-bold">{session?.user?.name?.replace(/\s*\([^)]*\)$/, '').trim() || ''}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              {loadingStats && stats === null ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : stats ? (
                <div className="space-y-3 py-4 w-full">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{headerStats.primaryLabel}</span>
                      <span className="text-lg font-bold text-[#6A7FDB]">{headerStats.primary}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{headerStats.secondaryLabel}</span>
                      <span className="text-lg font-bold text-[#F56A83]">{headerStats.secondary}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{headerStats.tertiaryLabel}</span>
                      <span className="text-sm font-medium text-gray-700">{headerStats.tertiary}</span>
                    </div>

                    <div className="pt-2 text-xs text-gray-500 text-center">
                      Track: {stats.track === 'jlpt' ? 'JLPT Order' : 'Frequency Order'}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No stats available</p>
              )}

              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => signOut()}
                className="w-full font-medium"
              >
                Log out
              </Button>
            </PopoverContent>
          </Popover>
        </motion.div>
      ) : (
        <div className="h-14 relative aspect-square"></div>
      )}
    </div>
  );
}