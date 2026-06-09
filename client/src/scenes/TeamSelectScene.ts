import Phaser from 'phaser';
import { api, ApiTeam } from '../api';

interface TeamSelectData {
  mode: 'quick' | 'tournament';
}

export class TeamSelectScene extends Phaser.Scene {
  private teams: ApiTeam[] = [];
  private selectedA = -1;
  private selectedB = -1;
  private mode: 'quick' | 'tournament' = 'quick';
  private teamCards: Phaser.GameObjects.Container[] = [];
  private infoTextA!: Phaser.GameObjects.Text;
  private infoTextB!: Phaser.GameObjects.Text;
  private startBtn!: Phaser.GameObjects.Rectangle;
  private startBtnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TeamSelectScene' });
  }

  init(data: TeamSelectData) {
    this.mode = data.mode || 'quick';
  }

  async create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 36, 'SELECT TEAMS', {
      fontSize: '32px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(320, 80, 'PLAYER 1 (WASD + SPACE)', {
      fontSize: '16px', color: '#88AAFF',
    }).setOrigin(0.5);

    this.add.text(960, 80, 'PLAYER 2 (ARROWS + ENTER)', {
      fontSize: '16px', color: '#FF8888',
    }).setOrigin(0.5);

    this.infoTextA = this.add.text(320, 680, 'Select a team for Player 1', {
      fontSize: '16px', color: '#88AAFF',
    }).setOrigin(0.5);

    this.infoTextB = this.add.text(960, 680, 'Select a team for Player 2', {
      fontSize: '16px', color: '#FF8888',
    }).setOrigin(0.5);

    // Start button (disabled initially)
    this.startBtn = this.add.rectangle(width / 2, 680, 280, 50, 0x333333)
      .setStrokeStyle(2, 0x555555);
    this.startBtnText = this.add.text(width / 2, 680, 'SELECT BOTH TEAMS', {
      fontSize: '18px', color: '#666666', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 680, '', { fontSize: '1px' }); // spacer

    // Back button
    this.createBackBtn();

    // Load teams
    try {
      console.log('[TeamSelect] Loading teams from API...');
      this.teams = await api.getTeams();
      console.log('[TeamSelect] Teams loaded:', this.teams.length);
      this.renderTeams();
    } catch (e) {
      console.error('[TeamSelect] Failed to load teams:', e);
      this.add.text(width / 2, height / 2, 'Failed to load teams.\nMake sure the server is running.', {
        fontSize: '20px', color: '#FF4444', align: 'center',
      }).setOrigin(0.5);
    }
  }

  private renderTeams() {
    const cols = 8;
    const startX = 80;
    const startY = 110;
    const cellW = 140;
    const cellH = 78;
    const groups = [...new Set(this.teams.map(t => t.group_name))].sort();

    let i = 0;
    for (const group of groups) {
      const groupTeams = this.teams.filter(t => t.group_name === group);
      // Group label
      this.add.text(startX + (i % cols) * cellW + cellW / 2, startY + Math.floor(i / cols) * cellH - 8, `GRP ${group}`, {
        fontSize: '9px', color: '#FFAA00',
      }).setOrigin(0.5, 1);

      for (const team of groupTeams) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = startX + col * cellW + cellW / 2;
        const cy = startY + row * cellH + cellH / 2;

        const card = this.createTeamCard(cx, cy, team, i);
        this.teamCards.push(card);
        i++;
      }
    }
  }

  private createTeamCard(x: number, y: number, team: ApiTeam, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const primaryHex = parseInt(team.primary_color.replace('#', '0x'));
    const secondaryHex = parseInt(team.secondary_color.replace('#', '0x'));

    const bg = this.add.rectangle(0, 0, 130, 66, primaryHex, 0.85)
      .setStrokeStyle(2, secondaryHex);

    const flag = this.add.text(0, -14, team.flag_emoji, { fontSize: '22px' }).setOrigin(0.5);

    const name = this.add.text(0, 10, team.name.toUpperCase(), {
      fontSize: '9px',
      color: this.getContrastColor(team.primary_color),
      fontStyle: 'bold',
      wordWrap: { width: 120 },
      align: 'center',
    }).setOrigin(0.5);

    const groupBadge = this.add.text(52, -24, team.group_name, {
      fontSize: '9px', color: '#FFAA00', backgroundColor: '#000000',
    }).setOrigin(0.5);

    container.add([bg, flag, name, groupBadge]);
    container.setSize(130, 66);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      if (this.selectedA !== index && this.selectedB !== index) {
        bg.setAlpha(1);
        this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
      }
    });
    container.on('pointerout', () => {
      if (this.selectedA !== index && this.selectedB !== index) {
        bg.setAlpha(0.85);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
      }
    });
    container.on('pointerdown', () => {
      console.log('[TeamSelect] Card clicked:', team.name, 'index=', index);
      this.selectTeam(index, team);
    });

    return container;
  }

  private selectTeam(index: number, team: ApiTeam) {
    console.log('[TeamSelect] selectTeam called', { index, team: team.name, selectedA: this.selectedA, selectedB: this.selectedB });
    // If already selected as either team, deselect
    if (this.selectedA === index) {
      this.selectedA = -1;
      this.updateCardHighlight(index, 'none');
      this.infoTextA.setText('Select a team for Player 1');
      this.updateStartBtn();
      return;
    }
    if (this.selectedB === index) {
      this.selectedB = -1;
      this.updateCardHighlight(index, 'none');
      this.infoTextB.setText('Select a team for Player 2');
      this.updateStartBtn();
      return;
    }

    // Assign to first unselected player
    if (this.selectedA === -1) {
      const prev = this.selectedA;
      if (prev !== -1) this.updateCardHighlight(prev, 'none');
      this.selectedA = index;
      this.updateCardHighlight(index, 'p1');
      this.infoTextA.setText(`P1: ${team.flag_emoji} ${team.name}`);
    } else if (this.selectedB === -1) {
      const prev = this.selectedB;
      if (prev !== -1) this.updateCardHighlight(prev, 'none');
      this.selectedB = index;
      this.updateCardHighlight(index, 'p2');
      this.infoTextB.setText(`P2: ${team.flag_emoji} ${team.name}`);
    } else {
      // Replace P2 selection
      const prev = this.selectedB;
      if (prev !== -1) this.updateCardHighlight(prev, 'none');
      this.selectedB = index;
      this.updateCardHighlight(index, 'p2');
      this.infoTextB.setText(`P2: ${team.flag_emoji} ${team.name}`);
    }

    this.updateStartBtn();
  }

  private updateCardHighlight(index: number, type: 'none' | 'p1' | 'p2') {
    const card = this.teamCards[index];
    if (!card) return;
    const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
    if (type === 'none') {
      bg.setStrokeStyle(2, 0x888888);
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 100 });
    } else if (type === 'p1') {
      bg.setStrokeStyle(4, 0x4488FF);
      this.tweens.add({ targets: card, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    } else {
      bg.setStrokeStyle(4, 0xFF4444);
      this.tweens.add({ targets: card, scaleX: 1.08, scaleY: 1.08, duration: 100 });
    }
  }

  private updateStartBtn() {
    if (this.selectedA !== -1 && this.selectedB !== -1) {
      this.startBtn.setFillStyle(0x006633).setStrokeStyle(2, 0x00ff66)
        .setInteractive({ useHandCursor: true });
      this.startBtnText.setText('START MATCH').setColor('#FFFFFF');

      this.startBtn.removeAllListeners('pointerdown');
      this.startBtn.on('pointerdown', () => {
        console.log('[TeamSelect] Start button clicked', {
          teamA: this.teams[this.selectedA]?.name,
          teamB: this.teams[this.selectedB]?.name,
          mode: this.mode,
        });
        this.scene.start('MatchSettingsScene', {
          teamAId: this.teams[this.selectedA].id,
          teamBId: this.teams[this.selectedB].id,
          teamA: this.teams[this.selectedA],
          teamB: this.teams[this.selectedB],
          mode: this.mode,
        });
      });
    } else {
      this.startBtn.setFillStyle(0x333333).setStrokeStyle(2, 0x555555);
      this.startBtnText.setText('SELECT BOTH TEAMS').setColor('#666666');
    }
  }

  private createBackBtn() {
    const btn = this.add.text(60, 690, '← BACK', {
      fontSize: '16px', color: '#AAAAAA',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#FFFFFF'));
    btn.on('pointerout', () => btn.setColor('#AAAAAA'));
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
}
