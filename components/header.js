import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Popover, PopoverTrigger, Divider, PopoverContent, Button, Spinner } from "@heroui/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Track popover state

  // Fetch stats when popover opens
  useEffect(() => {
    if (isOpen && status === "authenticated" && !stats) {
      fetchStats();
    }
  }, [isOpen, status, stats]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch("/api/stats?type=header", {
        headers: {
          'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN
        }
      });
      const json = await response.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Reset stats when popover closes to ensure fresh data on next open
  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setStats(null); // Clear stats when closing
    }
  };

  return (
    <div className="fixed bg-[#f9f4ed] xl:bg-transparent z-50 flex w-full items-center justify-between top-0 py-3 px-8">
      <Link href="/">
        <p className="text-2xl font-jp font-bold w-12">On&apos; yo!</p>
      </Link>

      {status === "authenticated" ? (
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
                  src={session.user.image || "/jblog.webp"}
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

            <Divider className="my-3" />

            {loadingStats ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : stats ? (
              <div className="space-y-3 py-4 w-full">
                <div className="flex mb-2 justify-between items-center">
              <div>
                <span className="text-xl font-bold text-indigo-600">{stats.kanjiMastered}</span>
                <span className="text-xs"> / {stats.totalKanji} kanji</span>
              </div>

        <div>
                <span className="text-xl font-bold text-cyan-600">{stats.groupsCompleted}</span>
                <span className="text-xs"> / {stats.totalGroups} groups</span>
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
      ) : (
        <div className="h-14 relative aspect-square"></div>
      )}
    </div>
  );
}