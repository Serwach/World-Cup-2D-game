import Phaser from 'phaser';

export class PowerBar extends Phaser.GameObjects.Container {
  private bg!: Phaser.GameObjects.Rectangle;
  private fill!: Phaser.GameObjects.Rectangle;
  private label!: Phaser.GameObjects.Text;
  private barWidth = 80;
  private barHeight = 10;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string) {
    super(scene, x, y);

    const outerBg = scene.add.rectangle(0, 0, this.barWidth + 4, this.barHeight + 4, 0x000000, 0.7);
    this.bg = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x333333);
    this.fill = scene.add.rectangle(-this.barWidth / 2, 0, 0, this.barHeight, 0x00FF88);
    this.fill.setOrigin(0, 0.5);

    this.label = scene.add.text(0, -14, label, {
      fontSize: '10px', color: '#AAAAAA',
    }).setOrigin(0.5);

    this.add([outerBg, this.bg, this.fill, this.label]);
    scene.add.existing(this);
    this.setDepth(1000);
    this.setVisible(false);
  }

  updatePower(power: number, charging: boolean) {
    if (!charging) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);
    const w = this.barWidth * power;
    this.fill.setDisplaySize(w, this.barHeight);

    // Color: green → yellow → red
    const r = Math.floor(power * 255);
    const g = Math.floor((1 - power * 0.7) * 255);
    const color = (r << 16) | (g << 8);
    this.fill.setFillStyle(color);
  }

  showAbovePlayer(px: number, py: number) {
    this.setPosition(px, py - 50);
  }
}
