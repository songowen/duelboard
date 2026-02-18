type RoomHeaderCompactProps = {
  roomText: string;
  seatTurnText: string;
  meText: string;
  opponentText: string;
};

export function RoomHeaderCompact({ roomText, seatTurnText, meText, opponentText }: RoomHeaderCompactProps) {
  return (
    <div className="grid gap-2 text-[10px] uppercase tracking-[0.11em] text-slate-300 sm:grid-cols-2">
      <p>{roomText}</p>
      <p>{seatTurnText}</p>
      <p>{meText}</p>
      <p>{opponentText}</p>
    </div>
  );
}
