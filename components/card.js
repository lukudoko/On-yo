import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Drawer, Chip, DrawerContent, DrawerHeader, DrawerBody, Button, DrawerFooter, useDisclosure } from '@heroui/react';
import { HiBookOpen, HiMiniCheckCircle, HiMiniQuestionMarkCircle } from "react-icons/hi2";
import { useMediaQuery } from "@/hooks/mediaquery";


const KanjiCard = ({
  kanji,
  meanings,
  readings_on,
  readings_kun,
  jlpt_new,
  freq_score,
  initialMasteryLevel = 0,
  onMasteryUpdate,
  exampleWords = [],
  kanjiId,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [masteryLevel, setMasteryLevel] = useState(initialMasteryLevel);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMasteryLevel(initialMasteryLevel);
  }, [initialMasteryLevel]);

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(/[,、]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const formatReadings = (readings) => {
    if (!readings || readings.length === 0) return "None";
    return readings.map((reading, index) => (
      <span key={index} className="inline-block mr-2 mb-1 last:mr-0">
        {reading}
        {index < readings.length - 1 && ', '}
      </span>
    ));
  };

  const isTabletOrDesktop = useMediaQuery("(min-width: 768px)");
  const drawerPlacement = isTabletOrDesktop ? "left" : "bottom";


  const handleMasteryUpdate = async (newLevel) => {
    if (isUpdating) return;
    setIsUpdating(true);
    const previousLevel = masteryLevel;
    setMasteryLevel(newLevel);
    try {
      await onMasteryUpdate?.(kanjiId, newLevel);
    } catch (error) {
      console.error('Error updating mastery level:', error);
      setMasteryLevel(previousLevel);
    } finally {
      setIsUpdating(false);
    }
  };

  const getMasteryInfo = (level) => {
    switch (level) {
      case 2:
        return { color: '#26A682', title: 'Mastered!' };
      case 1:
        return { color: '#FE9D0B', title: 'Learning' };
      default:
        return { color: '#EB4752', title: "Not Yet Learned" };
    }
  };

  const masteryInfo = getMasteryInfo(masteryLevel);

  return (
    <>
      <div
        onClick={onOpen}
        aria-label={`Kanji ${kanji}, ${meanings?.[0] || ''}`}
        className="flex flex-col aspect-square justify-between p-5 h-full rounded-3xl bg-white cursor-pointer transition-all duration-200  active:scale-[0.99] hover:scale-[1.01] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] active:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.6)] shadow-sm relative"
      >
        <div className="absolute top-3 left-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `${masteryInfo.color}` }} title={masteryInfo.title} />
        </div>
        <div className="flex flex-1 items-center font-bold justify-center text-center text-6xl md:text-[7rem] font-jp-round">
          {kanji}
        </div>
        <div className="absolute top-3 right-3">
          <p className="flex items-center justify-center font-semibold bg-gray-800 text-white aspect-square p-2 text-xs rounded-full">
            N{jlpt_new}
          </p>
        </div>
      </div>

      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        scrollBehavior="inside"
        placement={drawerPlacement}
        classNames={{
          base: "rounded-3xl border-0",
          header: "border-b-0 pb-2",
          body: "pt-0",
          closeButton: "text-2xl text-black hover:bg-default-100",
          backdrop: "bg-white/20",
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1">
                <div className="text-center">
                  <div className="text-8xl font-bold font-jp-round mb-4">{kanji}</div>
                  <div className="flex justify-center pb-2 gap-2">
                    {freq_score && (
                      <Chip
                        variant="flat"
                        radius="sm"
                        size="sm"
                        className="bg-[#6A7FDB]/10 text-[#6A7FDB] text-xs font-semibold"
                      >
                        <span className="font-bold">#{freq_score}</span>
                      </Chip>
                    )}
                    <Chip
                      variant="flat"
                      radius="sm"
                      size="sm"
                      className="bg-gray-700 text-white text-xs"
                    >
                      <span className="font-semibold">JLPT N{jlpt_new}</span>
                    </Chip>
                    <Chip
                      variant="flat"
                      radius="sm"
                      size="sm"
                      className="text-xs"
                      style={{ backgroundColor: `${masteryInfo.color}10`, color: `${masteryInfo.color}` }}
                    >
                      <span className="font-semibold">{masteryInfo.title}</span>
                    </Chip>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#6A7FDB]/10 rounded-2xl p-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
                        Onyomi
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {toArray(readings_on).map((r, i) => (
                          <span
                            key={i}
                            className="font-jp-round text-base text-gray-800 bg-white px-2.5 py-1 rounded-md"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#6A7FDB]/10 rounded-2xl p-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
                        Kunyomi
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {toArray(readings_kun).map((r, i) => (
                          <span
                            key={i}
                            className="font-jp-round text-base text-gray-800 bg-white px-2.5 py-1 rounded-md"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#8DDCDC]/10 rounded-2xl p-4 mb-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
                      Meanings
                    </h3>
                    <div className="flex flex-wrap gap-y-1">
                      {toArray(meanings).map((m, i, arr) => (
                        <span key={i} className="text-gray-800 text-base leading-relaxed">
                          {m}
                          {i < arr.length - 1 && <span className="text-gray-400 mx-1.5">/</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {exampleWords && exampleWords.length > 0 && (
                    <div className="bg-[#4A90E2]/10 rounded-2xl p-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
                        Example Words
                      </h3>
                      <div className="grid md:grid-cols-3 grid-cols-2 gap-3">
                        {exampleWords.map((word, index) => {
                          let displayMeaning = word.meaning;
                          if (displayMeaning.includes(';')) {
                            const parts = displayMeaning.split(';').map(part => part.trim());
                            displayMeaning = parts.slice(0, 3).join(', ');
                            if (parts.length > 3) displayMeaning += '...';
                          } else if (displayMeaning.length > 100) {
                            displayMeaning = displayMeaning.substring(0, 100) + '...';
                          }
                          return (
                            <div
                              key={index}
                              className="flex flex-col bg-white rounded-xl p-3 shadow-xs"
                            >
                              <div className="text-center mb-1">
                                <p className="text-gray-500 text-xs font-medium">{word.reading}</p>
                                <p className="font-jp-round text-2xl text-gray-900 leading-tight">{word.word}</p>
                              </div>
                              <p className="text-gray-600 text-center text-xs capitalize leading-snug mt-1">
                                {displayMeaning}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </DrawerBody>
              <DrawerFooter className="justify-center">
                <div className="flex justify-center gap-4">
                  <Button
                    isIconOnly
                    aria-label="Mark as mastered"
                    className="font-medium bg-[#26A682] text-white"
                    onPress={() => handleMasteryUpdate(2)}
                    isDisabled={isUpdating || masteryLevel === 2}
                    isLoading={isUpdating && masteryLevel === 2}
                    size="lg"
                  >
                    <HiMiniCheckCircle size={22} />
                  </Button>

                  <Button
                    isIconOnly
                    aria-label="Mark as learning"
                    className="font-medium bg-[#FE9D0B] text-white"
                    onPress={() => handleMasteryUpdate(1)}
                    isDisabled={isUpdating || masteryLevel === 1}
                    isLoading={isUpdating && masteryLevel === 1}
                    size="lg"
                  >
                    <HiBookOpen size={22} />
                  </Button>

                  <Button
                    isIconOnly
                    aria-label="Mark as not learned"
                    className="font-medium bg-[#EB4752] text-white"
                    onPress={() => handleMasteryUpdate(0)}
                    isDisabled={isUpdating || masteryLevel === 0}
                    isLoading={isUpdating && masteryLevel === 0}
                    size="lg"
                  >
                    <HiMiniQuestionMarkCircle size={22} />
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default KanjiCard;