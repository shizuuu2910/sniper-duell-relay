# Sniper Duel relay server

This small prototype relay creates two-player rooms and forwards movement,
shot, and hit messages. It does not validate hits or store accounts/game data.

```sh
npm install
npm start
```

Run `npm test` to check that two clients can create and join a room.

## Host on Render

1. Put **only this folder's contents** (`server.js`, `package.json`,
   `package-lock.json`, `relay_smoke_test.js`, `.gitignore`) in a GitHub repo.
   Do not upload `node_modules`. Alternatively, put the full Godot project in
   a repo and set Render's Root Directory to `sniper-duell/server` (or `server`
   if the repository root is already `sniper-duell`).
2. In Render, create a **Web Service** from that repo. Choose **Node**,
   Build Command `npm ci`, Start Command `npm start`, and **one instance**.
   The server reads the `PORT` environment variable Render supplies.
3. Wait for the deploy log to show `Sniper Duel relay listening on ...`.
   Render's HTTPS hostname also accepts WebSockets. In the game, use
   `wss://<your-service>.onrender.com` (no `:8080`).
4. Test with two browsers/computers: one creates a room, the other joins its
   code using the same `wss://` URL.

For local play use `ws://127.0.0.1:8080`. For a published Godot Web build,
change `online/server_url` in `project.godot` to the public `wss://` URL and
re-export the game. Rooms live in memory, so a server restart ends active
matches; running multiple instances would split rooms across instances.
