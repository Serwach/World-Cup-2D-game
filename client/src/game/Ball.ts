import Phaser from 'phaser';
import type { Player } from './Player';
import {
  FIELD_LEFT, FIELD_RIGHT, FIELD_TOP, FIELD_BOTTOM,
  BALL_RADIUS, BALL_FRICTION, BALL_MIN_SPEED,
  GOAL_TOP, GOAL_BOTTOM, GOAL_DEPTH,
} from '@shared/constants';

export class Ball extends Phaser.GameObjects.Container {
  public vx = 0;
  public vy = 0;
  public controller: Player | null = null;
  private circle!: Phaser.GameObjects.Arc;
  private shadow!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.shadow = scene.add.ellipse(2, 4, BALL_RADIUS * 2.4, BALL_RADIUS * 1.2, 0x000000, 0.3);
    this.circle = scene.add.arc(0, 0, BALL_RADIUS, 0, 360, false, 0xffffff);
    this.circle.setStrokeStyle(1.5, 0x333333);

    // Draw pentagon/hex pattern on ball
    const pattern = scene.add.graphics();
    pattern.lineStyle(1, 0x333333, 0.8);
    // Simplified: a few lines to suggest ball stitching
    pattern.lineBetween(-BALL_RADIUS * 0.5, -BALL_RADIUS * 0.5, BALL_RADIUS * 0.5, BALL_RADIUS * 0.5);
    pattern.lineBetween(-BALL_RADIUS * 0.5, BALL_RADIUS * 0.5, BALL_RADIUS * 0.5, -BALL_RADIUS * 0.5);

    this.add([this.shadow, this.circle, pattern]);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  update(delta: number) {
    const dt = delta / 1000;

    if (this.controller) {
      this.syncWithController();
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Apply friction
    this.vx *= Math.pow(BALL_FRICTION, delta / (1000 / 60));
    this.vy *= Math.pow(BALL_FRICTION, delta / (1000 / 60));

    // Stop very slow movement
    if (Math.abs(this.vx) < BALL_MIN_SPEED) this.vx = 0;
    if (Math.abs(this.vy) < BALL_MIN_SPEED) this.vy = 0;

    this.handleWallBounce();

    // Rotate visual slightly based on movement
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.circle.angle += speed * dt * 3;
  }

  private handleWallBounce() {
    const r = BALL_RADIUS;

    // Left wall (but allow goals)
    if (this.x - r < FIELD_LEFT) {
      if (this.y >= GOAL_TOP && this.y <= GOAL_BOTTOM) {
        // Inside goal — let it pass through for goal detection
        if (this.x < FIELD_LEFT - GOAL_DEPTH - r) {
          // Behind goal — bounce back
          this.x = FIELD_LEFT - GOAL_DEPTH + r;
          this.vx = Math.abs(this.vx) * 0.6;
        }
      } else {
        this.x = FIELD_LEFT + r;
        this.vx = Math.abs(this.vx) * 0.75;
      }
    }

    // Right wall (but allow goals)
    if (this.x + r > FIELD_RIGHT) {
      if (this.y >= GOAL_TOP && this.y <= GOAL_BOTTOM) {
        if (this.x > FIELD_RIGHT + GOAL_DEPTH + r) {
          this.x = FIELD_RIGHT + GOAL_DEPTH - r;
          this.vx = -Math.abs(this.vx) * 0.6;
        }
      } else {
        this.x = FIELD_RIGHT - r;
        this.vx = -Math.abs(this.vx) * 0.75;
      }
    }

    // Top wall
    if (this.y - r < FIELD_TOP) {
      this.y = FIELD_TOP + r;
      this.vy = Math.abs(this.vy) * 0.75;
    }

    // Bottom wall
    if (this.y + r > FIELD_BOTTOM) {
      this.y = FIELD_BOTTOM - r;
      this.vy = -Math.abs(this.vy) * 0.75;
    }
  }

  isGoalLeft(): boolean {
    return this.x - BALL_RADIUS < FIELD_LEFT - GOAL_DEPTH &&
      this.y >= GOAL_TOP && this.y <= GOAL_BOTTOM;
  }

  isGoalRight(): boolean {
    return this.x + BALL_RADIUS > FIELD_RIGHT + GOAL_DEPTH &&
      this.y >= GOAL_TOP && this.y <= GOAL_BOTTOM;
  }

  reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.controller = null;
  }

  setController(player: Player | null) {
    this.controller = player;
    this.vx = 0;
    this.vy = 0;
    if (player) {
      this.syncWithController();
    }
  }

  private syncWithController() {
    if (!this.controller) return;
    const carryOffset = 14;
    const angle = this.controller.facingAngle;
    this.x = this.controller.x + Math.cos(angle) * carryOffset;
    this.y = this.controller.y + Math.sin(angle) * carryOffset;
    this.vx = 0;
    this.vy = 0;
  }

  getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  applyForce(forceX: number, forceY: number) {
    this.vx += forceX;
    this.vy += forceY;
  }

  setVelocity(vx: number, vy: number) {
    this.vx = vx;
    this.vy = vy;
    this.controller = null;
  }
}
