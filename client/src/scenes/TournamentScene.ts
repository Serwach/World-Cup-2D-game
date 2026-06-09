import Phaser from 'phaser';
import { api, ApiGroup, ApiMatch, ApiStanding } from '../api';

export class TournamentScene extends Phaser.Scene {
  private currentView: 'groups' | 'bracket' = 'groups';
  private container!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'TournamentScene' });
  }

  async create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x001122, 0x001122, 0x002244, 0x002244, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 36, 'WORLD CUP 2026 TOURNAMENT', {
      fontSize: '28px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tab buttons
    this.createTabBtn(400, 80, 'GROUP STAGE', () => this.showGroups());
    this.createTabBtn(880, 80, 'KNOCKOUT BRACKET', () => this.showBracket());

    // Back button
    const back = this.add.text(60, 700, '← MENU', {
      fontSize: '16px', color: '#AAAAAA',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FFFFFF'));
    back.on('pointerout', () => back.setColor('#AAAAAA'));
    back.on('pointerdown', () => this.scene.start('MenuScene'));

    this.container = this.add.container(0, 0);
    this.showGroups();
  }

  private createTabBtn(x: number, y: number, label: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, 280, 44, 0x003366)
      .setStrokeStyle(2, 0x4488FF, 0.8)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0x004488));
    bg.on('pointerout', () => bg.setFillStyle(0x003366));
  }

  private async showGroups() {
    this.clearContainer();
    try {
      const groups = await api.getGroups();
      this.renderGroups(groups);
    } catch {
      this.container.add(this.add.text(640, 400, 'Server not available', {
        fontSize: '20px', color: '#FF4444',
      }).setOrigin(0.5));
    }
  }

  private renderGroups(groups: ApiGroup[]) {
    const cols = 4;
    const colW = 300;
    const startX = 50;
    const startY = 120;
    const rowH = 280;

    groups.forEach((group, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * colW;
      const y = startY + row * rowH;

      const groupBg = this.add.rectangle(x + colW / 2, y + 130, colW - 10, 260, 0x001133, 0.8)
        .setStrokeStyle(1, 0x3366AA, 0.6);
      this.container.add(groupBg);

      const title = this.add.text(x + colW / 2, y + 10, `GROUP ${group.name}`, {
        fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      this.container.add(title);

      // Header
      const headerY = y + 32;
      this.container.add(this.add.text(x + 10, headerY, 'Team', { fontSize: '10px', color: '#888888' }));
      this.container.add(this.add.text(x + 175, headerY, 'P', { fontSize: '10px', color: '#888888' }).setOrigin(0.5));
      this.container.add(this.add.text(x + 200, headerY, 'W', { fontSize: '10px', color: '#888888' }).setOrigin(0.5));
      this.container.add(this.add.text(x + 220, headerY, 'D', { fontSize: '10px', color: '#888888' }).setOrigin(0.5));
      this.container.add(this.add.text(x + 240, headerY, 'L', { fontSize: '10px', color: '#888888' }).setOrigin(0.5));
      this.container.add(this.add.text(x + 268, headerY, 'Pts', { fontSize: '10px', color: '#FFD700' }).setOrigin(0.5));

      group.standings.forEach((s, si) => {
        const ry = y + 50 + si * 48;
        const rowBg = this.add.rectangle(x + colW / 2, ry + 18, colW - 20, 44,
          si < 2 ? 0x003322 : 0x110022, 0.7
        ).setStrokeStyle(1, si < 2 ? 0x00AA44 : 0x440044, 0.4);
        this.container.add(rowBg);

        const flag = this.add.text(x + 8, ry + 10, s.flag_emoji, { fontSize: '16px' });
        const name = this.add.text(x + 28, ry + 10, s.team_name.substring(0, 10), {
          fontSize: '11px', color: si < 2 ? '#FFFFFF' : '#AAAAAA',
        });
        const pts = this.add.text(x + 175, ry + 18, String(s.played), { fontSize: '11px', color: '#AAAAAA' }).setOrigin(0.5);
        const won = this.add.text(x + 200, ry + 18, String(s.won), { fontSize: '11px', color: '#AAAAAA' }).setOrigin(0.5);
        const drawn = this.add.text(x + 220, ry + 18, String(s.drawn), { fontSize: '11px', color: '#AAAAAA' }).setOrigin(0.5);
        const lost = this.add.text(x + 240, ry + 18, String(s.lost), { fontSize: '11px', color: '#AAAAAA' }).setOrigin(0.5);
        const ptsScore = this.add.text(x + 268, ry + 18, String(s.points), { fontSize: '13px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
        this.container.add([rowBg, flag, name, pts, won, drawn, lost, ptsScore]);
      });
    });
  }

  private async showBracket() {
    this.clearContainer();
    try {
      const bracket = await api.getTournamentBracket();
      this.renderBracket(bracket);
    } catch {
      this.container.add(this.add.text(640, 400, 'Bracket not yet generated\n(play group stage first)', {
        fontSize: '20px', color: '#FF8800', align: 'center',
      }).setOrigin(0.5));
    }
  }

  private renderBracket(bracket: Record<string, ApiMatch[]>) {
    const rounds = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'];
    const roundLabels: Record<string, string> = {
      round_of_32: 'R32',
      round_of_16: 'R16',
      quarter_final: 'QF',
      semi_final: 'SF',
      final: 'FINAL',
    };
    const colW = 220;
    const startX = 30;
    const startY = 120;

    rounds.forEach((round, ri) => {
      const matches = bracket[round] || [];
      const x = startX + ri * colW;

      this.container.add(this.add.text(x + colW / 2, startY - 16, roundLabels[round], {
        fontSize: '13px', color: '#FFD700', fontStyle: 'bold',
      }).setOrigin(0.5, 1));

      const spacing = Math.max(50, 500 / (matches.length || 1));
      matches.forEach((m, mi) => {
        const y = startY + mi * spacing;
        this.renderMatchCard(x + 10, y, m, colW - 20);
      });
    });
  }

  private renderMatchCard(x: number, y: number, match: ApiMatch, w: number) {
    const h = 44;
    const played = match.played === 1;

    const bg = this.add.rectangle(x + w / 2, y + h / 2, w, h,
      played ? 0x001a00 : 0x111122, 0.85
    ).setStrokeStyle(1, played ? 0x00AA44 : 0x3366AA, 0.6);
    this.container.add(bg);

    const aText = this.add.text(x + 4, y + 4, `${match.team_a_flag || ''} ${(match.team_a_name || '?').substring(0, 11)}`, {
      fontSize: '10px', color: '#FFFFFF',
    });
    const bText = this.add.text(x + 4, y + 22, `${match.team_b_flag || ''} ${(match.team_b_name || '?').substring(0, 11)}`, {
      fontSize: '10px', color: '#CCCCCC',
    });

    if (played) {
      const score = this.add.text(x + w - 4, y + 12, `${match.score_a} - ${match.score_b}`, {
        fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      this.container.add(score);
    }

    this.container.add([bg, aText, bText]);
  }

  private clearContainer() {
    this.container.removeAll(true);
  }
}
