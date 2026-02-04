import React from 'react';
import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  FollowCamera,
} from '@babylonjs/core';
import { grammarRounds } from '../data/grammarData.js';
import { mathRounds } from '../data/mathData.js';

const buildQuestionPool = () => {
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
};

export default function BabylonCanvas({ mode = 'overworld', bossName = 'Boss', onComplete }) {
  const canvasRef = React.useRef(null);
  const engineRef = React.useRef(null);
  const sceneRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const bossRef = React.useRef(null);
  const [status, setStatus] = React.useState('loading');
  const [question, setQuestion] = React.useState(null);
  const [playerHp, setPlayerHp] = React.useState(4);
  const [bossHp, setBossHp] = React.useState(6);
  const [log, setLog] = React.useState('');
  const [bossCast, setBossCast] = React.useState(null);
  const [interruptCdMs, setInterruptCdMs] = React.useState(0);
  const bossMatRef = React.useRef(null);
  const questionPoolRef = React.useRef(buildQuestionPool());
  const inputRef = React.useRef({ left: false, right: false, up: false, down: false });
  const castTimerRef = React.useRef(null);
  const tickTimerRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new Color3(0.08, 0.1, 0.16);

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.8;

    const dir = new DirectionalLight('dir', new Vector3(-0.6, -1, -0.4), scene);
    dir.position = new Vector3(10, 20, 10);
    dir.intensity = 0.6;

    const ground = MeshBuilder.CreateGround('ground', { width: 60, height: 60 }, scene);
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = mode === 'dungeon' ? new Color3(0.16, 0.18, 0.26) : new Color3(0.35, 0.55, 0.45);
    groundMat.specularColor = new Color3(0, 0, 0);
    ground.material = groundMat;

    if (mode === 'dungeon') {
      for (let i = 0; i < 10; i += 1) {
        const pillar = MeshBuilder.CreateBox(`pillar-${i}`, { width: 1, height: 4, depth: 1 }, scene);
        pillar.position = new Vector3(-12 + i * 2.5, 2, -12);
        const pillarMat = new StandardMaterial(`pillar-mat-${i}`, scene);
        pillarMat.diffuseColor = new Color3(0.6, 0.5, 0.3);
        pillar.material = pillarMat;
      }
    }

    const player = MeshBuilder.CreateCapsule('player', { height: 2, radius: 0.6 }, scene);
    player.position = new Vector3(-6, 1, 0);
    const playerMat = new StandardMaterial('playerMat', scene);
    playerMat.diffuseColor = new Color3(1, 0.55, 0.7);
    player.material = playerMat;
    playerRef.current = player;

    const boss = MeshBuilder.CreateSphere('boss', { diameter: 3 }, scene);
    boss.position = new Vector3(8, 1.5, 0);
    const bossMat = new StandardMaterial('bossMat', scene);
    bossMat.diffuseColor = new Color3(0.5, 0.8, 1);
    boss.material = bossMat;
    bossRef.current = boss;
    bossMatRef.current = bossMat;

    const camera = new FollowCamera('follow', new Vector3(-10, 8, -10), scene);
    camera.radius = 14;
    camera.heightOffset = 6;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.08;
    camera.maxCameraSpeed = 4;
    camera.lockedTarget = player;
    camera.attachControl(canvas, true);

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    const keyHandler = (isDown) => (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputRef.current.left = isDown;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputRef.current.right = isDown;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputRef.current.up = isDown;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          inputRef.current.down = isDown;
          break;
        default:
          break;
      }
    };

    const onKeyDown = keyHandler(true);
    const onKeyUp = keyHandler(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    scene.onBeforeRenderObservable.add(() => {
      const speed = mode === 'dungeon' ? 0.12 : 0.18;
      const input = inputRef.current;
      const direction = new Vector3(
        (input.right ? 1 : 0) - (input.left ? 1 : 0),
        0,
        (input.down ? 1 : 0) - (input.up ? 1 : 0)
      );
      if (direction.length() > 0) {
        direction.normalize();
        player.position.addInPlace(direction.scale(speed));
      }

      if (mode === 'dungeon') {
        boss.position.x = 8 + Math.sin(scene.getEngine().getDeltaTime() * 0.002 * scene.getFrameId()) * 2;
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    setStatus('ready');

    return () => {
      if (castTimerRef.current) clearInterval(castTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      scene.dispose();
      engine.dispose();
    };
  }, [mode]);


  React.useEffect(() => {
    if (mode !== 'dungeon') return undefined;

    castTimerRef.current = setInterval(() => {
      setBossCast((prev) => {
        if (prev || bossHp <= 0 || playerHp <= 0) return prev;
        const next = {
          spellName: 'Shadow Burst',
          totalMs: 2200,
          remainingMs: 2200,
        };
        setLog(`${bossName} begins casting Shadow Burst!`);
        if (bossMatRef.current) {
          bossMatRef.current.diffuseColor = new Color3(1, 0.45, 0.5);
        }
        return next;
      });
    }, 3600);

    tickTimerRef.current = setInterval(() => {
      setInterruptCdMs((prev) => Math.max(0, prev - 100));
      setBossCast((prev) => {
        if (!prev) return prev;
        const next = { ...prev, remainingMs: prev.remainingMs - 100 };
        if (next.remainingMs <= 0) {
          if (bossMatRef.current) {
            bossMatRef.current.diffuseColor = new Color3(0.5, 0.8, 1);
          }
          setPlayerHp((hp) => Math.max(0, hp - 1));
          setLog(`${bossName} hits you with Shadow Burst!`);
          return null;
        }
        return next;
      });
    }, 100);

    return () => {
      if (castTimerRef.current) clearInterval(castTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [mode, bossHp, playerHp, bossName]);

  const resolveQuestion = (option) => {
    if (!question) return;
    const correct = option === question.answer;
    setQuestion(null);
    if (correct) {
      setBossHp((prev) => Math.max(0, prev - 1));
      setLog('Spell landed! You damage the boss.');
    } else {
      setLog('Your spell fizzled. Try again!');
    }
  };

  const openSpellQuestion = () => {
    if (question || bossHp <= 0 || playerHp <= 0) return;
    const next = questionPoolRef.current.shift() || buildQuestionPool()[0];
    questionPoolRef.current.push(next);
    setQuestion(next);
    setLog('Cast Spell: answer to hit the boss.');
  };

  const attemptInterrupt = () => {
    if (interruptCdMs > 0) {
      setLog('Counterspell recharging.');
      return;
    }
    setInterruptCdMs(5000);
    setBossCast((prev) => {
      if (!prev) {
        setLog('No spell to interrupt.');
        return prev;
      }
      if (bossMatRef.current) {
        bossMatRef.current.diffuseColor = new Color3(0.5, 0.8, 1);
      }
      setLog('Counterspell! Boss cast interrupted.');
      return null;
    });
  };

  React.useEffect(() => {
    const onKeySpell = (event) => {
      if (mode !== 'dungeon') return;
      if (event.key === '1') openSpellQuestion();
      if (event.key === '2') attemptInterrupt();
    };
    window.addEventListener('keydown', onKeySpell);
    return () => window.removeEventListener('keydown', onKeySpell);
  }, [mode, openSpellQuestion, attemptInterrupt]);

  React.useEffect(() => {
    if (mode !== 'dungeon') return;
    if (bossHp <= 0) {
      setLog('Dungeon cleared!');
      if (onComplete) {
        const timer = setTimeout(() => onComplete({ win: true }), 900);
        return () => clearTimeout(timer);
      }
    }
    if (playerHp <= 0) {
      setLog('You were defeated.');
      if (onComplete) {
        const timer = setTimeout(() => onComplete({ win: false }), 900);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [bossHp, playerHp, mode, onComplete]);

  return (
    <div className="babylon-frame">
      <canvas ref={canvasRef} />
      {status !== 'ready' && <div className="phaser-overlay">Loading 3D scene...</div>}
      {mode === 'dungeon' && (
        <div className="babylon-hud">
          <div>
            <strong>{bossName}</strong> HP: {bossHp}
          </div>
          <div>
            <strong>You</strong> HP: {playerHp}
          </div>
          {log && <div className="babylon-log">{log}</div>}
        </div>
      )}
      {mode === 'dungeon' && (
        <div className="babylon-actions">
          <button onClick={openSpellQuestion}>Cast Spell</button>
          <button onClick={attemptInterrupt}>
            Counterspell {interruptCdMs > 0 ? `(${Math.ceil(interruptCdMs / 1000)}s)` : ''}
          </button>
          {bossCast && (
            <div className="cast-bar">
              <span>{bossCast.spellName}</span>
              <div className="cast-track">
                <div
                  className="cast-fill"
                  style={{ width: `${Math.max(0, (bossCast.remainingMs / bossCast.totalMs) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {question && (
        <div className="babylon-question">
          <div className="question-title">Cast Spell</div>
          <p>{question.prompt}</p>
          <div className="question-options">
            {question.options.map((option) => (
              <button key={option} onClick={() => resolveQuestion(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
