// Legg til øverst i filen:
let levelBackgroundImg = null;
let loadingNextLevel = false;
let readyToStart = false;
let selectedCharacter = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/cat4.png";
let playerName = "";
let characterChosen = false;
let showHighscores = false;

document.querySelectorAll('.char-opt').forEach(img => {
  img.addEventListener('click', function() {
    if (characterChosen) return;
    characterChosen = true;
    selectedCharacter = this.dataset.img;
    document.querySelectorAll('.char-opt').forEach(i => i.style.border = "2px solid #fff");
    this.style.border = "4px solid gold";
    document.getElementById('character-select').style.display = "none";
    // Hvis navn allerede er satt, hopp rett til spillstart
    if (playerName && playerName.length > 0) {
      document.getElementById('name-input-container').style.display = "none";
      canvas.style.display = "block";
      readyToStart = true;
      gameStarted = false;
      currentLevel = 1;
      loadLevel(currentLevel);
    } else {
      document.getElementById('name-input-container').style.display = "block";
      document.getElementById('player-name').focus();
    }
    //resizeCanvas();
  });
});



// Start spill når bruker trykker på knappen eller Enter
document.getElementById('start-btn').onclick = startGameWithName;
document.getElementById('player-name').addEventListener('keydown', function(e) {
  if (e.key === "Enter") startGameWithName();
});

function startGameWithName() {
  const input = document.getElementById('player-name');
  playerName = input.value.trim().substring(0, 10);
  if (!playerName) {
    alert("Skryf jou fokken naam!");
    input.focus();
    return;
  }
  document.getElementById('name-input-container').style.display = "none";
  readyToStart = true;
  gameStarted = false;
  currentLevel = 1;
  loadLevel(currentLevel); // <-- LAST INN LEVEL 1 FRA FIL
  // Ikke sett gameStarted = true her!
  // Ikke start ballen her!

}
    const PADDLE_BOTTOM_MARGIN = 250; // Avstand fra bunnen av skjermen til padelen
    const PADDLE_TOUCH_OFFSET = 150; // Avstand fra touchpunkt til padelens midtpunkt
    let extraBalls = [];
    let showPoesklap = false;
    let poesklapTimer = 0;
    let pausedBallVelocity = { dx: 0, dy: 0 };
    let levelLoaded = false;

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    
    let lifeLossSound = new Audio('https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/lifeloss.mp3');  // Lyd for livstap

    lifeLossSound.volume = 0.2; // Juster volumet for livstap-lyd
    lifeLossSound.preload = "auto"; // Forhåndsinnlading for raskere avspilling

    const poesklapSound = new Audio("https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/poesklap.mp3");
    poesklapSound.volume = 0.8;
    poesklapSound.preload = "auto";

    
const hitSoundPool = Array.from({length: 20}, () => {
  const a = new Audio("https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/beep1.mp3");
  a.volume = 0.1;
  return a;
});
let hitSoundIndex = 0;

function playHitSound() {
  const sound = hitSoundPool[hitSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
  hitSoundIndex = (hitSoundIndex + 1) % hitSoundPool.length;
}

const lifeLossSoundPool = Array.from({length: 3}, () => {
  const a = new Audio("https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/lifeloss.mp3");
  a.volume = 0.3;
  return a;
});
let lifeLossSoundIndex = 0;

function playLifeLossSound() {
  const sound = lifeLossSoundPool[lifeLossSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
  lifeLossSoundIndex = (lifeLossSoundIndex + 1) % lifeLossSoundPool.length;
}

const poesklapSoundPool = Array.from({length: 3}, () => {
  const a = new Audio("https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/poesklap.mp3");
  a.volume = 0.8;
  return a;
});
let poesklapSoundIndex = 0;

function unlockAudio() {
  try {
    // Spill av og pause alle lyder for å "låse opp" dem
    lifeLossSoundPool.forEach(a =>
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{})
    );
    poesklapSoundPool.forEach(a =>
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{})
    );
    hitSoundPool.forEach(a =>
      a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{})
    );
  } catch(e) {}
  window.removeEventListener('touchstart', unlockAudio);
  window.removeEventListener('mousedown', unlockAudio);
}
window.addEventListener('touchstart', unlockAudio, { once: true });
window.addEventListener('mousedown', unlockAudio, { once: true });

function playPoesklapSound() {
  const sound = poesklapSoundPool[poesklapSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(() => {});
  poesklapSoundIndex = (poesklapSoundIndex + 1) % poesklapSoundPool.length;
}


    const sausageImg = new Image();
    sausageImg.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/sausage.png";

    const canvas = document.getElementById('arkanoid');
    const ctx = canvas.getContext('2d');

function resetGameState() {
  score = 0;
  lives = 3;
  currentLevel = 1;
  extraBalls = [];
  fallingTexts = [];
  showHighscores = false;
  gameOver = false;
  gameStarted = false;
  levelLoaded = false;
  loadingNextLevel = false;
  paddleHeads = 3;
  paddle.width = paddleHeads * headUnit;
  characterChosen = false;
  // Nullstill evt. andre variabler du bruker
}
    
function resizeCanvas() {
  // Velg ønsket aspect ratio for mobil og PC
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const aspect = isMobile ? 2 / 3 : 4 / 3; // 720x1280 for mobil, 800x600 for PC
  const baseW = isMobile ? 720 : 800;
  const baseH = isMobile ? 1280 : 600;

  // Finn vinduets størrelse
  let winW = window.innerWidth;
  let winH = window.innerHeight;

  // Finn riktig visningsstørrelse for canvas (uten å strekke)
  let scale = Math.min(winW / baseW, winH / baseH);

  // Sett intern oppløsning (for skarphet)
  canvas.width = baseW;
  canvas.height = baseH;

  // Sett visningsstørrelse med CSS
  canvas.style.width = (baseW * scale) + "px";
  canvas.style.height = (baseH * scale) + "px";

  // Sentrer canvas horisontalt/vertikalt hvis det er plass til overs
  canvas.style.display = "block";
  canvas.style.marginLeft = canvas.style.marginRight = "auto";
  canvas.style.marginTop = canvas.style.marginBottom = "auto";

  // Oppdater padelens y-posisjon etter resize
  paddle.y = canvas.height - PADDLE_BOTTOM_MARGIN; // Fra variabel
  paddle.x = canvas.width / 2 - paddle.width / 2;
}

canvas.addEventListener("pointerdown", (e) => {
  console.log("pointerdown", {gameOver, showHighscores, gameStarted});
  if (gameOver && !showHighscores) {
    showHighscores = true;
    console.log("Viser highscore");
    return;
  }
  if (gameOver && showHighscores) {
    canvas.style.display = "none";
    document.getElementById('character-select').style.display = "block";
    resetGameState();
    showHighscores = false;
    gameOver = false;
    console.log("Til character select");
    return;
}
  if (readyToStart && levelLoaded && !gameStarted) {
    canvas.style.display = "block";
    document.getElementById('character-select').style.display = "none";
    gameStarted = true;
    ball.dx = initialSpeed;
    ball.dy = -initialSpeed;
    return;
  }
  // Padle-styring kun hvis spillet er i gang
  if (!gameStarted) return;
  let x, y;
  if (e.touches && e.touches[0]) {
    x = getCanvasX(e.touches[0]);
    y = getCanvasY(e.touches[0]);
  } else {
    x = e.clientX * (canvas.width / canvas.getBoundingClientRect().width);
    y = e.clientY * (canvas.height / canvas.getBoundingClientRect().height);
  }
  paddle.x = x - paddle.width / 2;
  paddle.y = y - PADDLE_TOUCH_OFFSET;
});

//Level load

let currentLevel = 1;
let maxLevelReached = false;

// Kall denne for å laste et level
function loadLevel(levelNum) {
  currentLevel = levelNum;
  updateSpeedForLevel(); // Øk fart for hvert level

  return fetch(`https://raw.githubusercontent.com/Andysor/PoesGame/main/levels/level${levelNum}.json`)
    .then(res => {
      if (!res.ok) throw new Error("No more levels");
      return res.json();
    })
    .then(level => {
      rows = level.length;
      cols = level[0].length;

      brickWidth = Math.floor((canvas.width - 40 - (cols - 1) * 5) / cols);
      brickHeight = Math.floor(((canvas.height / 3) - (rows - 1) * 4) / rows);

      bricks = [];
      for (let r = 0; r < rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < cols; c++) {
          const b = level[r][c] || { type: "normal", destroyed: false, strength: 1 };
          bricks[r][c] = {
            type: b.type || "normal",
            destroyed: !!b.destroyed,
            strength: b.strength !== undefined
              ? b.strength
              : (b.type === "special" ? 3 : 1),
            bonusScore: !!b.bonusScore,
            extraBall: !!b.extraBall,
            special: !!b.special,
            effect: b.effect || null,
            x: c * (brickWidth + 5) + 20,
            y: r * (brickHeight + 4) + 80
          };
        }
      }

      // Tilbakestill variabler for nytt level
      resetLevelState();

      // --- START: Kun normalbrikker får extraLife og hasSkull, og aldri begge samtidig ---
      // Finn alle normalbrikker som ikke er ødelagt
      let normalBricks = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const b = bricks[r][c];
          if (!b.destroyed && b.type === "normal") {
            normalBricks.push(b);
          }
        }
      }

      // Velg én tilfeldig normalbrikke og gi den ekstra liv
      if (normalBricks.length > 0) {
        const idx = Math.floor(Math.random() * normalBricks.length);
        normalBricks[idx].extraLife = true;
      }

      // Lag skullCandidates: normalbrikker uten extraLife
      let skullCandidates = normalBricks.filter(brick => !brick.extraLife);

      // Legg til 3 dødningehoder tilfeldig plassert på normalbrikker uten extraLife
      for (let i = 0; i < 3; i++) {
        if (skullCandidates.length > 0) {
          const idx = Math.floor(Math.random() * skullCandidates.length);
          const brick = skullCandidates[idx];
          brick.hasSkull = true;
          skullCandidates.splice(idx, 1);
        }
      }
      // --- SLUTT: Kun normalbrikker får extraLife og hasSkull, og aldri begge samtidig ---

      console.log("Antall dødningehoder:", normalBricks.filter(b => b.hasSkull).length);

      maxLevelReached = false;
      levelLoaded = true;

      // ...etter at bricks er satt opp og før requestAnimationFrame(draw):
      levelBackgroundImg = null;
      const bgName = `level${currentLevel}`;
      const exts = [".png", ".jpg", ".jpeg", ".webp"];
      let found = false;
      for (let ext of exts) {
        const img = new Image();
        img.src = `https://raw.githubusercontent.com/Andysor/PoesGame/main/images/levels/${bgName}${ext}`;
        img.onload = () => {
          if (!found) {
            levelBackgroundImg = img;
            found = true;
            draw(); // Oppdater skjermen med bakgrunn
          }
        };
      }

      requestAnimationFrame(draw); // Start draw-loopen
    })
    .catch(() => {
      maxLevelReached = true;
      gameOver = true;
      gameStarted = false;

      // Lagre highscore én gang når du har rundet spillet
      const name = playerName;
      if (name) {
        const trimmed = name.substring(0, 10);
        db.collection("highscores").add({
          name: trimmed,
          score,
          level: currentLevel - 1, // Siste level fullført
          character: selectedCharacter,
          timestamp: Date.now()
        });
        loadHighscores();
      }

      // Vis "Du har rundet spillet!" eller lignende
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "40px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText("Jy is 'n GROOT POES!", canvas.width / 2, 80);

      // 👇 Vis highscore-listen hvis tilgjengelig
      if (highscoreList.length > 0) {
        let fontSize = Math.max(16, Math.floor(canvas.height * 0.025));
        let lineHeight = fontSize * 1.4;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText("Topp 10 Highscores:", 50, 170);

        highscoreList.forEach((entry, i) => {
          const y = 170 + lineHeight * (i + 1);
          ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score} (Level ${entry.level || 1})`, 50, y);
        });
      } else {
        loadHighscores();
      }

      // Ikke start draw-loopen her!
      // Ikke kall requestAnimationFrame(draw);

      return;
    });
}

// Tilbakestill variabler for nytt level
function resetLevelState() {
  //score = 0;
  //lives = 3;
  gameStarted = false;
  gameOver = false;
  extraBalls = [];
  fallingTexts = [];
  // evt. annet du vil nullstille
}

function lightenColor(hex, factor) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex; // fallback

  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, Math.floor(r + (255 - r) * factor));
  g = Math.min(255, Math.floor(g + (255 - g) * factor));
  b = Math.min(255, Math.floor(b + (255 - b) * factor));

  return `rgb(${r},${g},${b})`;
}
 

let paddleHeads = 3; // starter med 3
const maxPaddleHeads = 6;
const headUnit = canvas.width / 8; // bredde per hode

let paddle = {
  width: paddleHeads * headUnit,
  height: 60,
  x: canvas.width / 2 - (paddleHeads * headUnit) / 2,
  y: canvas.height - PADDLE_BOTTOM_MARGIN // Fra variabel
};

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Startfart og maks fart for ballen
const BASE_INITIAL_SPEED = 1.5;
const BASE_MAX_SPEED = 4.0;

let initialSpeed = BASE_INITIAL_SPEED;
let MAX_SPEED = BASE_MAX_SPEED;


function updateSpeedForLevel() {
  const speedMultiplier = Math.pow(1.05, currentLevel - 1); // 5% økning per level
  initialSpeed = BASE_INITIAL_SPEED * speedMultiplier;
  MAX_SPEED = BASE_MAX_SPEED * speedMultiplier;
}

function resetSpeed() {
  ball.dx = initialSpeed;
  ball.dy = -initialSpeed;
}

// Maksimalt hastighetsforhold for ballen
const MAX_SPEED_MULTIPLIER = 3;

let ball = {
  x: paddle.x + paddle.width / 2,
  y: paddle.y - 10,
  dx: 0,
  dy: 0,
  radius: 12
};
    let rightPressed = false;
    let leftPressed = false;
    let bricks = [];
    let rows = 10; // Antall rader med murstein
    let cols = 12; // Antall kolonner med murstein
    let brickWidth = Math.floor((canvas.width - 40 - (cols - 1) * 5) / cols);
    let brickHeight = Math.floor(((canvas.height / 3) - (rows - 1) * 4) / rows);

    let score = 0;
    let lives = 3;
    let catImg = new Image();


    catImg.src = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'; // Hundelignende bilde erstattes
    let gameStarted = false;
    let gameOver = false;
    let fallingTexts = [];


function getCanvasX(touch) {
  const rect = canvas.getBoundingClientRect();
  // Skaler til intern canvas-koordinat
  return (touch.clientX - rect.left) * (canvas.width / rect.width);
}

canvas.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  paddle.x = getCanvasX(touch) - paddle.width / 2;
  paddle.y = getCanvasY(touch) - PADDLE_TOUCH_OFFSET;
  e.preventDefault();
}, { passive: false });

// Hjelpefunksjon for y-koordinat:
function getCanvasY(touch) {
  const rect = canvas.getBoundingClientRect();
  return (touch.clientY - rect.top) * (canvas.height / rect.height);
}
    //requestAnimationFrame(draw); // Start rendering loop to show start screen






    document.addEventListener("keydown", e => {
      if (e.key === "r" && gameOver) {
        document.location.reload();
      }
      if (e.code === "Space" && !gameStarted) 
      if (readyToStart && levelLoaded && !gameStarted && (e.code === "Space" || e.key === " ")) {
  gameStarted = true;
  ball.dx = initialSpeed;
  ball.dy = -initialSpeed;
}
      if (e.key === "ArrowRight") rightPressed = true;
      if (e.key === "ArrowLeft") leftPressed = true;
    });

    document.addEventListener("keyup", e => {
      if (e.key === "ArrowRight") rightPressed = false;
      if (e.key === "ArrowLeft") leftPressed = false;
    });


    function drawBall() {
  // Skygge
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(ball.x + 4, ball.y + 6, ball.radius * 1.05, 0, Math.PI * 2);
  ctx.fillStyle = "#222";
  ctx.fill();
  ctx.restore();

  // Hovedball
  ctx.beginPath();
  let grad = ctx.createRadialGradient(
    ball.x - ball.radius / 2, ball.y - ball.radius / 2, ball.radius / 2,
    ball.x, ball.y, ball.radius
  );
  grad.addColorStop(0, "#fff");
  grad.addColorStop(0.3, "#ff6666");
  grad.addColorStop(1, "#b20000");
  ctx.fillStyle = grad;
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();

  // Glans
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();

  // Ekstra baller (samme effekt)
  extraBalls.forEach(b => {
    // Skygge
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(b.x + 3, b.y + 5, b.radius * 1.05, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.restore();

    // Hovedball
    ctx.beginPath();
    let gradB = ctx.createRadialGradient(
      b.x - b.radius / 2, b.y - b.radius / 2, b.radius / 2,
      b.x, b.y, b.radius
    );
    gradB.addColorStop(0, "#fff");
    gradB.addColorStop(0.3, "#66ff66");
    gradB.addColorStop(1, "#008800");
    ctx.fillStyle = gradB;
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Glans
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(b.x - b.radius / 3, b.y - b.radius / 3, b.radius / 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  });
}


    function drawPaddle() {
  const headWidth = paddle.width / paddleHeads;
  const headHeight = paddle.height;
  const y = paddle.y;

  for (let i = 0; i < paddleHeads; i++) {
    if (!drawPaddle[`img${i}`] || drawPaddle[`img${i}`].src !== selectedCharacter) {
      drawPaddle[`img${i}`] = new Image();
      drawPaddle[`img${i}`].src = selectedCharacter;
    }
    const img = drawPaddle[`img${i}`];
    if (img.complete) {
      ctx.drawImage(img, paddle.x + i * headWidth, y, headWidth, headHeight);
    } else {
      img.onload = draw;
    }
  }
}


function interpolateColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);

  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);

  const r = Math.floor(r1 + (r2 - r1) * t);
  const g = Math.floor(g1 + (g2 - g1) * t);
  const b = Math.floor(b1 + (b2 - b1) * t);

  return `rgb(${r},${g},${b})`;
}



function drawBricks() {
    if (!bricks || !bricks.length || !bricks[0] || !bricks[0].length) return;
    if (!brickWidth || brickWidth === 0) return;
    const shineOffset = (Date.now() / 15) % brickWidth;

        for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
        const b = bricks[r][c];
        if (b.destroyed) continue;

        

      // 🌭 Pølseblokk med bilde (ingen blinking)
    if (b.bonusScore) {
      if (sausageImg.complete && sausageImg.naturalWidth > 0) {
      ctx.drawImage(sausageImg, b.x, b.y, brickWidth, brickHeight);
      } else {
      ctx.fillStyle = "orange";
      ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
      }
      continue; // hopp over videre tegning
    }

      // 🎾 Ekstra ball-blokk: GRØNN
      if (b.extraBall) {
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        ctx.fillStyle = blink ? "#00ff00" : "#007700";
        ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
        continue;
      }

      // 🎨 Farge basert på type og styrke
      let baseColor = "#0099ff"; // standard blå

      if (b.strength === 3) {
        baseColor = "#b0b0b0"; // metallisk grå
      } else if (b.strength === 2) {
        baseColor = "#d2b48c"; // lysebrun (tan)
      } else if (b.special) {
        baseColor = "#ff0000"; // rød for special
      } else {
        baseColor = "#0099ff"; // blå for vanlig
      }

      // ✨ Skinnende gradient kun for ikke-normal
    if (b.type !== "normal") {
        const gradient = ctx.createLinearGradient(b.x, b.y, b.x + brickWidth, b.y);
        gradient.addColorStop(0, lightenColor(baseColor, 0.05));
        gradient.addColorStop(shineOffset / brickWidth, lightenColor(baseColor, 0.5));
        gradient.addColorStop(1, lightenColor(baseColor, 0.05));
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = baseColor; // Ingen shimmer på normal
      }

      // Legg til skygge bak blokken
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#111";
      ctx.fillRect(b.x + 4, b.y + 6, brickWidth, brickHeight);
      ctx.restore();

      // 3D-gradient på selve blokken
      ctx.beginPath();
      ctx.rect(b.x, b.y, brickWidth, brickHeight);
      let grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + brickHeight);
      grad.addColorStop(0, lightenColor(baseColor, 0.35)); // topp-lys
      grad.addColorStop(0.5, baseColor);                   // midt
      grad.addColorStop(1, lightenColor(baseColor, -0.25)); // bunn-skygge
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.closePath();

      // Lys "glans" øverst på blokken
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x + 4, b.y + 4, brickWidth - 8, brickHeight * 0.22);
      ctx.restore();

    
    // ❤️ Tegn hjerte på brikken hvis ekstra liv
    if (b.extraLife) {
        // Tegn rød hjerte på brikken
        ctx.save();
        ctx.beginPath();
        const cx = b.x + brickWidth / 2;
        const cy = b.y + brickHeight / 2 + 2;
        const size = Math.min(brickWidth, brickHeight) / 2.5;
        ctx.moveTo(cx, cy + size / 3);
        ctx.bezierCurveTo(cx - size, cy - size / 2, cx - size, cy + size, cx, cy + size);
        ctx.bezierCurveTo(cx + size, cy + size, cx + size, cy - size / 2, cx, cy + size / 3);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.restore();
        // Fortsett å tegne resten av brikken under hjertet hvis ønsket
    }

    // ...i drawBricks, etter at brikken er tegnet...
    if (b.hasSkull) {
      ctx.save();
      ctx.font = `${Math.floor(brickHeight * 0.8)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeText("☠", b.x + brickWidth / 2, b.y + brickHeight / 2);
      ctx.fillText("☠", b.x + brickWidth / 2, b.y + brickHeight / 2);
      ctx.restore();
    }
      }
  }
}

function drawDynamicBackground() {
  if (levelBackgroundImg) {
    ctx.save();
    // Reduser lysstyrke og kontrast (juster verdiene etter behov)
    ctx.filter = "brightness(1) contrast(1)";
    ctx.drawImage(levelBackgroundImg, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.restore();
    return;
  }
  // Fallback: gradient
  const t = Date.now() * 0.0003;
  const color1 = `hsl(${(t * 60) % 360}, 80%, 35%)`;
  const color2 = `hsl(${(t * 60 + 60) % 360}, 80%, 55%)`;
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}






 function drawFallingTexts() {
  ctx.textAlign = "center";
  fallingTexts.forEach(t => {
    ctx.save();

    // Tegn pølsebonus som bilde
    if (t.isSausage) {
      const imgW = 40, imgH = 24;
      if (sausageImg.complete && sausageImg.naturalWidth > 0) {
        ctx.drawImage(sausageImg, t.x - imgW / 2, t.y - imgH / 2, imgW, imgH);
      } else {
        ctx.fillStyle = "orange";
        ctx.fillRect(t.x - imgW / 2, t.y - imgH / 2, imgW, imgH);
      }
      ctx.restore();
      return;
    }

    // Tegn dødningehode
    if (t.isSkull) {
        ctx.font = t.hit ? `${60 + t.frame}px Arial` : "60px Arial";
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeText("☠", t.x, t.y);
        ctx.fillText("☠", t.x, t.y);
        ctx.restore();
        return;
    }

    // Tegn hjerte større og i rødt hvis det er ekstra liv
    if (t.isHeart) {
      // Skaler opp fra 1x til 3x størrelse over 40 frames
      let scale = t.hit ? 1 + 9 * Math.min(t.frame / 100, 1) : 1;
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(scale, scale);
      ctx.font = "60px Arial";
      ctx.fillStyle = "red";
      ctx.fillText("♥", 0, 0);
      ctx.restore();
      return;
    }

    if (t.hit) {
      ctx.globalAlpha = 1 - t.frame / 20;
      ctx.font = `${40 + t.frame}px Arial`;
    } else {
      ctx.font = "40px Arial";
    }

    // ✨ Blinkende gulltekst
    if (t.blink && Math.floor(Date.now() / 300) % 2 === 0) {
      ctx.fillStyle = "white";
    } else {
      ctx.fillStyle = t.color || "#fff";
    }

    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  });
}



function updateFallingTexts() {
  fallingTexts.forEach(t => {
    t.y += t.speed;

    // Kollisjon med padelen
    if (
      t.y >= paddle.y &&
      t.y <= paddle.y + paddle.height &&
      t.x > paddle.x &&
      t.x < paddle.x + paddle.width &&
      !t.hit
    ) {
      t.hit = true;
      t.frame = 0; // start animasjon

      if (t.isSkull) {
        lives--;
        playLifeLossSound && playLifeLossSound();
        gameStarted = false;
        ball.dx = 0;
        ball.dy = 0;
        // Sett ballen på padelen
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius;
      } else if (t.isSausage) {
        score += 50;
      } else if (t.isHeart) {
        lives++;
      } else {
        score++;
      }

      // 📳 Vibrer på mobil
      if ("vibrate" in navigator) {
        navigator.vibrate(100);
      }

      // 🚀 Utvid padel hvis det er bonus-type
      if (t.bonus === "extend" && paddleHeads < maxPaddleHeads) {
        paddleHeads++;
        paddle.width = paddleHeads * headUnit;
        paddle.x = Math.max(0, paddle.x - headUnit / 2); // bevar senter
      }

      // 🐈‍⬛ Krymp padel hvis det er krymp-bonus
      if (t.bonus === "shrink" && paddleHeads > 1) {
        paddleHeads--;
        paddle.width = paddleHeads * headUnit;
        paddle.x = Math.min(canvas.width - paddle.width, paddle.x + headUnit / 2);
      }
    }

    // Animasjon etter treff
    if (t.hit) {
      t.frame++;
    }
  });

  // Fjern bare de som er ferdig animert
  fallingTexts = fallingTexts.filter(t =>
    !t.hit || (t.hit && t.frame < 20)
  );
}


function collisionDetection() {
  // 🔴 Kollisjon for hovedball
  detectBallCollision(ball);

  // 🟢 Kollisjon for ekstra baller
  extraBalls.forEach(b => detectBallCollision(b));
}

function detectBallCollision(b) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const brick = bricks[r][c];
      if (brick.destroyed) continue;

      const hitX = b.x > brick.x && b.x < brick.x + brickWidth;
      const hitY = b.y > brick.y && b.y < brick.y + brickHeight;

      if (hitX && hitY) {
        b.dy = -b.dy;

        let speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (speed < MAX_SPEED) {
          let factor = 1.02; // Øk farten med 1% for hvert treff
          b.dx *= factor;
          b.dy *= factor;
        }

        // Poesklap pause kun for hovedball
        if (brick.extraBall && b === ball) {
          showPoesklap = true;
          poesklapTimer = Date.now();
          playPoesklapSound();
          // Ikke pause ballen!
        
          // Legg til ekstraball fra denne blokkens posisjon
            const mainSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const angle = Math.random() * Math.PI - Math.PI / 2; // tilfeldig vinkel oppover
            extraBalls.push({
                x: brick.x + brickWidth / 2,
                y: brick.y + brickHeight / 2,
                dx: mainSpeed * Math.cos(angle),
                dy: -Math.abs(mainSpeed * Math.sin(angle)),
                radius: 12,
                canBounce: false
            });
        }

        // Reduser styrke
        brick.strength--;
        if (brick.strength <= 0) {
    brick.destroyed = true;

    // NORMAL: Ingen fallingText, men kan ha powerup, og gir 2 poeng
    if (brick.type === "normal") {
        score += 2;

        // Powerups for normal-brikker
        if (brick.bonusScore) {
            fallingTexts.push({
                isSausage: true,
                x: brick.x + brickWidth / 2,
                y: brick.y,
                speed: 2,
                hit: false,
                frame: 0
            });
        }
        if (brick.extraBall) {
            // Ekstra ball håndteres allerede i ball-collision over
        }
        if (brick.extraLife) {
            fallingTexts.push({
                text: "♥",
                x: brick.x + brickWidth / 2,
                y: brick.y,
                speed: 2,
                color: "red",
                blink: false,
                hit: false,
                frame: 0,
                isHeart: true
            });
        }

        if (brick.hasSkull) {
            fallingTexts.push({
              text: "☠",
              x: brick.x + brickWidth / 2,
              y: brick.y,
              speed: 2,
              color: "#fff",
              blink: false,
              hit: false,
              frame: 0,
              isSkull: true
            });
        }


        return; // Ikke lag fallingText for normal
    }

    // SPECIAL, SAUSAGE, EXTRA BALL: FallingText som før
    // Hvis brikken har ekstra liv, lag KUN hjerte fallingText
    if (brick.extraLife) {
        fallingTexts.push({
            text: "♥",
            x: brick.x + brickWidth / 2,
            y: brick.y,
            speed: 2,
            color: "red",
            blink: false,
            hit: false,
            frame: 0,
            isHeart: true
        });
    } 
    
    // Hvis brikken har dødningehode, lag skull fallingText
     else if (brick.bonusScore) {
        score += 50;
        fallingTexts.push({
            isSausage: true,
            x: brick.x + brickWidth / 2,
            y: brick.y,
            speed: 4,
            hit: false,
            frame: 0
        });
    } else {
    score += 1;
    let text = "POES";
    let color = brick.special ? "red" : "white";
    let blink = false;
    let isShrinkOrGrow = brick.special && (brick.effect === "extend" || brick.effect === "shrink");
    // Kun 30% sjanse for fallingText hvis shrink/grow
    if (!isShrinkOrGrow || Math.random() < 0.3) {
        if (brick.special && brick.effect === "extend") {
            text = "😃"; // Smilefjes for expand
            color = "#fff";
            blink = false;
        } else if (brick.special && brick.effect === "shrink") {
            text = "👺"; // Rød firkant for shrink
            color = "#fff";
            blink = false;
        }
        fallingTexts.push({
            text,
            x: brick.x + brickWidth / 2,
            y: brick.y,
            speed: 2,
            color,
            blink,
            hit: false,
            frame: 0,
            bonus: brick.effect || null
        });
    }
}
}
      }
    }
  }
}





function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.fillText("Level: " + currentLevel, 20, 20);

    ctx.fillText("Score: " + score, 20, 40);

    const lifeSize = 40; // større kattehoder

    for (let i = 0; i < lives; i++) {
    const x = canvas.width - (lifeSize + 10) * (i + 1);
    const y = 10;

  if (!drawScore.img) {
    drawScore.img = new Image();
    drawScore.img.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/cat4.png";
  }

  if (drawScore.img.complete) {
    ctx.drawImage(drawScore.img, x, y, lifeSize, lifeSize);
  } else {
    drawScore.img.onload = draw;
  }
}

}

function showHighscorePreview() {
  // Eksempel-highscore hvis listen er tom
  if (!highscoreList || highscoreList.length === 0) {
    highscoreList = [
      {
        name: "andreaspoe",
        score: 12341,
        level: 10,
        character: "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/braai.png",
        timestamp: Date.now()
      },
      {
        name: "POESPOES22",
        score: 9000,
        level: 5,
        character: "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/rugby-ball.png",
        timestamp: Date.now()
      }
    ];
  }
  gameOver = true;
  showHighscores = true;
  draw();
}

function startGame() {
  if (!gameStarted) {
    document.getElementById('character-select').style.display = "none";
    ball.dx = initialSpeed;
    ball.dy = -initialSpeed;
    gameStarted = true;
    requestAnimationFrame(draw);
  }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDynamicBackground(); 

    if (showPoesklap) {
        const elapsed = Date.now() - poesklapTimer;
        ctx.fillStyle = elapsed % 500 < 250 ? "yellow" : "orange";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("POESKLAP!", canvas.width / 2, canvas.height / 2);

  if (elapsed >= 2000) {
    showPoesklap = false;
    // Når du legger til en ny ekstraball:
const mainSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
const angle = Math.random() * Math.PI - Math.PI / 2; // tilfeldig vinkel oppover

  }
  // Ikke return! La resten av draw() kjøre videre.
}

      
      if (gameOver) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SPEL VERBY!", canvas.width / 2, 80);

  ctx.font = "28px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, canvas.width / 2, 130);

  ctx.font = "20px Arial";
  ctx.fillText("Raak vir 'n hoë telling", canvas.width / 2, 180);

  // Vis highscore-listen først etter brukertrykk
  if (showHighscores && highscoreList.length > 0) {
  let fontSize = Math.max(12, Math.floor(canvas.height * 0.018));
  let lineHeight = fontSize * 2;
  let imgSize = fontSize * 2; // lite bilde

  // Justerte kolonnebredder for mobil:
  let xImg = 10;                       // bilde starter nær venstre kant
  let xName = xImg + imgSize + 6;      // navn rett etter bilde
  let xScore = xName + 250;             // poeng (kort navn gir plass)
  let xLevel = xScore + 100;            // level
  let xDate = xLevel + 100;             // dato
  let yStart = 230;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  // Kolonneoverskrifter
  ctx.fillText(" ", xImg, yStart); // bilde
  ctx.fillText("Naam", xName, yStart);
  ctx.fillText("Punte", xScore, yStart);
  ctx.fillText("Lvl", xLevel, yStart);
  ctx.fillText("Datum", xDate, yStart);

  ctx.font = `${fontSize}px Arial`;

  highscoreList.forEach((entry, i) => {
  const y = yStart + lineHeight * (i + 1);
  const textYOffset = imgSize / 1.3; // Juster denne for å sentrere teksten med bildet

  // Karakterbilde
  let img = new Image();
  img.src = entry.character || "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/cat4.png";
  if (img.complete) {
    ctx.drawImage(img, xImg, y - imgSize + fontSize, imgSize, imgSize);
  } else {
    img.onload = () => ctx.drawImage(img, xImg, y - imgSize + fontSize, imgSize, imgSize);
  }

  // Navn
  ctx.fillText(entry.name, xName, y + textYOffset - imgSize + fontSize);

  // Poeng
  ctx.fillText(entry.score, xScore, y + textYOffset - imgSize + fontSize);

  // Level
  ctx.fillText(entry.level || 1, xLevel, y + textYOffset - imgSize + fontSize);

  // Dato
  let dateStr = "";
  if (entry.timestamp) {
    let dateObj;
    if (typeof entry.timestamp === "object" && entry.timestamp.seconds) {
      dateObj = new Date(entry.timestamp.seconds * 1000);
    } else {
      dateObj = new Date(entry.timestamp);
    }
    dateStr = dateObj.toLocaleDateString();
  }
  ctx.fillText(dateStr, xDate, y + textYOffset - imgSize + fontSize);
});
}

  requestAnimationFrame(draw);
  return;
}
      

      if (!gameStarted) {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius;
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Raak die fokken skerm", canvas.width / 2, canvas.height / 2);
}
// Tegn alltid disse, uansett gameStarted:
  drawBricks();
  drawPaddle();
  drawBall();
  drawScore();
  drawFallingTexts();

  if (gameStarted) {
      updateFallingTexts();
      collisionDetection();
  }
    if (!loadingNextLevel && bricks.flat().every(brick => brick.destroyed)) {
  loadingNextLevel = true;
  setTimeout(() => {
    currentLevel++;
    loadLevel(currentLevel).then(() => {
      loadingNextLevel = false;
    });
  }, 2000);
  return;
}

      if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
      }
      if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
      } if (ball.y + ball.dy > canvas.height - ball.radius) {
  lives--;
  playLifeLossSound();
  if (lives > 0) {
    gameStarted = false;
    ball.dx = 0;
    ball.dy = 0;
    resetSpeed();
  } else {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SPEL VERBY!", canvas.width / 2, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 40);
    gameOver = true;
    gameStarted = false;

    // Lagre highscore én gang
    const name = playerName;
    if (name) {
        const trimmed = name.substring(0, 10);
        db.collection("highscores").add({
        name: trimmed,
        score,
        level: currentLevel, // <-- legg til dette feltet
        character: selectedCharacter,
        timestamp: Date.now()
    });
      loadHighscores();
    }

    return;
  }
} else if (
  ball.y + ball.dy + ball.radius >= paddle.y && // Ballen treffer eller går under padelens topp
  ball.y + ball.dy - ball.radius <= paddle.y + paddle.height && // Ballen er ikke under padelens bunn
  ball.x + ball.radius >= paddle.x && // Ballen treffer padelens venstre kant
  ball.x - ball.radius <= paddle.x + paddle.width // Ballen treffer padelens høyre kant
) {
  // Sprett ballen
  let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  let angle = hitPoint * (Math.PI / 3); // maks ±60°
  ball.dx = speed * Math.sin(angle);
  ball.dy = -Math.abs(speed * Math.cos(angle));
}

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (rightPressed && paddle.x < canvas.width - paddle.width) paddle.x += 2.5;
      if (leftPressed && paddle.x > 0) paddle.x -= 2.5;

      requestAnimationFrame(draw);

    extraBalls.forEach(b => {
  b.x += b.dx;
  b.y += b.dy;

  // Aktiver bouncing etter første frame
  if (!b.canBounce) {
    b.canBounce = true;
  }

  // Veggkollisjoner
  if (b.x < b.radius || b.x > canvas.width - b.radius) b.dx *= -1;
  if (b.y < b.radius) b.dy *= -1;

  // Treff padel (hvis aktivert)
  if (
  b.canBounce &&
  b.y + b.dy + b.radius >= paddle.y &&
  b.y + b.dy - b.radius <= paddle.y + paddle.height &&
  b.x + b.radius >= paddle.x &&
  b.x - b.radius <= paddle.x + paddle.width
) {
  const hitPoint = (b.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
  const angle = hitPoint * (Math.PI / 3);

  b.dx = speed * Math.sin(angle);
  b.dy = -Math.abs(speed * Math.cos(angle));
}

  // Fjern hvis den går under skjermen
  if (b.y - b.radius > canvas.height) {
    b.toRemove = true;
  }
});


// Fjern baller som er ute av skjermen
extraBalls = extraBalls.filter(b => !b.toRemove);



    }
