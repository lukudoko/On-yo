"use client";

import Image from "next/image";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import StreakHeader from "@/components/streaks.header";
import { useStats } from "@/utils/stats.provider";
import { getFreshDashboardData } from "@/app/actions/dash"; 

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Link,
  Button,
  Switch,
  Spinner,
  Progress,
  Divider,
} from "@heroui/react";
import {
  HiMiniArrowsRightLeft,
  HiMiniSun,
  HiMiniMoon,
  HiMiniFire,
} from "react-icons/hi2";

export default function ProfileDrawer({
  isOpen,
  onOpenChange,
  session,
  changingTrack,
  onChangeTrack,
  theme,
  onDeleteAccount,
  drawerPlacement,
  dsize,
  isTabletOrDesktop,
}) {
  const { stats, updateStats } = useStats();
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      getFreshDashboardData(session.user.id).then(data => {
        if (data) {
          updateStats(data);
        }
      });
    }
  }, [isOpen, session?.user?.id, updateStats]);

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={dsize}
      scrollBehavior="inside"
      placement={drawerPlacement}
      hideCloseButton
      classNames={{
        header: "border-b-0 pb-2",
        body: "pt-0",
        backdrop: "bg-white/20",
        footer: "flex items-center flex-col",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex items-center justify-evenly gap-3 px-4 pt-4">
              <div className="h-16 relative aspect-square">
                <Image
                  src={session.user.image}
                  alt="Profile Picture"
                  className="object-cover border rounded-2xl"
                  fill
                  sizes="80px"
                />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {session?.user?.name
                    ?.replace(/\s*\([^)]*\)$/, "")
                    .trim() || ""}
                </p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
            </DrawerHeader>

            <DrawerBody className="pt-0">
              {stats ? (
                <div className="space-y-6 py-4 w-full px-4 flex flex-col min-h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <HiMiniFire className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-semibold">
                          {stats.streak ?? 0} day streak
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">
                          Overall progress
                        </span>
                        <span className="text-xs font-semibold">
                          {stats.progress.mastered}
                          <span className="text-gray-400">
                            {" / "}
                            {stats.progress.total}
                          </span>
                        </span>
                      </div>
                      <Progress
                        value={
                          (stats.progress.mastered /
                            stats.progress.total) *
                          100
                        }
                        aria-label="Overall progress"
                        classNames={{
                          track: "bg-default-100",
                          indicator: "bg-[#26A682]",
                        }}
                      />
                    </div>
                  </div>

                  {isTabletOrDesktop && (
                    <StreakHeader studyDates={stats.studyDates} />
                  )}

                  <div className="mt-auto" />
                  <Divider />

                  <div className="space-y-3">
                    <Button
                      onPress={() =>
                        onChangeTrack(
                          stats.track === "jlpt" ? "stat" : "jlpt"
                        )
                      }
                      isDisabled={changingTrack}
                      className="w-full h-auto min-h-0 px-4 py-3 justify-between bg-[#6A7FDB20]"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {stats.track === "jlpt"
                            ? "JLPT Track"
                            : "Stats Track"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Switch to{" "}
                          {stats.track === "jlpt" ? "Stats" : "JLPT"}{" "}
                          track
                        </span>
                      </div>
                      {changingTrack ? (
                        <Spinner size="sm" color="current" />
                      ) : (
                        <HiMiniArrowsRightLeft className="w-5 h-5 text-[#6A7FDB]" />
                      )}
                    </Button>

                    <Button
                      onPress={() => {}}
                      isDisabled
                      className="w-full h-auto min-h-0 px-4 py-4 justify-between bg-[#6A7FDB20]"
                    >
                      <div className="flex items-center gap-3">
                        {theme === "dark" ? (
                          <HiMiniMoon className="w-5 h-5" />
                        ) : (
                          <HiMiniSun className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">Dark Mode</span>
                      </div>
                      <Switch
                        isSelected={theme === "dark"}
                        size="sm"
                        isDisabled
                      />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No stats available
                </p>
              )}
            </DrawerBody>

            <DrawerFooter>
              <Button
                color="danger"
                variant="flat"
                onPress={() => signOut()}
                className="w-full font-medium"
              >
                Log out
              </Button>
              <Link
                size="sm"
                variant="light"
                className="text-[#6A7FDB] hover:opacity-80"
                onPress={onDeleteAccount}
              >
                Delete account
              </Link>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}