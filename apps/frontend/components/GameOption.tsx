interface GameOptionProps {
  onStatus: (status: "none" | "quick" | "private") => void;
}

export default function GameOption({ onStatus }: GameOptionProps) {
  return (
    <section>
      <button onClick={() => onStatus("quick")}>빠른게임</button>
      <button onClick={() => onStatus("private")}>사설게임</button>
    </section>
  );
}
