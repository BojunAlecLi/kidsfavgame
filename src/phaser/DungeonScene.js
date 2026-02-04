import Phaser from 'phaser';
import { grammarRounds } from '../data/grammarData.js';
import { mathRounds } from '../data/mathData.js';

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('dungeon');
    this.player = null;
    this.boss = null;
    this.cursors = null;
    this.questionLayer = null;
    this.questionActive = false;
    this.playerHp = 4;
    this.bossHp = 6;
    this.bossHpText = null;
    this.playerHpText = null;
    this.dungeonId = '';
    this.bossName = '';
    this.questions = [];
  }

  init(data) {
    this.dungeonId = data?.dungeonId || 'unknown';
    this.bossName = data?.bossName || 'Boss';
  }

  create() {
    this.add.rectangle(400, 300, 820, 620, 0x1d1f2f).setStrokeStyle(6, 0x45486a);
    this.add.rectangle(400, 300, 760, 540, 0x2a2f44).setStrokeStyle(2, 0x51557a);

    for (let i = 0; i < 10; i += 1) {
      this.add.rectangle(120 + i * 60, 120, 24, 48, 0xffd166).setAlpha(0.6);
      this.add.circle(120 + i * 60, 100, 6, 0xfff1a6).setAlpha(0.8);
    }

    this.player = this.add.rectangle(240, 380, 30, 40, 0xff8ab1);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.boss = this.add.rectangle(600, 240, 60, 60, 0x7ed9ff);
    this.physics.add.existing(this.boss, true);

    this.tweens.add({
      targets: this.boss,
      x: 620,
      y: 200,
      yoyo: true,
      repeat: -1,
      duration: 1800,
      ease: 'Sine.easeInOut',
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.playerHpText = this.add.text(40, 40, `HP: ${this.playerHp}`, {
      fontFamily: 'Baloo 2',
      fontSize: '16px',
      color: '#fbe3ff',
    });

    this.bossHpText = this.add.text(560, 40, `${this.bossName} HP: ${this.bossHp}`, {
      fontFamily: 'Baloo 2',
      fontSize: '16px',
      color: '#fbe3ff',
    });

    this.questions = this.buildQuestionPool();

    this.time.addEvent({
      delay: 2800,
      loop: true,
      callback: () => this.castSpell(),
    });
  }

  buildQuestionPool() {
    const grammarItems = grammarRounds.flatMap((round) =>
      round.items.map((item) => ({
        prompt: item.sentence,
        options: item.options,
        answer: item.answer,
      }))
    );
    const mathItems = mathRounds.flatMap((round) =>
      round.items.map((item) => ({
        prompt: item.question,
        options: item.options,
        answer: item.answer,
      }))
    );
    const combined = [...grammarItems, ...mathItems];
    const pool = [];
    while (pool.length < 6) {
      pool.push(combined[Math.floor(Math.random() * combined.length)]);
    }
    return pool;
  }

  castSpell() {
    if (this.questionActive || this.bossHp <= 0 || this.playerHp <= 0) return;

    this.questionActive = true;
    const telegraph = this.add.circle(this.player.x, this.player.y, 80, 0xff4d6d, 0.25);
    this.tweens.add({ targets: telegraph, alpha: 0.6, duration: 300, yoyo: true, repeat: 2 });

    const question = this.questions.shift() || this.buildQuestionPool()[0];
    this.showQuestion(question, (correct) => {
      telegraph.destroy();
      if (correct) {
        this.bossHp -= 1;
        this.bossHpText.setText(`${this.bossName} HP: ${this.bossHp}`);
        this.boss.setFillStyle(0x9dffb3);
        this.time.delayedCall(260, () => this.boss.setFillStyle(0x7ed9ff));
        if (this.bossHp <= 0) {
          this.finishDungeon(true);
          return;
        }
      } else {
        this.playerHp -= 1;
        this.playerHpText.setText(`HP: ${this.playerHp}`);
        this.player.setFillStyle(0xff4d6d);
        this.time.delayedCall(260, () => this.player.setFillStyle(0xff8ab1));
        if (this.playerHp <= 0) {
          this.finishDungeon(false);
          return;
        }
      }
      this.questionActive = false;
    });
  }

  showQuestion(question, onResolve) {
    const panel = this.add.rectangle(400, 300, 520, 280, 0x1a1733, 0.95).setStrokeStyle(2, 0xffd166);
    const text = this.add.text(200, 220, question.prompt, {
      fontFamily: 'Baloo 2',
      fontSize: '18px',
      color: '#fbe3ff',
      wordWrap: { width: 400 },
    });

    const buttons = question.options.map((option, index) => {
      const x = 220 + (index % 2) * 200;
      const y = 300 + Math.floor(index / 2) * 50;
      const btn = this.add.rectangle(x, y, 180, 40, 0x7ed9ff, 0.9).setInteractive();
      const label = this.add.text(x - 70, y - 10, option, {
        fontFamily: 'Baloo 2',
        fontSize: '16px',
        color: '#1a1733',
      });
      btn.on('pointerdown', () => {
        const correct = option === question.answer;
        this.clearQuestion(panel, text, buttons);
        onResolve(correct);
      });
      return { btn, label };
    });

    this.questionLayer = { panel, text, buttons };
  }

  clearQuestion(panel, text, buttons) {
    panel.destroy();
    text.destroy();
    buttons.forEach(({ btn, label }) => {
      btn.destroy();
      label.destroy();
    });
  }

  finishDungeon(win) {
    this.questionActive = true;
    const banner = this.add.text(240, 140, win ? 'Dungeon Cleared!' : 'Dungeon Failed', {
      fontFamily: 'Baloo 2',
      fontSize: '24px',
      color: '#fbe3ff',
    });
    this.time.delayedCall(1000, () => {
      window.dispatchEvent(
        new CustomEvent('moonlit:dungeonComplete', {
          detail: { dungeonId: this.dungeonId, win },
        })
      );
      banner.destroy();
    });
  }

  update() {
    if (this.questionActive) return;
    const speed = 180;
    const body = this.player.body;
    body.setVelocity(0, 0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(speed);
    }
  }
}
