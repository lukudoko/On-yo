"use client";
import { motion } from "framer-motion";
import { Button, Input, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import * as wanakana from "wanakana";

export default function AnswerForm({
  type,
  options = [],
  selectedAnswer,
  onSelect,
  onSubmit,
  isAnswerValid,
  isSubmitting,
  before = "",
  after = "",
  hints = [],
  showHints = false,
  inputRef,
  inputProps = {},
  errorMessage,
  shake,
}) {
  const shakeAnimation = shake
    ? { x: [0, -8, 8, -4, 4, 0] }
    : {};

  const handleInputChange = (value) => {
    let processedValue = value;
    if (/[a-zA-Z]/.test(value)) {
      processedValue = value.replace(/ん(?=[aiueoyn])/gi, "n");
    }

    const hiraganaValue = wanakana.toHiragana(processedValue);
    onSelect(hiraganaValue);
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 items-center justify-center w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, ...shakeAnimation }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {type === "multiple-choice" ? (
        <div className="grid grid-cols-1 w-full md:grid-cols-3 gap-3">
          {options.map((option) => (
            <Button
              key={option}
              onPress={() => onSelect(option)}
              size="lg"
              aria-pressed={selectedAnswer === option}
              className={`w-full font-bold text-xl transition-colors ${selectedAnswer === option
                ? "bg-[#6A7FDB] text-white"
                : "bg-[#6A7FDB20] text-black"
                }`}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 px-4 flex-col">
          <div className="flex items-center gap-2">
            {before && <span className="text-2xl font-bold">{before}</span>}
            <Input
              ref={inputRef}
              type="text"
              value={selectedAnswer}
              onValueChange={handleInputChange}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              size="lg"
              {...inputProps}
              classNames={{
                inputWrapper: "bg-[#6A7FDB20] mx-auto",
                input: "bg-[#6A7FDB20] w-full text-xl text-center font-bold ",
                ...inputProps?.classNames,
              }}
              className={inputProps?.className ?? "w-24"}
            />
            {after && <span className="text-2xl font-bold">{after}</span>}
          </div>
          {errorMessage && (
            <div className="text-red-600 font-bold text-sm">{errorMessage}</div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Button
          type="submit"
          className="bg-[#6A7FDB20] font-semibold w-32 h-11"
          isDisabled={!isAnswerValid || isSubmitting}
          isLoading={isSubmitting}
        >
          Check
        </Button>

        {showHints && hints.length > 0 && (
          <Popover size="lg" placement="top">
            <PopoverTrigger>
              <Button className="bg-[#6A7FDB10] font-semibold h-11">Hint</Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col mt-2 p-6">
              <div className="text-sm font-bold mb-3">Same reading as:</div>
              <div className="flex justify-center space-x-4">
                {hints.map((hint, index) => (
                  <span
                    key={index}
                    className="font-jp-round bg-[#6A7FDB10] rounded-lg p-2 text-2xl"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </motion.form>
  );
}