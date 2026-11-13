export const ACCURACY_MESSAGES = [
  { threshold: 90, message: "Amazing Work!" },
  { threshold: 80, message: "Excellent!" },
  { threshold: 70, message: "Great stuff! 😎" },
  { threshold: 60, message: "Good shot!" },
  { threshold: 50, message: "Not bad! 🤔" },
  { threshold: 0, message: "Keep practicing! 🔥" },
];

export function getAccuracyMessage(accuracy) {
  return (
    ACCURACY_MESSAGES.find((item) => accuracy >= item.threshold)?.message ??
    ACCURACY_MESSAGES.at(-1).message
  );
}

export function pickRandom(arr, count) {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function formatMeaning(meaning) {
  if (!meaning) return "";
  return meaning
    .split(";")
    .map((part) => part.trim().replace(/^\w/, (c) => c.toUpperCase()))
    .join(", ");
}

export function splitAroundTarget(text, target) {
  if (!target || !text?.includes(target)) return null;
  const start = text.indexOf(target);
  return {
    before: text.slice(0, start),
    after: text.slice(start + target.length),
  };
}

export function splitOnBlank(text) {
  const start = text.indexOf("＿");
  if (start === -1) return null;
  return {
    before: text.slice(0, start),
    after: text.slice(text.lastIndexOf("＿") + 1),
  };
}


export const REVIEW_COOLDOWN_MS = 9 * 60 * 60 * 1000;   // 9 hours
export const VOCAB_COOLDOWN_MS  = 3 * 60 * 60 * 1000;   // 3 hours
