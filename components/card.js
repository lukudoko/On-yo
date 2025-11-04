// components/card.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal, Chip, ModalContent, ModalHeader, ModalBody, Button, ModalFooter, useDisclosure } from '@heroui/react';
import { HiBookOpen, HiMiniCheckCircle , HiMiniQuestionMarkCircle    } from "react-icons/hi2";

const KanjiCard = ({
  kanji,
  meanings,
  readings_on,
  readings_kun,
  jlpt_new,
  freq_score,
  initialMasteryLevel = 0,
  onMasteryUpdate,
  exampleWords = [] // Add exampleWords prop
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [masteryLevel, setMasteryLevel] = useState(initialMasteryLevel);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMasteryLevel(initialMasteryLevel);
  }, [initialMasteryLevel]);

  const formatReadings = (readings) => {
    if (!readings || readings.length === 0) return "None";

    return readings.map((reading, index) => (
      <span key={index} className="inline-block mr-2 mb-1 last:mr-0">
        {reading}
        {index < readings.length - 1 && ', '}
      </span>
    ));
  };

  const handleMasteryUpdate = async (newLevel) => {
    if (isUpdating) return;

    setIsUpdating(true);
    const previousLevel = masteryLevel;

    setMasteryLevel(newLevel);

    try {
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kanji: kanji,
          masteryLevel: newLevel
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      onMasteryUpdate?.(kanji, newLevel);

      console.log(`Updated ${kanji} to mastery level ${newLevel}`);
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
        return {
          color: 'bg-[#26A682]',
          title: 'Mastered!',
        };
      case 1:
        return {
          color: 'bg-[#FE9D0B]',
          title: 'Learning',
        };
      default:
        return {
          color: 'bg-[#EB4752]',
          title: "Don't Know",
        };
    }
  };

  const masteryInfo = getMasteryInfo(masteryLevel);

  return (
    <>
      <motion.div
        className="flex aspect-square flex-col bg-white p-4 shadow-sm rounded-3xl cursor-pointer h-full relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="absolute top-3 left-3">
          <div
            className={`w-3 h-3 rounded-full ${masteryInfo.color}`}
            title={masteryInfo.title}
          />
        </div>

        <div className="flex flex-1 items-center font-bold justify-center text-center text-9xl font-jp-round p-8">
          {kanji}
        </div>
        <div className="flex justify-end items-center">
          <p className="flex items-center justify-center font-bold  bg-gray-800  text-white aspect-square p-2 text-xs rounded-full">
            N{jlpt_new}
          </p>
        </div>
      </motion.div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        backdrop='blur'
        scrollBehavior="inside"
        classNames={{
          base: "rounded-3xl border-0  ",
          header: "border-b-0 pb-2",
          body: "pt-0",
          closeButton: "text-2xl text-black hover:bg-default-100",
          backdrop: "bg-white/20",
        }}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.3
              }
            },
            exit: {
              y: 20,
              opacity: 0,
              scale: 0.8,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.3
              }
            }
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="text-center">
                  <div className="text-8xl font-bold font-jp-round mb-4">{kanji}</div>
                  <div className="flex justify-center pb-2 gap-3">
                    {freq_score && (
                      <Chip
                        size='sm'
                        classNames={{
                          base: "bg-[#6A7FDB]",
                          content: "font-bold text-white",
                        }}
                      > #{freq_score}</Chip>
                    )}

                    <Chip
                      size='sm'
                      classNames={{
                        base: "bg-black",
                        content: "font-bold text-white",
                      }}
                    > JLPT N{jlpt_new}</Chip>
                    <Chip
                      size='sm'
                      classNames={{
                        base: `${masteryInfo.color}`,
                        content: "font-medium text-white",
                      }}
                    >   {masteryInfo.title}</Chip>

                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#6A7FDB15] rounded-2xl p-4">
                      <h3 className="font-bold mb-3 text-base tracking-wide">Onyomi</h3>
                      <div className="font-jp-round text-gray-700 text-lg font-light flex flex-wrap gap-2">
                        {formatReadings(readings_on)}
                      </div>
                    </div>

                    <div className="bg-[#6A7FDB15]  rounded-2xl p-4">
                      <h3 className="font-bold mb-3 text-base  tracking-wide">Kunyomi</h3>
                      <div className="font-jp-round text-gray-700 text-lg font-light flex flex-wrap gap-2">
                        {formatReadings(readings_kun)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#6A7FDB15] rounded-2xl p-4 mb-6">
                    <h3 className="font-bold mb-3 text-base tracking-wide">Meanings</h3>
                    <p className="text-gray-700 text-sm flex flex-wrap">
                      {formatReadings(meanings)}
                    </p>
                  </div>
                  {exampleWords && exampleWords.length > 0 && (
                    <div className="bg-[#6A7FDB15] rounded-2xl p-4 mb-6">
                      <h3 className=" font-semibold mb-3 text-base tracking-wide">Example Words</h3>
                      <div className="grid md:grid-cols-3  grid-cols-2 gap-3">
                        {exampleWords.map((word, index) => {
                          let displayMeaning = word.meaning;
                          if (displayMeaning.includes(';')) {
                            const parts = displayMeaning.split(';').map(part => part.trim());
                            displayMeaning = parts.slice(0, 3).join(', ');
                            if (parts.length > 3) {
                              displayMeaning += ''
                            }
                          } else if (displayMeaning.length > 100) {
                            displayMeaning = displayMeaning.substring(0, 100);
                          }

                          return (
                            <div key={index} className="flex flex-col bg-white justify-center rounded-2xl p-2">
                              <div className="flex flex-col items-center justify-center items-baseline">
                                <p className="text-gray-600 text-xs">{word.reading}</p>
                                <p className="font-jp-round text-xl">{word.word}</p>
                              </div>
                              <p className="text-gray-700 text-center text-xs capitalize mt-1">{displayMeaning}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </ModalBody>

              <ModalFooter className='justify-center'>
                <div className="flex justify-center gap-4">
                  <Button
                    isIconOnly
                    className="font-medium bg-[#26A682] text-white"
                    onPress={() => handleMasteryUpdate(2)}
                    isDisabled={isUpdating || masteryLevel === 2}
                    isLoading={isUpdating && masteryLevel === 2}
                    size='lg'
                  >
                    <HiMiniCheckCircle  size={22} />
                  </Button>
                  <Button
                    className="font-medium bg-[#FE9D0B] text-white"
                    onPress={() => handleMasteryUpdate(1)}
                    isIconOnly
                    isDisabled={isUpdating || masteryLevel === 1}
                    isLoading={isUpdating && masteryLevel === 1}
                    size='lg'
                  >
                    <HiBookOpen size={22} />
                  </Button>
                  <Button
                    isIconOnly
                    className="font-medium bg-[#EB4752] text-white"
                    onPress={() => handleMasteryUpdate(0)}
                    isDisabled={isUpdating || masteryLevel === 0}
                    isLoading={isUpdating && masteryLevel === 0}
                    size='lg'
                  >
                    <HiMiniQuestionMarkCircle    size={22} />
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default KanjiCard;