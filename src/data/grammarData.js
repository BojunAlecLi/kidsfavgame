export const grammarRounds = [
  {
    id: 'verbs',
    title: 'Magic Verbs',
    prompt: 'Choose the verb that makes the sentence correct.',
    items: [
      {
        sentence: 'The kittens ____ to the music.',
        options: ['dance', 'dances', 'dancing', 'danced'],
        answer: 'dance',
      },
      {
        sentence: 'She ____ a sparkly dress yesterday.',
        options: ['wear', 'wears', 'wore', 'wearing'],
        answer: 'wore',
      },
      {
        sentence: 'We ____ to the moon market every Friday.',
        options: ['go', 'goes', 'going', 'gone'],
        answer: 'go',
      },
    ],
  },
  {
    id: 'plurals',
    title: 'Plural Parade',
    prompt: 'Pick the correct plural word.',
    items: [
      {
        sentence: 'One fairy, two ____.',
        options: ['fairys', 'fairies', 'fairy', 'fairie'],
        answer: 'fairies',
      },
      {
        sentence: 'One fox, three ____.',
        options: ['foxes', 'foxs', 'foxen', 'fox'],
        answer: 'foxes',
      },
      {
        sentence: 'One dress, four ____.',
        options: ['dress', 'dresss', 'dresses', 'dressies'],
        answer: 'dresses',
      },
    ],
  },
  {
    id: 'punctuation',
    title: 'Punctuation Party',
    prompt: 'Choose the correct ending punctuation.',
    items: [
      {
        sentence: 'Wow that dragon can sing',
        options: ['.', '?', '!'],
        answer: '!',
      },
      {
        sentence: 'Are you ready for the parade',
        options: ['.', '?', '!'],
        answer: '?',
      },
      {
        sentence: 'The moon is bright tonight',
        options: ['.', '?', '!'],
        answer: '.',
      },
    ],
  },
  {
    id: 'synonyms',
    title: 'Word Twins',
    prompt: 'Pick the word that means the same.',
    items: [
      {
        sentence: 'Tiny means ____.',
        options: ['big', 'small', 'loud', 'fast'],
        answer: 'small',
      },
      {
        sentence: 'Happy means ____.',
        options: ['sad', 'sleepy', 'glad', 'angry'],
        answer: 'glad',
      },
      {
        sentence: 'Shiny means ____.',
        options: ['sparkly', 'quiet', 'slow', 'soft'],
        answer: 'sparkly',
      },
    ],
  },
];
