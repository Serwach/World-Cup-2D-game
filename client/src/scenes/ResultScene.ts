import Phaser from 'phaser';
import { ApiTeam } from '../api';

interface ResultData {
  teamA: ApiTeam;
  teamB: ApiTeam;
  scoreA: number;
  scoreB: number;
  penaltyScoreA?: number;
  penaltyScoreB?: number;
  mode: string;
}

export class ResultScene extends Phaser.Scene {
  private data_in!: ResultData;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: ResultData) {
    this.data_in = data;
  }

  create() {
    const { width, height } = this.scale;
    const { teamA, teamB, scoreA, scoreB, penaltyScoreA, penaltyScoreB, mode } = this.data_in;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 80, 'FULL TIME', {
      fontSize: '44px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    // Team names and colors
    const aColor = parseInt(teamA.primary_color.replace('#', ''), 16);
    const bColor = parseInt(teamB.primary_color.replace('#', ''), 16);

    this.add.rectangle(280, 250, 420, 100, aColor, 0.85).setStrokeStyle(2, 0xffffff, 0.5);
    this.add.rectangle(1000, 250, 420, 100, bColor, 0.85).setStrokeStyle(2, 0xffffff, 0.5);

    this.add.text(280, 250, `${teamA.flag_emoji}\n${teamA.name}`, {
      fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);

    this.add.text(1000, 250, `${teamB.flag_emoji}\n${teamB.name}`, {
      fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);

    // Score
    const scoreText = `${scoreA}  -  ${scoreB}`;
    this.add.text(width / 2, 250, scoreText, {
      fontSize: '80px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5);

    // Penalty score if applicable
    if (penaltyScoreA !== undefined && penaltyScoreB !== undefined) {
      this.add.text(width / 2, 320, `(Penalties: ${penaltyScoreA} - ${penaltyScoreB})`, {
        fontSize: '20px', color: '#FF8800',
      }).setOrigin(0.5);
    }

    // Winner announcement
    let winnerText = '';
    let winnerColor = '#FFD700';
    const aWins = penaltyScoreA !== undefined
      ? penaltyScoreA > penaltyScoreB!
      : scoreA > scoreB;
    const bWins = penaltyScoreA !== undefined
      ? penaltyScoreB! > penaltyScoreA
      : scoreB > scoreA;

    if (aWins) {
      winnerText = `${teamA.flag_emoji} ${teamA.name} WIN!`;
    } else if (bWins) {
      winnerText = `${teamB.flag_emoji} ${teamB.name} WIN!`;
    } else {
      winnerText = 'DRAW';
      winnerColor = '#AAAAAA';
    }

    this.add.text(width / 2, 400, winnerText, {
      fontSize: '38px', color: winnerColor, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    // Buttons
    this.createButton(width / 2 - 200, 520, 'PLAY AGAIN', 0x006633, () => {
      this.scene.start('TeamSelectScene', { mode });
    });

    this.createButton(width / 2 + 200, 520, 'MAIN MENU', 0x003399, () => {
      this.scene.start('MenuScene');
    });

    if (mode === 'tournament') {
      this.createButton(width / 2, 600, 'VIEW BRACKET', 0x660033, () => {
        this.scene.start('TournamentScene');
      });
    }

    // Confetti for winner
    if (aWins || bWins) {
      this.spawnConfetti();
    }
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const bg = this.add.rectangle(x, y, 260, 54, color)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => {
      this.tweens.add({ targets: [bg, text], scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: [bg, text], scaleX: 1, scaleY: 1, duration: 80 });
    });
    bg.on('pointerdown', onClick);
  }

  private spawnConfetti() {
    for (let i = 0; i < 60; i++) {
      const colors = [0xFFD700, 0xFF4444, 0x44FF88, 0x4488FF, 0xFF88FF, 0xFFFFFF];
      const dot = this.add.rectangle(
        Phaser.Math.Between(0, 1280),
        Phaser.Math.Between(-100, 0),
        Phaser.Math.Between(6, 14),
        Phaser.Math.Between(6, 14),
        colors[Math.floor(Math.random() * colors.length)]
      ).setDepth(800);

      this.tweens.add({
        targets: dot,
        y: { from: dot.y, to: 800 },
        x: { value: `+=${Phaser.Math.Between(-80, 80)}` },
        angle: { value: `+=${Phaser.Math.Between(180, 720)}` },
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Linear',
        onComplete: () => dot.destroy(),
      });
    }
  }
}
