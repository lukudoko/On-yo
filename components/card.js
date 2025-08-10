import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal, ModalContent, ModalHeader, ModalBody, Button, ModalFooter, useDisclosure } from '@heroui/react';

const KanjiCard = ({
  kanji,
  meanings,
  readings_on,
  readings_kun,
  jlpt_new,
  freq_score,
  initialMasteryLevel = 0,
  onMasteryUpdate
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
          color: 'bg-green-500',
          title: 'Mastered!',
        };
      case 1:
        return {
          color: 'bg-yellow-500',
          title: 'Learning',
        };
      default:
        return {
          color: 'bg-red-500',
          title: "Don't Know",
        };
    }
  };

  const masteryInfo = getMasteryInfo(masteryLevel);

  return (
    <>
      { }
      <motion.div
        className="flex border-4 aspect-square flex-col bg-white p-4 rounded-3xl cursor-pointer h-full relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        { }
        <div className="absolute top-3 left-3">
          <div
            className={`w-3 h-3 rounded-full ${masteryInfo.color}`}
            title={masteryInfo.title}
          />
        </div>

        <div className="flex flex-1 items-center justify-center text-center text-9xl font-jp-round p-8">
          {kanji}
        </div>
        <div className="flex justify-end items-center">
          <p className="flex items-center justify-center font-bold bg-black text-white aspect-square p-2 text-xs rounded-full">
            N{jlpt_new}
          </p>
        </div>
      </motion.div>

      { }
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        backdrop='blur'
        scrollBehavior="inside"
        classNames={{
          base: "border-4 rounded-3xl",
          header: "border-b-0 pb-2",
          body: "pt-0",
          closeButton: "text-2xl hover:bg-default-100"
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
                { }
                <div className="text-center">
                  <div className="text-8xl font-jp-round mb-4">{kanji}</div>
                  <div className="flex justify-center pb-2 gap-3">
                    {freq_score && (
                      <span className="text-sm bg-blue-100 font-bold text-blue-800 px-3 py-1 rounded-full">
                        #{freq_score}
                      </span>
                    )}
                    <span className="text-sm bg-black font-bold text-white px-3 py-1 rounded-full">
                      JLPT N{jlpt_new}
                    </span>
                    <span className={`px-3 py-1 ${masteryInfo.color} text-white text-sm rounded-full font-medium`}>
                      {masteryInfo.title}
                    </span>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  { }
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h3 className="text-gray-500 font-semibold mb-3 text-sm uppercase tracking-wide">Onyomi</h3>
                      <div className="font-noto text-xl font-semibold flex flex-wrap gap-2">
                        {formatReadings(readings_on)}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h3 className="text-gray-500 font-semibold mb-3 text-sm uppercase tracking-wide">Kunyomi</h3>
                      <div className="font-noto text-xl font-semibold flex flex-wrap gap-2">
                        {formatReadings(readings_kun)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <h3 className="text-gray-500 font-semibold mb-3 text-sm uppercase tracking-wide">Meanings</h3>
                    <p className="text-black font-semibold text-sm">
                      {meanings.join(', ')}
                    </p>
                  </div>


                </motion.div>
              </ModalBody>
              <ModalFooter className='justify-center'>
                <div className="flex justify-center gap-4">
                  <Button
                    className="font-medium bg-green-500 text-white"
                    onPress={() => handleMasteryUpdate(2)}
                    size="sm"
                    isDisabled={isUpdating || masteryLevel === 2}
                    isLoading={isUpdating && masteryLevel === 2}
                  >
                    Mastered!
                  </Button>
                  <Button
                    className="font-medium bg-yellow-500 text-white"
                    onPress={() => handleMasteryUpdate(1)}
                    size="sm"
                    isDisabled={isUpdating || masteryLevel === 1}
                    isLoading={isUpdating && masteryLevel === 1}
                  >
                    Learning
                  </Button>
                  <Button
                    className="font-medium bg-red-500 text-white"
                    onPress={() => handleMasteryUpdate(0)}
                    size="sm"
                    isDisabled={isUpdating || masteryLevel === 0}
                    isLoading={isUpdating && masteryLevel === 0}
                  >
                    Don't Know
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