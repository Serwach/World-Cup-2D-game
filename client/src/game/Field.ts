import Phaser from 'phaser';
import {
  FIELD_LEFT, FIELD_RIGHT, FIELD_TOP, FIELD_BOTTOM,
  FIELD_CENTER_X, FIELD_CENTER_Y, FIELD_WIDTH, FIELD_HEIGHT,
  GOAL_HEIGHT, GOAL_DEPTH, GOAL_TOP, GOAL_BOTTOM,
} from '@shared/constants';

export class Field extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    const g = scene.add.graphics();
    this.drawField(g);

    this.add(g);
    scene.add.existing(this);
    this.setDepth(-100);
  }

  private drawField(g: Phaser.GameObjects.Graphics) {
    // Grass background
    g.fillStyle(0x1a7a1a);
    g.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_WIDTH, FIELD_HEIGHT);

    // Alternating grass stripes
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        g.fillStyle(0x1e8a1e, 0.5);
        g.fillRect(FIELD_LEFT + (i * FIELD_WIDTH) / 8, FIELD_TOP, FIELD_WIDTH / 8, FIELD_HEIGHT);
      }
    }

    // Goals (background rectangles)
    // Left goal
    g.fillStyle(0xdddddd, 0.3);
    g.fillRect(FIELD_LEFT - GOAL_DEPTH, GOAL_TOP, GOAL_DEPTH, GOAL_HEIGHT);

    // Right goal
    g.fillRect(FIELD_RIGHT, GOAL_TOP, GOAL_DEPTH, GOAL_HEIGHT);

    // Field border
    g.lineStyle(3, 0xFFFFFF, 0.9);
    g.strokeRect(FIELD_LEFT, FIELD_TOP, FIELD_WIDTH, FIELD_HEIGHT);

    // Center line
    g.lineBetween(FIELD_CENTER_X, FIELD_TOP, FIELD_CENTER_X, FIELD_BOTTOM);

    // Center circle
    g.strokeCircle(FIELD_CENTER_X, FIELD_CENTER_Y, 80);

    // Center dot
    g.fillStyle(0xFFFFFF);
    g.fillCircle(FIELD_CENTER_X, FIELD_CENTER_Y, 5);

    // Penalty areas
    const penAreaW = 150;
    const penAreaH = 280;
    const penAreaY = FIELD_CENTER_Y - penAreaH / 2;
    g.strokeRect(FIELD_LEFT, penAreaY, penAreaW, penAreaH);
    g.strokeRect(FIELD_RIGHT - penAreaW, penAreaY, penAreaW, penAreaH);

    // Goal areas (6-yard boxes)
    const goalAreaW = 60;
    const goalAreaH = 160;
    const goalAreaY = FIELD_CENTER_Y - goalAreaH / 2;
    g.strokeRect(FIELD_LEFT, goalAreaY, goalAreaW, goalAreaH);
    g.strokeRect(FIELD_RIGHT - goalAreaW, goalAreaY, goalAreaW, goalAreaH);

    // Penalty spots
    g.fillCircle(FIELD_LEFT + 110, FIELD_CENTER_Y, 4);
    g.fillCircle(FIELD_RIGHT - 110, FIELD_CENTER_Y, 4);

    // Corner arcs
    const cornerR = 15;
    g.beginPath();
    g.arc(FIELD_LEFT, FIELD_TOP, cornerR, 0, Math.PI / 2);
    g.strokePath();
    g.beginPath();
    g.arc(FIELD_RIGHT, FIELD_TOP, cornerR, Math.PI / 2, Math.PI);
    g.strokePath();
    g.beginPath();
    g.arc(FIELD_RIGHT, FIELD_BOTTOM, cornerR, Math.PI, Math.PI * 1.5);
    g.strokePath();
    g.beginPath();
    g.arc(FIELD_LEFT, FIELD_BOTTOM, cornerR, Math.PI * 1.5, Math.PI * 2);
    g.strokePath();

    // Goal posts (white lines and nets)
    this.drawGoalPosts(g);
  }

  private drawGoalPosts(g: Phaser.GameObjects.Graphics) {
    // Left goal posts
    g.lineStyle(4, 0xFFFFFF);
    g.lineBetween(FIELD_LEFT, GOAL_TOP, FIELD_LEFT - GOAL_DEPTH, GOAL_TOP);
    g.lineBetween(FIELD_LEFT, GOAL_BOTTOM, FIELD_LEFT - GOAL_DEPTH, GOAL_BOTTOM);
    g.lineBetween(FIELD_LEFT - GOAL_DEPTH, GOAL_TOP, FIELD_LEFT - GOAL_DEPTH, GOAL_BOTTOM);

    // Right goal posts
    g.lineBetween(FIELD_RIGHT, GOAL_TOP, FIELD_RIGHT + GOAL_DEPTH, GOAL_TOP);
    g.lineBetween(FIELD_RIGHT, GOAL_BOTTOM, FIELD_RIGHT + GOAL_DEPTH, GOAL_BOTTOM);
    g.lineBetween(FIELD_RIGHT + GOAL_DEPTH, GOAL_TOP, FIELD_RIGHT + GOAL_DEPTH, GOAL_BOTTOM);

    // Net pattern (left)
    g.lineStyle(1, 0xCCCCCC, 0.4);
    for (let y = GOAL_TOP; y <= GOAL_BOTTOM; y += 15) {
      g.lineBetween(FIELD_LEFT, y, FIELD_LEFT - GOAL_DEPTH, y);
    }
    for (let x = FIELD_LEFT; x >= FIELD_LEFT - GOAL_DEPTH; x -= 15) {
      g.lineBetween(x, GOAL_TOP, x, GOAL_BOTTOM);
    }

    // Net pattern (right)
    for (let y = GOAL_TOP; y <= GOAL_BOTTOM; y += 15) {
      g.lineBetween(FIELD_RIGHT, y, FIELD_RIGHT + GOAL_DEPTH, y);
    }
    for (let x = FIELD_RIGHT; x <= FIELD_RIGHT + GOAL_DEPTH; x += 15) {
      g.lineBetween(x, GOAL_TOP, x, GOAL_BOTTOM);
    }
  }
}
