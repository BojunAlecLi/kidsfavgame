import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEFAULT_PROFILE = {
  name: 'Nova',
  avatar: {
    base: 'peach',
    hair: 'night',
    outfit: 'petal',
    accessory: 'glow',
    companion: 'fox',
    companionLabel: 'Star Fox',
  },
};

const DEFAULT_PROGRESS = {
  stars: 0,
  gems: 0,
  xp: 0,
  level: 1,
  energy: 10,
  energyDate: '',
  streak: 0,
  bestStreak: 0,
  storyWins: 0,
  grammarCorrect: 0,
  mathCorrect: 0,
  writingDone: 0,
  battleWins: 0,
  wordForgeWins: 0,
  patternWins: 0,
  adventureWins: 0,
  dungeonClears: [],
  dailyBonusDate: '',
  claimedQuests: [],
  badges: [],
  inventory: {
    items: [],
    outfits: [],
    accessories: [],
    companions: [],
  },
  recentRewards: [],
};

const now = () => new Date().toISOString();

const getProfileByName = db.prepare('SELECT * FROM profiles WHERE name = ?');
const getProfileById = db.prepare('SELECT * FROM profiles WHERE id = ?');
const insertProfile = db.prepare(
  'INSERT INTO profiles (name, avatar_json, created_at) VALUES (?, ?, ?)'
);
const listProfiles = db.prepare('SELECT id, name, created_at FROM profiles ORDER BY created_at DESC');
const getProgress = db.prepare('SELECT * FROM progress WHERE profile_id = ?');
const upsertProgress = db.prepare(
  `INSERT INTO progress (profile_id, progress_json, updated_at)
   VALUES (?, ?, ?)
   ON CONFLICT(profile_id) DO UPDATE SET progress_json = excluded.progress_json, updated_at = excluded.updated_at`
);
const updateProfile = db.prepare(
  'UPDATE profiles SET name = ?, avatar_json = ? WHERE id = ?'
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/profiles', (_req, res) => {
  res.json(listProfiles.all());
});

app.post('/api/login', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  let profile = getProfileByName.get(name);
  if (!profile) {
    const avatar = { ...DEFAULT_PROFILE.avatar };
    const info = insertProfile.run(name, JSON.stringify(avatar), now());
    const profileId = info.lastInsertRowid;
    upsertProgress.run(profileId, JSON.stringify(DEFAULT_PROGRESS), now());
    profile = getProfileById.get(profileId);
  }

  const progress = getProgress.get(profile.id);
  res.json({
    profileId: profile.id,
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: JSON.parse(profile.avatar_json),
    },
    progress: progress ? JSON.parse(progress.progress_json) : DEFAULT_PROGRESS,
  });
});

app.get('/api/profile/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const profile = getProfileById.get(id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  const progress = getProgress.get(id);
  res.json({
    profileId: profile.id,
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: JSON.parse(profile.avatar_json),
    },
    progress: progress ? JSON.parse(progress.progress_json) : DEFAULT_PROGRESS,
  });
});

app.put('/api/save', (req, res) => {
  const { profileId, profile, progress } = req.body || {};
  const id = Number(profileId);
  if (!id || !profile || !progress) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    updateProfile.run(profile.name, JSON.stringify(profile.avatar), id);
    upsertProgress.run(id, JSON.stringify(progress), now());
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: 'Name already in use' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Moonlit server running on http://localhost:${PORT}`);
});
