import { socket } from "@/lib/socket";

interface GameOptionProps {
  onStatus: (status: "none" | "quick" | "private") => void;
}

export default function GameOption({ onStatus }: GameOptionProps) {
  const handleQuickMatch = () => {
    onStatus("quick");
    socket.emit("quick-match");
  };
  const handlePrivateRoom = () => {
    onStatus("private");
    socket.emit("private-room");
  };
  return (
    <section>
      <button onClick={handleQuickMatch}>빠른게임</button>
      <button onClick={handlePrivateRoom}>사설게임</button>
    </section>
  );
}
