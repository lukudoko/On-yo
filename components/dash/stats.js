import { motion } from "framer-motion";
import { useState } from "react";
import { useStats } from "@/contexts/stats";
import { HiBookOpen, HiFire, HiMiniBookOpen, HiMiniCheckCircle, HiMiniQuestionMarkCircle } from "react-icons/hi2";
import { CircularProgressChart, JLPTProgressChart } from '@/components/progressDisplays';

import {
    Button,
    Progress,
    Link,
    Modal,
    useDisclosure,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";


export default function StatsCard({ itemVariants }) {
    const { stats: dashboardData, refreshStats } = useStats();
    const { progress, trackSpecificStats, track } = dashboardData;
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [changingTrack, setChangingTrack] = useState(false);

    const apiHeaders = {
        "Content-Type": "application/json",
        "X-API-Token": process.env.NEXT_PUBLIC_API_TOKEN,
    };

    const changeTrack = async (newTrack) => {
        setChangingTrack(true);
        try {
            const response = await fetch("/api/user/preferences", {
                method: "PUT",
                headers: apiHeaders,
                body: JSON.stringify({ track: newTrack }),
            });

            const data = await response.json();

            if (data.success) {
                await refreshStats();

                onOpenChange(false);
            } else {
                console.error("Error updating track:", data.error);
            }
        } catch (error) {
            console.error("Error updating track:", error);
        } finally {
            setChangingTrack(false);
        }
    };

    return (
        <>
            <motion.div
                variants={itemVariants}
                className="flex p-6 flex-col col-span-1  md:col-span-2  bg-white rounded-3xl"
            >
                <p className="text-xl font-bold">Progress</p>

                <div className="grid p-4 grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="flex flex-col mx-auto items-center">
                        <CircularProgressChart
                            mastered={progress.mastered}
                            learning={progress.learning}
                            unlearned={progress.unlearned}
                            total={progress.total}
                            goal={progress.goalName}
                        />

                        <div className="flex  w-full justify-evenly py-5">
                            <div className="flex bg-[#26A68210] rounded-xl justify-center gap-x-1 items-center p-2">
                                <HiMiniCheckCircle className="fill-[#26A682]" />
                                <span className="text-sm font-black text-[#26A682]">{progress.mastered}</span>
                            </div>

                            <div className="flex bg-[#FE9D0B10] rounded-xl justify-center gap-x-1 items-center p-2">
                                <HiMiniBookOpen className="fill-[#FE9D0B]" />
                                <span className="text-sm font-black text-[#FE9D0B]">{progress.learning}</span>
                            </div>

                            <div className="flex bg-[#EB475210] rounded-xl justify-center gap-x-1 items-center p-2">
                                <HiMiniQuestionMarkCircle className="fill-[#EB4752]" />
                                <span className="text-sm font-black text-[#EB4752]">{progress.unlearned}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        {track === "jlpt" ? (
                            <div className="my-auto">
                                <div className="font-semibold mb-2">JLPT Levels</div>
                                <JLPTProgressChart trackSpecificStats={trackSpecificStats} />
                            </div>

                        ) : (
                            <div className="my-auto">
                                <h4 className="font-semibold mb-2">Group Progress</h4>
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <Progress
                                        classNames={{
                                            base: "max-w-xs",
                                            indicator: "bg-[#6A7FDB]",
                                            value: "text-foreground/60",
                                        }}
                                        showValueLabel={true}
                                        size="lg"
                                        value={Math.round(
                                            (trackSpecificStats.completedGroups /
                                                trackSpecificStats.totalGroups) *
                                            100,
                                        )}
                                    />
                                    <div className="text-xs text-gray-500 text-center">
                                        {trackSpecificStats.inProgressGroups} groups in progress
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                            <span className="text-sm text-gray-500">
                                {track === "jlpt" ? "JLPT" : "Statistically Ordered"} Track
                            </span>
                            <Button
                                onPress={onOpen}
                                size="sm"
                                className="ml-7 font-medium text-white bg-[#6A7FDB]"
                            >
                                Change Track
                            </Button>
                        </div>
                    </div>
                </div>


            </motion.div>

            <Modal
                isOpen={isOpen}
                scrollBehavior="inside"
                classNames={{
                    base: "rounded-3xl border-0",
                    header: "border-b-0 pb-2",
                    body: "pt-0",
                    closeButton: "text-2xl text-black hover:bg-default-100",
                    backdrop: "bg-white/40",
                }}
                onOpenChange={onOpenChange}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Change Learning Track
                            </ModalHeader>
                            <ModalBody>
                                <p>
                                    Switch between following a more statistically oriented track,
                                    or one which more closely follows the JLPT
                                </p>
                                <p>Stats explainer</p>
                                <p>JLPT explainer</p>
                                <div className="mt-4">
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant={track === "stat" ? "solid" : "bordered"}
                                            onPress={() => changeTrack("stat")}
                                            isLoading={changingTrack && track !== "stat"}
                                            isDisabled={changingTrack || track === "stat"}
                                            className="font-semibold text-indigo-800 "
                                        >
                                            Statistics-Based Track
                                        </Button>
                                        <Button
                                            color="primary"
                                            variant={track === "jlpt" ? "solid" : "bordered"}
                                            onPress={() => changeTrack("jlpt")}
                                            isLoading={changingTrack && track !== "jlpt"}
                                            isDisabled={changingTrack || track === "jlpt"}
                                            className="font-semibold text-indigo-800 bg-indigo-100"
                                        >
                                            JLPT Track
                                        </Button>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
