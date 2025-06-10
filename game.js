
    let readyToStart = false;
    let selectedCharacter = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/cat4.png";
    let playerName = "";

    let characterChosen = false;
document.querySelectorAll('.char-opt').forEach(img => {
  img.addEventListener('click', function() {
    if (characterChosen) return;
    characterChosen = true;
    selectedCharacter = this.dataset.img;
    document.querySelectorAll('.char-opt').forEach(i => i.style.border = "2px solid #fff");
    this.style.border = "4px solid gold";
    document.getElementById('character-select').style.display = "none";
    document.getElementById('name-input-container').style.display = "block";
    document.getElementById('player-name').focus();
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
  // Kall resizeCanvas etter at navneinput er skjult:
  //resizeCanvas();
  readyToStart = true;
  gameStarted = false;
  requestAnimationFrame(draw); // Tegn brettet, men ikke start ballen
}
    const PADDLE_BOTTOM_MARGIN = 150; // Avstand fra bunnen av skjermen til padelen
    let extraBalls = [];
    let showPoesklap = false;
    let poesklapTimer = 0;
    let pausedBallVelocity = { dx: 0, dy: 0 };


    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    //const hitSound = new Audio("https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/beep1.mp3"); // Lyd for treff
    //hitSound.volume = 0.5; // Juster volumet for trefflyd
    //hitSound.preload = "auto"; // Forhåndsinnlading for raskere avspilling
    //hitSound.loop = false; // Ikke looper, bare spiller én gang per treff
    let lifeLossSound = new Audio('https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/lifeloss.mp3');  // Lyd for livstap

    lifeLossSound.volume = 0.3; // Juster volumet for livstap-lyd
    lifeLossSound.preload = "auto"; // Forhåndsinnlading for raskere avspilling

    const poesklapSound = new Audio("https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/poesklap.mp3");
    poesklapSound.volume = 0.8;
    poesklapSound.preload = "auto";

    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('mousedown', unlockAudio, { once: true });

function unlockAudio() {
  //hitSound.play().catch(() => {});
  lifeLossSound.play().catch(() => {});
  poesklapSound.play().catch(() => {});
  //hitSound.pause();
  //hitSound.currentTime = 0;
  lifeLossSound.pause();
  lifeLossSound.currentTime = 0;
  poesklapSound.pause();
  poesklapSound.currentTime = 0;
}

    const sausageImg = new Image();
    sausageImg.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/sausage.png";

    const canvas = document.getElementById('arkanoid');
    const ctx = canvas.getContext('2d');

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
const headUnit = canvas.width / 12; // bredde per hode

let paddle = {
  width: paddleHeads * headUnit,
  height: 40,
  x: canvas.width / 2 - (paddleHeads * headUnit) / 2,
  y: canvas.height - PADDLE_BOTTOM_MARGIN // Fra variabel
};

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let initialSpeed = 2.5; // Startfart for ballen

function resetSpeed() {
  ball.dx = initialSpeed;
  ball.dy = -initialSpeed;
}

const MAX_SPEED = 10; // Maks fart for ballen
const MAX_SPEED_MULTIPLIER = 3;

let ball = {
  x: paddle.x + paddle.width / 2,
  y: paddle.y - 10,
  dx: 0,
  dy: 0,
  radius: 8
};
    let rightPressed = false;
    let leftPressed = false;
    let bricks = [];
    let rows = 10; // Antall rader med murstein
    let cols = 12; // Antall kolonner med murstein
    let brickWidth = (canvas.width - 40) / cols - 5; // 5 px mellomrom
    let brickHeight = (canvas.height / 3) / rows - 4; // tynnere og høyere dekning

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

canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  paddle.x = getCanvasX(touch) - paddle.width / 2;
});

canvas.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  paddle.x = getCanvasX(touch) - paddle.width / 2;
  e.preventDefault();
}, { passive: false });

    //requestAnimationFrame(draw); // Start rendering loop to show start screen

for (let r = 0; r < rows; r++) {
  bricks[r] = [];
  for (let c = 0; c < cols; c++) {
    const isStrong = r < rows - 1 && (rows - r - 2) % 2 === 0;

    const isSausageBonus = Math.random() < 0.1;
    const isExtraBall = Math.random() < 0.05;

    const brick = {
      x: c * (brickWidth + 5) + 20,
      y: r * (brickHeight + 4) + 80,
      destroyed: false,
      bonusScore: isSausageBonus,
      extraBall: isExtraBall,
      strength: 1,  // standard – overskrives under
      special: false,
      effect: null
    };

    // Pølseblokk
    if (isSausageBonus) {
      brick.type = "sausage";
      brick.strength = 1; // alltid svak
    }
    // Ekstra ball-blokk
    else if (isExtraBall) {
      brick.type = "extra";
      brick.strength = 1; // alltid svak
    }
    // Spesial (rød)
    else if (Math.random() < 0.2) {
      brick.special = true;
      brick.effect = Math.random() < 0.5 ? "extend" : "shrink";
      brick.strength = isStrong ? 3 : 1;
      brick.type = "special";
    }
    // Vanlig blokk
    else {
      brick.strength = isStrong ? 3 : 1;
      brick.type = "normal";
    }

    bricks[r][c] = brick;
  }
}



    document.addEventListener("keydown", e => {
      if (e.key === "r" && gameOver) {
        document.location.reload();
      }
      if (e.code === "Space" && !gameStarted) 
      if (readyToStart && !gameStarted && (e.code === "Space" || e.key === " ")) {
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

// Touchstart for mobil
canvas.addEventListener("touchstart", e => {
  if (gameOver) {
    document.location.reload();
  } else if (readyToStart && !gameStarted) {
    gameStarted = true;
    ball.dx = initialSpeed;
    ball.dy = -initialSpeed;
  }
});


    function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#f00";
  ctx.fill();
  ctx.closePath();

  extraBalls.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0f0"; // ekstra ball er grønn
    ctx.fill();
    ctx.closePath();
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

      // ✨ Skinnende gradient
      const gradient = ctx.createLinearGradient(b.x, b.y, b.x + brickWidth, b.y);
      gradient.addColorStop(0, lightenColor(baseColor, 0.05));
      gradient.addColorStop(shineOffset / brickWidth, lightenColor(baseColor, 0.5));
      gradient.addColorStop(1, lightenColor(baseColor, 0.05));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.rect(b.x, b.y, brickWidth, brickHeight);
      ctx.fill();
      ctx.closePath();
    }
  }
}

function drawDynamicBackground() {
  // Lys gradient som endrer seg over tid
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

    if (t.hit) {
      ctx.globalAlpha = 1 - t.frame / 20;
      ctx.font = `${20 + t.frame}px Arial`;
    } else {
      ctx.font = "20px Arial";
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
      t.x > paddle.x &&
      t.x < paddle.x + paddle.width &&
      !t.hit
    ) {
      score++;
      t.hit = true;
      t.frame = 0; // start animasjon

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
        let factor = 1.01; // Øk farten med 1% for hvert treff
        b.dx *= factor;
        b.dy *= factor;
        }

        // Spill lyd
        //if (hitSound && hitSound.readyState >= 2) {
        //hitSound.currentTime = 0;
        //hitSound.play().catch(() => {});
//}

        // Poesklap pause kun for hovedball
        if (brick.extraBall && b === ball) {
          showPoesklap = true;
          poesklapTimer = Date.now();
          pausedBallVelocity.dx = b.dx;
          pausedBallVelocity.dy = b.dy;
          b.dx = 0;
          b.dy = 0;
          poesklapSound.currentTime = 0;
          poesklapSound.play().catch(() => {});
        }

        // Reduser styrke
        brick.strength--;
        if (brick.strength <= 0) {
          brick.destroyed = true;

          // 🌭 Pølsebonus
          if (brick.bonusScore) {
            score += 50;
            fallingTexts.push({
              text: "50",
              x: brick.x + brickWidth / 2,
              y: brick.y,
              speed: 2,
              color: "gold",
              blink: true,
              hit: false,
              frame: 0
            });
          } else {
            score += 1;
            const color = brick.special ? "red" : "white";
            if (brick.bonusScore) {
            score += 50;
            fallingTexts.push({
              text: "50",
              x: brick.x + brickWidth / 2,
              y: brick.y,
              speed: 2,
              color: "gold",
              blink: true,
              hit: false,
              frame: 0
            });
          } else {
            score += 1;
            // Vis +POES for extend, -POES for shrink, ellers POES
            let text = "POES";
            let color = brick.special ? "red" : "white";
            let blink = false;
            if (brick.special && brick.effect === "extend") {
              text = "POES";
              color = "#0000ff"; // blå for utvidelse
              blink = true; // blinkende for utvidelse
            } else if (brick.special && brick.effect === "shrink") {
              text = "POES";
              color = "#800000"; // mørkerød for krymping
              blink = true; // blinkende for krymping
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
      
      if (showPoesklap) {
  const elapsed = Date.now() - poesklapTimer;
  ctx.fillStyle = elapsed % 500 < 250 ? "yellow" : "orange";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("POESKLAP!", canvas.width / 2, canvas.height / 2);

  if (elapsed >= 2000) {
    showPoesklap = false;

     // Gjenopprett fart til hovedball
  ball.dx = pausedBallVelocity.dx;
  ball.dy = pausedBallVelocity.dy;

    // Legg til en ny ball
    extraBalls.push({
  x: paddle.x + paddle.width / 2,
  y: paddle.y - 50,
  dx: 1,
  dy: -1,
  radius: 8,
  canBounce: false  // 👈 viktig
});



    // Sett fart tilbake på hovedballen
    if (!gameStarted) startGame();
  }

  requestAnimationFrame(draw);
  return;
}

      
      if (gameOver) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, 80);

  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Press R to restart", canvas.width / 2, 120);

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
      ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, 50, y);
    });
  } else {
    loadHighscores(); // 🔁 Hent hvis den ikke er klar ennå
  }

  // 👉 Fortsett å tegne draw() så highscore vises når listen er klar
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawDynamicBackground(); // <-- LEGG TIL DENNE LINJEN HER
      ctx.fillStyle = "red";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Poes Gaming", canvas.width / 2, 40);
      drawFallingTexts();
      drawBall();
      drawPaddle();
      drawBricks();
      drawScore();

      if (!gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        //ctx.fillText("Press SPACE to start", canvas.width / 2, canvas.height / 2);
      }

      updateFallingTexts();
      collisionDetection();

      if (bricks.flat().every(brick => brick.destroyed)) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "40px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  ctx.fillText("Jy is 'n GROOT POES!", canvas.width / 2, 80);

  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Du vant!", canvas.width / 2, 120);

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
      ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, 50, y);
    });
  } else {
    loadHighscores(); // 🔁 Hent hvis den ikke er klar ennå
  }

  // Lagre highscore én gang
  if (!gameOver) {
    const name = playerName;
    if (name) {
      const trimmed = name.substring(0, 10);
      db.collection("highscores").add({ name: trimmed, score, timestamp: Date.now() });
      loadHighscores();
    }
  }

  gameOver = true;
  requestAnimationFrame(draw); // Fortsett å tegne så highscore vises når listen er klar
  return;
}

      if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
      }
      if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
      } else if (ball.y + ball.dy > paddle.y - ball.radius) {
        if (ball.x > paddle.x - 10 && ball.x < paddle.x + paddle.width + 10) {
          let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

          // Begrens vinkel så ballen ikke går helt horisontalt
          let angle = hitPoint * (Math.PI / 3); // maks ±60°

          ball.dx = speed * Math.sin(angle);
          ball.dy = -Math.abs(speed * Math.cos(angle));

        } else {
          lives--;
          lifeLossSound.play();
          if (lives > 0) {
            gameStarted = false;
            ball.dx = 0;
            ball.dy = 0;
            // Reset fart til startfart
            resetSpeed();
          }
          else {
            ctx.fillStyle = "red";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
            ctx.font = "20px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 40);
            gameOver = true;

            // Lagre highscore én gang
            const name = playerName;
            if (name) {
              const trimmed = name.substring(0, 10);
              db.collection("highscores").add({ name: trimmed, score, timestamp: Date.now() });
              loadHighscores();
            }

            return;
          }
        }
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
    b.y + b.dy > paddle.y - b.radius &&
    b.x > paddle.x &&
    b.x < paddle.x + paddle.width
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
