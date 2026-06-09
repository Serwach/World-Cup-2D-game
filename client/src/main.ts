import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { TeamSelectScene } from './scenes/TeamSelectScene';
import { MatchSettingsScene } from './scenes/MatchSettingsScene';
import { TournamentScene } from './scenes/TournamentScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [
    BootScene,
    MenuScene,
    TeamSelectScene,
    MatchSettingsScene,
    TournamentScene,
    GameScene,
    ResultScene,
  ],
};

new Phaser.Game(config);
