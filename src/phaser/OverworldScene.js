import Phaser from 'phaser';

export default class OverworldScene extends Phaser.Scene {
  constructor() {
    super('overworld');
    this.player = null;
    this.enemy = null;
    this.cursors = null;
    this.spaceKey = null;
    this.projectiles = null;
    this.lastShot = 0;
    this.facing = { x: 1, y: 0 };
    this.enemyHp = 30;
    this.enemyHpText = null;
    this.bossDefeated = false;
  }

  create() {
    this.add.rectangle(400, 300, 820, 620, 0xf7f3ff).setStrokeStyle(6, 0xffd7ee);

    this.player = this.add.rectangle(200, 300, 32, 42, 0xff8ab1);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.enemy = this.add.rectangle(600, 300, 46, 46, 0x7ed9ff);
    this.physics.add.existing(this.enemy, true);
    if (this.enemy.body && this.enemy.body.setAllowGravity) {
      this.enemy.body.setAllowGravity(false);
    }
    this.enemy.setDepth(2);

    this.projectiles = this.physics.add.group();
    this.physics.add.overlap(this.projectiles, this.enemy, this.handleHit, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.enemyHpText = this.add.text(520, 240, `Boss HP: ${this.enemyHp}`, {
      fontFamily: 'Baloo 2',
      fontSize: '16px',
      color: '#2d1b3f',
    });

    this.add.text(24, 24, 'Overworld Online', {
      fontFamily: 'Baloo 2',
      fontSize: '14px',
      color: '#2d1b3f',
    });
  }

  handleHit(obj1, obj2) {
    const projectile = obj1 === this.enemy ? obj2 : obj1;
    if (projectile && projectile !== this.enemy) {
      projectile.destroy();
    }
    if (this.bossDefeated) return;
    this.enemyHp = Math.max(0, this.enemyHp - 5);
    this.enemyHpText.setText(`Boss HP: ${this.enemyHp}`);
    if (this.enemyHp === 0) {
      this.bossDefeated = true;
      this.enemy.setFillStyle(0xffc4dd);
      this.add.text(520, 270, 'Boss Defeated!', {
        fontFamily: 'Baloo 2',
        fontSize: '16px',
        color: '#2d1b3f',
      });
      this.time.delayedCall(800, () => {
        window.dispatchEvent(new CustomEvent('moonlit:overworldComplete'));
      });
    }
  }

  shootSpell() {
    const now = this.time.now;
    if (now - this.lastShot < 280) return;
    this.lastShot = now;
    const bullet = this.add.circle(this.player.x, this.player.y, 6, 0xffe66d);
    this.physics.add.existing(bullet);
    bullet.body.setVelocity(this.facing.x * 360, this.facing.y * 360);
    bullet.body.setAllowGravity(false);
    this.projectiles.add(bullet);
    this.time.delayedCall(1400, () => bullet.destroy());
  }

  update() {
    const speed = 180;
    const body = this.player.body;
    body.setVelocity(0, 0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
      this.facing = { x: -1, y: 0 };
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
      this.facing = { x: 1, y: 0 };
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-speed);
      this.facing = { x: 0, y: -1 };
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(speed);
      this.facing = { x: 0, y: 1 };
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shootSpell();
    }
  }
}
