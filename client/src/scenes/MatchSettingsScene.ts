import Phaser from 'phaser';
import { ApiTeam } from '../api';

interface MatchSettingsData {
  teamAId: number;
  teamBId: number;
  teamA: ApiTeam;
  teamB: ApiTeam;
  mode: string;
  matchId?: number;
}

export class MatchSettingsScene extends Phaser.Scene {
  private data_in!: MatchSettingsData;
  private matchDuration = 3; // minutes (displayed, actual seconds = *60)
  private extraTime = true;
  private goldenGoal = false;
  private penalties = true;

  private durationText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MatchSettingsScene' });
  }

  init(data: MatchSettingsData) {
    this.data_in = data;
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 80, 'MATCH SETTINGS', {
      fontSize: '36px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Team display
    const ta = this.data_in.teamA;
    const tb = this.data_in.teamB;
    this.add.text(width / 2, 150,
      `${ta.flag_emoji} ${ta.name}  vs  ${tb.flag_emoji} ${tb.name}`, {
      fontSize: '26px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Settings
    let y = 250;
    const settingY = (label: string) => {
      this.add.text(360, y, label, { fontSize: '22px', color: '#CCCCCC' }).setOrigin(0, 0.5);
      y += 70;
    };

    // Match duration
    this.add.text(360, 260, 'Match Duration:', { fontSize: '22px', color: '#CCCCCC' }).setOrigin(0, 0.5);
    this.add.text(560, 260, '−', { fontSize: '28px', color: '#FF8888' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.matchDuration = Math.max(1, this.matchDuration - 1);
        this.durationText.setText(`${this.matchDuration} min`);
      });
    this.durationText = this.add.text(640, 260, `${this.matchDuration} min`, {
      fontSize: '22px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(720, 260, '+', { fontSize: '28px', color: '#88FF88' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.matchDuration = Math.min(90, this.matchDuration + 1);
        this.durationText.setText(`${this.matchDuration} min`);
      });

    // Extra time toggle
    y = 340;
    const etLabel = this.createToggle(360, y, 'Extra Time (Knockout only):', () => this.extraTime, (v) => { this.extraTime = v; });

    // Golden goal toggle
    y = 410;
    const ggLabel = this.createToggle(360, y, 'Golden Goal:', () => this.goldenGoal, (v) => { this.goldenGoal = v; });

    // Penalties toggle
    y = 480;
    const penLabel = this.createToggle(360, y, 'Penalties (after ET):', () => this.penalties, (v) => { this.penalties = v; });

    // Note
    this.add.text(width / 2, 560, 'Note: Group stage draws end immediately (no extra time)', {
      fontSize: '14px', color: '#AAAAAA',
    }).setOrigin(0.5);

    // Start button
    this.createButton(width / 2, 630, 'KICK OFF!', 0x006633, () => {
      console.log('[MatchSettings] Kick off clicked', {
        teamA: this.data_in.teamA?.name,
        teamB: this.data_in.teamB?.name,
        mode: this.data_in.mode,
      });
      this.scene.start('GameScene', {
        ...this.data_in,
        settings: {
          matchDuration: this.matchDuration * 60,
          extraTime: this.extraTime,
          goldenGoal: this.goldenGoal,
          penalties: this.penalties,
        },
      });
    });

    // Back
    const back = this.add.text(80, 690, '← BACK', {
      fontSize: '16px', color: '#AAAAAA',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FFFFFF'));
    back.on('pointerout', () => back.setColor('#AAAAAA'));
    back.on('pointerdown', () => this.scene.start('TeamSelectScene', { mode: this.data_in.mode }));
  }

  private createToggle(
    x: number, y: number, label: string,
    getValue: () => boolean,
    setValue: (v: boolean) => void
  ) {
    this.add.text(x, y, label, { fontSize: '20px', color: '#CCCCCC' }).setOrigin(0, 0.5);

    const indicator = this.add.text(800, y, getValue() ? 'ON ✓' : 'OFF ✗', {
      fontSize: '20px',
      color: getValue() ? '#00FF88' : '#FF4444',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    indicator.on('pointerdown', () => {
      setValue(!getValue());
      indicator.setText(getValue() ? 'ON ✓' : 'OFF ✗');
      indicator.setColor(getValue() ? '#00FF88' : '#FF4444');
    });
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const bg = this.add.rectangle(x, y, 260, 56, color)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x008844));
    bg.on('pointerout', () => bg.setFillStyle(color));
    bg.on('pointerdown', onClick);
  }
}
