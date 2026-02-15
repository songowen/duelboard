"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Placement = {
  id: string;
  src: string;
  top: string;
  left: string;
  opacity: number;
  size: number;
};

const slots = [
  { top: "14%", left: "3%" },
  { top: "22%", left: "94%" },
  { top: "30%", left: "5%" },
  { top: "39%", left: "93%" },
  { top: "47%", left: "4%" },
  { top: "56%", left: "93%" },
  { top: "65%", left: "6%" },
  { top: "73%", left: "94%" },
  { top: "82%", left: "7%" },
  { top: "90%", left: "92%" },
];

const sprites = ["/pixel/star.svg", "/pixel/heart.svg", "/pixel/coin.svg"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PixelObjects() {
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    const count = randomInt(6, 8);
    const selectedSlots = shuffle(slots).slice(0, count);
    const next: Placement[] = selectedSlots.map((slot, index) => ({
      id: `${slot.top}-${slot.left}-${index}`,
      src: sprites[Math.floor(Math.random() * sprites.length)] ?? sprites[0],
      top: slot.top,
      left: slot.left,
      opacity: randomInt(70, 85) / 100,
      size: randomInt(20, 28),
    }));
    setPlacements(next);
  }, []);

  if (placements.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {placements.map((item) => (
        <Image
          key={item.id}
          src={item.src}
          alt=""
          width={item.size}
          height={item.size}
          className="absolute [image-rendering:pixelated]"
          style={{ top: item.top, left: item.left, opacity: item.opacity }}
        />
      ))}
    </div>
  );
}
