"use client";

import { useEffect, useState, useRef, SubmitEvent } from "react";
import { Copy, X, SquarePen, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import LoginOption from "@/components/LoginOption";
import Lobby from "@/components/Lobby";

export default function Page() {
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    return sessionStorage.getItem("min-gomoku-user-id");
  });
  const isLogged = userId !== null;

  return (
    <main className="w-full max-w-5xl flex flex-col justify-center items-center">
      <h1 className="text-5xl font-black text-center">⚫️ 오목 ⚪️</h1>
      {!isLogged ? <LoginOption onLogin={setUserId} /> : <Lobby />}
    </main>
  );

  // const [isConnected, setIsConnected] = useState<boolean>(false);
  // const socketId = useRef<string>("");
  // const [userName, setUserName] = useState("");
  // const [editName, setEditName] = useState("");
  // const [status, setStatue] = useState<"none" | "quick" | "private">("none");
  // const [isEditingName, setIsEditingName] = useState(false);

  // const router = useRouter();

  // useEffect(() => {
  //   if (!socket.connected) {
  //     socket.connect();
  //   }

  //   socket.on("connect", () => {
  //     socketId.current = socket.id ?? "";
  //     setIsConnected(true);
  //   });

  //   socket.on("initUser", (data: { name: string }) => {
  //     setUserName(data.name);
  //   });

  //   socket.on("matchSuccess", (data: { roomId: string; color: number }) => {
  //     router.push(`/room/${data.roomId}`);
  //   });

  //   socket.on("disconnect", () => setIsConnected(false));

  //   return () => {
  //     socket.off("connect");
  //     socket.off("initUser");
  //     socket.off("disconnect");
  //     socket.off("matchSuccess");
  //   };
  // }, [router]);

  // const handlerQuick = () => {
  //   if (status === "none")
  //     socket.emit(
  //       "joinMatch",
  //       (response: { success: boolean; reason?: string; msg?: string }) => {
  //         if (response.success) {
  //           console.log(response.msg);
  //           setStatue("quick");
  //         } else console.log(response.reason);
  //       },
  //     );
  //   else if (status === "quick")
  //     socket.emit(
  //       "cancelMatch",
  //       (response: { success: boolean; reason?: string; msg?: string }) => {
  //         if (response.success) {
  //           console.log(response.msg);
  //           setStatue("none");
  //         } else console.log(response.reason);
  //       },
  //     );
  // };

  // const handlerPrivate = () => {
  //   setStatue((prev) => (prev === "none" ? "private" : "none"));
  // };

  // const handlerEditName = () => {
  //   setEditName(userName);
  //   setIsEditingName(true);
  // };

  // const handlerSaveName = (e: SubmitEvent) => {
  //   e.preventDefault();
  //   setIsEditingName(false);
  //   socket.emit(
  //     "updateName",
  //     { name: editName },
  //     (response: {
  //       success: boolean;
  //       reason?: string;
  //       updatedName?: string;
  //     }) => {
  //       if (response.success) {
  //         const newName = response.updatedName ?? "ERROR";
  //         const oldName = userName;
  //         setUserName(newName);
  //         console.log(`이름 변경 완료: [${oldName}] -> [${newName}]`);
  //       } else console.log(response.reason);
  //     },
  //   );
  // };

  // return (
  //   <main className="flex w-full min-h-screen flex-col items-center justify-center p-4">
  //     <h1 className="mb-2 text-5xl font-bold text-slate-800">
  //       ⚔️ 실시간 대전 오목
  //     </h1>

  //     {/* 🟢 서버 연결 및 내 돌 색상 정보 */}
  //     <div
  //       className={`w-full max-w-3xl flex flex-row justify-end text-md text-center ${isConnected ? "text-emerald-600" : "text-rose-600"}`}
  //     >
  //       ●
  //       {isEditingName ? (
  //         <form className="flex flex-row gap-2" onSubmit={handlerSaveName}>
  //           <input
  //             value={editName}
  //             onChange={(e) => setEditName(e.target.value)}
  //             name="newName"
  //             type="text"
  //             className="w-"
  //           ></input>
  //           <button type="submit">
  //             <Check />
  //           </button>
  //         </form>
  //       ) : (
  //         <div className="flex flex-row gap-2">
  //           <span>{userName}</span>
  //           <button onClick={handlerEditName}>
  //             <SquarePen />
  //           </button>
  //         </div>
  //       )}
  //     </div>

  //     <div className="w-full max-w-3xl gap-4 flex flex-col md:flex-row">
  //       {status === "none" ? (
  //         <button className="w-full h-20 bg-blue-500" onClick={handlerQuick}>
  //           Quick match
  //         </button>
  //       ) : (
  //         <></>
  //       )}
  //       {status === "quick" ? (
  //         <div className="w-full flex flex-col md:flex-row gap-4">
  //           <span className="w-full md:w-fit md:grow h-20 bg-gray-300 text-center leading-20">
  //             Matching...
  //           </span>
  //           <button
  //             className="w-full md:w-20 h-20 bg-red-300 flex justify-center items-center"
  //             onClick={handlerQuick}
  //           >
  //             <X size={36} />
  //           </button>
  //         </div>
  //       ) : (
  //         <></>
  //       )}
  //       {status === "none" ? (
  //         <button className="w-full h-20 bg-blue-500" onClick={handlerPrivate}>
  //           Private game
  //         </button>
  //       ) : status === "private" ? (
  //         <div className="w-full flex flex-col md:flex-row gap-4">
  //           <button className="w-full md:w-fit md:grow h-20 bg-blue-500 flex flex-row justify-between items-center leading-20">
  //             <span>Link...</span>
  //             <div className="w-20 h-20 flex items-center justify-center">
  //               <Copy size={36} />
  //             </div>
  //           </button>
  //           <button
  //             className="w-full md:w-20 h-20 bg-red-300 flex justify-center items-center"
  //             onClick={handlerPrivate}
  //           >
  //             <X size={36} />
  //           </button>
  //         </div>
  //       ) : (
  //         <></>
  //       )}
  //     </div>
  //   </main>
  // );
}
