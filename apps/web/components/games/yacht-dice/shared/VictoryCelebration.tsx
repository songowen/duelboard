"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

type VictoryCelebrationProps = {
  open: boolean;
  label?: string;
  durationMs?: number;
};

export function VictoryCelebration({
  open,
  label = "YOU WIN!",
  durationMs = 1400,
}: VictoryCelebrationProps) {
  const reduceMotion = useReducedMotion();
  const effectiveDuration = reduceMotion ? 700 : durationMs;
  const [visible, setVisible] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

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
    if (!open || !visible || reduceMotion) {
      return;
    }

    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, reduceMotion, visible]);

  const animationSeconds = Math.max(0.3, effectiveDuration / 1000);

  return (
    <AnimatePresence>
      {open && visible ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[98] flex items-center justify-center"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.2, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: animationSeconds, ease: "easeOut" }}
        >
          {!reduceMotion && viewport.width > 0 && viewport.height > 0 ? (
            <Confetti
              width={viewport.width}
              height={viewport.height}
              numberOfPieces={140}
              recycle={false}
              gravity={0.22}
              initialVelocityY={14}
              colors={["#f6d32d", "#f5f5f5", "#6de2ff", "#ff5a5a", "#7cff73"]}
              drawShape={(ctx) => {
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI * 2);
                ctx.fill();
              }}
            />
          ) : null}

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.92 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: [0, 1, 1], y: [24, -6, 0], scale: [0.92, 1.08, 1], rotate: [0, -1.5, 1.5, 0] }
            }
            exit={{ opacity: 0 }}
            transition={{ duration: animationSeconds, ease: "easeOut" }}
            className="px-3 text-center"
          >
            <p className="text-[46px] uppercase leading-none tracking-[0.1em] text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.9)] sm:text-[84px]">
              {label}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default VictoryCelebration;

