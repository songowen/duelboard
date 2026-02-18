"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

type YachtCelebrationProps = {
  open: boolean;
  label?: string;
  durationMs?: number;
};

export function YachtCelebration({
  open,
  label = "YACHT!",
  durationMs = 900,
}: YachtCelebrationProps) {
  const reduceMotion = useReducedMotion();
  const effectiveDuration = reduceMotion ? 600 : durationMs;
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, effectiveDuration);
    return () => window.clearTimeout(timeout);
  }, [effectiveDuration, open]);

  useEffect(() => {
    if (!open || !visible) {
      return;
    }

    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, visible]);

  useEffect(() => {
    if (!open || !visible || reduceMotion) {
      setShowConfetti(false);
      return;
    }

    setShowConfetti(true);
    const timeout = window.setTimeout(() => {
      setShowConfetti(false);
    }, 810);

    return () => window.clearTimeout(timeout);
  }, [open, reduceMotion, visible]);

  const animationSeconds = Math.max(0.2, effectiveDuration / 1000);

  return (
    <AnimatePresence>
      {open && visible ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center"
          aria-hidden="true"
          initial={{ x: 0 }}
          animate={reduceMotion ? { x: 0 } : { x: [0, -5, 5, -3, 3, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationSeconds, ease: "easeOut" }}
        >
          {!reduceMotion ? (
            <motion.div
              className="absolute inset-0 bg-black/20"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: [0.15, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: animationSeconds, ease: "easeOut" }}
            />
          ) : null}

          {!reduceMotion && showConfetti && viewport.width > 0 && viewport.height > 0 ? (
            <Confetti
              width={viewport.width}
              height={viewport.height}
              numberOfPieces={48}
              recycle={false}
              gravity={0.18}
              initialVelocityY={12}
            />
          ) : null}

          <motion.div
            className="px-4 text-center"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: [0.9, 1, 1],
                    scale: [0.8, 1.15, 1],
                    rotate: [0, -2, 2, 0],
                  }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: animationSeconds, ease: "easeOut" }}
          >
            <span className="text-[56px] uppercase leading-none tracking-[0.08em] text-yellow-300 drop-shadow-[0_0_14px_rgba(253,224,71,0.7)] sm:text-[80px]">
              {label}
            </span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default YachtCelebration;
