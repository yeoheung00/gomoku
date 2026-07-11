interface PrivateRoomProps {
  onStatus: (status: "none" | "quick" | "private") => void;
}

export default function PrivateRoom({ onStatus }: PrivateRoomProps) {
  return <section>private room</section>;
}
