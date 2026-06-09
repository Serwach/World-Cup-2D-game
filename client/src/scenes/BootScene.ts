import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Generate face textures procedurally using canvas
    this.generateFaceTextures();

    // Load portrait-style face images as a richer fallback for player heads
    for (let variant = 0; variant < 24; variant++) {
      const portraitId = (variant % 12) + 1;
      this.load.image(`face_${variant}`, `https://i.pravatar.cc/300?img=${portraitId}`);
    }

    // Loading bar
    const bar = this.add.graphics();
    const border = this.add.graphics();

    border.lineStyle(2, 0xffffff);
    border.strokeRect(390, 340, 500, 30);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x00ff88);
      bar.fillRect(392, 342, 496 * value, 26);
    });

    this.add.text(640, 310, 'WORLD CUP 2026', {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(640, 390, 'Loading...', {
      fontSize: '16px',
      color: '#AAAAAA',
    }).setOrigin(0.5);
  }

  private generateFaceTextures() {
    // Create a generic face texture that will be used as a base
    // Each player will have a slight color variation based on their ID
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Base face
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = '#FFCC99';
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CC9966';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#333333';
    ctx.beginPath(); ctx.arc(11, 13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(21, 13, 2.5, 0, Math.PI * 2); ctx.fill();

    // Pupils
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(12, 12.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, 12.5, 1, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#CC9966';
    ctx.beginPath(); ctx.arc(16, 17, 1.5, 0, Math.PI * 2); ctx.fill();

    // Mouth
    ctx.strokeStyle = '#993333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(16, 19, 4, 0, Math.PI);
    ctx.stroke();

    // Hair
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(16, 4, 12, 8, 0, Math.PI, 0);
    ctx.fill();

    this.textures.addCanvas('face_default', canvas);

    // Generate 10 skin-tone variations for diversity
    const skinTones = ['#FFCC99', '#F0B070', '#D08850', '#C07040', '#A05020', '#FFE0B0', '#FFDEAD', '#E8C090', '#D4A070', '#B87040'];
    const hairColors = ['#333333', '#000000', '#663300', '#996633', '#CC9900', '#4A2000', '#222222', '#555555', '#774400', '#111111'];

    for (let variant = 0; variant < 48; variant++) {
      const varCanvas = document.createElement('canvas');
      varCanvas.width = 32;
      varCanvas.height = 32;
      const vCtx = varCanvas.getContext('2d')!;
      const skinIdx = variant % skinTones.length;
      const hairIdx = variant % hairColors.length;

      // Face circle
      vCtx.fillStyle = skinTones[skinIdx];
      vCtx.beginPath();
      vCtx.arc(16, 16, 14, 0, Math.PI * 2);
      vCtx.fill();
      vCtx.strokeStyle = this.shadeColor(skinTones[skinIdx], -30);
      vCtx.lineWidth = 1;
      vCtx.stroke();

      // Hair
      vCtx.fillStyle = hairColors[hairIdx];
      vCtx.beginPath();
      vCtx.ellipse(16, 4, 12, 8, 0, Math.PI, 0);
      vCtx.fill();

      // Eyes
      vCtx.fillStyle = variant % 5 === 0 ? '#4444AA' : variant % 5 === 1 ? '#448844' : '#333333';
      vCtx.beginPath(); vCtx.arc(11, 13, 2.5, 0, Math.PI * 2); vCtx.fill();
      vCtx.beginPath(); vCtx.arc(21, 13, 2.5, 0, Math.PI * 2); vCtx.fill();
      vCtx.fillStyle = '#FFFFFF';
      vCtx.beginPath(); vCtx.arc(12, 12.5, 1, 0, Math.PI * 2); vCtx.fill();
      vCtx.beginPath(); vCtx.arc(22, 12.5, 1, 0, Math.PI * 2); vCtx.fill();

      // Nose
      vCtx.fillStyle = this.shadeColor(skinTones[skinIdx], -20);
      vCtx.beginPath(); vCtx.arc(16, 17, 1.5, 0, Math.PI * 2); vCtx.fill();

      // Mouth
      vCtx.strokeStyle = '#993333';
      vCtx.lineWidth = 1.5;
      vCtx.beginPath();
      vCtx.arc(16, 19, 4, 0, Math.PI);
      vCtx.stroke();

      this.textures.addCanvas(`face_${variant}`, varCanvas);
    }
  }

  private shadeColor(hex: string, amount: number): string {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  create() {
    this.scene.start('MenuScene');
  }
}
