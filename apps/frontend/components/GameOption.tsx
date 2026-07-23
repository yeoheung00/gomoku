import { useSocket } from "@/contexts/SocketContext";

interface GameOptionProps {
  onStatus: (status: "none" | "quick" | "private") => void;
}

export default function GameOption({ onStatus }: GameOptionProps) {
  const { socket, isConnected } = useSocket();
  const handleQuickMatch = () => {
    if (!isConnected) return;
    onStatus("quick");
    socket.emit("quick-match", (response: {status: string, msg: string}) => {
      console.log(response.status, response.msg);
    });
  };
  const handlePrivateRoom = () => {
    if (!isConnected) return;
    onStatus("private");
    socket.emit("private-room");
  };
  return (
    <section className="w-full flex flex-col md:flex-row gap-4">
      <button className="w-full h-10 bg-blue-500" onClick={handleQuickMatch}>
        빠른게임
      </button>
      <button className="w-full h-10 bg-blue-500" onClick={handlePrivateRoom}>
        사설게임
      </button>
    </section>
  );
}
