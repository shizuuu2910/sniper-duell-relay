const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const port = 18080;
const server = spawn(process.execPath, ["server.js"], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
});
let host;
let guest;
let finished = false;

function finish(error) {
  if (finished) return;
  finished = true;
  host?.close();
  guest?.close();
  server.kill();
  if (error) {
    console.error(error);
    process.exitCode = 1;
  } else {
    console.log("PASS: room creation, join, and peer notification");
  }
}

setTimeout(() => {
  host = new WebSocket(`ws://127.0.0.1:${port}`);
  host.on("error", finish);
  host.on("open", () => host.send(JSON.stringify({ type: "create" })));
  host.on("message", (raw) => {
    const message = JSON.parse(raw);
    if (message.type === "room_ready" && message.role === "host" && !guest) {
      guest = new WebSocket(`ws://127.0.0.1:${port}`);
      guest.on("error", finish);
      guest.on("open", () => guest.send(JSON.stringify({ type: "join", room: message.room })));
      guest.on("message", (data) => {
        const joined = JSON.parse(data);
        if (joined.type === "room_ready" && joined.role === "guest") {
          console.log(`Guest joined room ${joined.room}`);
        }
      });
    }
    if (message.type === "peer_joined") finish();
  });
}, 300);

setTimeout(() => finish("Timed out waiting for room join"), 4000).unref();
