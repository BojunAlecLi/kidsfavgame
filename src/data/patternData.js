export const patternRounds = [
  {
    id: 'glow-steps',
    title: 'Glow Steps',
    prompt: 'Find the missing number in each pattern.',
    items: [
      { sequence: '2, 4, 6, ?', answer: '8', options: ['7', '8', '9', '10'] },
      { sequence: '5, 10, 15, ?', answer: '20', options: ['15', '20', '25', '30'] },
      { sequence: '3, 6, 9, ?', answer: '12', options: ['10', '11', '12', '13'] },
    ],
  },
  {
    id: 'moon-math',
    title: 'Moon Math',
    prompt: 'Spot the rule and choose the next number.',
    items: [
      { sequence: '1, 3, 6, 10, ?', answer: '15', options: ['12', '13', '14', '15'] },
      { sequence: '10, 8, 6, ?, 2', answer: '4', options: ['2', '3', '4', '5'] },
      { sequence: '2, 5, 8, 11, ?', answer: '14', options: ['12', '13', '14', '15'] },
    ],
  },
  {
    id: 'star-skips',
    title: 'Star Skips',
    prompt: 'Skip-count with the stars.',
    items: [
      { sequence: '4, 8, 12, ?, 20', answer: '16', options: ['14', '15', '16', '18'] },
      { sequence: '9, 12, 15, ?, 21', answer: '18', options: ['16', '17', '18', '19'] },
      { sequence: '7, 14, ?, 28, 35', answer: '21', options: ['18', '20', '21', '22'] },
    ],
  },
];
