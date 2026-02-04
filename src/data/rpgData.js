export const zones = [
  {
    id: 'moon-meadow',
    name: 'Moon Meadow',
    theme: 'Soft lights, singing flowers, friendly foxes.',
    npc: 'Lyra the Fox Scout',
    spotlight: 'Reading and Word Forge',
  },
  {
    id: 'crystal-harbor',
    name: 'Crystal Harbor',
    theme: 'Sparkling docks and clever seagulls.',
    npc: 'Captain Pearl',
    spotlight: 'Grammar and Spell Battle',
  },
  {
    id: 'sky-atelier',
    name: 'Sky Atelier',
    theme: 'Floating fashion studios and cloud runways.',
    npc: 'Tailor Sol',
    spotlight: 'Writing and Style Quests',
  },
  {
    id: 'dragon-library',
    name: 'Dragon Library',
    theme: 'Ancient books and tiny tea dragons.',
    npc: 'Archivist Nia',
    spotlight: 'Math and Pattern Path',
  },
];

export const quests = [
  {
    id: 'lantern-patrol',
    title: 'Lantern Patrol',
    description: 'Complete 2 reading stories in Moon Meadow.',
    type: 'storyWins',
    target: 2,
    reward: { stars: 6, gems: 1, xp: 35, item: 'lantern-badge' },
  },
  {
    id: 'grammar-parade',
    title: 'Grammar Parade',
    description: 'Answer 6 grammar questions correctly.',
    type: 'grammarCorrect',
    target: 6,
    reward: { stars: 5, gems: 1, xp: 30, item: 'parade-ticket' },
  },
  {
    id: 'math-bridges',
    title: 'Moon Bridges',
    description: 'Solve 6 math problems correctly.',
    type: 'mathCorrect',
    target: 6,
    reward: { stars: 5, gems: 1, xp: 30, item: 'bridge-charm' },
  },
  {
    id: 'word-forge',
    title: 'Word Forge Sparks',
    description: 'Complete 2 Word Forge puzzles.',
    type: 'wordForgeWins',
    target: 2,
    reward: { stars: 6, gems: 2, xp: 35, item: 'spark-scroll' },
  },
  {
    id: 'pattern-path',
    title: 'Pattern Path',
    description: 'Complete 2 Pattern Path rounds.',
    type: 'patternWins',
    target: 2,
    reward: { stars: 6, gems: 2, xp: 35, item: 'pattern-stone' },
  },
  {
    id: 'spell-battle',
    title: 'Spell Battle Win',
    description: 'Win 1 Spell Battle.',
    type: 'battleWins',
    target: 1,
    reward: { stars: 8, gems: 2, xp: 45, item: 'duel-medal' },
  },
  {
    id: 'adventure-journal',
    title: 'Adventure Journal',
    description: 'Complete 1 Story Adventure.',
    type: 'adventureWins',
    target: 1,
    reward: { stars: 6, gems: 2, xp: 35, item: 'journal-pin' },
  },
];

export const relics = [
  {
    id: 'lantern-badge',
    name: 'Lantern Badge',
    description: 'A glowing badge from Moon Meadow.',
  },
  {
    id: 'parade-ticket',
    name: 'Parade Ticket',
    description: 'Entry pass to the Crystal Harbor parade.',
  },
  {
    id: 'bridge-charm',
    name: 'Bridge Charm',
    description: 'A charm that sparkles when you solve math.',
  },
  {
    id: 'spark-scroll',
    name: 'Spark Scroll',
    description: 'A scroll that reminds you of perfect sentences.',
  },
  {
    id: 'pattern-stone',
    name: 'Pattern Stone',
    description: 'A stone carved with secret sequences.',
  },
  {
    id: 'duel-medal',
    name: 'Duel Medal',
    description: 'Awarded after a brave spell battle.',
  },
  {
    id: 'journal-pin',
    name: 'Journal Pin',
    description: 'A pin earned by completing a story adventure.',
  },
];

export const enemies = [
  {
    id: 'mist-owl',
    name: 'Mist Owl',
    element: 'Air',
    hp: 50,
    taunt: 'The owl flaps a misty wing and waits for your spell.',
  },
  {
    id: 'glimmer-crab',
    name: 'Glimmer Crab',
    element: 'Water',
    hp: 55,
    taunt: 'The crab rattles its shell of crystal.',
  },
  {
    id: 'velvet-lynx',
    name: 'Velvet Lynx',
    element: 'Shadow',
    hp: 60,
    taunt: 'The lynx purrs with a shimmer of shadows.',
  },
];

export const adventures = [
  {
    id: 'moonlight-post',
    title: 'Moonlight Post Office',
    scenes: [
      {
        id: 'start',
        text: 'You deliver a letter to the Moon Meadow. A fox asks for help sorting letters by sound.',
        choices: [
          { text: 'Sort by beginning sound', correct: true, next: 'sort' },
          { text: 'Sort by color only', correct: false, next: 'sort' },
        ],
      },
      {
        id: 'sort',
        text: 'A bundle says: star, sun, stone. Which word has a different ending sound?',
        choices: [
          { text: 'star', correct: false, next: 'finish' },
          { text: 'sun', correct: true, next: 'finish' },
          { text: 'stone', correct: false, next: 'finish' },
        ],
      },
      {
        id: 'finish',
        text: 'The fox smiles and gives you a glowing stamp for your journal.',
        choices: [
          { text: 'Finish Adventure', correct: true, next: null },
        ],
      },
    ],
  },
];
