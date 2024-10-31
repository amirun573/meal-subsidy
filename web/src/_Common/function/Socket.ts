// hooks/useSocket.ts
"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const serverUrl: string = process.env.NEXT_PUBLIC_SERVER_URL as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [SocketConnected, setIsConnected] = useState<boolean>(false); // Connection status

  useEffect(() => {
    const newSocket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setIsConnected(true); // Update connection status
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setIsConnected(false); // Update connection status
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.on("message", (newMessage: string) => {
      console.log("New message received:", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    const handleOnline = () => {
      console.log("Back online. Attempting to reconnect...");
      newSocket.connect();
    };

    const handleOffline = () => {
      console.log("You are offline. Please check your connection.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      newSocket.disconnect();
    };
  }, [serverUrl]);

  const sendMessage = (message: string) => {
    if (message.trim() && socket) {
      socket.emit("clientMessage", message, (response: any) => {
        console.log("Server response:", response); // This logs the server's reply
      });
    }
  };

  return { socket, messages, sendMessage, SocketConnected }; // Return isConnected status
};
