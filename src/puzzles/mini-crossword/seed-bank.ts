import { CrosswordClue, MiniCrosswordData } from './types.js';

interface RawSeedPuzzle {
  title: string;
  across: [string, string, string, string, string];
  acrossClues: [string, string, string, string, string];
  down: [string, string, string, string, string];
  downClues: [string, string, string, string, string];
}

const RAW_SEEDS: RawSeedPuzzle[] = [
  {
    title: 'Heart & Soul',
    across: ['HEART', 'EMBER', 'ABUSE', 'RESIN', 'TREND'],
    acrossClues: [
      'Vital muscular organ pumping blood',
      'Glowing piece of burning coal or wood',
      'Cruel or improper treatment',
      'Sticky organic fluid from pine trees',
      'General direction in which things are developing',
    ],
    down: ['HEART', 'EMBER', 'ABUSE', 'RESIN', 'TREND'],
    downClues: [
      'Center or core of an emotional issue',
      'Smoldering remnant of a dying campfire',
      'Excessive or corrupt misuse of authority',
      'Tree secretion used in varnishes',
      'Popular style or viral topic online',
    ],
  },
  {
    title: 'Standing Firm',
    across: ['STAND', 'TABOO', 'ABBOT', 'NOOSE', 'DOTED'],
    acrossClues: [
      "Remain upright on one's feet",
      'Prohibited by social custom or religion',
      'Head of a community of monks',
      'Loop with a running knot for hanging',
      'Showed excessive affection or fondness',
    ],
    down: ['STAND', 'TABOO', 'ABBOT', 'NOOSE', 'DOTED'],
    downClues: [
      'Take an assertive position on a dispute',
      'Forbidden topic or off-limits practice',
      'Monastic leader in a priory',
      'Rope trap or slipknot fastener',
      'Lavished unconditional love upon',
    ],
  },
  {
    title: 'Morning Clouds',
    across: ['CLOUD', 'LEASE', 'OAKEN', 'USERS', 'DENSE'],
    acrossClues: [
      'Visible mass of condensed water vapor',
      'Contract granting land or property use',
      'Made from hardwood of the genus Quercus',
      'People operating a software system',
      'Closely compacted in substance or crowded',
    ],
    down: ['CLOUD', 'LEASE', 'OAKEN', 'USERS', 'DENSE'],
    downClues: [
      'Vapor gathering before precipitation',
      'Rental agreement between tenant and landlord',
      'Crafted from sturdy oak timber',
      'Subscribers utilizing an application',
      'Thickly packed with trees or foliage',
    ],
  },
  {
    title: 'Royal North',
    across: ['CROWN', 'RETRO', 'OTHER', 'WREST', 'NORTH'],
    acrossClues: [
      'Ornamental circular headdress of monarchs',
      'Imitative of past styles and fashions',
      'Different from one previously mentioned',
      "Forcibly pull or tear from someone's grasp",
      'Compass direction pointing to the pole',
    ],
    down: ['CROWN', 'RETRO', 'OTHER', 'WREST', 'NORTH'],
    downClues: [
      'Peak or highest point of an arch or hill',
      'Vintage aesthetic looking back in time',
      'Alternative person or option',
      'Snatch or wrench away with effort',
      'Direction opposite to south on a map',
    ],
  },
  {
    title: 'Sweet Dreams',
    across: ['DREAM', 'RETRO', 'ETHER', 'ARENA', 'MORAL'],
    acrossClues: [
      'Series of thoughts and visions during sleep',
      'Nostalgic design reminiscent of the past',
      'Volatile liquid once used as an anesthetic',
      'Level area surrounded by seating for sports',
      'Lesson or ethical principle from a fable',
    ],
    down: ['DREAM', 'RETRO', 'ETHER', 'ARENA', 'MORAL'],
    downClues: [
      'Cherished hope, ambition, or slumber fantasy',
      'Throwback fashion or vintage pop style',
      'Upper air or classical element of the heavens',
      'Stadium setting for contests or gladiators',
      'Concerned with principles of right and wrong',
    ],
  },
  {
    title: 'Watchtower',
    across: ['TOWER', 'OLIVE', 'WIDEN', 'EVENT', 'RENTS'],
    acrossClues: [
      'Tall narrow building or fortress spire',
      'Small oval fruit yielding edible oil',
      'Make or become broader in scope',
      'Thing that happens, especially an important one',
      'Periodic payments made by tenant to landlord',
    ],
    down: ['TOWER', 'OLIVE', 'WIDEN', 'EVENT', 'RENTS'],
    downClues: [
      'Rise high above surroundings or look over',
      'Mediterranean branch symbolizing peace',
      'Broaden a road, aperture, or perspective',
      'Significant scheduled gathering or match',
      'Splits or tears in fabric caused by strain',
    ],
  },
  {
    title: 'Solid Thoughts',
    across: ['SOLID', 'OXIDE', 'LINEN', 'IDEAS', 'DENSE'],
    acrossClues: [
      'Firm and stable in shape without cavities',
      'Binary compound of oxygen with another element',
      'Cloth woven from flax yarn',
      'Thoughts, concepts, or mental impressions',
      'Crowded together or heavy in composition',
    ],
    down: ['SOLID', 'OXIDE', 'LINEN', 'IDEAS', 'DENSE'],
    downClues: [
      'Substantial, reliable, and well-grounded',
      'Compound formed when rust oxidizes iron',
      'Household bedsheets or tablecloth fabric',
      'Creative notions sparked in imagination',
      'Concentrated tightly packed mass',
    ],
  },
  {
    title: 'Harvest Field',
    across: ['WHEAT', 'HELLO', 'ELBOW', 'ALONE', 'TOWER'],
    acrossClues: [
      'Cereal plant whose grain is ground into flour',
      'Standard welcoming greeting when meeting',
      'Hinge joint between upper arm and forearm',
      'Having no one else present; solitary',
      'Tall structure rising above a fortress',
    ],
    down: ['WHEAT', 'HELLO', 'ELBOW', 'ALONE', 'TOWER'],
    downClues: [
      'Golden grain harvested for baking bread',
      'Salutation used when answering telephone calls',
      'Sharp bend or pipe angled like an arm joint',
      'Isolated or unaccompanied by others',
      'Soar lofty above nearby rooftops',
    ],
  },
  {
    title: 'Flowing Water',
    across: ['WATER', 'ALONE', 'TOGAS', 'ENACT', 'RESTS'],
    acrossClues: [
      'Essential liquid compound of hydrogen and oxygen',
      'Solitary without company',
      'Loose flowing outer garments of ancient Rome',
      'Make an official bill or statute into law',
      'Ceases work or movement to recover energy',
    ],
    down: ['WATER', 'ALONE', 'TOGAS', 'ENACT', 'RESTS'],
    downClues: [
      'Quench thirst or hydrate garden soil',
      'By oneself in quiet contemplation',
      'Draped garments worn by Roman senators',
      'Put into legislative or judicial effect',
      'Musical pauses indicating silence',
    ],
  },
  {
    title: 'Museum Relic',
    across: ['SPARE', 'PANEL', 'ANKLE', 'RELIC', 'ELECT'],
    acrossClues: [
      'Additional to what is required for ordinary use',
      'Flat rectangular board forming part of a door',
      'Joint connecting foot and lower leg',
      'Object surviving from an earlier time',
      'Choose someone to hold public office by voting',
    ],
    down: ['SPARE', 'PANEL', 'ANKLE', 'RELIC', 'ELECT'],
    downClues: [
      'Refrain from harming or keep in reserve',
      'Advisory group of judges or specialists',
      'Lower limb joint wrapped with an ace bandage',
      'Venerated historical artifact of religious significance',
      'Selected as the favorite or chosen few',
    ],
  },
  {
    title: 'Stout Timber',
    across: ['STOUT', 'TEASE', 'OAKEN', 'USERS', 'TENSE'],
    acrossClues: [
      'Heavily built with thickset frame',
      'Make fun of someone playfully or maliciously',
      'Fashioned from timber of deciduous oak trees',
      'Individuals operating a computing device',
      'Feeling anxious and unable to relax',
    ],
    down: ['STOUT', 'TEASE', 'OAKEN', 'USERS', 'TENSE'],
    downClues: [
      'Dark heavy malt beer or courageous spirit',
      'Gently mock or comb hair in reverse',
      'Made from sturdy acorn-bearing tree wood',
      'Subscribers browsing a digital network',
      'Verb form indicating time of an action',
    ],
  },
  {
    title: 'Winter Trail',
    across: ['STEPS', 'TRAIL', 'EAGLE', 'PILED', 'SLEDS'],
    acrossClues: [
      'Movements made by lifting and setting down a foot',
      'Marked pathway through a forest or wilderness',
      'Majestic bird of prey with keen vision',
      'Stacked up in a high heap',
      'Vehicles sliding over snow on runners',
    ],
    down: ['STEPS', 'TRAIL', 'EAGLE', 'PILED', 'SLEDS'],
    downClues: [
      'Rungs on stairs or consecutive actions taken',
      'Track followed when hunting game',
      'National symbol bird perched on crags',
      'Accumulated in an untidy mound',
      'Glides downhill on winter snowdrifts',
    ],
  },
  {
    title: 'Night Torch',
    across: ['TORCH', 'OPERA', 'REBUS', 'CRUST', 'HASTE'],
    acrossClues: [
      'Portable flaring light source or flashlight',
      'Dramatic stage work set entirely to music',
      'Puzzle where pictures represent words or syllables',
      'Hard outer layer of a freshly baked loaf',
      'Excessive speed or urgency of movement',
    ],
    down: ['TORCH', 'OPERA', 'REBUS', 'CRUST', 'HASTE'],
    downClues: [
      'Carry flaming brand to light dark corridors',
      'Elaborate vocal production staged in theaters',
      'Enigmatic visual riddle with cryptic symbols',
      "Earth's outermost solid rocky shell",
      'Swift promptness, as in an old proverb',
    ],
  },
  {
    title: 'Dressed for Battle',
    across: ['SHARP', 'HONOR', 'ANKLE', 'ROLES', 'DRESS'],
    acrossClues: [
      'Having a keen cutting blade or acute mind',
      'High respect, renown, or moral integrity',
      'Slender joint connecting foot to leg',
      'Character parts assigned to stage actors',
      'Put on clothes or one-piece female garment',
    ],
    down: ['SHARD', 'HONOR', 'ANKLE', 'ROLES', 'PRESS'],
    downClues: [
      'Sharp fragment of broken pottery or glass',
      'Bestow distinction upon or respect deeply',
      'Body joint prone to turning or spraining',
      'Functions performed within an organization',
      'News media or apply continuous pressure upon',
    ],
  },
  {
    title: 'Power Grid',
    across: ['POWER', 'OLIVE', 'SIREN', 'EVENT', 'RESTS'],
    acrossClues: [
      'Energy supplied to operate electrical devices',
      'Small oval drupe cured in brine or pressed for oil',
      'Warning horn emitting loud wailing signals',
      'Planned public occasion or sporting contest',
      'Takes a break from strenuous physical exertion',
    ],
    down: ['POSER', 'OLIVE', 'WIRES', 'EVENT', 'RENTS'],
    downClues: [
      'Baffling question or person acting pretentious',
      'Silver-green Mediterranean tree foliage',
      'Metallic strands conducting electrical current',
      'Occurrence of social or cultural importance',
      'Tears or fissures in garment seams',
    ],
  },
  {
    title: "Knight's Blade",
    across: ['SWORD', 'WIPER', 'OPINE', 'RENDS', 'DRESS'],
    acrossClues: [
      'Bladed weapon with hilt designed for thrusting',
      'Rubber blade clearing rainfall off windshields',
      'Express an opinion or state a belief',
      'Tears something into pieces with violence',
      'Adorn in ceremonial garments or bandage a wound',
    ],
    down: ['SWORD', 'WIPER', 'OPINE', 'RENDS', 'DRESS'],
    downClues: [
      'Steel sidearm wielded by medieval knights',
      'Mechanized squeegee on an automobile glass',
      'Voice an open viewpoint during debate',
      'Rips violently into ragged fragments',
      'Garment tailored with bodice and skirt',
    ],
  },
  {
    title: 'Mystic Forest',
    across: ['SPELL', 'PIXIE', 'EXILE', 'LILAC', 'LEECH'],
    acrossClues: [
      'Magical formula of spoken words or incantation',
      'Mischievous mythical fairy with pointed ears',
      'Enforced expulsion from one\'s native homeland',
      'Shrub with fragrant violet or white blossoms',
      'Aquatic annelid worm known for sucking blood',
    ],
    down: ['SPELL', 'PIXIE', 'EXILE', 'LILAC', 'LEECH'],
    downClues: [
      'Write or name letters forming a word correctly',
      'Tiny winged creature of folklore pranks',
      'Banishment abroad away from family and realm',
      'Delicate pastel shade of light purple',
      'Parasite feeding upon host resources',
    ],
  },
  {
    title: 'Town Bells',
    across: ['THEFT', 'HELLO', 'ELBOW', 'FLOWN', 'TOWNS'],
    acrossClues: [
      'Felonious taking of personal property of another',
      'Universal greeting spoken upon greeting acquaintances',
      'Anatomical joint permitting arm bending',
      'Traveled through atmospheric air on wings',
      'Populated urban centers smaller than cities',
    ],
    down: ['THEFT', 'HELLO', 'ELBOW', 'FLOWN', 'TOWNS'],
    downClues: [
      'Unlawful larceny of valuables or merchandise',
      'Friendly exclamation of social recognition',
      'Nudge with arm joint to gain attention',
      'Departed quickly by airborne flight',
      'Municipal boroughs across the countryside',
    ],
  },
];

const ACROSS_NUMBERS = [1, 6, 7, 8, 9];
const DOWN_NUMBERS = [1, 2, 3, 4, 5];

function buildSeedPuzzle(seed: RawSeedPuzzle): MiniCrosswordData {
  const grid: string[][] = seed.across.map(word => word.split(''));

  const acrossClues: CrosswordClue[] = seed.across.map((word, index) => ({
    number: ACROSS_NUMBERS[index],
    direction: 'across',
    word,
    clue: seed.acrossClues[index],
    startRow: index,
    startCol: 0,
    length: word.length,
  }));

  const downClues: CrosswordClue[] = seed.down.map((word, index) => ({
    number: DOWN_NUMBERS[index],
    direction: 'down',
    word,
    clue: seed.downClues[index],
    startRow: 0,
    startCol: index,
    length: word.length,
  }));

  return {
    title: seed.title,
    date: '2026-10-12',
    grid,
    acrossClues,
    downClues,
  };
}

export const SEED_CROSSWORDS: MiniCrosswordData[] = RAW_SEEDS.map(buildSeedPuzzle);

/**
 * Deterministically retrieves a curated seed puzzle for a given date string.
 * Uses a polynomial rolling hash on dateStr to select the puzzle index.
 */
export function getSeedCrosswordForDate(dateStr: string): MiniCrosswordData {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const index = hash % SEED_CROSSWORDS.length;
  const base = SEED_CROSSWORDS[index];

  return {
    title: base.title,
    date: dateStr,
    grid: base.grid.map(row => [...row]),
    acrossClues: base.acrossClues.map(c => ({ ...c })),
    downClues: base.downClues.map(c => ({ ...c })),
  };
}
