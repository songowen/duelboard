"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Placement = {
  id: string;
  src: string;
  top: string;
  left: string;
  opacity: number;
  size: number;
  scale: number;
  floatY: number;
  duration: number;
  delay: number;
};

const sprites = ["/pixel/star.svg", "/pixel/heart.svg", "/pixel/coin.svg"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

export function PixelObjects() {
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const count = mobile ? randomInt(6, 7) : randomInt(8, 10);
    const next: Placement[] = Array.from({ length: count }, (_, index) => ({
      id: `pixel-${index}-${Date.now()}`,
      src: sprites[Math.floor(Math.random() * sprites.length)] ?? sprites[0],
      top: `${randomInt(7, 92)}%`,
      left: `${randomInt(4, 95)}%`,
      opacity: randomFloat(0.38, 0.72),
      size: randomInt(18, 30),
      scale: randomFloat(0.82, 1.22),
      floatY: randomInt(2, 4),
      duration: randomFloat(4.5, 7),
      delay: randomFloat(0, 2.6),
    }));
    setPlacements(next);
  }, []);

  if (placements.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {placements.map((item) => (
        <span
          key={item.id}
          className="pixel-object absolute"
          style={
            {
              top: item.top,
              left: item.left,
              opacity: item.opacity,
              "--float-y": `-${item.floatY}px`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            } as CSSProperties
          }
        >
          <Image
            src={item.src}
            alt=""
            width={item.size}
            height={item.size}
            className="block [image-rendering:pixelated]"
            style={{ transform: `scale(${item.scale})` }}
          />
        </span>
      ))}
      <style jsx>{`
        .pixel-object {
          z-index: 0;
          animation-name: pixel-object-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        @keyframes pixel-object-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(var(--float-y, -3px));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pixel-object {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
