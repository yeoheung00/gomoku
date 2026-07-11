import { socket } from "@/lib/socket";

interface QuickMatchProps {
  onStatus: (status: "none" | "quick" | "private") => void;
}

export default function QuickMatch({ onStatus }: QuickMatchProps) {
  const handlerExitQuickMatch = () => {
    onStatus("none");
    socket.emit("exit-quick-match");
  };
  return (
    <section>
      <span>매칭중...</span>
      <button onClick={handlerExitQuickMatch}>취소</button>
    </section>
  );
}
