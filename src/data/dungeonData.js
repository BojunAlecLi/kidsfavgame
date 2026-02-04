export const dungeons = [
  {
    id: 'glimmer-grotto',
    name: 'Glimmer Grotto',
    boss: 'Crystal Beetle',
    recommended: 'Level 1',
    reward: { stars: 10, gems: 2, xp: 35 },
    map: { x: 220, y: 520 },
    requires: [],
  },
  {
    id: 'mistveil-crypt',
    name: 'Mistveil Crypt',
    boss: 'Shadow Lynx',
    recommended: 'Level 2',
    reward: { stars: 12, gems: 2, xp: 45 },
    map: { x: 420, y: 430 },
    requires: ['glimmer-grotto'],
  },
  {
    id: 'sunthread-ruins',
    name: 'Sunthread Ruins',
    boss: 'Gilded Moth',
    recommended: 'Level 3',
    reward: { stars: 14, gems: 3, xp: 60 },
    map: { x: 640, y: 360 },
    requires: ['mistveil-crypt'],
  },
  {
    id: 'cloudspire-keep',
    name: 'Cloudspire Keep',
    boss: 'Storm Griffin',
    recommended: 'Level 4',
    reward: { stars: 16, gems: 3, xp: 70 },
    map: { x: 820, y: 240 },
    requires: ['sunthread-ruins'],
  },
  {
    id: 'moonfall-sanctum',
    name: 'Moonfall Sanctum',
    boss: 'Eclipse Dragon',
    recommended: 'Level 5',
    reward: { stars: 20, gems: 4, xp: 90 },
    map: { x: 980, y: 130 },
    requires: ['cloudspire-keep'],
  },
];

export const mapPaths = [
  ['glimmer-grotto', 'mistveil-crypt'],
  ['mistveil-crypt', 'sunthread-ruins'],
  ['sunthread-ruins', 'cloudspire-keep'],
  ['cloudspire-keep', 'moonfall-sanctum'],
];
