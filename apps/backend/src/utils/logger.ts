import { users } from "../store/store.js";

export const log = (message: string, data?: unknown) => {
  console.log(message, data ?? "");
  //console.log("---------------------------------------------");
};

export const usersDisplay = () => {
  log("현재 사용자", users);
};
