"use client";

export function PressStartButton() {
  const onStart = () => {
    const target = document.getElementById("games-preview");
    if (!target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={onStart}
      className="press-start rounded-md border-2 border-cyan-200/90 bg-slate-950/70 px-6 py-3 text-xs uppercase tracking-[0.25em] text-cyan-100 backdrop-blur-sm transition hover:bg-slate-900/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      aria-label="Scroll to game list"
    >
      Press Start
    </button>
  );
}
