import "module-alias/register";
import express, { Request, Response } from "express";
import next from "next";
import "./cron";

const dev = process?.env?.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Middleware to parse JSON bodies for POST requests
  server.use(express.json());

  // Custom API routes can be defined here
  // Example: GET API route
  server.get("/api/testing", (req: Request, res: Response) => {
    console.log("Testing API hit!!!!");
    res.status(200).json({ message: "API is working!" });
  });

  // Example: POST API route
  server.post("/api/data", (req: Request, res: Response) => {
    const data = req.body; // You can access the request body here
    console.log("Data received:", data);

    // Return some JSON response
    res
      .status(200)
      .json({ receivedData: data, message: "Data received successfully!" });
  });

  // Example: Dynamic API route
  server.get("/api/user/:id", (req: Request, res: Response) => {
    const userId = req.params.id;
    console.log("User ID:", userId);
    res.status(200).json({ userId, message: `User with ID ${userId} found!` });
  });

  // Handle any other requests with Next.js
  server.all("*", (req: Request, res: Response) => {
    return handle(req, res); // Let Next.js handle the remaining requests
  });

  // Start the server
  server.listen(3000, (err?: any) => {
    if (err) {
      console.error("Error starting server:", err);
      process.exit(1);
    } else {
      console.log("> Ready on http://localhost:3000");
    }
  });
});
