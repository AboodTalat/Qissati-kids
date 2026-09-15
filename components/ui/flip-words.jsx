"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  // The first word renders in its finished state. Framer serialises `initial`
  // into the SSR HTML, so animating the first word in would ship
  // opacity:0 — leaving the sentence around it dangling for anyone whose JS
  // is slow, blocked, or throttled. Later flips animate normally.
  const [hasFlipped, setHasFlipped] = useState(false);

  // thanks for the fix Julian - https://github.com/Julian-AT
  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
    setHasFlipped(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating)
      setTimeout(() => {
        startAnimation();
      }, duration);
  }, [isAnimating, duration, startAnimation]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}>
      <motion.div
        initial={
          hasFlipped
            ? {
                opacity: 0,
                y: 10,
              }
            : false
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
        exit={{
          opacity: 0,
          y: -28,
          filter: "blur(8px)",
          scale: 1.25,
          position: "absolute",
        }}
        className={cn(
          "z-10 inline-block relative text-start px-1",
          className
        )}
        key={currentWord}>
        {/* Word-level only. The shipped version also splits each word into
            per-letter <span>s, which shapes every Arabic letter in isolation —
            "شرطي" comes out as four disconnected glyphs. */}
        {currentWord.split(" ").map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={
              hasFlipped ? { opacity: 0, y: 10, filter: "blur(8px)" } : false
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: wordIndex * 0.12,
              duration: 0.3,
            }}
            className="inline-block whitespace-nowrap">
            {word}
            {wordIndex < currentWord.split(" ").length - 1 ? (
              <span className="inline-block">&nbsp;</span>
            ) : null}
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
