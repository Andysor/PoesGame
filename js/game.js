import { ASSETS, loadImage, loadSound, loadLevel } from './assets.js';
import { db, loadHighscores } from './firebase-init.js';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { 
    BASE_INITIAL_SPEED, 
    BASE_MAX_SPEED, 
    LEVEL_SPEED_INCREASE, 
    SPEED_INCREASE_INTERVAL, 
    SPEED_INCREASE_FACTOR,
    COMPONENT_SPEED
} from './config.js';
import { Level } from './level.js';
import { GameOverManager } from './gameOverManager.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { eventBus } from './eventBus.js';
import { PowerUp } from './powerup.js';

export class Game {
    constructor(app) {
        if (!app || !app.stage) {
            console.error('PIXI application not properly initialized');
            return;
        }

        this.app = app;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameStarted = false;
        this.readyToStart = false;
        this.playerName = '';
        this.selectedCharacter = ASSETS.images.characters.RugbyBall;
        this.gameOver = false;
        this.showHighscores = false;
        this.levelLoaded = false;
        this.loadingNextLevel = false;
        this.paddleHeads = 3;
        this.characterChosen = false;
        this.brannasActive = false;
        this.brannasEndTime = 0;
        this.extraBalls = [];
        this.fallingTexts = [];
        this.waitingForInput = true;
        this.inputMode = 'waitForStart'; // 'playing', 'gameover', etc.
        this.boundHandleGameStart = this.handleGameStart.bind(this);
        this.boundHandlePointerMove = this.handlePointerMove.bind(this);
        
        // Make stage interactive
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;
        
        
        // Create game container
        this.gameContainer = new PIXI.Container();
        

        this.app.stage.addChild(this.gameContainer);
        
        // Create UI container
        this.uiContainer = new PIXI.Container();
        this.gameContainer.addChild(this.uiContainer);
        
        // Create score text
        this.scoreText = new PIXI.Text('Score: 0', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        this.scoreText.position.set(10, 10);
        this.uiContainer.addChild(this.scoreText);
        
        // Create lives text
        this.livesText = new PIXI.Text('Lives: 3', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        this.livesText.position.set(app.screen.width - 100, 10);
        this.uiContainer.addChild(this.livesText);
        
        // Create level text
        this.levelText = new PIXI.Text('Level: 1', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        this.levelText.position.set(app.screen.width / 2 - 50, 10);
        this.uiContainer.addChild(this.levelText);
        
        // Create game over manager
        this.gameOverManager = new GameOverManager(app);
        
        // Create game objects container
        this.objectsContainer = new PIXI.Container();
        this.gameContainer.addChild(this.objectsContainer);
        this.powerUpContainer = new PIXI.Container();
        this.objectsContainer.addChild(this.powerUpContainer);
        
        // Initialize level instance
        this.levelInstance = new Level(app);
        this.objectsContainer.addChild(this.levelInstance.brickContainer);
        
        // Initialize paddle
        this.paddle = new Paddle(app);
        this.objectsContainer.addChild(this.paddle.graphics);
        
        // Load ball textures and initialize main ball
        Ball.loadTextures().then(async () => {
            await PowerUp.loadTextures();  // Add this line
            this.ball = new Ball(this.app);
            this.ball.game = this;
            this.ball.setLevel(this.levelInstance);
            this.objectsContainer.addChild(this.ball.graphics);
        });


        
        // Load sounds
        this.sounds = {
            hit: loadSound(ASSETS.sounds.hit),
            lifeLoss: loadSound(ASSETS.sounds.lifeLoss),
            poesklap: loadSound(ASSETS.sounds.poesKlap),
            brannas: loadSound(ASSETS.sounds.brannas)
        };
        
        // Load images
        this.images = {
            sausage: loadImage(ASSETS.images.items.sausage),
            coin: loadImage(ASSETS.images.items.coin),
            brannas: loadImage(ASSETS.images.items.brannas)
        };
    }

    //Handle pointer move
    handlePointerMove(e) {
        if (this.inputMode === 'waitForStart') {
            // For eksempel: marker at spilleren er klar til å starte
            this.handleGameStart(e);
        } else if (this.inputMode === 'playing') {
            // Flytt padel hvis ønskelig – eller kall paddle.handlePointerMove direkte:
            if (this.paddle && this.paddle.handlePointerMove) {
                this.paddle.handlePointerMove(e);
            }
        } else if (this.inputMode === 'gameOver') {
            // Kanskje ikke gjør noe – eller bruk som highscore-bla?
        }
    }

    //Center paddle and place ball
    centerPaddleAndPlaceBall() {
        // Flytt padelen til midten
        const paddleStartX = (this.app.screen.width - this.paddle.graphics.width) / 2;
        const paddleStartY = this.app.screen.height - this.paddle.graphics.height - 20;

        if (!this.paddle || !this.ball) return;

        this.paddle.graphics.x = paddleStartX;
        this.paddle.graphics.y = paddleStartY;

        // Sett target lik nåværende posisjon for å unngå lerp-glitch
        this.paddle.targetX = paddleStartX;
        this.paddle.targetY = paddleStartY;

        // Wait 1 frame before placing ball
        requestAnimationFrame(() => {
            console.log('🎬 Calling placeOnPaddle. Paddle at:', {
                x: this.paddle.graphics.x,
                y: this.paddle.graphics.y
            });
            console.log('🎬 Ball before placeOnPaddle:', {
                ballX: this.ball.graphics.x,
                ballY: this.ball.graphics.y,
                inBallArray: Ball.balls.includes(this.ball)
            });
            this.ball.placeOnPaddle(this.paddle);

            console.log('✅ Ball after placeOnPaddle:', {
                ballX: this.ball.graphics.x,
                ballY: this.ball.graphics.y
            });
        });
    }

    //Reset game state
    resetGameState() {
        console.log('🎮 Resetting game state...');
        
        // 1. Reset state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameStarted = false;
        this.gameOver = false;
        this.waitingForInput = false; // <– Ikke true enda
        this.showHighscores = false;
        this.extraBalls = [];
        this.levelLoaded = false;
        this.loadingNextLevel = true;
    
        // 2. Reset UI
        this.scoreText.text = `Score: ${this.score}`;
        this.livesText.text = `Lives: ${this.lives}`;
        this.levelText.text = `Level: ${this.level}`;
        this.scoreText.visible = true;
        this.livesText.visible = true;
        this.levelText.visible = true;
    
        // 3. Paddle til startposisjon
        if (this.paddle) {
            this.paddle.graphics.x = (this.app.screen.width - this.paddle.graphics.width) / 2;
            this.paddle.graphics.y = this.app.screen.height - this.paddle.graphics.height - 20;
        }
    
        // 4. Fjern gamle baller
        Ball.balls.forEach(ball => {
            if (ball.graphics && this.objectsContainer.children.includes(ball.graphics)) {
                this.objectsContainer.removeChild(ball.graphics);
            }
        });
        Ball.balls = [];
    
        // 5. Last nivå
        this.levelInstance.loadLevel(this.level).then(() => {
            this.levelLoaded = true;
            this.loadingNextLevel = false;
    
            // 🆕 6. Lag ny ball og plasser den
            this.ball = new Ball(this.app);
            this.ball.game = this;
            this.ball.setLevel(this.levelInstance);
            this.objectsContainer.addChild(this.ball.graphics);
            this.ball.placeOnPaddle(this.paddle);
    
            console.log('🆕 New ball placed after resetGameState');
    
            // 7. Klar til input
            this.waitingForInput = true;
            this.inputMode = 'waitForStart';
    
            // Sørg for å lytte på input
            this.app.stage.off('pointerdown', this.boundHandleGameStart);
            this.app.stage.on('pointerdown', this.boundHandleGameStart);
        });
    }
    
    
    handleGameOverClick(e) {
        if (!this.gameOver) return;
        
        if (!this.showHighscores) {
            console.log('🔄 Transition: Game Over -> High Scores');
            // Stop the game and hide game elements
            this.gameStarted = false;
            this.scoreText.visible = false;
            this.livesText.visible = false;
            this.levelText.visible = false;
            
            // Hide game elements (bricks, paddle, ball)
            if (this.app.stage.children) {
                this.app.stage.children.forEach(child => {
                    if (child !== this.gameOverContainer && 
                        child !== this.scoreText && 
                        child !== this.livesText && 
                        child !== this.levelText) {
                        child.visible = false;
                    }
                });
            }
            
            this.showHighscores = true;
            this.loadHighscores();
        } else {
            console.log('🔄 Before High Scores -> New Game:', {
                gameStarted: this.gameStarted,
                gameOver: this.gameOver,
                showHighscores: this.showHighscores,
                waitingForInput: this.waitingForInput
            });

            // First hide the high score screen
            this.gameOverContainer.visible = false;
            this.showHighscores = false;
            this.gameOver = false;
            this.waitingForInput = true;

            // Remove all pointer event listeners
            this.app.stage.removeAllListeners('pointermove');

            console.log('🔄 After state reset:', {
                gameStarted: this.gameStarted,
                gameOver: this.gameOver,
                showHighscores: this.showHighscores,
                waitingForInput: this.waitingForInput
            });

            // Initialize fresh game state
            this.resetGameState();

            console.log('🔄 After game initialization:', {
                gameStarted: this.gameStarted,
                gameOver: this.gameOver,
                showHighscores: this.showHighscores,
                waitingForInput: this.waitingForInput
            });

            // Add a small delay before setting up the game start listener
            setTimeout(() => {
                this.app.stage.on('pointerdown', this.handleGameStart.bind(this));
            }, 100);
        }
    }

    handleStartInput(e) {
        if (e?.preventDefault) e.preventDefault();
    
        if (this.isMoving) return;
    
        console.log("🚀 Ball start triggered");
        this.start();
    }

    handleGameStart(e) {
        if (this.waitingForInput) {
            console.log('🎮 Game Start: Input received, ball will start moving');
            this.waitingForInput = false;
            this.gameStarted = true;
            this.inputMode = 'playing'; // 🎮 Viktig!
    
            // Start ball
            const mainBall = Ball.balls.find(b => !b.isExtraBall);
            if (mainBall && !mainBall.isMoving) {
                mainBall.start();
            }
        }
    }
    
    displayHighscores(highscoreList) {
        // Clear existing highscore display
        while (this.gameOverContainer.children.length > 3) {
            this.gameOverContainer.removeChild(this.gameOverContainer.children[3]);
        }

        if (!highscoreList || highscoreList.length === 0) {
            // Show message if no highscores
            const noScoresText = new PIXI.Text('Geen hoë tellings nie', {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0xFFFFFF,
                align: 'center'
            });
            noScoresText.anchor.set(0.5);
            noScoresText.x = this.app.screen.width / 2;
            noScoresText.y = 230;
            this.gameOverContainer.addChild(noScoresText);
            return;
        }

        const fontSize = Math.max(12, Math.floor(this.app.screen.height * 0.018));
        const lineHeight = fontSize * 2;
        const imgSize = fontSize * 2;

        // Column positions
        const xImg = 10;
        const xName = xImg + imgSize + 6;
        const xScore = xName + 250;
        const xLevel = xScore + 100;
        const xDate = xLevel + 100;
        const yStart = 230;

        // Add column headers
        const headers = new PIXI.Text('Naam\tPunte\tLvl\tDatum', {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        headers.x = xName;
        headers.y = yStart;
        this.gameOverContainer.addChild(headers);

        // Add each highscore entry
        highscoreList.forEach((entry, i) => {
            const y = yStart + lineHeight * (i + 1);
            const textYOffset = imgSize / 1.3;

            // Character image
            const img = PIXI.Sprite.from(entry.character || ASSETS.images.characters.RugbyBall);
            img.width = imgSize;
            img.height = imgSize;
            img.x = xImg;
            img.y = y - imgSize + fontSize;
            this.gameOverContainer.addChild(img);

            // Name
            const nameText = new PIXI.Text(entry.name, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fill: 0xFFFFFF
            });
            nameText.x = xName;
            nameText.y = y + textYOffset - imgSize + fontSize;
            this.gameOverContainer.addChild(nameText);

            // Score
            const scoreText = new PIXI.Text(entry.score, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fill: 0xFFFFFF
            });
            scoreText.x = xScore;
            scoreText.y = y + textYOffset - imgSize + fontSize;
            this.gameOverContainer.addChild(scoreText);

            // Level
            const levelText = new PIXI.Text(entry.level || 1, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fill: 0xFFFFFF
            });
            levelText.x = xLevel;
            levelText.y = y + textYOffset - imgSize + fontSize;
            this.gameOverContainer.addChild(levelText);

            // Date
            const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '';
            const dateText = new PIXI.Text(dateStr, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fill: 0xFFFFFF
            });
            dateText.x = xDate;
            dateText.y = y + textYOffset - imgSize + fontSize;
            this.gameOverContainer.addChild(dateText);
        });

        // Add tap to restart text
        const tapToRestartText = new PIXI.Text('Raak vir \'n nuwe spel', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        });
        tapToRestartText.anchor.set(0.5);
        tapToRestartText.x = this.app.screen.width / 2;
        tapToRestartText.y = yStart + lineHeight * (highscoreList.length + 2);
        this.gameOverContainer.addChild(tapToRestartText);
    }

    async loadHighscores() {
        try {
            // Clear existing display first
            while (this.gameOverContainer.children.length > 3) {
                this.gameOverContainer.removeChild(this.gameOverContainer.children[3]);
            }

            const highscoresRef = collection(db, "highscores");
            const q = query(highscoresRef, orderBy("score", "desc"), limit(10));
            const snapshot = await getDocs(q);

            const highscoreList = snapshot.docs.map(doc => doc.data());
            this.displayHighscores(highscoreList);
            // Show the container after loading highscores
            this.gameOverContainer.visible = true;
        } catch (error) {
            console.error("Error loading highscores:", error);
            // Show error message
            const errorText = new PIXI.Text('Fout met laai van hoë tellings', {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0xFF0000,
                align: 'center'
            });
            errorText.anchor.set(0.5);
            errorText.x = this.app.screen.width / 2;
            errorText.y = 230;
            this.gameOverContainer.addChild(errorText);
            this.gameOverContainer.visible = true;
        }
    }
    
    playSound(type) {
        if (this.sounds[type]) {
            this.sounds[type].play();
        }
    }
    
    async loadLevelData(levelNum) {
        return await loadLevel(levelNum);
    }
    
    start() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.waitingForInput = false;
        console.log('🎮 Starting game...');
        
        // Show UI elements
        if (this.scoreText) this.scoreText.visible = true;
        if (this.livesText) this.livesText.visible = true;
        if (this.levelText) this.levelText.visible = true;
        
        // Show game elements
        if (this.app.stage.children) {
            this.app.stage.children.forEach(child => {
                if (child !== this.gameOverManager.gameOverContainer && 
                    child !== this.gameOverManager.highscoreContainer) {
                    child.visible = true;
                }
            });
        }
        
        // Start the game loop
        this.app.ticker.start();
        
        
        
    }
    
    restart() {
        // Reset game state
        this.resetGameState();
        
        // Start the game
        this.start();
    }
    
    update() {
        // Don't process any game logic if showing high scores or game over
        if (this.showHighscores || this.gameOver) {
            return;
        }
        
        // Don't update if game hasn't started or is waiting for input
        if (!this.gameStarted || this.waitingForInput) {
            return;
        }
        
        // Check for game over
        if (this.lives <= 0) {
            this.updateLives();
            return;
        }
        
        if(!this.levelLoaded || this.loadingNextLevel) return;

        // Update paddle
        if (this.paddle) {
            this.paddle.update();
        }
        
        // Update all balls
        let lifeLost = false;
        let brickHit = false;
        
        if (Ball.balls && Ball.balls.length > 0) {
            Ball.balls.forEach(ball => {
                if (ball && ball.update) {
                    const result = ball.update(this.paddle, this.levelInstance);
                    
                    if (result.lifeLost) {
                        lifeLost = true;
                    }
                    if (result.brickHit) {
                        brickHit = true;
                    }
                }
            });
        }
        
        // Handle life lost
        if (lifeLost) {
            this.loseLife();
            this.inputMode = 'waitForStart';
            this.waitingForInput = true;
        }
        
        // Handle brick hit
        if (brickHit) {
            this.addScore(10);
        }
        
        // Update level
        if (this.levelInstance) {
            this.levelInstance.update();
        }
        
        // Update UI elements
        this.updateScore();
        this.updateLives();
        this.updateLevel();
    }
    
    updateScore() {
        this.scoreText.text = `Score: ${this.score}`;
    }
    
    updateLives() {
        this.livesText.text = `Lives: ${this.lives}`;
        if (this.lives <= 0 && !this.gameOver) {
            console.log('🎮 Game over state triggered');
            this.gameOver = true;
            this.gameStarted = false;
            this.waitingForInput = true;
            
            // Hide game elements
            this.scoreText.visible = false;
            this.livesText.visible = false;
            this.levelText.visible = false;
            
            // Delegate all game over handling to GameOverManager
            this.gameOverManager.handleGameOver(this.score, this);
        }
    }
    
    updateLevel() {
        this.levelText.text = `Level: ${this.level}`;
    }
    
    addScore(points) {
        this.score += points;
        this.updateScore();
    }
    
    async loseLife() {
        // Remove all extra balls first
        await Ball.resetAll(this.app, this, this.levelInstance);
        const newBall = Ball.resetAll(this.app, this, this.levelInstance);
        this.ball = newBall;
        
        // Then update lives and play sound
        this.lives--;
        this.updateLives();
        this.playSound('lifeLoss');
        this.waitingForInput = true;

        //Center paddle and place ball
        this.centerPaddleAndPlaceBall();

        this.app.stage.once('pointerdown', this.handleGameStart.bind(this));
    }
    
    async nextLevel() {
        this.level++;
        this.updateLevel();
        this.levelLoaded = false;
        this.loadingNextLevel = true;
        
        // Remove all extra balls before loading next level
        await Ball.resetAll(this.app, this, this.levelInstance);
        
        // Load the next level
        this.levelInstance.loadLevel(this.level).then(() => {
            this.levelLoaded = true;
            this.loadingNextLevel = false;

            // Reset ball position and speed
            if (this.ball) {
                this.ball.reset();
                this.ball.setLevel(this.levelInstance);
            }
            
            // Reset paddle position
            if (this.paddle) {
                this.paddle.graphics.x = (this.app.screen.width - this.paddle.graphics.width) / 2;
            }
        });
    }
    
    showGameOver() {
        // Only show game over if not already in game over state
        if (this.gameOver) return;
        
        console.log('💀 Game Over: Lives depleted');
        this.gameOver = true;
        this.gameStarted = false;
        
        // Stop the game loop
        this.app.ticker.stop();
        
        // Show game over screen
        this.gameOverContainer.visible = true;
        
        // Show game over screen
        this.gameOverManager.showGameOver(this.score, () => {
            this.showHighscores = true;
            this.gameOver = false;
            this.resetGameState();
            this.app.ticker.start();
        });
    }

    resetBallSpeed() {
        // Reset to base speed
        this.initialSpeed = BASE_INITIAL_SPEED;
        this.maxSpeed = BASE_MAX_SPEED;
        this.componentSpeed = COMPONENT_SPEED;
        
        // Reset speed timer and multiplier
        this.lastSpeedIncreaseTime = null;
        this.speedMultiplier = 1;
    }

    getMaxSpeedForLevel(level) {
        return {
            initial: BASE_INITIAL_SPEED,
            max: BASE_MAX_SPEED * (1 + (level - 1) * LEVEL_SPEED_INCREASE)
        };
    }

    maintainBallSpeed() {
        if (!this.gameStarted || this.gameOver || (this.ball.dx === 0 && this.ball.dy === 0)) {
            return;
        }

        // Calculate time-based multiplier
        const timeBasedMultiplier = this.lastSpeedIncreaseTime ? 
            Math.pow(SPEED_INCREASE_FACTOR, Math.floor((Date.now() - this.lastSpeedIncreaseTime) / SPEED_INCREASE_INTERVAL)) : 1;
        
        // Get speeds for current level
        const speeds = this.getMaxSpeedForLevel(this.level);
        
        // Calculate target speed with time multiplier
        const targetSpeed = speeds.initial * timeBasedMultiplier;
        
        // Cap at maximum allowed speed for level
        const finalTargetSpeed = Math.min(targetSpeed, speeds.max);

        const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
        
        // Only adjust speed if difference is significant (more than 1%)
        if (Math.abs(currentSpeed - finalTargetSpeed) > finalTargetSpeed * 0.01) {
            const angle = Math.atan2(this.ball.dy, this.ball.dx);
            this.ball.dx = finalTargetSpeed * Math.cos(angle);
            this.ball.dy = finalTargetSpeed * Math.sin(angle);
        }
    }

    setBallSpeed(speed) {
        const currentAngle = Math.atan2(this.ball.dy, this.ball.dx);
        this.ball.dx = speed * Math.cos(currentAngle);
        this.ball.dy = speed * Math.sin(currentAngle);
    }

    handleCharacterSelect() {
        // Hide character select screen
        this.characterSelectContainer.visible = false;
        
        // Initialize fresh game state
        this.resetGameState();
    }
} 