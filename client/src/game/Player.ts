import Phaser from 'phaser';
import { ApiPlayer } from '../api';
import {
  PLAYER_SPEED, PLAYER_CHARGE_SPEED, PLAYER_RADIUS, HEAD_RADIUS,
  FIELD_LEFT, FIELD_RIGHT, FIELD_TOP, FIELD_BOTTOM,
  BALL_RADIUS, MAX_KICK_POWER, MIN_KICK_POWER,
} from '@shared/constants';
import { Ball } from './Ball';
import { evaluateBallInteraction } from './ballControl';

export interface PlayerInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean;
  actionJustPressed: boolean;
  actionJustReleased: boolean;
}

export class Player extends Phaser.GameObjects.Container {
  public data_player: ApiPlayer;
  public teamIndex: 0 | 1; // 0 = left team, 1 = right team
  public isActive = false; // currently controlled
  public isCharging = false;
  public chargePower = 0; // 0..1
  public facingAngle = 0; // radians, 0 = right
  public vx = 0;
  public vy = 0;
  public isGK: boolean;

  private bodyRect!: Phaser.GameObjects.Rectangle;
  private head!: Phaser.GameObjects.Image;
  private leftArm!: Phaser.GameObjects.Rectangle;
  private rightArm!: Phaser.GameObjects.Rectangle;
  private leftLeg!: Phaser.GameObjects.Rectangle;
  private rightLeg!: Phaser.GameObjects.Rectangle;
  private shortsPart!: Phaser.GameObjects.Rectangle;
  private activeDot!: Phaser.GameObjects.Arc;
  private nameText!: Phaser.GameObjects.Text;
  private isMoving = false;
  private animTime = 0;

  private primaryColor: number;
  private secondaryColor: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: ApiPlayer,
    teamIndex: 0 | 1,
    primaryColor: number,
    secondaryColor: number,
    faceVariant: number
  ) {
    super(scene, x, y);
    this.data_player = player;
    this.teamIndex = teamIndex;
    this.isGK = player.position === 'GK';
    this.primaryColor = primaryColor;
    this.secondaryColor = secondaryColor;

    // Default facing: left team faces right, right team faces left
    this.facingAngle = teamIndex === 0 ? 0 : Math.PI;

    this.buildSprite(faceVariant);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
  }

  private buildSprite(faceVariant: number) {
    // Shadow
    const shadow = this.scene.add.ellipse(2, 20, 24, 10, 0x000000, 0.25);

    // Legs (drawn below body)
    this.leftLeg = this.scene.add.rectangle(-5, 16, 6, 12, this.secondaryColor);
    this.rightLeg = this.scene.add.rectangle(5, 16, 6, 12, this.secondaryColor);
    this.leftLeg.setOrigin(0.5, 0);
    this.rightLeg.setOrigin(0.5, 0);

    // Shoes
    const leftShoe = this.scene.add.rectangle(-5, 28, 8, 4, 0x222222);
    const rightShoe = this.scene.add.rectangle(5, 28, 8, 4, 0x222222);

    // Body/shirt
    this.bodyRect = this.scene.add.rectangle(0, 6, 20, 18, this.primaryColor);
    this.bodyRect.setStrokeStyle(1, this.secondaryColor);

    // Shorts
    this.shortsPart = this.scene.add.rectangle(0, 16, 20, 8, this.secondaryColor);

    // Arms
    this.leftArm = this.scene.add.rectangle(-12, 4, 5, 14, this.primaryColor);
    this.rightArm = this.scene.add.rectangle(12, 4, 5, 14, this.primaryColor);
    this.leftArm.setOrigin(0.5, 0);
    this.rightArm.setOrigin(0.5, 0);
    this.leftArm.setStrokeStyle(1, this.secondaryColor);
    this.rightArm.setStrokeStyle(1, this.secondaryColor);

    // Head
    const headTextureKey = this.scene.textures.exists(`face_${faceVariant}`) ? `face_${faceVariant}` : 'face_default';
    this.head = this.scene.add.image(0, -10, headTextureKey)
      .setDisplaySize(HEAD_RADIUS * 2.8, HEAD_RADIUS * 2.8)
      .setOrigin(0.5, 0.5);

    // Shirt number
    const numText = this.scene.add.text(0, 6, String(this.data_player.shirt_number), {
      fontSize: '7px', color: this.getContrastColor(this.primaryColor),
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Name label (above head)
    this.nameText = this.scene.add.text(0, -26, this.getShortName(), {
      fontSize: '8px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Active indicator (dot above head)
    this.activeDot = this.scene.add.arc(0, -32, 4, 0, 360, false, 0x00ff88);
    this.activeDot.setVisible(false);

    this.add([shadow, this.leftLeg, this.rightLeg, leftShoe, rightShoe,
              this.bodyRect, this.shortsPart, this.leftArm, this.rightArm,
              this.head, numText, this.nameText, this.activeDot]);
  }

  update(delta: number, input: PlayerInputState | null, ball: Ball) {
    const dt = delta / 1000;
    this.animTime += delta;

    const inputToUse = input;
    this.isMoving = false;

    if (inputToUse) {
      this.processInput(inputToUse, dt, ball);
    }

    // Apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp to field
    this.x = Phaser.Math.Clamp(this.x, FIELD_LEFT + PLAYER_RADIUS, FIELD_RIGHT - PLAYER_RADIUS);
    this.y = Phaser.Math.Clamp(this.y, FIELD_TOP + PLAYER_RADIUS + 10, FIELD_BOTTOM - PLAYER_RADIUS);

    // Update animation
    this.updateAnimation();
    this.updateDepth();

    // Active indicator
    this.activeDot.setVisible(this.isActive && input !== null);
  }

  private processInput(input: PlayerInputState, dt: number, ball: Ball) {
    let dx = 0;
    let dy = 0;

    if (input.up && !input.down) dy = -1;
    if (input.down && !input.up) dy = 1;
    if (input.left && !input.right) dx = -1;
    if (input.right && !input.left) dx = 1;

    const decision = evaluateBallInteraction({
      distToBall: Phaser.Math.Distance.Between(this.x, this.y, ball.x, ball.y),
      isCharging: this.isCharging,
      actionJustPressed: input.actionJustPressed,
      hasBallController: ball.controller !== null,
      controllerIsSelf: ball.controller === this,
      ballSpeed: ball.getSpeed(),
      controlRange: PLAYER_RADIUS + BALL_RADIUS + 6,
      stealRange: PLAYER_RADIUS + BALL_RADIUS + 24,
      interceptRange: PLAYER_RADIUS + BALL_RADIUS + 28,
    });

    if (decision.shouldSteal || decision.shouldIntercept) {
      this.stealBall(ball);
    } else if (decision.shouldTakeControl) {
      this.takeBall(ball);
    }

    const isCharging = ball.controller === this && input.action;
    const speed = isCharging ? PLAYER_CHARGE_SPEED : PLAYER_SPEED;

    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;

      this.vx = dx * speed;
      this.vy = dy * speed;
      this.facingAngle = Math.atan2(dy, dx);
      this.isMoving = true;
    } else {
      this.vx *= 0.7;
      this.vy *= 0.7;
      if (Math.abs(this.vx) < 10) this.vx = 0;
      if (Math.abs(this.vy) < 10) this.vy = 0;
    }

    // Charge mechanic
    if (isCharging) {
      this.isCharging = true;
      this.chargePower = Math.min(1, this.chargePower + dt / 1.4);
    }

    if (input.actionJustReleased && this.isCharging) {
      this.kick(ball);
      this.isCharging = false;
      this.chargePower = 0;
    }

    if (ball.controller === this) {
      ball.setController(this);
    }
  }

  private takeBall(ball: Ball) {
    ball.setController(this);
  }

  private stealBall(ball: Ball) {
    ball.setController(this);
    this.vx += Math.cos(this.facingAngle) * 80;
    this.vy += Math.sin(this.facingAngle) * 80;
  }

  kick(ball: Ball) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, ball.x, ball.y);
    const kickRange = PLAYER_RADIUS + BALL_RADIUS + 20;

    if (dist > kickRange) return;

    ball.setController(null);

    const power = MIN_KICK_POWER + this.chargePower * (MAX_KICK_POWER - MIN_KICK_POWER);
    // Slight inaccuracy at max power
    const spread = this.chargePower * 0.15;
    const angle = this.facingAngle + (Math.random() - 0.5) * spread;

    ball.vx = Math.cos(angle) * power;
    ball.vy = Math.sin(angle) * power;
  }

  private updateAnimation() {
    if (this.isMoving) {
      const t = this.animTime / 120;
      const swing = Math.sin(t) * 18;
      this.leftLeg.setAngle(swing);
      this.rightLeg.setAngle(-swing);
      this.leftArm.setAngle(-swing * 0.7);
      this.rightArm.setAngle(swing * 0.7);
    } else {
      this.leftLeg.setAngle(0);
      this.rightLeg.setAngle(0);
      this.leftArm.setAngle(0);
      this.rightArm.setAngle(0);
    }

    // Rotate sprite to face direction
    const faceAngleDeg = Phaser.Math.RadToDeg(this.facingAngle);
    // Flip body for right-facing
    if (Math.cos(this.facingAngle) < 0) {
      this.setScale(-1, 1);
      this.nameText.setScale(-1, 1);
    } else {
      this.setScale(1, 1);
      this.nameText.setScale(1, 1);
    }
  }

  private updateDepth() {
    this.setDepth(this.y);
  }

  setActiveState(active: boolean) {
    this.isActive = active;
    if (active) {
      this.bodyRect.setStrokeStyle(2, 0xFFFF00);
    } else {
      this.bodyRect.setStrokeStyle(1, this.secondaryColor);
    }
  }

  distanceToBall(ball: Ball): number {
    return Phaser.Math.Distance.Between(this.x, this.y, ball.x, ball.y);
  }

  private getShortName(): string {
    const parts = this.data_player.name.split(' ');
    return parts[parts.length - 1].toUpperCase().substring(0, 8);
  }

  private getContrastColor(color: number): string {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#000000' : '#FFFFFF';
  }
}
