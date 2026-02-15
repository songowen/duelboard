"use client";

export function PressStartButton() {
  const onStart = () => {
    const target = document.getElementById("games");
    if (!target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={onStart}
      className="press-start-bob bg-transparent p-0 text-3xl uppercase tracking-[0.1em] text-[#f5f5f5] hover:text-[#f6d32d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]"
      aria-label="Scroll to games section"
    >
      ▼ Press Start
    </button>
  );
}
