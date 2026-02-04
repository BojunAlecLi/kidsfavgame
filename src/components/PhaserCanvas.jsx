import React from 'react';
import Phaser from 'phaser';
import OverworldScene from '../phaser/OverworldScene.js';
import DungeonScene from '../phaser/DungeonScene.js';

export default function PhaserCanvas({ sceneKey = 'overworld', sceneData = {} }) {
  const containerRef = React.useRef(null);
  const [status, setStatus] = React.useState('loading');

  React.useEffect(() => {
    if (!containerRef.current) return;

    let game;
    try {
      class BootScene extends Phaser.Scene {
        constructor() {
          super('boot');
        }

        create() {
          this.scene.start(sceneKey, sceneData);
        }
      }

      const width = 800;
      const height = 600;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width,
        height,
        parent: containerRef.current,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width,
          height,
        },
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: [BootScene, OverworldScene, DungeonScene],
        backgroundColor: '#f7f3ff',
      });
      setStatus('ready');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Phaser failed to start', err);
      setStatus('error');
    }

    return () => {
      if (game) game.destroy(true);
    };
  }, [sceneKey]);

  return (
    <div className="phaser-frame" ref={containerRef}>
      {status !== 'ready' && (
        <div className="phaser-overlay">
          {status === 'error' ? 'Phaser failed to load. Check the console.' : 'Loading overworld...'}
        </div>
      )}
    </div>
  );
}
