import React from 'react';
import Phaser from 'phaser';
import OverworldScene from '../phaser/OverworldScene.js';

export default function PhaserCanvas() {
  const containerRef = React.useRef(null);
  const [status, setStatus] = React.useState('loading');

  React.useEffect(() => {
    if (!containerRef.current) return;

    let game;
    try {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: containerRef.current,
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: [OverworldScene],
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
  }, []);

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
