import Phaser from 'phaser';
import { ApiTeam } from '../api';

export class HUD extends Phaser.GameObjects.Container {
  private scoreAText!: Phaser.GameObjects.Text;
  private scoreBText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private teamALabel!: Phaser.GameObjects.Text;
  private teamBLabel!: Phaser.GameObjects.Text;
  private goalBanner!: Phaser.GameObjects.Container;
  private goalBannerText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, teamA: ApiTeam, teamB: ApiTeam) {
    super(scene, 0, 0);

    this.buildHUD(teamA, teamB);
    scene.add.existing(this);
    this.setDepth(500);
  }

  private buildHUD(teamA: ApiTeam, teamB: ApiTeam) {
    const { width } = this.scene.scale;

    // Background bar
    const barBg = this.scene.add.rectangle(width / 2, 24, width, 48, 0x000000, 0.75);

    // Team A (left)
    const aColor = parseInt(teamA.primary_color.replace('#', ''), 16);
    const bColor = parseInt(teamB.primary_color.replace('#', ''), 16);

    const aBg = this.scene.add.rectangle(200, 24, 380, 46, aColor, 0.9);
    const bBg = this.scene.add.rectangle(width - 200, 24, 380, 46, bColor, 0.9);

    // Team flags and names
    this.teamALabel = this.scene.add.text(200, 24, `${teamA.flag_emoji} ${teamA.name}`, {
      fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.teamBLabel = this.scene.add.text(width - 200, 24, `${teamB.flag_emoji} ${teamB.name}`, {
      fontSize: '16px', color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Score area
    const scoreBg = this.scene.add.rectangle(width / 2, 24, 200, 46, 0x111111, 0.95)
      .setStrokeStyle(2, 0xFFFFFF, 0.5);

    this.scoreAText = this.scene.add.text(width / 2 - 40, 24, '0', {
      fontSize: '28px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.scene.add.text(width / 2, 24, '-', {
      fontSize: '24px', color: '#AAAAAA',
    }).setOrigin(0.5);

    this.scoreBText = this.scene.add.text(width / 2 + 40, 24, '0', {
      fontSize: '28px', color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Timer
    const timerBg = this.scene.add.rectangle(width / 2, 56, 120, 22, 0x000000, 0.6);
    this.timerText = this.scene.add.text(width / 2, 56, '90:00', {
      fontSize: '14px', color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Phase text (ET, Penalties)
    this.phaseText = this.scene.add.text(width / 2, 74, '', {
      fontSize: '11px', color: '#FF8800',
    }).setOrigin(0.5);

    this.add([barBg, aBg, bBg, scoreBg, this.teamALabel, this.teamBLabel,
              this.scoreAText, this.scene.add.text(width / 2, 24, '-', { fontSize: '24px', color: '#AAAAAA' }).setOrigin(0.5),
              this.scoreBText, timerBg, this.timerText, this.phaseText]);

    // Goal banner (hidden by default)
    this.buildGoalBanner();
  }

  private buildGoalBanner() {
    const { width, height } = this.scene.scale;
    const bannerBg = this.scene.add.rectangle(width / 2, height / 2, 500, 120, 0x000000, 0.85)
      .setStrokeStyle(3, 0xFFD700);
    this.goalBannerText = this.scene.add.text(width / 2, height / 2, '', {
      fontSize: '56px', color: '#FFD700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.goalBanner = this.scene.add.container(0, 0, [bannerBg, this.goalBannerText]);
    this.goalBanner.setDepth(600).setVisible(false);
    this.add(this.goalBanner);
  }

  updateScore(scoreA: number, scoreB: number) {
    this.scoreAText.setText(String(scoreA));
    this.scoreBText.setText(String(scoreB));
  }

  updateTimer(timeLeft: number) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);
    this.timerText.setText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    if (timeLeft <= 30) {
      this.timerText.setColor('#FF4444');
    } else {
      this.timerText.setColor('#FFD700');
    }
  }

  setPhaseLabel(phase: string) {
    this.phaseText.setText(phase);
  }

  showGoalBanner(scoringTeamName: string, done?: () => void) {
    this.goalBannerText.setText(`⚽ GOAAAAL! ⚽\n${scoringTeamName}`);
    this.goalBannerText.setFontSize(scoringTeamName.length > 12 ? '38px' : '46px');
    this.goalBanner.setVisible(true);
    this.goalBanner.setAlpha(0);
    this.scene.tweens.add({
      targets: this.goalBanner,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.scene.time.delayedCall(2200, () => {
          this.scene.tweens.add({
            targets: this.goalBanner,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              this.goalBanner.setVisible(false);
              done?.();
            },
          });
        });
      },
    });
  }

  showHalfTimeBanner(text: string, done?: () => void) {
    this.goalBannerText.setText(text);
    this.goalBannerText.setFontSize('36px');
    this.goalBannerText.setColor('#FFFFFF');
    this.goalBanner.setVisible(true);
    this.goalBanner.setAlpha(1);
    this.scene.time.delayedCall(2000, () => {
      this.goalBanner.setVisible(false);
      this.goalBannerText.setColor('#FFD700');
      done?.();
    });
  }
}
