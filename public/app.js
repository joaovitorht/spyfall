const socket = io();

const screens = {
  home: document.getElementById("screen-home"),
  lobby: document.getElementById("screen-lobby"),
  game: document.getElementById("screen-game"),
  reveal: document.getElementById("screen-reveal")
};

let myId = null;
let currentRoom = null;

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function codeFromUrl() {
  const match = window.location.pathname.match(/\/room\/([A-Za-z0-9]{5})/);
  return match ? match[1].toUpperCase() : "";
}

const prefillCode = codeFromUrl();
if (prefillCode) {
  document.getElementById("join-code").value = prefillCode;
}

socket.on("connect", () => {
  myId = socket.id;
});

// ---------- TELA INICIAL ----------

document.getElementById("btn-create").addEventListener("click", () => {
  const name = document.getElementById("create-name").value.trim();
  const maxPlayers = document.getElementById("create-max").value;
  const errorEl = document.getElementById("home-error");
  errorEl.textContent = "";

  if (!name) {
    errorEl.textContent = "Digite seu nome.";
    return;
  }

  socket.emit("createRoom", { name, maxPlayers }, (res) => {
    if (res.error) {
      errorEl.textContent = res.error;
      return;
    }
    window.history.pushState({}, "", `/room/${res.code}`);
  });
});

document.getElementById("btn-join").addEventListener("click", () => {
  const name = document.getElementById("join-name").value.trim();
  const code = document.getElementById("join-code").value.trim().toUpperCase();
  const errorEl = document.getElementById("home-error");
  errorEl.textContent = "";

  if (!name) {
    errorEl.textContent = "Digite seu nome.";
    return;
  }
  if (!code) {
    errorEl.textContent = "Digite o código da sala.";
    return;
  }

  socket.emit("joinRoom", { code, name }, (res) => {
    if (res.error) {
      errorEl.textContent = res.error;
      return;
    }
    window.history.pushState({}, "", `/room/${res.code}`);
  });
});

// ---------- LOBBY ----------

document.getElementById("btn-copy").addEventListener("click", () => {
  const input = document.getElementById("share-link");
  input.select();
  navigator.clipboard.writeText(input.value).catch(() => {});
});

document.getElementById("btn-start").addEventListener("click", () => {
  socket.emit("startGame");
});

document.getElementById("btn-home-lobby").addEventListener("click", leaveRoom);
document.getElementById("btn-home-game").addEventListener("click", leaveRoom);
document.getElementById("btn-home-reveal").addEventListener("click", leaveRoom);

function leaveRoom() {
  window.history.pushState({}, "", "/");
  leaveRoomSilently();
}

function leaveRoomSilently() {
  socket.emit("leaveRoom");
  currentRoom = null;
  showScreen("home");
}

window.addEventListener("popstate", () => {
  if (!codeFromUrl() && currentRoom) {
    leaveRoomSilently();
  }
});

// ---------- JOGO ----------

document.getElementById("btn-reveal").addEventListener("click", () => {
  socket.emit("revealRound");
});

document.getElementById("btn-new-round").addEventListener("click", () => {
  socket.emit("resetRound");
});

// ---------- EVENTOS DO SERVIDOR ----------

socket.on("roomUpdate", (room) => {
  currentRoom = room;
  const isHost = room.hostId === myId;

  if (room.status === "lobby") {
    renderLobby(room, isHost);
    showScreen("lobby");
  } else if (room.status === "playing") {
    renderGameControls(isHost);
    showScreen("game");
  } else if (room.status === "revealed") {
    renderReveal(room, isHost);
    showScreen("reveal");
  }
});

socket.on("yourRole", (data) => {
  const valueEl = document.getElementById("role-value");
  const locationEl = document.getElementById("role-location");

  if (data.isSpy) {
    valueEl.textContent = "🕵️ Espião";
    locationEl.textContent = "Você não sabe o local. Descubra ouvindo os outros!";
  } else {
    valueEl.textContent = data.role;
    locationEl.textContent = `Local: ${data.location}`;
  }
});

function renderLobby(room, isHost) {
  document.getElementById("lobby-code").textContent = room.code;
  document.getElementById("lobby-count").textContent = room.players.length;
  document.getElementById("lobby-max").textContent = room.maxPlayers;
  document.getElementById("share-link").value = `${window.location.origin}/room/${room.code}`;

  const list = document.getElementById("lobby-players");
  list.innerHTML = "";
  room.players.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name;
    if (p.id === room.hostId) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "Host";
      li.appendChild(badge);
    }
    list.appendChild(li);
  });

  const startBtn = document.getElementById("btn-start");
  const hint = document.getElementById("lobby-hint");
  const errorEl = document.getElementById("lobby-error");
  errorEl.textContent = "";

  if (isHost) {
    startBtn.classList.remove("hidden");
    startBtn.disabled = room.players.length < room.minPlayers;
    hint.textContent =
      room.players.length < room.minPlayers
        ? `São necessários pelo menos ${room.minPlayers} jogadores para sortear.`
        : "Tudo pronto! Quando todos entrarem, clique em sortear.";
  } else {
    startBtn.classList.add("hidden");
    hint.textContent = "Aguardando o host iniciar o sorteio...";
  }
}

function renderGameControls(isHost) {
  document.getElementById("host-controls").classList.toggle("hidden", !isHost);
}

function renderReveal(room, isHost) {
  document.getElementById("reveal-location").textContent = room.location;
  const spy = room.reveal.find((p) => p.id === room.spyId);
  document.getElementById("reveal-spy").textContent = spy ? spy.name : "?";

  const list = document.getElementById("reveal-list");
  list.innerHTML = "";
  room.reveal.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.name}: ${p.role}`;
    list.appendChild(li);
  });

  document.getElementById("host-controls-reveal").classList.toggle("hidden", !isHost);
}
