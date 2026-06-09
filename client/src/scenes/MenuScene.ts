import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private controlsPanel?: Phaser.GameObjects.Container;
  private controlsVisible = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
    bg.fillRect(0, 0, width, height);

    // Pitch decoration
    this.drawPitchDecor();

    // Title
    this.add.text(width / 2, 160, '⚽ WORLD CUP 2026 ⚽', {
      fontSize: '52px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, 230, 'ARCADE FOOTBALL', {
      fontSize: '26px',
      color: '#FFFFFF',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // Buttons
    this.createButton(width / 2, 340, 'QUICK MATCH', 0x006633, () => {
      this.scene.start('TeamSelectScene', { mode: 'quick' });
    });

    this.createButton(width / 2, 420, 'TOURNAMENT', 0x003399, () => {
      this.scene.start('TeamSelectScene', { mode: 'tournament' });
    });

    this.createButton(width / 2, 500, 'VIEW BRACKET', 0x660033, () => {
      this.scene.start('TournamentScene');
    });

    this.createButton(width / 2, 580, 'CONTROLS', 0x664400, () => {
      this.toggleControlsPanel();
    });

    // Controls hint
    this.add.text(width / 2, 640, 'P1: WASD + SPACE  |  P2: ARROWS + ENTER', {
      fontSize: '16px',
      color: '#AAAAAA',
    }).setOrigin(0.5);

    this.add.text(width / 2, 670, 'Tap action once to tackle/steal, hold to charge a shot and release to shoot!', {
      fontSize: '13px',
      color: '#888888',
    }).setOrigin(0.5);

    this.controlsPanel = this.add.container(0, 0).setDepth(400);
    const panelBg = this.add.rectangle(width / 2, height / 2, 760, 360, 0x112233, 0.96)
      .setStrokeStyle(2, 0xFFD700, 0.9);
    const title = this.add.text(width / 2, 220, 'CONTROLS', {
      fontSize: '28px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);
    const movement = this.add.text(width / 2, 280, 'Movement: Player 1 = WASD, Player 2 = Arrow Keys', {
      fontSize: '20px', color: '#FFFFFF',
    }).setOrigin(0.5);
    const action = this.add.text(width / 2, 325, 'Action: Player 1 = Space, Player 2 = Enter', {
      fontSize: '20px', color: '#FFFFFF',
    }).setOrigin(0.5);
    const tactic = this.add.text(width / 2, 380, 'Tap action once to tackle/steal the ball, or hold it to charge a shot.', {
      fontSize: '17px', color: '#AAAAAA',
    }).setOrigin(0.5);
    const note = this.add.text(width / 2, 425, 'Release the button to shoot when the power bar is full.', {
      fontSize: '15px', color: '#88CCFF',
    }).setOrigin(0.5);

    this.controlsPanel.add([panelBg, title, movement, action, tactic, note]);
    this.controlsPanel.add(this.createPanelButton(width / 2, 520, 'CLOSE', 0x006633, () => this.toggleControlsPanel()));
    this.controlsPanel.setVisible(false);

    // Animated stars
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  private toggleControlsPanel() {
    this.controlsVisible = !this.controlsVisible;
    this.controlsPanel?.setVisible(this.controlsVisible);
  }

  private drawPitchDecor() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x00ff44, 0.08);
    // Center circle
    g.strokeCircle(640, 360, 120);
    // Center line
    g.lineBetween(640, 50, 640, 670);
    // Field border
    g.strokeRect(80, 50, 1120, 620);
  }

  private createPanelButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 44, color, 0.95)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff, 0.5);
    const text = this.add.text(0, 0, label, {
      fontSize: '18px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([bg, text]);

    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).brighten(20).color);
      this.tweens.add({ targets: [bg, text], scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(color, 0.95);
      this.tweens.add({ targets: [bg, text], scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text],
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        yoyo: true,
        onComplete: onClick,
      });
    });

    return container;
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const bg = this.add.rectangle(x, y, 320, 56, color, 0.85)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff, 0.5);

    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.ValueToColor(color).brighten(30).color);
      this.tweens.add({ targets: [bg, text], scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(color, 0.85);
      this.tweens.add({ targets: [bg, text], scaleX: 1, scaleY: 1, duration: 100 });
    });
    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text],
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }
}
