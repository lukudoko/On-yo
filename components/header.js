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
       const response = await fetch("/api/dashboard?type=header", {
      headers: {
        'X-API-Token': process.env.NEXT_PUBLIC_API_TOKEN || 'fallback-token-for-dev'
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
    <div className="fixed bg-[#f6eee3] md:bg-transparent z-50 flex w-full items-center justify-between top-0 py-4 px-8">
      <Link href="/">
        <p className="text-3xl font-jp font-bold w-12">On&apos; yo!</p>
      </Link>

      {status === "authenticated" ? (
        <Popover placement="bottom-end" isOpen={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger>
            <div className="h-14 relative aspect-square cursor-pointer">
              <Image
                src={session.user.image || "/jblog.webp"}
                alt="Profile Picture"
                className="object-cover border-2 border-black rounded-full"
                fill
                sizes="56px"
              />
            </div>
          </PopoverTrigger>

          <PopoverContent className="p-4 w-64 rounded-3xl border border-3 border-black shadow-lg bg-white">
            {/* User info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 relative aspect-square">
                <Image
                  src={session.user.image || "/jblog.webp"}
                  alt="Profile Picture"
                  className="object-cover border border-gray-300 rounded-full"
                  fill
                  sizes="40px"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
            </div>

            <Divider className="my-3" />

            {/* Stats */}
            {loadingStats ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : stats ? (
              <div className="space-y-3 w-full">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{stats.kanjiMastered}<span className="text-sm font-normal text-gray-500">/{stats.totalKanji}</span></p>
                    <p className="text-sm text-gray-500">Kanji Mastered</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Groups Completed</p>
                    <p className="text-lg font-bold text-green-600">{stats.groupsCompleted}<span className="text-sm font-normal text-gray-500">/{stats.totalGroups}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No stats available</p>
            )}

            <Divider className="my-3" />

            {/* Logout button */}
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => signOut()}
              className="mt-2 w-full font-medium"
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