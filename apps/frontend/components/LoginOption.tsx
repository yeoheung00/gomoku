interface LoginOptionProps {
  onLogin: (id: string) => void;
}

export default function LoginOption({ onLogin }: LoginOptionProps) {
  const handleGuestLogin = () => {
    const guestId = `gst_${crypto.randomUUID()}`;
    sessionStorage.setItem("mink-gomoku-user-id", guestId);
    onLogin(guestId);
  };
  return (
    <div className="w-full h-fit grid grid-cols-1 md:grid-cols-2">
      <button
        className="w-full h-10 bg-gray-600 text-white"
        onClick={handleGuestLogin}
      >
        Guest
      </button>
      <button className="w-full h-10 bg-green-600 text-white">Naver</button>
      <button className="w-full h-10 bg-blue-600 text-white">Google</button>
      <button className="w-full h-10 bg-gray-900 text-white">Github</button>
    </div>
  );
}
