const { WebSocketServer } = require("ws");

const port = Number(process.env.PORT || 8080);
const rooms = new Map();
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function roomCode() {
  let code = "";
  do {
    code = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function send(socket, payload) {
  if (socket && socket.readyState === 1) socket.send(JSON.stringify(payload));
}

function other(room, socket) {
  return room && (room.host === socket ? room.guest : room.host);
}

function removeFromRoom(socket) {
  const room = socket.room;
  if (!room) return;
  const peer = other(room, socket);
  if (peer) {
    peer.room = null;
    send(peer, { type: "peer_left" });
  }
  rooms.delete(room.code);
  socket.room = null;
}

function fail(socket, message) {
  send(socket, { type: "error", message });
}

const server = new WebSocketServer({ port });
server.on("connection", (socket) => {
  socket.room = null;
  socket.on("message", (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch (_) { return fail(socket, "Invalid message."); }
    const type = String(message.type || "");
    if (type === "create") {
      removeFromRoom(socket);
      const code = roomCode();
      const room = { code, host: socket, guest: null };
      rooms.set(code, room);
      socket.room = room;
      send(socket, { type: "room_ready", room: code, role: "host" });
      return;
    }
    if (type === "join") {
      removeFromRoom(socket);
      const code = String(message.room || "").trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return fail(socket, "Room not found.");
      if (room.guest) return fail(socket, "Room is already full.");
      room.guest = socket;
      socket.room = room;
      send(room.host, { type: "room_ready", room: code, role: "host" });
      send(socket, { type: "room_ready", room: code, role: "guest" });
      send(room.host, { type: "peer_joined" });
      return;
    }
    const room = socket.room;
    if (!room) return fail(socket, "Join a room first.");
    if (type === "leave") return removeFromRoom(socket);
    if (["state", "hit", "shot"].includes(type)) send(other(room, socket), { ...message, type });
  });
  socket.on("close", () => removeFromRoom(socket));
  socket.on("error", () => removeFromRoom(socket));
});

console.log(`Sniper Duel relay listening on ws://0.0.0.0:${port}`);
