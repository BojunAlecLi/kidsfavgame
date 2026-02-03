import React, { useMemo, useState } from 'react';
import { stories } from './data/storyData.js';
import { grammarRounds } from './data/grammarData.js';
import { mathRounds } from './data/mathData.js';
import { writingPrompts } from './data/writingPrompts.js';
import { badges, outfits, accessories, companions } from './data/rewards.js';
import AvatarPreview from './components/AvatarPreview.jsx';

const STORAGE_PROFILE = 'moonlit-profile-v1';
const STORAGE_PROGRESS = 'moonlit-progress-v1';

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
  streak: 0,
  bestStreak: 0,
  storyWins: 0,
  grammarCorrect: 0,
  mathCorrect: 0,
  writingDone: 0,
  dailyBonusDate: '',
  badges: [],
  inventory: {
    outfits: [],
    accessories: [],
    companions: [],
  },
  recentRewards: [],
};

const SCREEN = {
  HUB: 'hub',
  STORY: 'story',
  GRAMMAR: 'grammar',
  MATH: 'math',
  WRITING: 'writing',
  CHALLENGE: 'challenge',
  REWARDS: 'rewards',
  AVATAR: 'avatar',
};

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

const loadState = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
};

const saveState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Ignore storage errors
  }
};

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
  return Array.from(earned);
};

export default function App() {
  const [screen, setScreen] = useState(SCREEN.HUB);
  const [dailyMode, setDailyMode] = useState(null);
  const [profile, setProfile] = useState(() => loadState(STORAGE_PROFILE, DEFAULT_PROFILE));
  const [progress, setProgress] = useState(() => loadState(STORAGE_PROGRESS, DEFAULT_PROGRESS));
  const [toast, setToast] = useState('');

  React.useEffect(() => {
    saveState(STORAGE_PROFILE, profile);
  }, [profile]);

  React.useEffect(() => {
    saveState(STORAGE_PROGRESS, progress);
  }, [progress]);

  const dailyChallengeType = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const types = ['story', 'grammar', 'math', 'writing'];
    return types[hashString(todayKey) % types.length];
  }, []);

  const awardProgress = (payload) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        stars: prev.stars + (payload.stars || 0),
        gems: prev.gems + (payload.gems || 0),
        storyWins: prev.storyWins + (payload.storyWins || 0),
        grammarCorrect: prev.grammarCorrect + (payload.grammarCorrect || 0),
        mathCorrect: prev.mathCorrect + (payload.mathCorrect || 0),
        writingDone: prev.writingDone + (payload.writingDone || 0),
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
        const todayKey = new Date().toISOString().slice(0, 10);
        if (prev.dailyBonusDate !== todayKey) {
          next.gems += 1;
          next.dailyBonusDate = todayKey;
          next.recentRewards = [`+1 gem Daily Focus`, ...(next.recentRewards || [])].slice(0, 4);
        }
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
              <span>🔥 {progress.streak}</span>
            </div>
          </div>
          <button className="ghost" onClick={() => setScreen(SCREEN.AVATAR)}>
            Avatar Studio
          </button>
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
          onNavigate={(nextScreen) => {
            setDailyMode(null);
            setScreen(nextScreen);
          }}
          onStartDaily={(type) => {
            setDailyMode(type);
            setScreen(SCREEN[type.toUpperCase()]);
          }}
        />
      )}

      {screen === SCREEN.STORY && (
        <StoryGame
          onFinish={(result) => {
            awardProgress({
              stars: result.correct * 2,
              gems: 1,
              storyWins: 1,
              streakDelta: result.correct === result.total ? 1 : 0,
              resetStreak: result.correct !== result.total,
              dailyBonus: dailyMode === 'story',
              log: `+${result.correct * 2} stars from Reading`,
              toast: result.correct === result.total ? 'Perfect story score!' : 'Story complete!'
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
              grammarCorrect: result.correct,
              streakDelta: result.correct === result.total ? 1 : 0,
              resetStreak: result.correct !== result.total,
              dailyBonus: dailyMode === 'grammar',
              log: `+${result.correct * 2} stars from Grammar`,
              toast: result.correct >= result.total - 1 ? 'Grammar glow!' : 'Grammar round complete!'
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
              mathCorrect: result.correct,
              streakDelta: result.correct === result.total ? 1 : 0,
              resetStreak: result.correct !== result.total,
              dailyBonus: dailyMode === 'math',
              log: `+${result.correct * 2} stars from Math`,
              toast: result.correct === result.total ? 'Math meteor!' : 'Math mission done!'
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
              writingDone: 1,
              streakDelta: result.gems > 0 ? 1 : 0,
              resetStreak: result.gems === 0,
              dailyBonus: dailyMode === 'writing',
              log: `+${result.stars} stars from Writing`,
              toast: result.gems > 0 ? 'Writing bonus earned!' : 'Writing complete!'
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
              grammarCorrect: result.grammarCorrect,
              mathCorrect: result.mathCorrect,
              streakDelta: result.correct >= 5 ? 2 : 0,
              resetStreak: result.correct < 5,
              log: `+${result.correct * 3} stars from Challenge`,
              toast: result.correct >= 5 ? 'Challenge champion!' : 'Challenge complete!'
            });
            setScreen(SCREEN.HUB);
          }}
          onQuit={() => setScreen(SCREEN.HUB)}
        />
      )}

      {screen === SCREEN.REWARDS && (
        <RewardsRoom
          progress={progress}
          onBack={() => setScreen(SCREEN.HUB)}
          onBuy={buyItem}
        />
      )}

      {screen === SCREEN.AVATAR && (
        <AvatarStudio
          profile={profile}
          progress={progress}
          onBack={() => setScreen(SCREEN.HUB)}
          onUpdate={updateAvatar}
        />
      )}
    </div>
  );
}

function Hub({ dailyChallengeType, progress, onNavigate, onStartDaily }) {
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
  ];

  return (
    <main className="hub">
      <section className="hero">
        <div>
          <h2>Welcome to the Moonlit Academy</h2>
          <p>
            Explore stories, polish your grammar, write magical tales, and master math quests.
            Earn gems, collect companions, and unlock new avatar styles.
          </p>
          <div className="hero-actions">
          <button onClick={() => onNavigate(SCREEN.CHALLENGE)}>Challenge Trail</button>
          <button className="ghost" onClick={() => onNavigate(SCREEN.REWARDS)}>
            Rewards Room
          </button>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-tag">Daily Focus</div>
          <h3>{dailyChallengeType.toUpperCase()} DAY</h3>
          <p>Complete one {dailyChallengeType} activity for a bonus gem.</p>
          <button onClick={() => onStartDaily(dailyChallengeType)}>
            Start Daily
          </button>
        </div>
      </section>

      <section className="cards">
        {cards.map((card) => (
          <button key={card.id} className="card" onClick={() => onNavigate(card.id)}>
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
            <h4>Stories Completed</h4>
            <p>{progress.storyWins}</p>
          </div>
        </div>
      </section>
    </main>
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
    const stars = Math.min(10, Math.max(4, Math.floor(wordCount / 2)));
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
  const statsRef = React.useRef({ correctCount: 0, grammarCorrect: 0, mathCorrect: 0 });

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

function AvatarStudio({ profile, progress, onBack, onUpdate }) {
  return (
    <GameShell title="Avatar Studio" onQuit={onBack}>
      <div className="avatar-studio">
        <AvatarPreview avatar={profile.avatar} />
        <div className="avatar-controls">
          <h3>Create Your Look</h3>
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
