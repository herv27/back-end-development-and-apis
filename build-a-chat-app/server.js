
import http from "node:http";
import fs from "node:fs";
import { WebSocketServer } from "ws";

const PORT = 3001;

// Create HTTP server
const server = http.createServer((req, res) => {
  let filePath = "./public/index.html";
  let contentType = "text/html";

  if (req.url === "/script.js") {
    filePath = "./public/script.js";
    contentType = "application/javascript";
  } else if (req.url === "/style.css") {
    filePath = "./public/style.css";
    contentType = "text/css";
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, {
        "Content-Type": "text/plain"
      });
      return res.end("Internal Server Error");
    }

    res.writeHead(200, {
      "Content-Type": contentType
    });

    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// Handle WebSocket connections
wss.on("connection", (socket, req) => {
  const username = new URL(
    req.url,
    "http://localhost"
  ).searchParams.get("username");

  // Notify everyone when a user joins
  broadcast({
    type: "system",
    text: `${username} joined`
  });

  // Handle chat messages
  socket.on("message", (message) => {
    try {
      const { username, text } = JSON.parse(
        message.toString()
      );

      broadcast({
        type: "chat",
        username,
        text
      });
    } catch (error) {
      console.error("Invalid message:", error);
    }
  });

  // Notify everyone when a user leaves
  socket.on("close", () => {
    broadcast({
      type: "system",
      text: `${username} left`
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(
    "Chat server running at http://localhost:3001"
  );
});
