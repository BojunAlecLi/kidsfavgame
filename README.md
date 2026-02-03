# Moonlit Learning Hub

A magical learning hub for grade 1–2 students, focused on reading, grammar, writing, and math. It includes a daily focus challenge, a timed challenge trail, an avatar creator, and a rewards room with badges and unlockables.

## Run Locally

```bash
npm install
npm run dev
```

## Customize Content

- Reading stories: `src/data/storyData.js`
- Grammar rounds: `src/data/grammarData.js`
- Math rounds: `src/data/mathData.js`
- Writing prompts: `src/data/writingPrompts.js`
- Reward items and badges: `src/data/rewards.js`

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
