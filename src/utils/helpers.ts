import { Chat } from "whatsapp-web.js";

// 
export const inGroup = (chat: Chat): boolean => {
  return (chat.isGroup || chat.id.server.includes("g.us"));
};