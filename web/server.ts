// Import necessary modules
import "module-alias/register";
import express, { Request, Response } from "express";
import next from "next";
import "./cron";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import SocketRoute from "@/app/api/socket/socket-route";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { decrypt } from "./src/_Common/function/Hashing";

const dev = process?.env?.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use(
    cors({
      origin: process.env.NEXT_PUBLIC_SERVER_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Middleware to parse JSON bodies for POST requests
  // server.use(express.json());

  // Create an HTTP server and attach Socket.IO to it
  const httpServer = createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.NEXT_PUBLIC_SERVER_URL || "*"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Basic message handling
    socket.on("message", (message, callback) => {
      console.log("Message received:", message);
      callback({ status: "success", data: "Message received!" });
    });

    // Main message handler with async SocketRoute
    socket.on("clientMessage", async (message, callback) => {
      console.log(`Received message from client ${socket.id}: ${message}`);

      try {

        if(!message){
          callback({
            status: 400,
            msg: "Empty Message",
          });
        }

        const data = JSON.parse(decrypt(message) || '{}');

        if (!data || !data.code) {
          return callback({
            status: 400,
            msg: "No Status API Code",
          });
        }

        const { code, ...body } = data;

        // Attempt to call the async `SocketRoute` function
        const response = await SocketRoute(code as StatusAPICode, body);

        // Send a plain object back, no extra serialization needed
        callback(JSON.stringify(response));
      } catch (error) {
        console.error("Error processing message:", error);
        callback({
          status: 500,
          msg: "Server error occurred",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  // Handle any other requests with Next.js
  server.all("*", (req: Request, res: Response) => {
    return handle(req, res); // Let Next.js handle the remaining requests
  });

  // Start the HTTP server instead of the Express server
  httpServer.listen(3000, (err?: any) => {
    if (err) {
      console.error("Error starting server:", err);
      process.exit(1);
    } else {
      console.log("> Ready on http://localhost:3000");
    }
  });
});
