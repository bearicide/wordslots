
"use strict";

const SYMBOLS = [
  { id: "wildBear", label: "WILD", file: "assets/symbols/wild-bear.png", wild: true },
  { id: "jackpot", label: "FX", file: "assets/symbols/bonus-crt.png" },
  { id: "free", label: "MATTBEAR", file: "assets/symbols/free-spins-token.png" },
  { id: "headphones", label: "HEADPHONES", file: "assets/symbols/headphones.png" },
  { id: "cassette", label: "CLICK/REWIND", file: "assets/symbols/cassette.png", cassette: true },
  { id: "vinyl", label: "MUSIC", file: "assets/symbols/vinyl.png" },
  { id: "tileW", label: "W", file: "assets/symbols/tile-w.png" },
  { id: "tileO", label: "O", file: "assets/symbols/tile-o.png" },
  { id: "tileR", label: "R", file: "assets/symbols/tile-r.png" },
  { id: "tileD", label: "D", file: "assets/symbols/tile-d.png" },
  { id: "tileP", label: "P", file: "assets/symbols/tile-p.png" },
  { id: "tileL", label: "L", file: "assets/symbols/tile-l.png" },
  { id: "tileA", label: "A", file: "assets/symbols/tile-a.png" },
  { id: "tileY", label: "Y", file: "assets/symbols/tile-y.png" }
];

const REWIND_BASE_RTP = 0.989;
const FULL_REVERSE_RTP = 1.01;
const REWIND_START_SPINS = 3;
const REWIND_RETRIGGER_SPINS = 2;

const state = {
  coins: 250,
  bet: 10,
  freeSpins: 0,
  lastWin: 0,
  totalWin: 0,
  luck: 0,
  spinning: false,
  auto: false,
  autoTimer: null,
  sound: false,
  audio: null,
  bonusLocked: false,
  bonusPicks: 0,
  rewindSpins: 0,
  rewindActive: false,
  fullReverse: false,
  fastStopRequested: false
};

const SFX = {
  tap: "audio/sfx/button-tap.mp3",
  spin: "audio/sfx/spin-start.mp3",
  reelStop: "audio/sfx/reel-stop.mp3",
  smallWin: "audio/sfx/small-win.mp3",
  bigWin: "audio/sfx/big-win.mp3",
  bonus: "audio/sfx/bonus-open.mp3",
  free: "audio/sfx/free-spin.mp3",
  lose: "audio/sfx/lose.mp3",
  coin: "audio/sfx/coin-count.mp3",
  jackpot: "audio/sfx/jackpot.mp3"
};

const TRACKS = [
  {
    id: "binary-skies",
    title: "Binary Skies",
    artist: "MATTBEAR",
    art: "assets/album-art/binary-skies.png",
    audio: "audio/tracks/binary-skies.mp3",
    soundcloud: ""
  },
  {
    id: "bile",
    title: "Bile in a Glass",
    artist: "MATTBEAR",
    art: "assets/album-art/bile.png",
    audio: "audio/tracks/bile-in-a-glass.mp3",
    soundcloud: ""
  },
  {
    id: "all-fall-down",
    title: "We All Fall Down v2.0",
    artist: "MATTBEAR",
    art: "assets/album-art/all-fall-down.png",
    audio: "audio/tracks/we-all-fall-down-v2.mp3",
    soundcloud: ""
  },
  {
    id: "chip-dnb",
    title: "Chip DNB Ambient",
    artist: "MATTBEAR",
    art: "assets/album-art/chip-dnb.png",
    audio: "audio/tracks/chip-dnb-ambient.mp3",
    soundcloud: ""
  }
];


const $ = (id) => document.getElementById(id);
const strips = [$("strip0"), $("strip1"), $("strip2")];
const reels = [$("reel0"), $("reel1"), $("reel2")];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function renderSymbol(symbol) {
  const wrap = document.createElement("div");
  wrap.className = "symbol";

  const img = document.createElement("img");
  img.src = symbol.file;
  img.alt = symbol.label;
  img.loading = "eager";
  img.onerror = () => {
    wrap.classList.add("symbol-missing");
  };

  wrap.appendChild(img);
  return wrap;
}

function preloadImages() {
  SYMBOLS.forEach((symbol) => {
    const img = new Image();
    img.src = symbol.file;
  });
}

function setupReels() {
  strips.forEach((strip) => {
    strip.innerHTML = "";
    ["wildBear", "jackpot", "free", "headphones", "cassette"].forEach((id) => {
      const symbol = SYMBOLS.find((item) => item.id === id);
      strip.appendChild(renderSymbol(symbol));
    });
  });
}

function update() {
  $("coins").textContent = state.coins;
  $("bet").textContent = state.bet;
  $("freeSpins").textContent = state.freeSpins;
  $("lastWin").textContent = state.lastWin;
  $("totalWin").textContent = state.totalWin;
  $("hypeFill").style.width = `${state.luck}%`;
  const rewindLabel = state.rewindSpins > 0 ? ` • Rewind: ${state.rewindSpins} spin${state.rewindSpins === 1 ? "" : "s"} • ${state.fullReverse ? "Full Reverse 101% RTP" : "Base 98.9% RTP"}` : "";
  $("hypeText").textContent = `Luck: ${state.luck}%${rewindLabel}`;
  document.body.classList.toggle("rewind-mode", state.rewindSpins > 0 || state.rewindActive);
  document.body.classList.toggle("full-reverse-mode", state.fullReverse);

  const lockGameplay = state.spinning || state.bonusLocked || state.auto;

  $("autoBtn").disabled = state.auto || state.spinning || state.bonusLocked;
  $("stopBtn").disabled = !state.auto;
  $("freeBtn").disabled = state.freeSpins <= 0 || lockGameplay;
  $("spinBtn").disabled = lockGameplay;
  $("betDownBtn").disabled = lockGameplay;
  $("betUpBtn").disabled = lockGameplay;
  $("maxBtn").disabled = lockGameplay;
  $("refillBtn").disabled = state.spinning || state.auto;
  $("openBonusBtn").disabled = state.spinning || state.auto || state.bonusLocked;
  $("resetBonusBtn").disabled = state.spinning || state.auto;
}

function status(msg) {
  $("status").textContent = msg;
}

function unlockAudio() {
  if (state.audio) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  state.audio = new Ctx();
}

function tone(freq = 220, dur = 0.08, type = "sine", gain = 0.04) {
  if (!state.sound) return;
  unlockAudio();
  if (!state.audio) return;
  const ctx = state.audio;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.stop(ctx.currentTime + dur + 0.02);
}

function playSfx(name, volume = 0.72) {
  if (!state.sound || !SFX[name]) return;
  try {
    const a = new Audio(SFX[name]);
    a.volume = volume;
    a.play().catch(() => {});
  } catch (err) {
    // Synth fallback already handles sound when external files fail.
  }
}

function initMiniPlayer() {
  const select = $("trackSelect");
  const audio = $("miniAudio");
  const art = $("playerArt");
  const title = $("nowTitle");
  const artist = $("nowArtist");

  if (!select || !audio || !art || !title || !artist) return;

  select.innerHTML = "";
  TRACKS.forEach((track, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${track.title} — ${track.artist}`;
    select.appendChild(option);
  });

  function loadTrack(index, autoPlay = false) {
    const track = TRACKS[index] || TRACKS[0];
    art.src = track.art;
    art.alt = `${track.title} album art`;
    title.textContent = track.title;
    artist.textContent = track.artist;
    audio.src = track.audio;
    audio.load();
    if (autoPlay) {
      audio.play().catch(() => {});
    }
  }

  select.addEventListener("change", () => loadTrack(Number.parseInt(select.value, 10), false));
  loadTrack(0, false);
}


function fanfare() {
  [260, 330, 392, 523].forEach((f, i) => setTimeout(() => tone(f, 0.12, "square", 0.035), i * 80));
}

function burst(n = 22, x = window.innerWidth / 2, y = 240) {
  for (let i = 0; i < n; i += 1) {
    const s = document.createElement("i");
    s.className = "spark";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--dx", `${rand(-180, 180)}px`);
    s.style.setProperty("--dy", `${rand(-160, 180)}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
}

function flash() {
  document.body.classList.add("flash");
  setTimeout(() => document.body.classList.remove("flash"), 460);
}

function countSymbols(result, id) {
  return result.filter((symbol) => symbol.id === id).length;
}

function getRewindRtpLabel() {
  return state.fullReverse ? "Full Reverse Mode • 101% RTP" : "Click/Rewind Feature • 98.9% RTP";
}

function activateRewindFeature(cassetteCount, wasRewindSpin) {
  if (cassetteCount <= 0) return "";

  if (wasRewindSpin || state.rewindActive || state.rewindSpins > 0) {
    state.rewindSpins += REWIND_RETRIGGER_SPINS * cassetteCount;
    const upgradedNow = !state.fullReverse;
    state.fullReverse = true;
    state.rewindActive = true;
    playSfx("bonus", 0.78);
    return upgradedNow
      ? ` Click/Rewind retriggered: +${REWIND_RETRIGGER_SPINS * cassetteCount} reverse spins and FULL REVERSE MODE unlocked at 101% RTP.`
      : ` Click/Rewind retriggered: +${REWIND_RETRIGGER_SPINS * cassetteCount} reverse spins. Full Reverse stays active at 101% RTP.`;
  }

  state.rewindSpins += REWIND_START_SPINS;
  state.rewindActive = true;
  state.fullReverse = false;
  playSfx("bonus", 0.78);
  return ` Click/Rewind Cassette triggered: ${REWIND_START_SPINS} backward spins at 98.9% RTP.`;
}

function dominantSymbol(result) {
  const nonWild = result.filter((s) => !s.wild);
  const pool = nonWild.length ? nonWild : result;
  let winner = pool[0];
  let best = 0;

  pool.forEach((candidate) => {
    const count = result.filter((s) => s.id === candidate.id || s.wild).length;
    if (count > best) {
      best = count;
      winner = candidate;
    }
  });

  return { symbol: winner, count: best };
}

function evaluate(result, bet) {
  const { symbol, count } = dominantSymbol(result);
  let win = 0;
  let free = 0;
  let bonus = false;
  let message = "No hit. The reels have chosen violence.";

  if (count === 3) {
    if (symbol.id === "wildBear") {
      win = bet * 50;
      free = 3;
      message = "Triple WILD BEAR. Absolute maul payout plus three free spins.";
    } else if (symbol.id === "jackpot") {
      win = bet * 40;
      bonus = true;
      message = "Triple FX. Bonus board unlocked.";
    } else if (symbol.id === "free") {
      win = bet * 20;
      free = 5;
      message = "Triple MATTBEAR. Five free spins added.";
    } else if (symbol.id === "headphones") {
      win = bet * 18;
      message = "Triple HEADPHONES. Clean audio hit.";
    } else {
      win = bet * 12;
      message = `Triple ${symbol.label}. Clean hit.`;
    }
  } else if (count === 2) {
    win = bet * 2;
    if (result.some((s) => s.wild)) {
      free = 1;
      message = "Pair with wild bear. Small win and one free spin.";
    } else {
      message = "Pair hit. Small win.";
    }
  }

  return { win, free, bonus, message };
}

function buildStrip(strip, centerSymbol, reverse = false) {
  strip.innerHTML = "";
  const pool = [choice(SYMBOLS), choice(SYMBOLS), centerSymbol, choice(SYMBOLS), choice(SYMBOLS)];
  if (reverse) pool.reverse();
  pool.forEach((symbol) => strip.appendChild(renderSymbol(symbol)));
}

function requestFastStop() {
  if (!state.spinning) return false;
  state.fastStopRequested = true;
  status("Fast stop armed. Result is already locked, just revealing faster.");
  return true;
}

function waitForRevealDelay(ms) {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      if (state.fastStopRequested || performance.now() - started >= ms) {
        resolve();
        return;
      }
      setTimeout(tick, 24);
    };
    tick();
  });
}

async function spin(useFree = false) {
  if (state.spinning || state.bonusLocked) return false;
  unlockAudio();

  const rewindSpin = !useFree && state.rewindSpins > 0;
  const rewindRtp = state.fullReverse ? FULL_REVERSE_RTP : REWIND_BASE_RTP;

  playSfx(useFree ? "free" : "spin", 0.72);

  if (rewindSpin) {
    state.rewindSpins = Math.max(0, state.rewindSpins - 1);
    state.rewindActive = true;
  } else if (useFree) {
    if (state.freeSpins <= 0) {
      status("No free spins available.");
      playSfx("lose", 0.7);
      tone(120, 0.12, "sawtooth", 0.035);
      return false;
    }
    state.freeSpins -= 1;
  } else {
    if (state.coins < state.bet) {
      status("Out of coins for this bet. Refill or lower the bet.");
      stopAuto();
      playSfx("lose", 0.7);
      tone(110, 0.14, "sawtooth", 0.035);
      return false;
    }
    state.coins -= state.bet;
  }

  state.spinning = true;
  state.fastStopRequested = false;
  state.lastWin = 0;
  update();
  reels.forEach((r) => {
    r.classList.remove("spinning", "rewinding", "win");
    r.classList.add(rewindSpin ? "rewinding" : "spinning");
    if (state.fullReverse) r.classList.add("full-reverse-reel");
  });
  status(rewindSpin ? `${getRewindRtpLabel()} — reels spinning backward...` : (useFree ? "Free spin running..." : "Spinning..."));
  tone(190, 0.08, "square", 0.025);

  const result = [];
  for (let i = 0; i < 3; i += 1) {
    const featureBoost = rewindSpin ? (state.fullReverse ? 0.16 : 0.08) : 0;
    const weight = Math.random() + state.luck / 230 + featureBoost;
    result.push(weight > 1.56 ? SYMBOLS.find((s) => s.id === "wildBear") : choice(SYMBOLS));
  }

  strips.forEach((strip, i) => buildStrip(strip, result[i], rewindSpin));

  for (let i = 0; i < 3; i += 1) {
    const delay = state.fastStopRequested ? 55 : 320 + i * 210;
    await waitForRevealDelay(delay);
    reels[i].classList.remove("spinning", "rewinding", "full-reverse-reel");
    playSfx("reelStop", 0.55);
    tone(250 + i * 90, 0.06, "triangle", 0.03);
  }

  const outcome = evaluate(result, state.bet);
  if (rewindSpin && outcome.win > 0) {
    outcome.win = Math.max(1, Math.round(outcome.win * rewindRtp));
    outcome.message += ` ${getRewindRtpLabel()} payout coefficient applied.`;
  }

  const cassetteCount = countSymbols(result, "cassette");
  const rewindMessage = activateRewindFeature(cassetteCount, rewindSpin);
  if (rewindMessage) {
    outcome.message += rewindMessage;
  } else if (rewindSpin && state.rewindSpins <= 0) {
    state.rewindActive = false;
    state.fullReverse = false;
    outcome.message += " Click/Rewind complete. Forward time has resumed, annoyingly.";
  }

  state.lastWin = outcome.win;
  state.totalWin += outcome.win;
  state.coins += outcome.win;
  state.freeSpins += outcome.free;

  if (outcome.win > 0) {
    state.luck = clamp(state.luck + 11, 0, 100);
    reels.forEach((r) => r.classList.add("win"));
    burst(outcome.win >= state.bet * 20 ? 42 : 22);
    if (outcome.win >= state.bet * 20) {
      flash();
      playSfx(outcome.win >= state.bet * 40 ? "jackpot" : "bigWin", 0.82);
      fanfare();
    } else {
      playSfx("smallWin", 0.7);
      tone(520, 0.1, "square", 0.035);
    }
  } else {
    state.luck = clamp(state.luck + 4, 0, 100);
    playSfx("lose", 0.42);
    tone(145, 0.11, "sawtooth", 0.025);
  }

  if (outcome.bonus) {
    state.bonusLocked = true;
    openBonus();
  }

  $("jackpotText").textContent = outcome.message;
  status(outcome.message);
  state.fastStopRequested = false;
  state.spinning = false;
  update();
  return true;
}

function startAuto() {
  if (state.auto || state.spinning || state.bonusLocked) return;
  state.auto = true;
  status("Auto spin running. The lever gremlin has been hired.");
  update();

  const loop = async () => {
    if (!state.auto) return;
    if (state.spinning) {
      state.autoTimer = setTimeout(loop, 350);
      return;
    }
    if (state.bonusLocked) {
      stopAuto();
      status("Auto stopped for bonus board. Pick tiles first.");
      return;
    }

    const ok = await spin(state.rewindSpins > 0 ? false : state.freeSpins > 0);
    if (!ok) {
      stopAuto();
      return;
    }

    if (state.auto) {
      state.autoTimer = setTimeout(loop, 760);
    }
  };

  loop();
}

function stopAuto() {
  state.auto = false;
  if (state.autoTimer) {
    clearTimeout(state.autoTimer);
    state.autoTimer = null;
  }
  update();
}

function buildBonus() {
  const vals = [25, 50, 75, 100, "+2", "+3", "TAPE", "FULL", "LOSE"];
  const grid = $("bonusGrid");
  grid.innerHTML = "";
  state.bonusPicks = 0;

  vals.sort(() => Math.random() - 0.5).forEach((v) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bonus-tile";
    b.textContent = "?";
    b.dataset.value = String(v);
    b.addEventListener("click", () => pickBonus(b));
    grid.appendChild(b);
  });

  $("bonusStatus").textContent = "Pick three tiles.";
}

function openBonus() {
  stopAuto();
  playSfx("bonus", 0.75);
  state.bonusLocked = true;
  buildBonus();
  $("bonusStatus").textContent = "Bonus active. Pick three tiles.";
  status("Bonus board active. Auto spin paused.");
  update();
}

function closeBonus() {
  state.bonusLocked = false;
  $("bonusStatus").textContent = "Bonus board complete.";
  update();
}

function pickBonus(btn) {
  if (!state.bonusLocked || btn.classList.contains("revealed") || state.bonusPicks >= 3) return;

  btn.classList.add("revealed");
  state.bonusPicks += 1;
  const v = btn.dataset.value;

  if (v === "LOSE") {
    btn.textContent = "💀";
    $("bonusStatus").textContent = "Dead tile. Charming.";
    tone(95, 0.12, "sawtooth", 0.035);
  } else if (v === "JACK") {
    btn.textContent = "💎";
    state.coins += 150;
    state.totalWin += 150;
    $("bonusStatus").textContent = "Jack tile: +150 coins.";
    burst(36);
    fanfare();
  } else if (v === "TAPE") {
    btn.textContent = "⏪";
    state.rewindSpins += REWIND_START_SPINS;
    state.rewindActive = true;
    state.fullReverse = false;
    $("bonusStatus").textContent = `Cassette tile: Click/Rewind +${REWIND_START_SPINS} backward spins at 98.9% RTP.`;
    playSfx("bonus", 0.75);
    status(`Bonus cassette triggered Click/Rewind: ${REWIND_START_SPINS} backward spins queued.`);
  } else if (v === "FULL") {
    btn.textContent = "⏪";
    state.rewindSpins += REWIND_RETRIGGER_SPINS;
    state.rewindActive = true;
    state.fullReverse = true;
    $("bonusStatus").textContent = `Full Reverse tile: +${REWIND_RETRIGGER_SPINS} reverse spins at 101% RTP.`;
    playSfx("jackpot", 0.75);
    status(`FULL REVERSE MODE unlocked from bonus board: ${REWIND_RETRIGGER_SPINS} reverse spins queued.`);
  } else if (v.startsWith("+")) {
    btn.textContent = "🆓";
    const free = Number.parseInt(v.slice(1), 10);
    state.freeSpins += free;
    $("bonusStatus").textContent = `Free spin tile: +${free}.`;
    tone(620, 0.1, "square", 0.035);
  } else {
    btn.textContent = "🪙";
    const coins = Number.parseInt(v, 10);
    state.coins += coins;
    state.totalWin += coins;
    $("bonusStatus").textContent = `Coin tile: +${coins} coins.`;
    tone(520, 0.1, "square", 0.035);
  }

  update();
  if (state.bonusPicks >= 3) {
    closeBonus();
  }
}

function bind() {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => playSfx("tap", 0.42));
  });
  $("spinBtn").addEventListener("click", () => spin(false));
  $("autoBtn").addEventListener("click", startAuto);
  $("stopBtn").addEventListener("click", () => {
    stopAuto();
    status("Auto spin stopped.");
  });
  $("maxBtn").addEventListener("click", () => {
    state.bet = 25;
    update();
    status("Max bet set to 25.");
  });
  $("freeBtn").addEventListener("click", () => spin(true));
  $("betDownBtn").addEventListener("click", () => {
    state.bet = clamp(state.bet - 1, 1, 25);
    update();
  });
  $("betUpBtn").addEventListener("click", () => {
    state.bet = clamp(state.bet + 1, 1, 25);
    update();
  });
  $("refillBtn").addEventListener("click", () => {
    state.coins = 250;
    state.lastWin = 0;
    update();
    status("Coins refilled.");
  });
  $("soundBtn").addEventListener("click", () => {
    state.sound = !state.sound;
    unlockAudio();
    $("soundBtn").textContent = state.sound ? "🔊 Sound On" : "🔇 Sound Off";
    $("soundBtn").setAttribute("aria-pressed", String(state.sound));
    if (state.sound) fanfare();
  });
  $("partyBtn").addEventListener("click", () => {
    document.body.classList.toggle("party");
    const on = document.body.classList.contains("party");
    $("partyBtn").setAttribute("aria-pressed", String(on));
    status(on ? "Party mode on." : "Party mode off.");
  });
  $("openBonusBtn").addEventListener("click", openBonus);
  $("resetBonusBtn").addEventListener("click", () => {
    state.bonusLocked = false;
    buildBonus();
    update();
    status("Bonus board reset.");
  });

  document.addEventListener("keydown", (e) => {
    if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    const key = e.key.toLowerCase();
    if (e.code === "Space") {
      e.preventDefault();
      if (!requestFastStop()) spin(false);
    }
    if (key === "a") startAuto();
    if (key === "s") {
      stopAuto();
      status("Auto spin stopped.");
    }
    if (e.key === "+") {
      state.bet = clamp(state.bet + 1, 1, 25);
      update();
    }
    if (e.key === "-") {
      state.bet = clamp(state.bet - 1, 1, 25);
      update();
    }
  });
}

preloadImages();
setupReels();
buildBonus();
bind();
initMiniPlayer();
update();
