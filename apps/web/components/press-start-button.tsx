"use client";

import type { MouseEvent } from "react";

type PressStartButtonProps = {
  ariaLabel: string;
};

export function PressStartButton({ ariaLabel }: PressStartButtonProps) {
  const onStart = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
    const target = document.getElementById("games");
    if (target) {
      target.scrollIntoView({ behavior, block: "start" });
      return;
    }

    window.location.hash = "games";
  };

  return (
    <a
      href="#games"
      onClick={onStart}
      className="press-start-bob bg-transparent p-0 text-3xl uppercase tracking-[0.1em] text-[#f5f5f5] hover:text-[#f6d32d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]"
      aria-label={ariaLabel}
    >
      ▼ Press Start
    </a>
  );
}
