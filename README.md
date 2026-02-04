# Moonlit Learning Hub

A magical learning hub for grade 1–2 students, focused on reading, grammar, writing, and math. It includes a daily focus challenge, RPG-style world map and quests, a timed challenge trail, an avatar creator, and a rewards room with badges, relics, and unlockables.

## Run Locally

```bash
npm install
npm run server
npm run dev
```

This runs the SQLite + Express server on `http://localhost:3001` and the Vite client on `http://localhost:5173`.

## SQLite Data

The SQLite database is stored at `server/data/moonlit.db`.

View via CLI:

```bash
sqlite3 server/data/moonlit.db
.tables
SELECT * FROM profiles;
SELECT * FROM progress;
```

Or open the `.db` file in DB Browser for SQLite / TablePlus / DBeaver.

## Customize Content

- Reading stories: `src/data/storyData.js`
- Grammar rounds: `src/data/grammarData.js`
- Math rounds: `src/data/mathData.js`
- Writing prompts: `src/data/writingPrompts.js`
- Word Forge puzzles: `src/data/wordForge.js`
- Pattern Path rounds: `src/data/patternData.js`
- RPG zones, quests, relics, and enemies: `src/data/rpgData.js`
- Reward items and badges: `src/data/rewards.js`

## Phaser 3 Overworld

The real-time overworld scene is in `src/phaser/OverworldScene.js` and mounted via `src/components/PhaserCanvas.jsx`.
Use this as the base to build dungeons, raids, enemies, skills, and boss mechanics.

## Swap in Art Assets

The UI uses simple shapes so it works without external images. To add art:

1. Drop images into `public/assets/`.
2. Reference them in `src/App.jsx` or a new component.
3. Keep a credits section if the asset license requires attribution.

Recommended sources for kid-friendly art assets:

- Kenney (CC0 game assets)
- OpenGameArt (varied licenses)
- itch.io free asset packs
- OpenMoji (CC BY-SA)

## Notes

- The app persists progress locally using `localStorage`.
- The daily focus bonus gives 1 extra gem per day.
- Challenge Trail is timed at 90 seconds.
