export function shortRoomId(roomId: string | null | undefined) {
  if (!roomId) {
    return "-";
  }

  if (roomId.length < 12) {
    return roomId;
  }

  return `${roomId.slice(0, 6)}...${roomId.slice(-4)}`;
}
