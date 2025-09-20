const config = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  backgroundColor: '#4174cf',
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'matter', matter: { gravity: { y: 1 }, debug: false } },
  scene: { create, update, resize }
};
new Phaser.Game(config);

let score = 0;
let scoreText, restartBtn, base;
let blocksGroup, paletteGroup;
let draggingClone = null;

function create() {
  blocksGroup = this.add.group();
  paletteGroup = this.add.group();
  buildLayout.call(this);
  this.scale.on('resize', s => resize.call(this, s));
}

function buildLayout() {
  const { width, height } = this.scale;
  const hudHeight     = Math.max(50, height * 0.08);
  const paletteHeight = Math.max(70, height * 0.15);
  const pad = Math.min(width, height) * 0.02;

  // ----- HUD -----
  if (scoreText) scoreText.destroy();
  if (restartBtn) restartBtn.destroy();

  scoreText = this.add.text(pad, pad, 'Score: 0', {
    fontSize: `${Math.max(16,width*0.04)}px`,
    fill:'#fff'
  });

  // RIGHT-aligned restart button
  restartBtn = this.add.text(width - pad, pad, 'Restart', {
      fontSize: `${Math.max(14,width*0.04)}px`,
      fill:'#fff',
      backgroundColor:'#000',
      padding:{x:8,y:4}
    })
    .setOrigin(1,0) // anchor to right-top corner
    .setInteractive({ useHandCursor:true })
    .on('pointerdown', () => restartGame.call(this));

  // ----- Shape Palette -----
 // ----- Shape Palette with variable widths and equal gaps -----
paletteGroup.clear(true, true);

// Example sizes for the 5 rectangles (you can tweak)
const sizes = [
  { w: width * 0.15, h: paletteHeight * 0.35 },
  { w: width * 0.10, h: paletteHeight * 0.45 },
  { w: width * 0.18, h: paletteHeight * 0.30 },
  { w: width * 0.12, h: paletteHeight * 0.40 },
  { w: width * 0.14, h: paletteHeight * 0.36 }
];

// 1. total width of all shapes
const totalShapesWidth = sizes.reduce((sum, s) => sum + s.w, 0);

// 2. total available width for gaps (N + 1 gaps: left + right + between each pair)
const gapsCount = sizes.length + 1;
const gap = (width - totalShapesWidth) / gapsCount;

// 3. draw shapes with equal gaps
let currentX = gap; // start after the left outer gap
const centerY = hudHeight + paletteHeight / 2;

sizes.forEach((s) => {
  const x = currentX + s.w / 2; // center of this shape
  const shape = this.add.rectangle(x, centerY, s.w, s.h, 0x374d9d)
    .setStrokeStyle(2, 0xffffff)
    .setInteractive();
  paletteGroup.add(shape);

  shape.on('pointerdown', pointer => {
    if (draggingClone) draggingClone.destroy();
    draggingClone = this.add.rectangle(pointer.x, pointer.y, s.w, s.h, 0x374d9d)
      .setStrokeStyle(2, 0xffffff);
  });

  currentX += s.w + gap; // move to the start of the next gap
});


  // ----- Base platform -----
  const baseY = height - 20;
  if (base) base.destroy();
  base = this.add.rectangle(width/2, baseY, width*0.75, 20, 0x11182a);
  this.matter.add.gameObject(base, { isStatic:true });

  // Drag/Drop
  this.input.on('pointermove', p => {
    if (draggingClone) { draggingClone.x = p.x; draggingClone.y = p.y; }
  });
  this.input.on('pointerup', p => {
    if (!draggingClone) return;
    if (p.y > hudHeight + paletteHeight && p.y < baseY) {
      this.matter.add.gameObject(draggingClone);
      blocksGroup.add(draggingClone);
      draggingClone.once('removedfromworld', () => adjustScore(-1));
      adjustScore(1);
    } else draggingClone.destroy();
    draggingClone = null;
  });
}

function update() {}

function resize(gameSize) {
  this.cameras.main.setSize(gameSize.width, gameSize.height);
  buildLayout.call(this);
}

function adjustScore(delta) {
  score = Math.max(0, score + delta);
  scoreText.setText('Score: ' + score);
}

function restartGame() {
  blocksGroup.getChildren().forEach(b=>{
    if (b.body) this.matter.world.remove(b.body);
    b.destroy();
  });
  blocksGroup.clear(true);
  adjustScore(-score);
}