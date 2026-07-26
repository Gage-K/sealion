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
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("[Server] Connection closed");
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
