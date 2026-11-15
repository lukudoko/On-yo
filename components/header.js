"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Link, useDisclosure } from "@heroui/react";

import { useMediaQuery } from "@/hooks/mediaquery";
import { changeTrack } from "@/app/actions/preferences";
import DeleteAccountModal from "@/components/deletemodal.header";
import ProfileDrawer from "@/components/profiledrawer.header";

export default function Header() { 
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [changingTrack, setChangingTrack] = useState(false);
  const router = useRouter();
  const theme = "light";
  const deleteModal = useDisclosure();
  const isTabletOrDesktop = useMediaQuery("(min-width: 768px)");
  const drawerPlacement = isTabletOrDesktop ? "right" : "top";
  const dsize = isTabletOrDesktop ? "sm" : "lg";

  const handleChangeTrack = async (newTrack) => {
    setChangingTrack(true);
    try {
      await changeTrack(newTrack);
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      console.error("Error changing track:", error);
    } finally {
      setChangingTrack(false);
    }
  };

  return (
    <>
      <DeleteAccountModal
        isOpen={deleteModal.isOpen}
        onOpenChange={deleteModal.onOpenChange}
      />

      <div className="fixed backdrop-blur-xl xl:backdrop-blur-none bg-[#f9f4ed90] shadow-xs xl:shadow-none xl:bg-transparent z-50 flex w-full items-center justify-between top-0 py-3 px-8">
        <Link href="/">
          <p className="text-xl/6.5 text-black tracking-wider font-jp font-bold w-14 h-14">
            On&apos; yo!
          </p>
        </Link>

        {status === "authenticated" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              className="h-12 relative aspect-square cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              <Image
                src={session.user.image || "/jblog.webp"}
                alt="Profile Picture"
                className="object-cover shadow-sm rounded-2xl"
                fill
                sizes="50px"
                loading="eager"
              />
            </div>

            <ProfileDrawer
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              session={session}
              changingTrack={changingTrack}
              onChangeTrack={handleChangeTrack}
              theme={theme}
              onDeleteAccount={deleteModal.onOpen}
              drawerPlacement={drawerPlacement}
              dsize={dsize}
              isTabletOrDesktop={isTabletOrDesktop}
            />
          </motion.div>
        ) : (
          <div className="h-14 relative aspect-square"></div>
        )}
      </div>
    </>
  );
}