import { PADDLE_HOVER_OFFSET, PADDLE_BOTTOM_MARGIN, POWER_UP_DURATION, PADDLE_SPEED, PADDLE_HEIGHT } from './config.js';
import { ASSETS } from './assets.js';

export class Paddle {
    constructor(app) {
        this.app = app;
        this.width = 100;
        this.height = PADDLE_HEIGHT;
        this.speed = PADDLE_SPEED;
        this.baseWidth = 100;

        // Power-up duration tracking
        this.powerUpEndTime = 0;
        this.isExtended = false;
        this.isShrunk = false;

        // Movement tracking for ball collision
        this.lastX = 0;
        this.velocityX = 0;

        // Create paddle sprite instead of graphics
        this.sprite = PIXI.Sprite.from(ASSETS.images.items.paddle_main);
        this.sprite.width = this.width;
        this.sprite.height = this.height;
        this.sprite.anchor.set(0.5, 0.5); // Center the anchor point

        // Set initial position using centralized method
        this.setStartingPosition();

        this.sprite.name = 'paddle';

        // Initialize target position for lerp
        this.targetX = this.sprite.x;
        this.targetY = this.sprite.y;

        //this.app.stage.eventMode = 'static';
        //this.app.stage.on('pointermove', this.handlePointerMove.bind(this));
    }

    setStartingPosition() {
        // Center horizontally
        this.sprite.x = this.app.screen.width / 2;
        
        // Position from bottom using config value
        this.sprite.y = this.app.screen.height - PADDLE_BOTTOM_MARGIN;
        
        // Update target positions to match
        this.targetX = this.sprite.x;
        this.targetY = this.sprite.y;
    }

    handlePointerMove(e, ballIsMoving = true) {
        this.targetX = e.global.x;
        
        // Only allow Y movement if the ball is moving (active gameplay)
        // When ball is not moving (restarting), keep Y position fixed
        if (ballIsMoving) {
            // Set Y position to hover 15% of screen height above the touch point
            const hoverOffset = this.app.screen.height * PADDLE_HOVER_OFFSET;
            this.targetY = e.global.y - hoverOffset;
        }
        // If ballIsMoving is false, targetY remains unchanged, keeping the paddle at its current Y position
    }

    update() {
        // Check power-up status first
        this.updatePowerUpStatus();

        // Store previous position for velocity calculation
        this.lastX = this.sprite.x;

        // Speed-based movement for better responsiveness
        const paddleSpeed = this.speed; // Use instance speed property
        
        // Move toward target X position
        const distanceX = this.targetX - this.sprite.x;
        const directionX = Math.sign(distanceX);
        const moveDistanceX = Math.min(Math.abs(distanceX), paddleSpeed);
        this.sprite.x += directionX * moveDistanceX;
        
        // Move toward target Y position
        const distanceY = this.targetY - this.sprite.y;
        const directionY = Math.sign(distanceY);
        const moveDistanceY = Math.min(Math.abs(distanceY), paddleSpeed);
        this.sprite.y += directionY * moveDistanceY;

        // Calculate velocity
        this.velocityX = this.sprite.x - this.lastX;

        // Bound X
        const minX = this.width / 2;
        const maxX = this.app.screen.width - this.width / 2;
        this.sprite.x = Math.max(minX, Math.min(this.sprite.x, maxX));

        // Bound Y
        const minY = this.app.screen.height * 0.45;
        const maxY = this.app.screen.height - PADDLE_BOTTOM_MARGIN;
        this.sprite.y = Math.max(minY, Math.min(this.sprite.y, maxY));
    }

    extend() {
        this.width = this.baseWidth * 1.5;
        this.isExtended = true;
        this.isShrunk = false;
        this.powerUpEndTime = Date.now() + POWER_UP_DURATION;
        this.updateSprite();
    }

    shrink() {
        this.width = this.baseWidth * 0.75;
        this.isShrunk = true;
        this.isExtended = false;
        this.powerUpEndTime = Date.now() + POWER_UP_DURATION;
        this.updateSprite();
    }

    reset() {
        this.width = this.baseWidth;
        this.isExtended = false;
        this.isShrunk = false;
        this.powerUpEndTime = 0;
        this.updateSprite();
        
        // Don't reset position - let the paddle stay where the player is controlling it
        // this.setStartingPosition(); // REMOVED - this was causing the position reset bug
    }

    updateSprite() {
        // Store current center position
        const centerX = this.sprite.x;
        const centerY = this.sprite.y;
        
        // Update only sprite width, keep height constant
        this.sprite.width = this.width;
        // Keep the original height from the sprite texture
        this.sprite.height = this.height;
        
        // Restore center position
        this.sprite.x = centerX;
        this.sprite.y = centerY;
    }

    get x() {
        return this.sprite.x - this.width / 2;
    }

    get y() {
        return this.sprite.y - this.height / 2;
    }

    get graphics() {
        // For backward compatibility with existing code
        return this.sprite;
    }

    updatePowerUpStatus() {
        // Check if power-up duration has expired
        if (this.powerUpEndTime > 0 && Date.now() > this.powerUpEndTime) {
            this.reset();
        }
    }
}
