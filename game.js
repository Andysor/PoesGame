// Legg til øverst i filen:
// triggering a new version
let levelBackgroundImg = null;
let loadingNextLevel = false;
let readyToStart = false;
let selectedCharacter = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/cat4.png";
let playerName = "";
let characterChosen = false;
let showHighscores = false;

// Add at the top of the file, after other constants
const GAME_VERSION = "0.1.9"; // Major.Minor.Patch

// Power-up constants
const POWERUPS_PER_LEVEL = {
  BRANNAS: 1,     // One brannas power-up per level
  EXTRA_LIFE: 1,  // One extra life power-up per level
  SKULL: 3,       // Three skull power-ups per level
  COIN: 5         // Five coin power-ups per level
};

// Speed-related constants
const BASE_INITIAL_SPEED = 7;
const BASE_MAX_SPEED = 14;
const COMPONENT_SPEED = BASE_INITIAL_SPEED / Math.sqrt(2);
const SPEED_INCREASE_INTERVAL = 10000; // Every 10 seconds
const SPEED_INCREASE_FACTOR = 1.1; // 10% increase
const LEVEL_SPEED_INCREASE = 0.05; // 5% increase per level
const MAX_SPEED_MULTIPLIER = 3; // Maximum speed multiplier (3x base speed)

let initialSpeed = BASE_INITIAL_SPEED;
let MAX_SPEED = BASE_MAX_SPEED;

const TEST_MODE = false; // Set to true to start at level 21


// Add version display when the game loads
window.addEventListener('load', function() {
  const versionDisplay = document.createElement('div');
  versionDisplay.style.position = 'fixed';
  versionDisplay.style.bottom = '10px';
  versionDisplay.style.right = '10px';
  versionDisplay.style.color = '#fff';
  versionDisplay.style.fontSize = '14px';
  versionDisplay.style.fontFamily = 'Arial';
  versionDisplay.style.zIndex = '100';
  versionDisplay.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
  versionDisplay.textContent = `v${GAME_VERSION}`;
  document.body.appendChild(versionDisplay);
});

// Add speed logging function at the top
function logBallSpeed(location) {
  console.log(`[${location}] Ball Speed:`, getSpeedState());
}

// Add this function at the top level
function resetBallSpeed() {
  // Get speeds for current level
  const speeds = getMaxSpeedForLevel(currentLevel);
  initialSpeed = speeds.initial;
  MAX_SPEED = speeds.max;
  
  // Reset the ball speed to initial speed
  if (ball) {
    const angle = Math.atan2(ball.dy, ball.dx);
    ball.dx = initialSpeed * Math.cos(angle);
    ball.dy = initialSpeed * Math.sin(angle);
  }
  
  // Reset speed increase timer
  window.lastSpeedIncreaseTime = Date.now();
  
  // Log the reset
  logBallSpeed('resetBallSpeed');
}

function resetGameState() {
  score = 0;
  lives = 3;
  currentLevel = TEST_MODE ? 21 : 1; // Keep level 21 in test mode
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
  brannasActive = false;
  brannasEndTime = 0;
  
  // Complete speed reset
  resetBallSpeed();
  
  logBallSpeed('resetGameState');
}

function restartGame() {
  // Reset all game state
  resetGameState();
  
  // Reset speed to base values
  resetBallSpeed();
  
  // Reset level to 1 or 21 based on test mode
  currentLevel = TEST_MODE ? 21 : 1;
  
  // Reset UI state
  showHighscores = false;
  gameOver = false;
  
  // Show character select screen and hide name input
  canvas.style.display = "none";
  document.getElementById('character-select').style.display = "block";
  document.getElementById('name-input-container').style.display = "none";
  
  // Keep the existing player name
  characterChosen = false;
  
  // Load level based on test mode
  loadLevel(currentLevel);
}

document.querySelectorAll('.char-opt').forEach(img => {
  img.addEventListener('click', function() {
    if (characterChosen) return;
    characterChosen = true;
    selectedCharacter = this.dataset.img;
    document.querySelectorAll('.char-opt').forEach(i => i.style.border = "2px solid #fff");
    this.style.border = "4px solid gold";
    
    // Add version display
    const versionDisplay = document.createElement('div');
    versionDisplay.style.position = 'absolute';
    versionDisplay.style.bottom = '10px';
    versionDisplay.style.right = '10px';
    versionDisplay.style.color = '#666';
    versionDisplay.style.fontSize = '12px';
    versionDisplay.style.fontFamily = 'Arial';
    versionDisplay.textContent = `v${GAME_VERSION}`;
    document.getElementById('character-select').appendChild(versionDisplay);
    
    document.getElementById('character-select').style.display = "none";
    
    // If we have a player name (from previous game), skip name input
    if (playerName && playerName.length > 0) {
      document.getElementById('name-input-container').style.display = "none";
      canvas.style.display = "block";
      readyToStart = true;
      gameStarted = false;
      
      // Reset game state first
      resetGameState();
      
      // Force speed to base values
      resetBallSpeed();
      logBallSpeed('characterSelect');
      
      // Load level 1
      loadLevel(1);
    } else {
      document.getElementById('name-input-container').style.display = "block";
      document.getElementById('player-name').focus();
    }
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
  canvas.style.display = "block";
  readyToStart = true;
  gameStarted = false;
  currentLevel = TEST_MODE ? 21 : 1; // Start at level 21 in test mode
  
  // Reset game state first
  resetGameState();
  
  // Reset speed to base values before starting
  resetBallSpeed();
  logBallSpeed('startGameWithName');
  
  // Load level 21 in test mode
  loadLevel(currentLevel);
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

// Add at the top with other constants
const POESKLAP_COOLDOWN = 500; // milliseconds between poesklap sounds
let lastPoesklapTime = 0;
let audioContext = null;
let audioEnabled = false;

// Create empty audio elements
const hitSoundPool = Array.from({length: 20}, () => {
  const a = new Audio();
  a.volume = 0.1;
  return a;
});
let hitSoundIndex = 0;

const lifeLossSoundPool = Array.from({length: 3}, () => {
  const a = new Audio();
  a.volume = 0.3;
  return a;
});
let lifeLossSoundIndex = 0;

const poesklapSoundPool = Array.from({length: 2}, () => {
  const a = new Audio();
  a.volume = 0.8;
  return a;
});
let poesklapSoundIndex = 0;

// Add with other sound pool declarations
const brannasSoundPool = Array.from({length: 2}, () => {
  const a = new Audio();
  a.volume = 0.8;
  return a;
});
let brannasSoundIndex = 0;

// Initialize audio on first user interaction
function initializeAudio() {
  if (audioEnabled) return;
  
  try {
    // Create AudioContext
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Load and initialize all sounds
    hitSoundPool.forEach(sound => {
      sound.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/beep1.mp3";
      sound.load();
    });
    
    lifeLossSoundPool.forEach(sound => {
      sound.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/lifeloss.mp3";
      sound.load();
    });
    
    poesklapSoundPool.forEach(sound => {
      sound.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/poesklap.mp3";
      sound.load();
    });

    brannasSoundPool.forEach(sound => {
      sound.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/sound/brannas.mp3";
      sound.load();
    });
    
    audioEnabled = true;
    console.log('Audio initialized');
  } catch (e) {
    console.error('Failed to initialize audio:', e);
  }
}

// Add click/touch event listeners for audio initialization
window.addEventListener('click', initializeAudio, { once: true });
window.addEventListener('touchstart', initializeAudio, { once: true });

function playHitSound() {
  if (!audioEnabled) return;
  
  const sound = hitSoundPool[hitSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(e => {
    console.log('Failed to play hit sound:', e);
  });
  hitSoundIndex = (hitSoundIndex + 1) % hitSoundPool.length;
}

function playLifeLossSound() {
  if (!audioEnabled) return;
  
  const sound = lifeLossSoundPool[lifeLossSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(e => {
    console.log('Failed to play life loss sound:', e);
  });
  lifeLossSoundIndex = (lifeLossSoundIndex + 1) % lifeLossSoundPool.length;
}

function playPoesklapSound() {
  if (!audioEnabled) return;
  
  const now = Date.now();
  if (now - lastPoesklapTime < POESKLAP_COOLDOWN) {
    return; // Skip if too soon since last poesklap
  }
  
  lastPoesklapTime = now;
  const sound = poesklapSoundPool[poesklapSoundIndex];
  
  // Ensure we're in a playable state
  if (sound.readyState === 0) {
    sound.load();
  }
  
  // Play the sound
  sound.currentTime = 0;
  sound.play().catch(e => {
    console.log('Failed to play poesklap sound:', e);
  });
  
  poesklapSoundIndex = (poesklapSoundIndex + 1) % poesklapSoundPool.length;
}

// Add new function to play Brannas sound
function playBrannasSound() {
  if (!audioEnabled) return;
  
  const sound = brannasSoundPool[brannasSoundIndex];
  sound.currentTime = 0;
  sound.play().catch(e => {
    console.log('Failed to play brannas sound:', e);
  });
  brannasSoundIndex = (brannasSoundIndex + 1) % brannasSoundPool.length;
}

const sausageImg = new Image();
sausageImg.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/sausage.png";

const coinImg = new Image();
coinImg.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/coin.png";

const brannasImg = new Image();
brannasImg.src = "https://raw.githubusercontent.com/Andysor/PoesGame/main/images/brannas.png";

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

canvas.addEventListener("pointerdown", (e) => {
  console.log("pointerdown", {gameOver, showHighscores, gameStarted});
  if (gameOver && !showHighscores) {
    showHighscores = true;
    console.log("Viser highscore");
    return;
  }
  if (gameOver && showHighscores) {
    restartGame();
    console.log("Til character select");
    return;
  }
  if (readyToStart && levelLoaded && !gameStarted) {
    canvas.style.display = "block";
    document.getElementById('character-select').style.display = "none";
    gameStarted = true;
    
    // Reset speed timer and multiplier
    window.lastSpeedIncreaseTime = Date.now();
    window.speedMultiplier = 1;
    
    // Set initial velocity at 45 degrees
    ball.dx = COMPONENT_SPEED;
    ball.dy = -COMPONENT_SPEED;
    
    logBallSpeed('ballStart');
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

// Add at the top with other constants
const LEVEL_BACKGROUNDS = [
  "level1", "level2", "level3", "level4", "level5",
  "level6", "level7", "level8", "level9", "level10",
  "level11", "level12", "level13", "level14", "level15",
  "level16", "level17", "level18", "level19", "level20",
  "level21"
];

// Add at the top with other constants
const AVAILABLE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

// Add at the top with other constants
const BRANNAS_DURATION = 5000; // 5 seconds in milliseconds

// Add with other game state variables
let brannasActive = false;
let brannasEndTime = 0;

// Add at the top with other game state variables
let showBrannas = false;
let brannasTimer = 0;

// Add with other image declarations

// Kall denne for å laste et level
function loadLevel(levelNum) {
  console.log('=== LEVEL LOAD START ===');
  console.log('Previous level:', currentLevel);
  console.log('Loading level:', levelNum);
  
  // Prevent multiple simultaneous level loads
  if (loadingNextLevel) {
    console.log('Level load already in progress, ignoring request');
    return;
  }
  
  loadingNextLevel = true;
  levelLoaded = false;
  gameStarted = false; // Ensure game is not started during load
  currentLevel = levelNum;
  
  // Reset speed to base values before loading level
  initialSpeed = BASE_INITIAL_SPEED;
  MAX_SPEED = BASE_MAX_SPEED;
  window.lastSpeedIncreaseTime = null;
  window.speedMultiplier = 1;
  
  // Reset game state
  extraBalls = [];
  fallingTexts = [];
  brannasActive = false;
  brannasEndTime = 0;
  
  // Clear any existing background image
  if (levelBackgroundImg) {
    levelBackgroundImg = null;
  }
  
  // First try to load the specific level
  fetch(`https://raw.githubusercontent.com/Andysor/PoesGame/main/levels/level${levelNum}.json`)
    .then(res => {
      if (!res.ok) {
        // If level doesn't exist, load a random level but keep the level counter
        const randomLevel = AVAILABLE_LEVELS[Math.floor(Math.random() * AVAILABLE_LEVELS.length)];
        console.log('Level not found, loading random level:', randomLevel);
        return fetch(`https://raw.githubusercontent.com/Andysor/PoesGame/main/levels/level${randomLevel}.json`);
      }
      return res;
    })
    .then(res => res.json())
    .then(level => {
      console.log('Level data loaded successfully');
      
      rows = level.length;
      cols = level[0].length;

      brickWidth = Math.floor((canvas.width - 40 - (cols - 1) * 5) / cols);
      brickHeight = Math.floor(((canvas.height / 3) - (rows - 1) * 4) / rows);

      // Create array of all possible brick positions
      let availablePositions = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const b = level[r][c];
          // Consider both normal and special bricks, but exclude sausage and poesklap type
          if (b && !b.bonusScore && !b.extraBall) {
            availablePositions.push({r, c});
          }
        }
      }
      
      // Shuffle the positions
      for (let i = availablePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
      }

      // Create power-up assignments array
      let powerUpAssignments = [];
      let currentIndex = 0;

      // Add brannas
      if (currentIndex < availablePositions.length) {
        powerUpAssignments.push({type: 'brannas', position: availablePositions[currentIndex++]});
      }

      // Add extra life
      if (currentIndex < availablePositions.length) {
        powerUpAssignments.push({type: 'extraLife', position: availablePositions[currentIndex++]});
      }

      // Add skulls
      for (let i = 0; i < POWERUPS_PER_LEVEL.SKULL && currentIndex < availablePositions.length; i++) {
        powerUpAssignments.push({type: 'skull', position: availablePositions[currentIndex++]});
      }

      // Add coins
      for (let i = 0; i < POWERUPS_PER_LEVEL.COIN && currentIndex < availablePositions.length; i++) {
        powerUpAssignments.push({type: 'coin', position: availablePositions[currentIndex++]});
      }

      bricks = [];
      for (let r = 0; r < rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < cols; c++) {
          const b = level[r][c] || { type: "normal", destroyed: false, strength: 1 };
          
          // Initialize power-ups based on assignments
          let extraLife = false;
          let hasSkull = false;
          let hasBrannas = false;
          let hasCoin = false;
          
          // Assign power-ups to any brick that's not sausage or poesklap type
          if (!b.bonusScore && !b.extraBall) {
            const assignment = powerUpAssignments.find(a => a.position.r === r && a.position.c === c);
            if (assignment) {
              if (assignment.type === 'brannas') {
                hasBrannas = true;
              } else if (assignment.type === 'extraLife') {
                extraLife = true;
              } else if (assignment.type === 'skull') {
                hasSkull = true;
              } else if (assignment.type === 'coin') {
                hasCoin = true;
              }
            }
          }
          
          bricks[r][c] = {
            type: b.type || "normal",
            destroyed: false,
            strength: b.strength !== undefined ? b.strength : (b.type === "special" ? 3 : 1),
            bonusScore: !!b.bonusScore,
            extraBall: !!b.extraBall,
            special: !!b.special,
            effect: b.effect || null,
            extraLife: extraLife,
            hasSkull: hasSkull,
            hasBrannas: hasBrannas,
            hasCoin: hasCoin,
            x: c * (brickWidth + 5) + 20,
            y: r * (brickHeight + 4) + 80
          };
        }
      }

      // Reset variables for new level
      resetLevelState();

      // Load background image
      const bgName = `level${currentLevel}`;
      const exts = [".png", ".jpg", ".jpeg", ".webp"];
      let found = false;
      let attempts = 0;
      const maxAttempts = exts.length;

      function tryLoadImage(name) {
        return new Promise((resolve, reject) => {
          for (let ext of exts) {
            const img = new Image();
            img.onload = () => {
              if (!found) {
                levelBackgroundImg = img;
                found = true;
                resolve();
              }
            };
            img.onerror = () => {
              attempts++;
              if (attempts >= maxAttempts && !found) {
                const randomLevel = LEVEL_BACKGROUNDS[Math.floor(Math.random() * LEVEL_BACKGROUNDS.length)];
                tryLoadImage(randomLevel).then(resolve).catch(reject);
              }
            };
            img.src = `https://raw.githubusercontent.com/Andysor/PoesGame/main/images/levels/${name}${ext}`;
          }
        });
      }

      return tryLoadImage(bgName);
    })
    .then(() => {
      console.log('=== LEVEL LOAD COMPLETE ===');
      levelLoaded = true;
      loadingNextLevel = false;
      
      // Reset ball position and velocity
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
      ball.dx = 0;
      ball.dy = 0;
      
      // Ensure game is ready to start
      readyToStart = true;
      
      requestAnimationFrame(draw);
    })
    .catch(error => {
      console.error("Error loading level:", error);
      // If there's an error, try loading a random level
      const randomLevel = AVAILABLE_LEVELS[Math.floor(Math.random() * AVAILABLE_LEVELS.length)];
      console.log('Error loading level, trying random level:', randomLevel);
      loadingNextLevel = false; // Reset flag before retrying
      loadLevel(randomLevel);
    });
}

// Tilbakestill variabler for nytt level
function resetLevelState() {
  gameStarted = false;
  gameOver = false;
  extraBalls = [];
  fallingTexts = [];
  readyToStart = true; // Ensure game is ready to start after level reset
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

// Add a maximum speed cap based on level
function getMaxSpeedForLevel(level) {
  const levelMultiplier = Math.pow(1 + LEVEL_SPEED_INCREASE, level - 1);
  return {
    initial: BASE_INITIAL_SPEED * levelMultiplier,
    max: BASE_MAX_SPEED * levelMultiplier
  };
}

function updateSpeedForLevel() {
  // Always use base speed, no multipliers
  initialSpeed = BASE_INITIAL_SPEED;
  MAX_SPEED = getMaxSpeedForLevel(currentLevel).max;
  
  // If the ball is moving, set its exact speed
  if (ball.dx !== 0 || ball.dy !== 0) {
    const angle = Math.atan2(ball.dy, ball.dx);
    const speed = Math.min(initialSpeed, MAX_SPEED);
    ball.dx = speed * Math.cos(angle);
    ball.dy = speed * Math.sin(angle);
  }
  
  // Reset speed timer and multiplier
  window.lastSpeedIncreaseTime = null;
  window.speedMultiplier = 1;
  
  logBallSpeed('updateSpeedForLevel');
}

function resetSpeed() {
  // Reset to base speed
  initialSpeed = BASE_INITIAL_SPEED;
  MAX_SPEED = BASE_MAX_SPEED;
  window.lastSpeedIncreaseTime = null;
  window.speedMultiplier = 1;
  
  // Set initial velocity at 45 degrees
  ball.dx = COMPONENT_SPEED;
  ball.dy = -COMPONENT_SPEED;
  
  logBallSpeed('resetSpeed');
}

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
        restartGame();
        return;
      }
      if (readyToStart && levelLoaded && !gameStarted && (e.code === "Space" || e.key === " ")) {
        gameStarted = true;
        
        // Reset speed timer and multiplier
        window.lastSpeedIncreaseTime = Date.now();
        window.speedMultiplier = 1;
        
        // Set initial velocity at 45 degrees
        ball.dx = COMPONENT_SPEED;
        ball.dy = -COMPONENT_SPEED;
        
        logBallSpeed('ballStart');
      }
      if (e.key === "ArrowRight") rightPressed = true;
      if (e.key === "ArrowLeft") leftPressed = true;
    });

    document.addEventListener("keyup", e => {
      if (e.key === "ArrowRight") rightPressed = false;
      if (e.key === "ArrowLeft") leftPressed = false;
    });


    function drawBall() {
  // Safety check for ball position and radius
  if (!isFinite(ball.x) || !isFinite(ball.y) || !isFinite(ball.radius)) {
    console.error('Invalid ball values:', ball);
    // Reset ball to safe values
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.radius = 12;
    return;
  }

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
    // Safety check for extra ball position and radius
    if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.radius)) {
      console.error('Invalid extra ball values:', b);
      return; // Skip this ball
    }

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

    // Draw bottle
    if (t.isBottle) {
      const size = t.hit ? 80 + t.frame : 80; // Doubled from 40 to 80
      if (brannasImg.complete && brannasImg.naturalWidth > 0) {
        ctx.drawImage(brannasImg, t.x - size/2, t.y - size/2, size, size);
      } else {
        // Fallback if image not loaded
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(t.x - size/2 + size * 0.3, t.y - size/2 + size * 0.2);
        ctx.lineTo(t.x - size/2 + size * 0.7, t.y - size/2 + size * 0.2);
        ctx.lineTo(t.x - size/2 + size * 0.8, t.y - size/2 + size * 0.4);
        ctx.lineTo(t.x - size/2 + size * 0.8, t.y - size/2 + size * 0.8);
        ctx.lineTo(t.x - size/2 + size * 0.2, t.y - size/2 + size * 0.8);
        ctx.lineTo(t.x - size/2 + size * 0.2, t.y - size/2 + size * 0.4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }

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

    // Tegn mynt
    if (t.isCoin) {
      const size = t.hit ? 20 + t.frame : 20; // Reduced from 40 to 20 (50% smaller)
      if (coinImg.complete && coinImg.naturalWidth > 0) {
        ctx.drawImage(coinImg, t.x - size/2, t.y - size/2, size, size);
      } else {
        // Fallback hvis bildet ikke er lastet
        ctx.beginPath();
        ctx.arc(t.x, t.y, size/2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFD700";
        ctx.fill();
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = 2;
        ctx.stroke();
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

      if (t.isBottle) {
        brannasActive = true;
        brannasEndTime = Date.now() + BRANNAS_DURATION;
        showBrannas = true;
        brannasTimer = Date.now();
        playBrannasSound();
      } else if (t.isSkull) {
        lives--;
        playLifeLossSound();
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
      } else if (t.isCoin) {
        score += 10;
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

// Add at the top with other constants
const COLLISION_COOLDOWN = 100; // milliseconds between hits on the same brick

// Add this object to track last hit times
let lastHitTimes = {};

function detectBallCollision(b) {
  // Add a small buffer to prevent multiple collisions
  const COLLISION_BUFFER = 0.5;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const brick = bricks[r][c];
      if (brick.destroyed) continue;

      // Calculate the closest point on the brick to the ball
      const closestX = Math.max(brick.x, Math.min(b.x, brick.x + brickWidth));
      const closestY = Math.max(brick.y, Math.min(b.y, brick.y + brickHeight));

      // Calculate distance between closest point and ball center
      const distanceX = b.x - closestX;
      const distanceY = b.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;

      // Check if ball is colliding with brick (with buffer)
      if (distanceSquared < (b.radius * b.radius) + COLLISION_BUFFER) {
        // Create a unique key for this brick
        const brickKey = `${r}-${c}`;
        const now = Date.now();
        
        // Check if this brick was hit recently
        if (lastHitTimes[brickKey] && now - lastHitTimes[brickKey] < COLLISION_COOLDOWN) {
          continue;
        }
        
        // Update the last hit time
        lastHitTimes[brickKey] = now;

        

        // Only bounce if Brannas is not active
        if (!brannasActive) {
          // Determine which side of the brick was hit
          const overlapX = b.radius - Math.abs(distanceX);
          const overlapY = b.radius - Math.abs(distanceY);

          // Add a small random angle variation to prevent straight vertical/horizontal bounces
          const angleVariation = (Math.random() - 0.5) * 0.2; // ±0.1 radians

          // Bounce based on which side had the smaller overlap
          if (overlapX < overlapY) {
            b.dx = -b.dx * (1 + angleVariation);
            b.dy = b.dy * (1 + angleVariation);
          } else {
            b.dx = b.dx * (1 + angleVariation);
            b.dy = -b.dy * (1 + angleVariation);
          }

          // Ensure minimum horizontal velocity
          const minHorizontalSpeed = initialSpeed * 0.3;
          if (Math.abs(b.dx) < minHorizontalSpeed) {
            const sign = b.dx > 0 ? 1 : -1;
            b.dx = sign * minHorizontalSpeed;
          }
        }

        // Handle powerups and brick destruction
        if (brick.extraBall) {
          showPoesklap = true;
          poesklapTimer = Date.now();
          playPoesklapSound();
          
          // Create new extra ball for any ball hitting the brick
          const currentSpeed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
          const angle = Math.random() * Math.PI - Math.PI / 2;
          extraBalls.push({
            x: brick.x + brickWidth / 2,
            y: brick.y + brickHeight / 2,
            dx: currentSpeed * Math.cos(angle),
            dy: -Math.abs(currentSpeed * Math.sin(angle)),
            radius: 12,
            canBounce: false
          });
        }

        // Decrease strength for all blocks
        if (brick.strength > 0) {
          brick.strength--;
          
          if (brick.strength <= 0) {
            brick.destroyed = true;

            // Handle scoring and powerups
            if (brick.type === "normal") {
              score += 2;

              // Handle power-ups for normal bricks
              if (brick.extraLife) {
                fallingTexts.push({
                  text: "♥",
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  color: "red",
                  blink: false,
                  hit: false,
                  frame: 0,
                  isHeart: true
                });
              } else if (brick.hasBrannas) {
                fallingTexts.push({
                  isBottle: true,
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  hit: false,
                  frame: 0
                });
              } else if (brick.hasSkull) {
                fallingTexts.push({
                  text: "☠",
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  color: "#fff",
                  blink: false,
                  hit: false,
                  frame: 0,
                  isSkull: true
                });
              } else if (brick.hasCoin) {
                fallingTexts.push({
                  isCoin: true,
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  hit: false,
                  frame: 0
                });
              }

              // Handle bonus score for normal bricks
              if (brick.bonusScore) {
                fallingTexts.push({
                  isSausage: true,
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  hit: false,
                  frame: 0
                });
              }
            } else {
              // Handle special bricks
              if (brick.extraLife) {
                fallingTexts.push({
                  text: "♥",
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  color: "red",
                  blink: false,
                  hit: false,
                  frame: 0,
                  isHeart: true
                });
              } else if (brick.bonusScore) {
                score += 50;
                fallingTexts.push({
                  isSausage: true,
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  hit: false,
                  frame: 0
                });
              } else if (brick.hasBrannas) {
                fallingTexts.push({
                  isBottle: true,
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  hit: false,
                  frame: 0
                });
              } else if (brick.hasSkull) {
                fallingTexts.push({
                  text: "☠",
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  color: "#fff",
                  blink: false,
                  hit: false,
                  frame: 0,
                  isSkull: true
                });
              } else if (brick.hasCoin) {
                fallingTexts.push({
                  isCoin: true,
                  x: brick.x + brickWidth / 2,
                  y: brick.y,
                  speed: 1,
                  hit: false,
                  frame: 0
                });
              } else {
                score += 1;
                let isShrinkOrGrow = brick.special && (brick.effect === "extend" || brick.effect === "shrink");
                if (!isShrinkOrGrow || Math.random() < 0.3) {
                  if (brick.special && brick.effect === "extend") {
                    fallingTexts.push({
                      text: "😃",
                      x: brick.x + brickWidth / 2,
                      y: brick.y,
                      speed: 1,
                      color: "#fff",
                      blink: false,
                      hit: false,
                      frame: 0,
                      bonus: "extend"
                    });
                  } else if (brick.special && brick.effect === "shrink") {
                    fallingTexts.push({
                      text: "👺",
                      x: brick.x + brickWidth / 2,
                      y: brick.y,
                      speed: 1,
                      color: "#fff",
                      blink: false,
                      hit: false,
                      frame: 0,
                      bonus: "shrink"
                    });
                  }
                }
              }
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

    // Draw version number
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText(`v${GAME_VERSION}`, canvas.width - 10, 60);
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

// Add at the top with other constants
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0;

// Modify the draw function to include simpler frame rate control
function draw(currentTime) {
  // Calculate delta time
  if (!lastFrameTime) lastFrameTime = currentTime;
  const deltaTime = Math.min(currentTime - lastFrameTime, 100); // Cap at 100ms to prevent huge jumps
  lastFrameTime = currentTime;

  // Calculate movement factor based on frame time
  const movementFactor = (deltaTime / 1000) * TARGET_FPS;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawDynamicBackground();

  if (showPoesklap) {
    const elapsed = Date.now() - poesklapTimer;
    ctx.fillStyle = elapsed % 500 < 250 ? "yellow" : "orange";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("POESKLAP!", canvas.width / 2, canvas.height / 2);

    // Keep the effect visible for 1 second
    if (elapsed >= 1000) {
      showPoesklap = false;
    }
  }

  if (showBrannas) {
    const elapsed = Date.now() - brannasTimer;
    ctx.fillStyle = elapsed % 500 < 250 ? "#ff0000" : "#cc0000"; // Alternating between bright and dark red
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("BRANNAS!", canvas.width / 2, canvas.height / 2 + 100); // Positioned 100px below center

    // Keep the effect visible for 5 seconds
    if (elapsed >= 5000) {
      showBrannas = false;
    }
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
  if (!loadingNextLevel && gameStarted && bricks.flat().every(brick => brick.destroyed)) {
    console.log('=== LEVEL COMPLETE ===');
    console.log('Current level:', currentLevel);
    
    // Prevent multiple level transitions
    if (loadingNextLevel) return;
    
    loadingNextLevel = true;
    gameStarted = false; // Stop game updates during transition
    
    // Stop ball movement during transition
    ball.dx = 0;
    ball.dy = 0;
    extraBalls = [];
    
    // Store the next level number before the timeout
    const nextLevel = currentLevel + 1;
    console.log('Next level to load:', nextLevel);
    
    // Add a small delay to ensure current level is fully cleaned up
    setTimeout(() => {
      console.log('=== LEVEL TRANSITION TIMEOUT ===');
      console.log('Loading level:', nextLevel);
      loadingNextLevel = false; // Reset the flag before loading next level
      loadLevel(nextLevel);
    }, 2000);
    return;
  }

  if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
    ball.dx = -ball.dx;
    // Ensure minimum horizontal velocity to prevent vertical bouncing
    const minHorizontalSpeed = initialSpeed * 0.3; // 30% of initial speed
    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (Math.abs(ball.dx) < minHorizontalSpeed) {
      // Adjust horizontal velocity while maintaining total speed
      const sign = ball.dx > 0 ? 1 : -1;
      const newDx = sign * minHorizontalSpeed;
      const newDy = Math.sqrt(currentSpeed * currentSpeed - newDx * newDx) * (ball.dy > 0 ? 1 : -1);
      ball.dx = newDx;
      ball.dy = newDy;
    }
  }
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
    // Add slight horizontal movement when hitting top wall
    if (Math.abs(ball.dx) < initialSpeed * 0.2) {
      const sign = Math.random() < 0.5 ? 1 : -1;
      ball.dx = sign * initialSpeed * 0.2;
    }
  } if (ball.y + ball.dy > canvas.height - ball.radius) {
    lives--;
    playLifeLossSound();
    if (lives > 0) {
      gameStarted = false;
      ball.dx = 0;
      ball.dy = 0;
      resetSpeed();
    } else {
      gameOver = true;
      gameStarted = false;
      
      // Save highscore
      const name = playerName;
      if (name) {
        const trimmed = name.substring(0, 10);
        db.collection("highscores").add({
          name: trimmed,
          score,
          level: currentLevel,
          character: selectedCharacter,
          timestamp: Date.now()
        });
        loadHighscores();
      }

      // Show game over screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "red";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SPEL VERBY!", canvas.width / 2, canvas.height / 2);
      ctx.font = "20px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 40);
    }
  } else if (
    ball.y + ball.dy + ball.radius >= paddle.y && // Ball hits or goes under paddle top
    ball.y + ball.dy - ball.radius <= paddle.y + paddle.height && // Ball is not under paddle bottom
    ball.x + ball.radius >= paddle.x && // Ball hits paddle left edge
    ball.x - ball.radius <= paddle.x + paddle.width // Ball hits paddle right edge
  ) {
    // Calculate hit point relative to paddle center (-1 to 1)
    let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    
    // Calculate new angle based on hit point (-60 to 60 degrees)
    let angle = hitPoint * (Math.PI / 3);
    
    // Get current speed
    let currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    
    // Set new velocity while maintaining speed
    ball.dx = currentSpeed * Math.sin(angle);
    ball.dy = -Math.abs(currentSpeed * Math.cos(angle));
  }

  // Update ball position with frame rate control
  ball.x += ball.dx * movementFactor;
  ball.y += ball.dy * movementFactor;

  // Safety checks to keep ball within bounds
  if (ball.x < ball.radius) {
    ball.x = ball.radius;
    ball.dx = Math.abs(ball.dx);
  }
  if (ball.x > canvas.width - ball.radius) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -Math.abs(ball.dx);
  }
  if (ball.y < ball.radius) {
    ball.y = ball.radius;
    ball.dy = Math.abs(ball.dy);
  }
  if (ball.y > canvas.height - ball.radius) {
    lives--;
    playLifeLossSound();
    if (lives > 0) {
      gameStarted = false;
      ball.dx = 0;
      ball.dy = 0;
      resetSpeed();
    } else {
      gameOver = true;
      gameStarted = false;
      
      // Save highscore
      const name = playerName;
      if (name) {
        const trimmed = name.substring(0, 10);
        db.collection("highscores").add({
          name: trimmed,
          score,
          level: currentLevel,
          character: selectedCharacter,
          timestamp: Date.now()
        });
        loadHighscores();
      }

      // Show game over screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "red";
      ctx.font = "40px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SPEL VERBY!", canvas.width / 2, canvas.height / 2);
      ctx.font = "20px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  if (rightPressed && paddle.x < canvas.width - paddle.width) paddle.x += 2.5;
  if (leftPressed && paddle.x > 0) paddle.x -= 2.5;

  // Timer-based speed increase (2% every 10 seconds)
  if (gameStarted && !gameOver) {
    // Temporarily disabled speed increases
    // Only maintain speed if the ball is moving
    if (ball.dx !== 0 || ball.dy !== 0) {
      maintainBallSpeed();
    }
  }

  extraBalls.forEach(b => {
    // Update ball position with frame rate control
    b.x += b.dx * movementFactor;
    b.y += b.dy * movementFactor;

    // Aktiver bouncing etter første frame
    if (!b.canBounce) {
      b.canBounce = true;
    }

    // Veggkollisjoner med frame rate control
    if (b.x - b.radius < 0) {
      b.x = b.radius;
      b.dx = Math.abs(b.dx);
    }
    if (b.x + b.radius > canvas.width) {
      b.x = canvas.width - b.radius;
      b.dx = -Math.abs(b.dx);
    }
    if (b.y - b.radius < 0) {
      b.y = b.radius;
      b.dy = Math.abs(b.dy);
    }

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

  // Check if Brannas has expired
  if (brannasActive && Date.now() > brannasEndTime) {
    brannasActive = false;
  }

  requestAnimationFrame(draw);
}

// Modify the getSpeedState function to include multiplier information
function getSpeedState() {
  const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  const timeBasedMultiplier = window.lastSpeedIncreaseTime ? 
    Math.pow(SPEED_INCREASE_FACTOR, Math.floor((Date.now() - window.lastSpeedIncreaseTime) / SPEED_INCREASE_INTERVAL)) : 1;
  const levelMultiplier = Math.pow(1 + LEVEL_SPEED_INCREASE, currentLevel - 1);
  const maxAllowedSpeed = getMaxSpeedForLevel(currentLevel).max;
  
  return {
    initialSpeed,
    MAX_SPEED,
    currentSpeed,
    dx: ball.dx,
    dy: ball.dy,
    currentLevel,
    timeBasedMultiplier,
    levelMultiplier,
    maxAllowedSpeed,
    totalMultiplier: timeBasedMultiplier * levelMultiplier
  };
}

// Modify the maintainBallSpeed function to use level-based speeds
function maintainBallSpeed() {
  if (!gameStarted || gameOver || (ball.dx === 0 && ball.dy === 0)) {
    return;
  }

  // Calculate time-based multiplier
  const timeBasedMultiplier = window.lastSpeedIncreaseTime ? 
    Math.pow(SPEED_INCREASE_FACTOR, Math.floor((Date.now() - window.lastSpeedIncreaseTime) / SPEED_INCREASE_INTERVAL)) : 1;
  
  // Get speeds for current level
  const speeds = getMaxSpeedForLevel(currentLevel);
  
  // Calculate target speed with time multiplier
  const targetSpeed = speeds.initial * timeBasedMultiplier;
  
  // Cap at maximum allowed speed for level
  const finalTargetSpeed = Math.min(targetSpeed, speeds.max);

  const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
  
  // Only adjust speed if difference is significant (more than 1%)
  if (Math.abs(currentSpeed - finalTargetSpeed) > finalTargetSpeed * 0.01) {
    const angle = Math.atan2(ball.dy, ball.dx);
    ball.dx = finalTargetSpeed * Math.cos(angle);
    ball.dy = finalTargetSpeed * Math.sin(angle);
    logBallSpeed('maintainBallSpeed');
  }
}

// Modify the getMaxSpeedForLevel function to be more strict
function getMaxSpeedForLevel(level) {
  const levelMultiplier = Math.pow(1 + LEVEL_SPEED_INCREASE, level - 1);
  return {
    initial: BASE_INITIAL_SPEED * levelMultiplier,
    max: BASE_MAX_SPEED * levelMultiplier
  };
}

// Modify the setBallSpeed function to be more precise
function setBallSpeed(speed) {
  const currentAngle = Math.atan2(ball.dy, ball.dx);
  const newDx = speed * Math.cos(currentAngle);
  const newDy = speed * Math.sin(currentAngle);
  
  // Log before speed change
  logBallSpeed('beforeSetBallSpeed');
  
  ball.dx = newDx;
  ball.dy = newDy;
  
  // Log after speed change
  logBallSpeed('afterSetBallSpeed');
}

// Add to the draw function, after drawing the score
function drawBrannasStatus() {
  if (brannasActive) {
    const timeLeft = Math.ceil((brannasEndTime - Date.now()) / 1000);
    if (timeLeft <= 0) {
      brannasActive = false;
    } else {
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff0000";
      ctx.fillText(`BRANNAS: ${timeLeft}s`, canvas.width / 2, 80);
    }
  }
}

// Add to the draw function, after drawScore()
drawBrannasStatus();

// Add touch event prevention
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault(); // Prevent default touch behavior
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
  e.preventDefault(); // Prevent default touch behavior
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
  e.preventDefault(); // Prevent default touch behavior
}, { passive: false });

// Also prevent text selection on the entire game container
document.body.style.webkitTouchCallout = 'none';
document.body.style.webkitUserSelect = 'none';
document.body.style.khtmlUserSelect = 'none';
document.body.style.mozUserSelect = 'none';
document.body.style.msUserSelect = 'none';
document.body.style.userSelect = 'none';

