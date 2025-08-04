import { createServer } from "http";
import { WebSocketServer } from "ws";

const server = createServer();
const wss = new WebSocketServer({ server });

// TODO: add ready state validation
wss.on("connection", (ws) => {
  console.log("[Server] Client connected");
  ws.on("message", (message) => {
    console.log("[Server] Received:", message.toString());
    wss.clients.forEach((client) => {
      client.send(message.toString());
    });
  });

  ws.on("close", () => {
    console.log("[Server] Connection closed");
  });
});

server.listen(8080, () => {
  console.log("[Server] Listening on ws://localhost:8080");
});
