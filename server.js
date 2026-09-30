const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const LOCATIONS = require("./locations");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para evitar confusão
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10; // limitado pelo nº de papéis distintos por local

app.use(express.static(path.join(__dirname, "public")));

// Permite que /room/ABC123 sirva o mesmo app (o client lê o código da URL)
app.get("/room/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/** @type {Map<string, Room>} */
const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function publicRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    minPlayers: MIN_PLAYERS,
    players: Array.from(room.players.values()).map((p) => ({ id: p.id, name: p.name })),
    location: room.status === "revealed" ? room.location : null,
    spyId: room.status === "revealed" ? room.spyId : null,
    reveal:
      room.status === "revealed"
        ? Array.from(room.players.values()).map((p) => ({
            id: p.id,
            name: p.name,
            role: room.assignments.get(p.id) || null
          }))
        : null
  };
}

function broadcastRoom(room) {
  io.to(room.code).emit("roomUpdate", publicRoomState(room));
}

function removePlayerFromRoom(room, socketId) {
  if (!room.players.has(socketId)) return;
  room.players.delete(socketId);
  room.assignments.delete(socketId);

  if (room.players.size === 0) {
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === socketId) {
    room.hostId = room.players.keys().next().value;
  }

  // Se alguém saiu no meio de uma rodada em jogo, volta pro lobby pra evitar estado inconsistente.
  if (room.status === "playing") {
    room.status = "lobby";
    room.location = null;
    room.spyId = null;
    room.assignments.clear();
  }

  broadcastRoom(room);
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name, maxPlayers }, callback) => {
    const cleanName = String(name || "").trim().slice(0, 24);
    if (!cleanName) return callback({ error: "Informe um nome." });

    const capped = Math.min(Math.max(parseInt(maxPlayers, 10) || 6, MIN_PLAYERS), MAX_PLAYERS);
    const code = generateRoomCode();

    const room = {
      code,
      hostId: socket.id,
      maxPlayers: capped,
      status: "lobby",
      location: null,
      spyId: null,
      players: new Map(),
      assignments: new Map()
    };
    room.players.set(socket.id, { id: socket.id, name: cleanName });
    rooms.set(code, room);

    socket.join(code);
    socket.data.roomCode = code;
    callback({ code });
    broadcastRoom(room);
  });

  socket.on("joinRoom", ({ code, name }, callback) => {
    const cleanCode = String(code || "").trim().toUpperCase();
    const cleanName = String(name || "").trim().slice(0, 24);
    const room = rooms.get(cleanCode);

    if (!room) return callback({ error: "Sala não encontrada." });
    if (!cleanName) return callback({ error: "Informe um nome." });
    if (room.status !== "lobby") return callback({ error: "A rodada já começou nesta sala." });
    if (room.players.size >= room.maxPlayers) return callback({ error: "Sala cheia." });
    if (Array.from(room.players.values()).some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
      return callback({ error: "Já existe alguém com esse nome na sala." });
    }

    room.players.set(socket.id, { id: socket.id, name: cleanName });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    callback({ code: room.code });
    broadcastRoom(room);
  });

  socket.on("startGame", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.size < MIN_PLAYERS) return;

    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const playerIds = Array.from(room.players.keys());
    const spyId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const nonSpyIds = playerIds.filter((id) => id !== spyId);
    const rolesForRound = shuffle(location.roles).slice(0, nonSpyIds.length);

    room.status = "playing";
    room.location = location.name;
    room.spyId = spyId;
    room.assignments = new Map();
    room.assignments.set(spyId, "Espião");
    nonSpyIds.forEach((id, i) => room.assignments.set(id, rolesForRound[i]));

    for (const [playerId] of room.players) {
      const isSpy = playerId === spyId;
      io.to(playerId).emit("yourRole", {
        isSpy,
        role: room.assignments.get(playerId),
        location: isSpy ? null : location.name
      });
    }

    broadcastRoom(room);
  });

  socket.on("revealRound", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== "playing") return;
    room.status = "revealed";
    broadcastRoom(room);
  });

  socket.on("resetRound", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.status = "lobby";
    room.location = null;
    room.spyId = null;
    room.assignments.clear();
    broadcastRoom(room);
  });

  socket.on("leaveRoom", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    socket.leave(room.code);
    removePlayerFromRoom(room, socket.id);
    socket.data.roomCode = null;
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    removePlayerFromRoom(room, socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Spyfall rodando em http://localhost:${PORT}`);
});
