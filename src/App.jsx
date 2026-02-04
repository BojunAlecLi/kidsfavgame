import React, { useMemo, useRef, useState } from 'react';
import { stories } from './data/storyData.js';
import { grammarRounds } from './data/grammarData.js';
import { mathRounds } from './data/mathData.js';
import { writingPrompts } from './data/writingPrompts.js';
import { badges, outfits, accessories, companions } from './data/rewards.js';
import { wordForgePuzzles } from './data/wordForge.js';
import { patternRounds } from './data/patternData.js';
import { zones, quests, relics, enemies, adventures } from './data/rpgData.js';
import AvatarPreview from './components/AvatarPreview.jsx';
import PhaserCanvas from './components/PhaserCanvas.jsx';

const STORAGE_PROFILE_ID = 'moonlit-profile-id';
const ENERGY_MAX = 10;

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
  energy: ENERGY_MAX,
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

const SCREEN = {
  HUB: 'hub',
  MAP: 'map',
  QUESTS: 'quests',
  STORY: 'story',
  GRAMMAR: 'grammar',
  MATH: 'math',
  WRITING: 'writing',
  CHALLENGE: 'challenge',
  REWARDS: 'rewards',
  AVATAR: 'avatar',
  BATTLE: 'battle',
  WORDFORGE: 'wordforge',
  PATTERN: 'pattern',
  ADVENTURE: 'adventure',
  OVERWORLD: 'overworld',
};

const GAME_SCREENS = new Set([
  SCREEN.STORY,
  SCREEN.GRAMMAR,
  SCREEN.MATH,
  SCREEN.WRITING,
  SCREEN.CHALLENGE,
  SCREEN.BATTLE,
  SCREEN.WORDFORGE,
  SCREEN.PATTERN,
  SCREEN.ADVENTURE,
  SCREEN.OVERWORLD,
]);

const baseOptions = [
  { id: 'peach', label: 'Peach' },
  { id: 'cocoa', label: 'Cocoa' },
  { id: 'honey', label: 'Honey' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'rose', label: 'Rose' },
  { id: 'lilac', label: 'Lilac' },
];

const hairOptions = [
  { id: 'night', label: 'Night' },
  { id: 'chestnut', label: 'Chestnut' },
  { id: 'gold', label: 'Gold' },
  { id: 'blush', label: 'Blush' },
  { id: 'teal', label: 'Teal' },
];

const outfitOptions = [
  { id: 'petal', label: 'Petal' },
  { id: 'mint', label: 'Mint' },
  { id: 'sky', label: 'Sky' },
  { id: 'sunshine', label: 'Sunshine' },
  { id: 'violet', label: 'Violet' },
];

const accessoryOptions = [
  { id: 'glow', label: 'Glow' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'moon', label: 'Moon' },
];

const companionOptions = [
  { id: 'fox', label: 'Star Fox' },
  { id: 'owl', label: 'Moon Owl' },
  { id: 'bunny', label: 'Garden Bunny' },
  { id: 'cat', label: 'Luna Cat' },
];

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const badgeNameById = (id) => badges.find((badge) => badge.id === id)?.name || 'Badge';

const computeBadges = (progress) => {
  const earned = new Set(progress.badges);
  if (progress.storyWins >= 3) earned.add('story-spark');
  if (progress.grammarCorrect >= 8) earned.add('grammar-glow');
  if (progress.mathCorrect >= 10) earned.add('math-meteor');
  if (progress.writingDone >= 3) earned.add('writer-wings');
  if (progress.bestStreak >= 5) earned.add('streak-star');
  if (progress.stars >= 50) earned.add('moon-master');
  if (progress.battleWins >= 2) earned.add('battle-bright');
  if (progress.wordForgeWins >= 3) earned.add('word-wizard');
  if (progress.patternWins >= 3) earned.add('pattern-pro');
  if (progress.level >= 5) earned.add('level-leader');
  return Array.from(earned);
};

const levelThreshold = (level) => 80 + level * 40;

const getQuestStatus = (quest, progress) => {
  const current = progress[quest.type] || 0;
  const done = current >= quest.target;
  return { current, total: quest.target, done };
};

const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }
  return response.json();
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.HUB);
  const [dailyMode, setDailyMode] = useState(null);
  const [activeZone, setActiveZone] = useState(zones[0]?.id || 'moon-meadow');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [profileId, setProfileId] = useState(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginName, setLoginName] = useState('');
  const [profilesList, setProfilesList] = useState([]);
  const saveTimer = useRef(null);

  React.useEffect(() => {
    const initialize = async () => {
      try {
        const cachedId = localStorage.getItem(STORAGE_PROFILE_ID);
        if (cachedId) {
          const data = await api(`/profile/${cachedId}`);
          setProfileId(data.profileId);
          setProfile(data.profile);
          setProgress(data.progress);
        }
        const list = await api('/profiles');
        setProfilesList(list);
      } catch (err) {
        localStorage.removeItem(STORAGE_PROFILE_ID);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  React.useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setProgress((prev) => {
      if (prev.energyDate === todayKey) return prev;
      return { ...prev, energyDate: todayKey, energy: ENERGY_MAX };
    });
  }, []);

  React.useEffect(() => {
    if (!profileId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api('/save', {
        method: 'PUT',
        body: JSON.stringify({ profileId, profile, progress }),
      }).catch(() => {
        setToast('Server offline. Progress not saved yet.');
      });
    }, 500);
  }, [profile, progress, profileId]);

  const dailyChallengeType = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const types = ['story', 'grammar', 'math', 'writing'];
    return types[hashString(todayKey) % types.length];
  }, []);

  const awardProgress = (payload) => {
    setProgress((prev) => {
      const todayKey = new Date().toISOString().slice(0, 10);
      let energy = prev.energy;
      let energyDate = prev.energyDate || todayKey;
      if (energyDate !== todayKey) {
        energyDate = todayKey;
        energy = ENERGY_MAX;
      }

      const next = {
        ...prev,
        stars: prev.stars + (payload.stars || 0),
        gems: prev.gems + (payload.gems || 0),
        xp: prev.xp + (payload.xp || 0),
        storyWins: prev.storyWins + (payload.storyWins || 0),
        grammarCorrect: prev.grammarCorrect + (payload.grammarCorrect || 0),
        mathCorrect: prev.mathCorrect + (payload.mathCorrect || 0),
        writingDone: prev.writingDone + (payload.writingDone || 0),
        battleWins: prev.battleWins + (payload.battleWins || 0),
        wordForgeWins: prev.wordForgeWins + (payload.wordForgeWins || 0),
        patternWins: prev.patternWins + (payload.patternWins || 0),
        adventureWins: prev.adventureWins + (payload.adventureWins || 0),
        energy: Math.max(0, energy - (payload.energyCost || 0)),
        energyDate,
      };

      if (payload.resetStreak) {
        next.streak = 0;
      } else if (typeof payload.streakDelta === 'number') {
        next.streak = Math.max(0, prev.streak + payload.streakDelta);
      } else {
        next.streak = prev.streak;
      }

      next.bestStreak = Math.max(prev.bestStreak || 0, next.streak || 0);

      if (payload.log) {
        next.recentRewards = [payload.log, ...prev.recentRewards].slice(0, 4);
      }

      if (payload.dailyBonus) {
        if (prev.dailyBonusDate !== todayKey) {
          next.gems += 1;
          next.dailyBonusDate = todayKey;
          next.recentRewards = [`+1 gem Daily Focus`, ...(next.recentRewards || [])].slice(0, 4);
        }
      }

      if (payload.items?.length) {
        const nextItems = new Set([...(prev.inventory.items || []), ...payload.items]);
        next.inventory = { ...prev.inventory, items: Array.from(nextItems) };
      }

      if (payload.claimQuestId) {
        const claimed = new Set([...(prev.claimedQuests || []), payload.claimQuestId]);
        next.claimedQuests = Array.from(claimed);
      }

      let level = prev.level || 1;
      let xp = next.xp;
      let levelUps = 0;
      while (xp >= levelThreshold(level)) {
        xp -= levelThreshold(level);
        level += 1;
        levelUps += 1;
      }
      next.level = level;
      next.xp = xp;
      if (levelUps > 0) {
        next.gems += levelUps * 2;
        next.recentRewards = [`Level up x${levelUps} (+${levelUps * 2} gems)`, ...next.recentRewards].slice(0, 4);
        setToast(`Level up! You are now level ${level}.`);
      }

      const newBadges = computeBadges(next);
      const unlocked = newBadges.filter((id) => !prev.badges.includes(id));
      next.badges = newBadges;

      if (unlocked.length > 0) {
        setToast(`Badge unlocked: ${badgeNameById(unlocked[0])}`);
      }

      return next;
    });

    if (payload.toast) {
      setToast(payload.toast);
    }
  };

  const buyItem = (type, item) => {
    if (progress.gems < item.cost) {
      setToast('Not enough gems yet.');
      return;
    }
    setProgress((prev) => {
      const current = prev.inventory[type];
      if (current.includes(item.id)) return prev;
      return {
        ...prev,
        gems: prev.gems - item.cost,
        inventory: {
          ...prev.inventory,
          [type]: [...current, item.id],
        },
      };
    });
    setToast(`Unlocked ${item.name}!`);
  };

  const updateAvatar = (key, value, label) => {
    setProfile((prev) => ({
      ...prev,
      avatar: {
        ...prev.avatar,
        [key]: value,
        ...(key === 'companion' ? { companionLabel: label } : {}),
      },
    }));
  };

  const startScreen = (nextScreen, options = {}) => {
    if (GAME_SCREENS.has(nextScreen) && progress.energy <= 0) {
      setToast('Out of energy. Rest to refill your spark.');
      return;
    }
    setDailyMode(options.dailyType || null);
    setScreen(nextScreen);
  };

  const restEnergy = () => {
    if (progress.gems < 2) {
      setToast('Need 2 gems to rest.');
      return;
    }
    setProgress((prev) => ({
      ...prev,
      gems: prev.gems - 2,
      energy: Math.min(ENERGY_MAX, prev.energy + 5),
    }));
    setToast('Rested! +5 energy');
  };

  const claimQuest = (quest) => {
    const status = getQuestStatus(quest, progress);
    if (!status.done || progress.claimedQuests.includes(quest.id)) return;
    awardProgress({
      stars: quest.reward.stars,
      gems: quest.reward.gems,
      xp: quest.reward.xp,
      items: quest.reward.item ? [quest.reward.item] : [],
      claimQuestId: quest.id,
      log: `Quest reward: ${quest.title}`,
      toast: 'Quest complete! Rewards collected.',
    });
  };

  const xpPercent = Math.min(100, Math.round((progress.xp / levelThreshold(progress.level)) * 100));

  const handleLogin = async (name) => {
    const safeName = name.trim();
    if (!safeName) return;
    try {
      setLoading(true);
      const data = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ name: safeName }),
      });
      setProfileId(data.profileId);
      setProfile(data.profile);
      setProgress(data.progress);
      localStorage.setItem(STORAGE_PROFILE_ID, data.profileId);
      const list = await api('/profiles');
      setProfilesList(list);
    } catch (err) {
      setToast('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading Moonlit Academy...</div>
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="app">
        <LoginScreen
          loginName={loginName}
          setLoginName={setLoginName}
          profilesList={profilesList}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-badge">Moonlit</span>
          <div>
            <h1>Learning Hub</h1>
            <p>Reading, grammar, writing, and math for magical minds.</p>
          </div>
        </div>
        <div className="profile">
          <div>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-stats">
              <span>⭐ {progress.stars}</span>
              <span>💎 {progress.gems}</span>
              <span>⚡ {progress.energy}</span>
              <span>LV {progress.level}</span>
            </div>
            <div className="xp-bar">
              <div style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
          <div className="profile-actions">
            <button className="ghost" onClick={restEnergy}>
              Rest (+5 ⚡ / 2 💎)
            </button>
            <button className="ghost" onClick={() => setScreen(SCREEN.AVATAR)}>
              Avatar Studio
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="toast" onAnimationEnd={() => setToast('')}>
          {toast}
        </div>
      )}

      {screen === SCREEN.HUB && (
        <Hub
          dailyChallengeType={dailyChallengeType}
          progress={progress}
          onNavigate={setScreen}
          onStartDaily={(type) => startScreen(SCREEN[type.toUpperCase()], { dailyType: type })}
          onStartGame={(next) => startScreen(next)}
        />
      )}

      {screen === SCREEN.MAP && (
        <MapScreen
          activeZone={activeZone}
          onSelectZone={setActiveZone}
          onBack={() => setScreen(SCREEN.HUB)}
          onStartGame={(next) => startScreen(next)}
        />
      )}

      {screen === SCREEN.QUESTS && (
        <QuestBoard progress={progress} onBack={() => setScreen(SCREEN.HUB)} onClaim={claimQuest} />
      )}

      {screen === SCREEN.STORY && (
        <StoryGame
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 2,
              gems: 1,
              xp: result.correct * 6,
              energyCost: 1,
              storyWins: 1,
              streakDelta: result.correct === result.total ? 1 : 0,
              resetStreak: result.correct !== result.total,
              dailyBonus: dailyMode === 'story',
              log: `+${result.correct * 2} stars from Reading`,
              toast: result.correct === result.total ? 'Perfect story score!' : 'Story complete!',
            });
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => {
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
        />
      )}

      {screen === SCREEN.GRAMMAR && (
        <GrammarGame
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 2,
              gems: 1,
              xp: result.correct * 6,
              energyCost: 1,
              grammarCorrect: result.correct,
              streakDelta: result.correct === result.total ? 1 : 0,
              resetStreak: result.correct !== result.total,
              dailyBonus: dailyMode === 'grammar',
              log: `+${result.correct * 2} stars from Grammar`,
              toast: result.correct >= result.total - 1 ? 'Grammar glow!' : 'Grammar round complete!',
            });
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => {
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
        />
      )}

      {screen === SCREEN.MATH && (
        <MathGame
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 2,
              gems: 1,
              xp: result.correct * 6,
              energyCost: 1,
              mathCorrect: result.correct,
              streakDelta: result.correct === result.total ? 1 : 0,
              resetStreak: result.correct !== result.total,
              dailyBonus: dailyMode === 'math',
              log: `+${result.correct * 2} stars from Math`,
              toast: result.correct === result.total ? 'Math meteor!' : 'Math mission done!',
            });
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => {
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
        />
      )}

      {screen === SCREEN.WRITING && (
        <WritingStudio
          onFinish={(result) => {
            awardProgress({
              stars: result.stars,
              gems: result.gems,
              xp: result.stars * 3,
              energyCost: 1,
              writingDone: 1,
              streakDelta: result.gems > 0 ? 1 : 0,
              resetStreak: result.gems === 0,
              dailyBonus: dailyMode === 'writing',
              log: `+${result.stars} stars from Writing`,
              toast: result.gems > 0 ? 'Writing bonus earned!' : 'Writing complete!',
            });
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => {
            setDailyMode(null);
            setScreen(SCREEN.HUB);
          }}
        />
      )}

      {screen === SCREEN.CHALLENGE && (
        <ChallengeTrail
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 3,
              gems: 2,
              xp: result.correct * 10,
              energyCost: 2,
              grammarCorrect: result.grammarCorrect,
              mathCorrect: result.mathCorrect,
              streakDelta: result.correct >= 5 ? 2 : 0,
              resetStreak: result.correct < 5,
              log: `+${result.correct * 3} stars from Challenge`,
              toast: result.correct >= 5 ? 'Challenge champion!' : 'Challenge complete!',
            });
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => setScreen(SCREEN.HUB)}
        />
      )}

      {screen === SCREEN.BATTLE && (
        <SpellBattle
          onFinish={(result) => {
            awardProgress({
              stars: result.stars,
              gems: result.gems,
              xp: result.xp,
              energyCost: 2,
              battleWins: result.win ? 1 : 0,
              log: result.win ? `Spell battle victory (+${result.stars} stars)` : 'Spell battle attempt',
              toast: result.win ? 'Victory! Your spells shined.' : 'Keep training your spells.',
            });
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => setScreen(SCREEN.HUB)}
        />
      )}

      {screen === SCREEN.WORDFORGE && (
        <WordForge
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 3,
              gems: 1,
              xp: result.correct * 8,
              energyCost: 1,
              wordForgeWins: 1,
              log: `+${result.correct * 3} stars from Word Forge`,
              toast: result.correct >= result.total - 1 ? 'Word wizardry!' : 'Word Forge complete!',
            });
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => setScreen(SCREEN.HUB)}
        />
      )}

      {screen === SCREEN.PATTERN && (
        <PatternPath
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 3,
              gems: 1,
              xp: result.correct * 8,
              energyCost: 1,
              patternWins: 1,
              log: `+${result.correct * 3} stars from Pattern Path`,
              toast: result.correct === result.total ? 'Pattern pro!' : 'Pattern Path complete!',
            });
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => setScreen(SCREEN.HUB)}
        />
      )}

      {screen === SCREEN.ADVENTURE && (
        <StoryAdventure
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 4,
              gems: result.correct >= 2 ? 2 : 1,
              xp: result.correct * 10,
              energyCost: 2,
              adventureWins: 1,
              log: `Adventure complete (+${result.correct * 4} stars)`,
              toast: result.correct >= 2 ? 'Adventure mastered!' : 'Adventure complete!',
            });
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => setScreen(SCREEN.HUB)}
        />
      )}

      {screen === SCREEN.OVERWORLD && (
        <OverworldScreen onBack={() => setScreen(SCREEN.HUB)} />
      )}

      {screen === SCREEN.REWARDS && (
        <RewardsRoom progress={progress} onBack={() => setScreen(SCREEN.HUB)} onBuy={buyItem} />
      )}

      {screen === SCREEN.AVATAR && (
        <AvatarStudio
          profile={profile}
          progress={progress}
          onBack={() => setScreen(SCREEN.HUB)}
          onUpdate={updateAvatar}
          onRename={(name) => setProfile((prev) => ({ ...prev, name }))}
        />
      )}
    </div>
  );
}

function LoginScreen({ loginName, setLoginName, profilesList, onLogin }) {
  return (
    <div className="login-card">
      <h2>Moonlit Academy</h2>
      <p>Enter a hero name to load or create progress.</p>
      <div className="login-form">
        <input
          type="text"
          value={loginName}
          onChange={(event) => setLoginName(event.target.value)}
          placeholder="Hero name"
          maxLength={16}
        />
        <button onClick={() => onLogin(loginName)}>Enter</button>
      </div>
      {profilesList.length > 0 && (
        <div className="login-list">
          <h4>Recent Heroes</h4>
          <div className="login-chips">
            {profilesList.map((profile) => (
              <button
                key={profile.id}
                className="ghost"
                onClick={() => onLogin(profile.name)}
              >
                {profile.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Hub({ dailyChallengeType, progress, onNavigate, onStartDaily, onStartGame }) {
  const cards = [
    {
      id: SCREEN.STORY,
      title: 'Story Spark',
      desc: 'Read enchanted stories and answer questions.',
      tag: 'Reading',
    },
    {
      id: SCREEN.GRAMMAR,
      title: 'Grammar Garden',
      desc: 'Fix sentences and grow your word power.',
      tag: 'Grammar',
    },
    {
      id: SCREEN.MATH,
      title: 'Math Meteor',
      desc: 'Solve bright math puzzles and race the stars.',
      tag: 'Math',
    },
    {
      id: SCREEN.WRITING,
      title: 'Writing Studio',
      desc: 'Create your own fairy-tale sentences.',
      tag: 'Writing',
    },
    {
      id: SCREEN.WORDFORGE,
      title: 'Word Forge',
      desc: 'Arrange words to build magical sentences.',
      tag: 'Wordcraft',
    },
    {
      id: SCREEN.PATTERN,
      title: 'Pattern Path',
      desc: 'Solve number patterns to light the road.',
      tag: 'Patterns',
    },
    {
      id: SCREEN.BATTLE,
      title: 'Spell Battle',
      desc: 'Answer quickly to cast spells in combat.',
      tag: 'RPG',
    },
    {
      id: SCREEN.ADVENTURE,
      title: 'Story Adventure',
      desc: 'Make choices and solve language puzzles.',
      tag: 'Adventure',
    },
    {
      id: SCREEN.OVERWORLD,
      title: 'Overworld',
      desc: 'Run, dodge, and cast spells in real time.',
      tag: 'Action',
    },
  ];

  return (
    <main className="hub">
      <section className="hero">
        <div>
          <h2>Welcome to the Moonlit Academy</h2>
          <p>
            Explore stories, polish your grammar, write magical tales, and master math quests.
            Earn gems, collect companions, level up, and unlock new zones on the world map.
          </p>
          <div className="hero-actions">
            <button onClick={() => onNavigate(SCREEN.MAP)}>World Map</button>
            <button className="ghost" onClick={() => onNavigate(SCREEN.QUESTS)}>
              Quest Board
            </button>
            <button className="ghost" onClick={() => onNavigate(SCREEN.REWARDS)}>
              Rewards Room
            </button>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-tag">Daily Focus</div>
          <h3>{dailyChallengeType.toUpperCase()} DAY</h3>
          <p>Complete one {dailyChallengeType} activity for a bonus gem.</p>
          <button onClick={() => onStartDaily(dailyChallengeType)}>Start Daily</button>
        </div>
      </section>

      <section className="cards">
        {cards.map((card) => (
          <button key={card.id} className="card" onClick={() => onStartGame(card.id)}>
            <div className="card-tag">{card.tag}</div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            <span className="card-cta">Play</span>
          </button>
        ))}
      </section>

      <section className="progress">
        <h3>Your Moonlit Progress</h3>
        <div className="progress-grid">
          <div className="progress-card">
            <h4>Stars</h4>
            <p>{progress.stars}</p>
          </div>
          <div className="progress-card">
            <h4>Gems</h4>
            <p>{progress.gems}</p>
          </div>
          <div className="progress-card">
            <h4>Best Streak</h4>
            <p>{progress.bestStreak}</p>
          </div>
          <div className="progress-card">
            <h4>Level</h4>
            <p>{progress.level}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function MapScreen({ activeZone, onSelectZone, onBack, onStartGame }) {
  const zone = zones.find((item) => item.id === activeZone) || zones[0];

  return (
    <GameShell title="World Map" onQuit={onBack}>
      <div className="map-layout">
        <div className="map-grid">
          {zones.map((item) => (
            <button
              key={item.id}
              className={`zone-card ${item.id === zone.id ? 'active' : ''}`}
              onClick={() => onSelectZone(item.id)}
            >
              <h3>{item.name}</h3>
              <p>{item.theme}</p>
              <span>{item.spotlight}</span>
            </button>
          ))}
        </div>
        <div className="zone-panel">
          <h3>{zone.name}</h3>
          <p>{zone.theme}</p>
          <div className="zone-npc">
            <strong>Guide:</strong> {zone.npc}
          </div>
          <div className="zone-actions">
            <button onClick={() => onStartGame(SCREEN.OVERWORLD)}>Enter Overworld</button>
            <button className="ghost" onClick={() => onStartGame(SCREEN.ADVENTURE)}>
              Story Adventure
            </button>
            <button className="ghost" onClick={() => onStartGame(SCREEN.BATTLE)}>
              Spell Battle
            </button>
            <button className="ghost" onClick={() => onStartGame(SCREEN.WORDFORGE)}>
              Word Forge
            </button>
            <button className="ghost" onClick={() => onStartGame(SCREEN.PATTERN)}>
              Pattern Path
            </button>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

function QuestBoard({ progress, onBack, onClaim }) {
  return (
    <GameShell title="Quest Board" onQuit={onBack}>
      <div className="quest-grid">
        {quests.map((quest) => {
          const status = getQuestStatus(quest, progress);
          const claimed = progress.claimedQuests.includes(quest.id);
          return (
            <div key={quest.id} className="quest-card">
              <h3>{quest.title}</h3>
              <p>{quest.description}</p>
              <div className="quest-progress">
                <div className="quest-bar">
                  <div
                    className="quest-bar-fill"
                    style={{ width: `${Math.min(100, Math.round((status.current / status.total) * 100))}%` }}
                  />
                </div>
                <span>
                  {status.current}/{status.total}
                </span>
              </div>
              <div className="quest-reward">
                Rewards: ⭐ {quest.reward.stars} | 💎 {quest.reward.gems} | XP {quest.reward.xp}
              </div>
              <button
                className="ghost"
                disabled={!status.done || claimed}
                onClick={() => onClaim(quest)}
              >
                {claimed ? 'Claimed' : status.done ? 'Claim Reward' : 'In Progress'}
              </button>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}

function StoryGame({ onFinish, onQuit }) {
  const [story] = useState(() => stories[Math.floor(Math.random() * stories.length)]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const current = story.questions[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === current.answer) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('Correct! A star glows brighter.');
    } else {
      setFeedback(`Close! The correct answer is "${current.answer}".`);
    }
  };

  const handleNext = () => {
    if (index + 1 >= story.questions.length) {
      onFinish({ correct: correctCount, total: story.questions.length });
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected('');
    setFeedback('');
  };

  return (
    <GameShell title={story.title} onQuit={onQuit}>
      <div className="story-text">{story.text}</div>
      <div className="question">
        <h3>{current.prompt}</h3>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={selected === option ? 'selected' : ''}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {feedback && <div className="feedback">{feedback}</div>}
        <button className="next" onClick={handleNext} disabled={!selected}>
          {index + 1 === story.questions.length ? 'Finish Story' : 'Next Question'}
        </button>
      </div>
    </GameShell>
  );
}

function GrammarGame({ onFinish, onQuit }) {
  const [round] = useState(() => grammarRounds[Math.floor(Math.random() * grammarRounds.length)]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const current = round.items[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === current.answer) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('Nice choice!');
    } else {
      setFeedback(`Try again next time. The answer is "${current.answer}".`);
    }
  };

  const handleNext = () => {
    if (index + 1 >= round.items.length) {
      onFinish({ correct: correctCount, total: round.items.length });
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected('');
    setFeedback('');
  };

  return (
    <GameShell title={round.title} onQuit={onQuit}>
      <p className="prompt">{round.prompt}</p>
      <div className="question">
        <h3>{current.sentence}</h3>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={selected === option ? 'selected' : ''}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {feedback && <div className="feedback">{feedback}</div>}
        <button className="next" onClick={handleNext} disabled={!selected}>
          {index + 1 === round.items.length ? 'Finish Round' : 'Next'}
        </button>
      </div>
    </GameShell>
  );
}

function MathGame({ onFinish, onQuit }) {
  const [round] = useState(() => mathRounds[Math.floor(Math.random() * mathRounds.length)]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const current = round.items[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === current.answer) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('Great math magic!');
    } else {
      setFeedback(`The answer is ${current.answer}.`);
    }
  };

  const handleNext = () => {
    if (index + 1 >= round.items.length) {
      onFinish({ correct: correctCount, total: round.items.length });
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected('');
    setFeedback('');
  };

  return (
    <GameShell title={round.title} onQuit={onQuit}>
      <p className="prompt">{round.prompt}</p>
      <div className="question">
        <h3>{current.question}</h3>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={selected === option ? 'selected' : ''}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {feedback && <div className="feedback">{feedback}</div>}
        <button className="next" onClick={handleNext} disabled={!selected}>
          {index + 1 === round.items.length ? 'Finish Round' : 'Next'}
        </button>
      </div>
    </GameShell>
  );
}

function WritingStudio({ onFinish, onQuit }) {
  const [prompt] = useState(() => writingPrompts[Math.floor(Math.random() * writingPrompts.length)]);
  const [text, setText] = useState('');
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lowerText = text.toLowerCase();
  const mustUseHits = prompt.mustUse.filter((word) => lowerText.includes(word));
  const bonusHits = prompt.bonus.filter((word) => lowerText.includes(word));

  const submit = () => {
    const stars = Math.min(12, Math.max(4, Math.floor(wordCount / 2)));
    const gems = mustUseHits.length === prompt.mustUse.length ? 2 : 0;
    onFinish({ stars, gems });
  };

  return (
    <GameShell title={prompt.title} onQuit={onQuit}>
      <p className="prompt">{prompt.prompt}</p>
      <div className="writing">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write your story here..."
        />
        <div className="writing-stats">
          <div>
            <strong>Words:</strong> {wordCount}
          </div>
          <div>
            <strong>Must use:</strong> {prompt.mustUse.join(', ')}
          </div>
          <div>
            <strong>Bonus:</strong> {prompt.bonus.join(', ')}
          </div>
          <div className="writing-check">
            Must words found: {mustUseHits.length}/{prompt.mustUse.length} | Bonus words: {bonusHits.length}
          </div>
        </div>
        <button className="next" onClick={submit} disabled={wordCount < 8}>
          Submit Writing
        </button>
      </div>
    </GameShell>
  );
}

function ChallengeTrail({ onFinish, onQuit }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [grammarCorrect, setGrammarCorrect] = useState(0);
  const [mathCorrect, setMathCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const statsRef = useRef({ correctCount: 0, grammarCorrect: 0, mathCorrect: 0 });

  const pool = useMemo(() => {
    const grammarItems = grammarRounds.flatMap((round) =>
      round.items.map((item) => ({
        type: 'grammar',
        question: item.sentence,
        options: item.options,
        answer: item.answer,
      }))
    );
    const mathItems = mathRounds.flatMap((round) =>
      round.items.map((item) => ({
        type: 'math',
        question: item.question,
        options: item.options,
        answer: item.answer,
      }))
    );
    const combined = [...grammarItems, ...mathItems];
    const selection = [];
    while (selection.length < 6) {
      const pick = combined[Math.floor(Math.random() * combined.length)];
      selection.push(pick);
    }
    return selection;
  }, []);

  React.useEffect(() => {
    statsRef.current = { correctCount, grammarCorrect, mathCorrect };
  }, [correctCount, grammarCorrect, mathCorrect]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const stats = statsRef.current;
          onFinish({
            correct: stats.correctCount,
            grammarCorrect: stats.grammarCorrect,
            mathCorrect: stats.mathCorrect,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onFinish]);

  const current = pool[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === current.answer) {
      setCorrectCount((prev) => prev + 1);
      if (current.type === 'grammar') setGrammarCorrect((prev) => prev + 1);
      if (current.type === 'math') setMathCorrect((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 >= pool.length) {
      onFinish({ correct: correctCount, grammarCorrect, mathCorrect });
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected('');
  };

  return (
    <GameShell title="Challenge Trail" onQuit={onQuit}>
      <div className="challenge-banner">
        <div>
          <strong>Time Left:</strong> {timeLeft}s
        </div>
        <div>
          <strong>Question:</strong> {index + 1}/6
        </div>
      </div>
      <div className="question">
        <h3>{current.question}</h3>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={selected === option ? 'selected' : ''}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button className="next" onClick={handleNext} disabled={!selected}>
          {index + 1 === pool.length ? 'Finish Challenge' : 'Next'}
        </button>
      </div>
    </GameShell>
  );
}

function SpellBattle({ onFinish, onQuit }) {
  const [enemy] = useState(() => enemies[Math.floor(Math.random() * enemies.length)]);
  const [playerHp, setPlayerHp] = useState(45);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [battleLog, setBattleLog] = useState([]);
  const [result, setResult] = useState(null);

  const questions = useMemo(() => {
    const grammarItems = grammarRounds.flatMap((round) =>
      round.items.map((item) => ({
        type: 'grammar',
        question: item.sentence,
        options: item.options,
        answer: item.answer,
      }))
    );
    const mathItems = mathRounds.flatMap((round) =>
      round.items.map((item) => ({
        type: 'math',
        question: item.question,
        options: item.options,
        answer: item.answer,
      }))
    );
    const combined = [...grammarItems, ...mathItems];
    const selection = [];
    while (selection.length < 6) {
      const pick = combined[Math.floor(Math.random() * combined.length)];
      selection.push(pick);
    }
    return selection;
  }, []);

  const current = questions[index];

  const logLine = (text) => {
    setBattleLog((prev) => [text, ...prev].slice(0, 4));
  };

  const finishBattle = (win) => {
    if (result) return;
    const stars = win ? 12 : 4;
    const gems = win ? 2 : 0;
    const xp = win ? 60 : 20;
    setResult({ win, stars, gems, xp });
    setTimeout(() => onFinish({ win, stars, gems, xp }), 900);
  };

  const handleAnswer = (option) => {
    if (selected || result) return;
    setSelected(option);
    if (option === current.answer) {
      const damage = 10 + Math.floor(Math.random() * 6);
      logLine(`You cast a spell for ${damage} damage!`);
      setEnemyHp((prev) => {
        const next = Math.max(0, prev - damage);
        if (next === 0) finishBattle(true);
        return next;
      });
    } else {
      const damage = 8 + Math.floor(Math.random() * 6);
      logLine(`${enemy.name} hits back for ${damage}.`);
      setPlayerHp((prev) => {
        const next = Math.max(0, prev - damage);
        if (next === 0) finishBattle(false);
        return next;
      });
    }
  };

  const handleNext = () => {
    if (result) return;
    if (index + 1 >= questions.length) {
      finishBattle(enemyHp <= playerHp);
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected('');
  };

  return (
    <GameShell title={`Spell Battle: ${enemy.name}`} onQuit={onQuit}>
      <div className="battle-arena">
        <div>
          <div className="hp-row">
            <span>You</span>
            <div className="hp-bar">
              <div style={{ width: `${Math.max(0, Math.round((playerHp / 45) * 100))}%` }} />
            </div>
            <strong>{playerHp} HP</strong>
          </div>
          <div className="hp-row enemy">
            <span>{enemy.name}</span>
            <div className="hp-bar">
              <div style={{ width: `${Math.max(0, Math.round((enemyHp / enemy.hp) * 100))}%` }} />
            </div>
            <strong>{enemyHp} HP</strong>
          </div>
        </div>
        <div className="enemy-taunt">{enemy.taunt}</div>
      </div>

      <div className="question">
        <h3>{current.question}</h3>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={selected === option ? 'selected' : ''}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button className="next" onClick={handleNext} disabled={!selected}>
          {index + 1 === questions.length ? 'Finish Battle' : 'Next Spell'}
        </button>
      </div>

      <div className="battle-log">
        {battleLog.map((line, idx) => (
          <div key={`${line}-${idx}`}>{line}</div>
        ))}
      </div>
      {result && (
        <div className="battle-result">
          {result.win ? 'Victory! The arena sparkles.' : 'Defeat. Train and try again.'}
        </div>
      )}
    </GameShell>
  );
}

function WordForge({ onFinish, onQuit }) {
  const [index, setIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const current = wordForgePuzzles[index] || wordForgePuzzles[0];

  const handlePick = (word, idx) => {
    if (selectedWords.length >= current.words.length) return;
    const key = `${word}-${idx}`;
    if (selectedWords.includes(key)) return;
    setSelectedWords((prev) => [...prev, key]);
  };

  const handleReset = () => {
    setSelectedWords([]);
    setFeedback('');
  };

  const handleSubmit = () => {
    const chosenWords = selectedWords.map((item) => item.split('-')[0]);
    const sentence = chosenWords.join(' ');
    if (sentence === current.sentence) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('Perfect order!');
    } else {
      setFeedback('Almost! Try a new puzzle.');
    }
  };

  const handleNext = () => {
    if (index + 1 >= wordForgePuzzles.length) {
      onFinish({ correct: correctCount, total: wordForgePuzzles.length });
      return;
    }
    setIndex((prev) => prev + 1);
    setSelectedWords([]);
    setFeedback('');
  };

  return (
    <GameShell title="Word Forge" onQuit={onQuit}>
      <p className="prompt">Arrange the words to build the sentence.</p>
      <div className="word-forge">
        <div className="word-slots">
          {selectedWords.map((item) => (
            <span key={item} className="word-slot">
              {item.split('-')[0]}
            </span>
          ))}
        </div>
        <div className="word-bank">
          {current.words.map((word, idx) => {
            const key = `${word}-${idx}`;
            const used = selectedWords.includes(key);
            return (
              <button key={key} className={used ? 'selected' : ''} onClick={() => handlePick(word, idx)}>
                {word}
              </button>
            );
          })}
        </div>
        {feedback && <div className="feedback">{feedback}</div>}
        <div className="word-actions">
          <button className="ghost" onClick={handleReset}>
            Reset
          </button>
          <button onClick={handleSubmit} disabled={selectedWords.length !== current.words.length}>
            Check Sentence
          </button>
          <button className="ghost" onClick={handleNext}>
            {index + 1 === wordForgePuzzles.length ? 'Finish Forge' : 'Next Puzzle'}
          </button>
        </div>
      </div>
    </GameShell>
  );
}

function PatternPath({ onFinish, onQuit }) {
  const [round] = useState(() => patternRounds[Math.floor(Math.random() * patternRounds.length)]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const current = round.items[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    if (option === current.answer) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('Pattern solved!');
    } else {
      setFeedback(`The answer is ${current.answer}.`);
    }
  };

  const handleNext = () => {
    if (index + 1 >= round.items.length) {
      onFinish({ correct: correctCount, total: round.items.length });
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected('');
    setFeedback('');
  };

  return (
    <GameShell title={round.title} onQuit={onQuit}>
      <p className="prompt">{round.prompt}</p>
      <div className="question">
        <h3>{current.sequence}</h3>
        <div className="options">
          {current.options.map((option) => (
            <button
              key={option}
              className={selected === option ? 'selected' : ''}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {feedback && <div className="feedback">{feedback}</div>}
        <button className="next" onClick={handleNext} disabled={!selected}>
          {index + 1 === round.items.length ? 'Finish Path' : 'Next'}
        </button>
      </div>
    </GameShell>
  );
}

function StoryAdventure({ onFinish, onQuit }) {
  const [adventure] = useState(() => adventures[Math.floor(Math.random() * adventures.length)]);
  const [sceneId, setSceneId] = useState(adventure.scenes[0].id);
  const [selected, setSelected] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const scene = adventure.scenes.find((item) => item.id === sceneId) || adventure.scenes[0];

  const handleChoice = (choice) => {
    if (selected) return;
    setSelected(choice.text);
    if (choice.correct) {
      setCorrectCount((prev) => prev + 1);
      setFeedback('Great choice!');
    } else {
      setFeedback('Try to listen for the best clue.');
    }
    if (choice.next) {
      setTimeout(() => {
        setSceneId(choice.next);
        setSelected('');
        setFeedback('');
      }, 700);
    } else {
      setTimeout(() => onFinish({ correct: correctCount + (choice.correct ? 1 : 0) }), 700);
    }
  };

  return (
    <GameShell title={adventure.title} onQuit={onQuit}>
      <div className="adventure-text">{scene.text}</div>
      <div className="options">
        {scene.choices.map((choice) => (
          <button
            key={choice.text}
            className={selected === choice.text ? 'selected' : ''}
            onClick={() => handleChoice(choice)}
          >
            {choice.text}
          </button>
        ))}
      </div>
      {feedback && <div className="feedback">{feedback}</div>}
    </GameShell>
  );
}

function OverworldScreen({ onBack }) {
  React.useEffect(() => {
    const handler = () => onBack();
    window.addEventListener('moonlit:overworldComplete', handler);
    return () => window.removeEventListener('moonlit:overworldComplete', handler);
  }, [onBack]);

  return (
    <GameShell title="Overworld Training" onQuit={onBack}>
      <div className="overworld-grid">
        <div>
          <h3>Controls</h3>
          <ul className="control-list">
            <li>Move: Arrow keys</li>
            <li>Cast spell: Space</li>
          </ul>
          <p>Defeat the practice boss by casting spells. This is a Phaser 3 scene you can expand into dungeons and raids.</p>
        </div>
        <PhaserCanvas />
      </div>
    </GameShell>
  );
}

function RewardsRoom({ progress, onBack, onBuy }) {
  return (
    <GameShell title="Rewards Room" onQuit={onBack}>
      <div className="rewards-grid">
        <section className="reward-panel">
          <h3>Badges</h3>
          <div className="badge-grid">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`badge ${progress.badges.includes(badge.id) ? 'earned' : ''}`}
              >
                <strong>{badge.name}</strong>
                <span>{badge.requirement}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="reward-panel">
          <h3>Relic Vault</h3>
          <div className="relic-grid">
            {relics.map((item) => {
              const owned = progress.inventory.items.includes(item.id);
              return (
                <div key={item.id} className={`relic ${owned ? 'owned' : ''}`}>
                  <strong>{item.name}</strong>
                  <span>{owned ? item.description : '??? Locked relic'}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="reward-panel">
          <h3>Wardrobe</h3>
          <div className="shop-grid">
            {outfits.map((item) => (
              <ShopItem
                key={item.id}
                item={item}
                owned={progress.inventory.outfits.includes(item.id)}
                onBuy={() => onBuy('outfits', item)}
              />
            ))}
          </div>
        </section>

        <section className="reward-panel">
          <h3>Accessories</h3>
          <div className="shop-grid">
            {accessories.map((item) => (
              <ShopItem
                key={item.id}
                item={item}
                owned={progress.inventory.accessories.includes(item.id)}
                onBuy={() => onBuy('accessories', item)}
              />
            ))}
          </div>
        </section>

        <section className="reward-panel">
          <h3>Companions</h3>
          <div className="shop-grid">
            {companions.map((item) => (
              <ShopItem
                key={item.id}
                item={item}
                owned={progress.inventory.companions.includes(item.id)}
                onBuy={() => onBuy('companions', item)}
              />
            ))}
          </div>
        </section>

        <section className="reward-panel">
          <h3>Recent Rewards</h3>
          <ul className="reward-log">
            {progress.recentRewards.length === 0 && <li>Play a game to earn rewards.</li>}
            {progress.recentRewards.map((reward, index) => (
              <li key={`${reward}-${index}`}>{reward}</li>
            ))}
          </ul>
        </section>
      </div>
    </GameShell>
  );
}

function ShopItem({ item, owned, onBuy }) {
  return (
    <div className={`shop-item ${owned ? 'owned' : ''}`}>
      <div>
        <strong>{item.name}</strong>
        <span>{item.cost} gems</span>
      </div>
      <button onClick={onBuy} disabled={owned}>
        {owned ? 'Owned' : 'Unlock'}
      </button>
    </div>
  );
}

function AvatarStudio({ profile, progress, onBack, onUpdate, onRename }) {
  return (
    <GameShell title="Avatar Studio" onQuit={onBack}>
      <div className="avatar-studio">
        <AvatarPreview avatar={profile.avatar} />
        <div className="avatar-controls">
          <h3>Create Your Look</h3>
          <label className="name-input">
            <span>Hero Name</span>
            <input
              type="text"
              value={profile.name}
              onChange={(event) => onRename(event.target.value)}
              maxLength={16}
            />
          </label>
          <ControlGroup
            title="Base"
            options={baseOptions}
            current={profile.avatar.base}
            onSelect={(value) => onUpdate('base', value)}
          />
          <ControlGroup
            title="Hair"
            options={hairOptions}
            current={profile.avatar.hair}
            onSelect={(value) => onUpdate('hair', value)}
          />
          <ControlGroup
            title="Outfit"
            options={outfitOptions}
            current={profile.avatar.outfit}
            onSelect={(value) => onUpdate('outfit', value)}
          />
          <ControlGroup
            title="Accessory"
            options={accessoryOptions}
            current={profile.avatar.accessory}
            onSelect={(value) => onUpdate('accessory', value)}
          />
          <ControlGroup
            title="Companion"
            options={companionOptions}
            current={profile.avatar.companion}
            onSelect={(value) => onUpdate('companion', value, companionOptions.find((opt) => opt.id === value)?.label)}
          />
          <p className="avatar-note">Unlock more outfits and companions in the Rewards Room.</p>
        </div>
        <div className="inventory-preview">
          <h3>Unlocked Items</h3>
          <div>
            <strong>Outfits:</strong> {progress.inventory.outfits.length}
          </div>
          <div>
            <strong>Accessories:</strong> {progress.inventory.accessories.length}
          </div>
          <div>
            <strong>Companions:</strong> {progress.inventory.companions.length}
          </div>
          <div>
            <strong>Relics:</strong> {progress.inventory.items.length}
          </div>
        </div>
      </div>
    </GameShell>
  );
}

function ControlGroup({ title, options, current, onSelect }) {
  return (
    <div className="control-group">
      <h4>{title}</h4>
      <div className="control-options">
        {options.map((option) => (
          <button
            key={option.id}
            className={current === option.id ? 'selected' : ''}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GameShell({ title, onQuit, children }) {
  return (
    <main className="game-shell">
      <div className="game-header">
        <h2>{title}</h2>
        <button className="ghost" onClick={onQuit}>
          Back to Hub
        </button>
      </div>
      {children}
    </main>
  );
}
