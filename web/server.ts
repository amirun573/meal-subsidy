import "module-alias/register";
import express, { Request, Response } from "express";
import next from "next";
import "./cron";
import { Server } from "socket.io";
import { createServer } from "http";

const dev = process?.env?.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Middleware to parse JSON bodies for POST requests
  server.use(express.json());

  // Create an HTTP server and attach Socket.IO to it
  const httpServer = createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,   // Set ping interval (default 25000 ms)
    pingTimeout: 5000      // Set ping timeout (default 5000 ms)
  });
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("message", (message) => {
      console.log("message===>", message);
      io.emit("message", message);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  // Custom API routes can be defined here
  server.get("/api/testing", (req: Request, res: Response) => {
    console.log("Testing API hit!!!!");
    res.status(200).json({ message: "API is working!" });
  });

  server.post("/api/data", (req: Request, res: Response) => {
    const data = req.body;
    console.log("Data received:", data);
    res
      .status(200)
      .json({ receivedData: data, message: "Data received successfully!" });
  });

  server.get("/api/user/:id", (req: Request, res: Response) => {
    const userId = req.params.id;
    console.log("User ID:", userId);
    res.status(200).json({ userId, message: `User with ID ${userId} found!` });
  });

  // Handle any other requests with Next.js
  server.all("*", (req: Request, res: Response) => {
    return handle(req, res); // Let Next.js handle the remaining requests
  });

  // Start the HTTP server instead of the Express server
  httpServer.listen(3000, "0.0.0.0", (err?: any) => {
    if (err) {
      console.error("Error starting server:", err);
      process.exit(1);
    } else {
      console.log("> Ready on http://localhost:3000");
    }
  });
});
