import { CrosswordClue, MiniCrosswordData } from './types.js';
import { calculateCrosswordNumbering } from './numbering.js';

interface RawSeedPuzzle {
  title: string;
  templateId: string;
  grid: string[];
  acrossClues: string[];
  downClues: string[];
}

const RAW_SEEDS: RawSeedPuzzle[] = [
  // 1. Autumn Harvest (tmpl-2-corners-a)
  {
    title: 'Autumn Harvest',
    templateId: 'tmpl-2-corners-a',
    grid: [
      'PAST#',
      'ALLOW',
      'STAKE',
      'SEVEN',
      '#RENT',
    ],
    acrossClues: [
      'Time gone by or elapsed history',
      'Permit or give authorization for',
      'Post driven into ground, or enterprise share',
      'Prime number of days in a week',
      'Regular payment made by tenant to landlord',
    ],
    downClues: [
      'Go beyond an obstacle or succeed in an exam',
      'Make a modification or adjustment to',
      'Laborer bound in involuntary servitude',
      'Tangible keepsake, symbol, or game piece',
      'Departed or traveled from one place to another',
    ],
  },
  // 2. Desert Echo (tmpl-2-corners-a)
  {
    title: 'Desert Echo',
    templateId: 'tmpl-2-corners-a',
    grid: [
      'MOST#',
      'ATLAS',
      'SHAKE',
      'SEVEN',
      '#RENT',
    ],
    acrossClues: [
      'Greatest in amount, quantity, or degree',
      'Bound volume of geographic maps and charts',
      'Vibrate rapidly or tremble with force',
      'Lucky casino roll sum or days in a week',
      'Monthly lease payment for an apartment',
    ],
    downClues: [
      'Large body of matter, or a church liturgy',
      'Alternative person or different option',
      'Involuntary worker of ancient times',
      'Captured by force or occupied by reservation',
      'Dispatched a letter or electronic message',
    ],
  },
  // 3. Shoreline Breeze (tmpl-2-corners-b)
  {
    title: 'Shoreline Breeze',
    templateId: 'tmpl-2-corners-b',
    grid: [
      '#THAT',
      'SHORE',
      'TERMS',
      'ASSET',
      'REED#',
    ],
    acrossClues: [
      'Specific person, item, or concept indicated',
      'Coastal boundary where ocean meets sandy land',
      'Stipulated conditions within a legal contract',
      'Item of valuable property or financial wealth',
      'Tall slender wetland grass or woodwind piece',
    ],
    downClues: [
      'Plural pronoun indicating objects close at hand',
      'Equine steed harnessed for riding or farming',
      'Equipped with weaponry or prepared for combat',
      'Examination assessing knowledge or skill',
      'Luminous celestial body shining in night sky',
    ],
  },
  // 4. Coral Reef (tmpl-4-quad-corners)
  {
    title: 'Coral Reef',
    templateId: 'tmpl-4-quad-corners',
    grid: [
      '#SAN#',
      'CORAL',
      'ALIKE',
      'BASED',
      '#RED#',
    ],
    acrossClues: [
      'Honorific suffix in Japan, or Francisco prefix',
      'Marine invertebrate colony building colorful reefs',
      'Having similar qualities or looking identical',
      'Founded upon evidence or located in headquarters',
      'Primary color of ripe strawberries and rubies',
    ],
    downClues: [
      'Relating to energy harnessed from sun rays',
      'Get up from slumber or emerge into existence',
      'Without clothing, covering, or artificial disguise',
      'Hired taxicab vehicle in a bustling city',
      'Guided a group forward along a marked trail',
    ],
  },
  // 5. Morning Flight (tmpl-4-quad-corners)
  {
    title: 'Morning Flight',
    templateId: 'tmpl-4-quad-corners',
    grid: [
      '#BAD#',
      'MONEY',
      'EAGLE',
      'TREAT',
      '#DRY#',
    ],
    acrossClues: [
      'Unpleasant in quality or ethically corrupt',
      'Medium of exchange in coins and banknotes',
      'Regal bird of prey with keen distance vision',
      'Provide hospitality or an unexpected delicious snack',
      'Free from moisture, rain, or dampness',
    ],
    downClues: [
      'Plank of timber, or committee directing a firm',
      'Intense displeasure provoked by wrongdoing',
      'Postpone or cause something to run late',
      'Encountered an acquaintance face to face',
      'Up until now, or nevertheless',
    ],
  },
  // 6. Time & Orbit (tmpl-4-quad-corners)
  {
    title: 'Time & Orbit',
    templateId: 'tmpl-4-quad-corners',
    grid: [
      '#WAS#',
      'TODAY',
      'WROTE',
      'ORBIT',
      '#YEN#',
    ],
    acrossClues: [
      'Existed in a past state or condition',
      'The present 24-hour calendar day',
      'Composed words using ink or computer keyboard',
      'Curved gravitational path of a planet',
      'Currency of Japan, or an intense craving',
    ],
    downClues: [
      'Feel anxious concern about impending problems',
      'Sunbaked brick of clay and straw',
      'Smooth glossy woven fabric with lustrous sheen',
      'Smallest positive even prime number',
      'Even now, or in spite of preceding facts',
    ],
  },
  // 7. Tokens & Shapes (tmpl-4-corner-doublets-a)
  {
    title: 'Tokens & Shapes',
    templateId: 'tmpl-4-corner-doublets-a',
    grid: [
      '##NOT',
      'SHAPE',
      'TOKEN',
      'AMEND',
      'RED##',
    ],
    acrossClues: [
      'Particle expressing grammatical negation',
      'External boundary, contour, or outline',
      'Symbolic keepsake, subway coin, or memento',
      'Modify a formal document or legislative bill',
      'Crimson hue of ripe cherries and stoplights',
    ],
    downClues: [
      'Unadorned, bare, or stripped of covering',
      'Unfastened or accessible to public visitors',
      'Look after attentively or care for livestock',
      'Blazing celestial sphere of stellar plasma',
      'Place of residence where family dwells',
    ],
  },
  // 8. New Horizons (tmpl-4-corner-doublets-a)
  {
    title: 'New Horizons',
    templateId: 'tmpl-4-corner-doublets-a',
    grid: [
      '##NEW',
      'SLAVE',
      'TOKEN',
      'AGENT',
      'ROD##',
    ],
    acrossClues: [
      'Recently produced, discovered, or introduced',
      'Worker bound by involuntary servitude in history',
      'Symbolic voucher, coin, or keepsake',
      'Representative acting on behalf of another',
      'Straight slender shaft made of metal or wood',
    ],
    downClues: [
      'Bare, exposed, or lacking clothes',
      'Divisible by two, or flat and balanced in level',
      'Traveled from one location to another',
      'Five-pointed nocturnal luminary in outer space',
      'Graphic emblem identifying a business trademark',
    ],
  },
  // 9. Present Moment (tmpl-4-corner-doublets-a)
  {
    title: 'Present Moment',
    templateId: 'tmpl-4-corner-doublets-a',
    grid: [
      '##NOW',
      'SLAVE',
      'TOKEN',
      'AGENT',
      'ROD##',
    ],
    acrossClues: [
      'At this immediate current instant',
      'Bonded laborer under forced ownership of another',
      'Voucher redeemable for merchandise or transit',
      'Secret operative or commercial contract manager',
      'Fishing pole or cylindrical metal connector',
    ],
    downClues: [
      'Devoid of artificial disguise or garments',
      'Enclosed heated chamber for baking sourdough',
      'Departed or moved from one point to another',
      'Celebrity performer or dazzling night star',
      'Distinctive symbol or trademark badge',
    ],
  },
  // 10. Generous Giving (tmpl-4-corner-doublets-b)
  {
    title: 'Generous Giving',
    templateId: 'tmpl-4-corner-doublets-b',
    grid: [
      'OFF##',
      'DOING',
      'DONOR',
      'SLAVE',
      '##LAW',
    ],
    acrossClues: [
      'Away from a surface, or inactive switch mode',
      'Engaged in positive action or bustling work',
      'Philanthropist donating money or organs',
      'Historical bonded laborer lacking personal rights',
      'System of judicial statutes passed by congress',
    ],
    downClues: [
      'Probability ratio of an outcome in wagering',
      'Person lacking prudence or a court jester',
      'Decisive ultimate match in a playoff championship',
      'Astronomical star erupting in sudden brightness',
      'Sprouted taller or increased in physical stature',
    ],
  },
  // 11. Meadow Garden (tmpl-4-corner-doublets-b)
  {
    title: 'Meadow Garden',
    templateId: 'tmpl-4-corner-doublets-b',
    grid: [
      'FEE##',
      'LARGE',
      'ARRAY',
      'GNOME',
      '##RED',
    ],
    acrossClues: [
      'Fixed payment made for professional advice',
      'Substantial in scope, volume, or dimension',
      'Orderly sequence or indexed grid of variables',
      'Mythical bearded figurine standing in flowerbeds',
      'Warm primary color of autumn apple skin',
    ],
    downClues: [
      'Cloth banner waving as a national symbol',
      'Gain rightful income in exchange for labor',
      'Mistake or deviation from computational accuracy',
      'Recreational match played according to rules',
      'Scrutinized with attentive visual gaze',
    ],
  },
  // 12. Future Tech (tmpl-4-corner-doublets-b)
  {
    title: 'Future Tech',
    templateId: 'tmpl-4-corner-doublets-b',
    grid: [
      'ARE##',
      'ROBOT',
      'CLONE',
      'HENCE',
      '##YEN',
    ],
    acrossClues: [
      'Present tense plural form of verb to be',
      'Automated electromechanical humanoid apparatus',
      'Genetically identical organism grown in a lab',
      'As a consequence, or forward from this day',
      'Monetary denomination of Tokyo, or eager urge',
    ],
    downClues: [
      'Curved structural masonry over a doorway',
      'Part portrayed by a theatrical actor',
      'Dense dark hardwood used in fine furniture',
      'On a single past occasion; formerly',
      'Youngster aged between twelve and twenty',
    ],
  },
  // 13. Silver Screen (tmpl-4-corner-vertical-a)
  {
    title: 'Silver Screen',
    templateId: 'tmpl-4-corner-vertical-a',
    grid: [
      '#THAT',
      '#HASH',
      'MOVIE',
      'USED#',
      'GENE#',
    ],
    acrossClues: [
      'Indicating a specific person or thing nearby',
      'Chopped potato dish, or cryptological hash function',
      'Feature motion picture presented in cinemas',
      'Previously operated or purchased secondhand',
      'Biological DNA sequence encoding cellular traits',
    ],
    downClues: [
      'Demonstrative indicating objects over there',
      'Protected cove offering safe shelter to boats',
      'Brief dramatic comment made away from listeners',
      'Standard grammatical definite article',
      'Ceramic cup with handle for hot morning coffee',
    ],
  },
  // 14. Cozy Hearth (tmpl-4-corner-vertical-a)
  {
    title: 'Cozy Hearth',
    templateId: 'tmpl-4-corner-vertical-a',
    grid: [
      '#HOME',
      '#UPON',
      'AMEND',
      'MORE#',
      'PRAY#',
    ],
    acrossClues: [
      'Comfortable domestic house where one lives',
      'Resting directly on top of; preposition',
      'Correct flaws or revise legislative paragraphs',
      'Additional in quantity, duration, or degree',
      'Petition heaven with earnest devotion',
    ],
    downClues: [
      'Ability to appreciate comedy and witty laughter',
      'Theatrical drama sung completely to orchestra',
      'Coins and banknotes circulating in commerce',
      'Final terminus, edge, or conclusion',
      'Electronic sound amplifier for electric guitars',
    ],
  },
  // 15. Kitchen Craft (tmpl-4-corner-vertical-a)
  {
    title: 'Kitchen Craft',
    templateId: 'tmpl-4-corner-vertical-a',
    grid: [
      '#HOME',
      '#UPON',
      'AMEND',
      'CORE#',
      'TRAY#',
    ],
    acrossClues: [
      'Safe abode of family comfort and rest',
      'Mounted atop the upper surface of',
      'Modify and enhance a legal declaration',
      'Central fibrous seed chamber of a pear',
      'Flat platter used for carrying drinks and meals',
    ],
    downClues: [
      'Faculty of finding amusing amusement in life',
      'Elaborate vocal production performed in opera houses',
      'Universal medium of commercial exchange',
      'Finishing point or boundary of a route',
      'Perform a dramatic role on stage, or a statute',
    ],
  },
  // 16. Banner Flight (tmpl-4-corner-vertical-b)
  {
    title: 'Banner Flight',
    templateId: 'tmpl-4-corner-vertical-b',
    grid: [
      'FLAG#',
      'EARN#',
      'ERROR',
      '#GAME',
      '#EYED',
    ],
    acrossClues: [
      'Emblematic fabric standard flapping on a mast',
      'Receive equitable salary for industrious toil',
      'Unintentional blunder or mathematical error',
      'Athletic contest or entertaining puzzle match',
      'Watched with observant discerning gaze',
    ],
    downClues: [
      'Scheduled tariff for professional services',
      'Immense in magnitude, capacity, or expanse',
      'Orderly matrix array of values or components',
      'Mythological earth sprite or lawn figure',
      'Rich scarlet tint of autumn foliage',
    ],
  },
  // 17. Ocean Voyage (tmpl-4-corner-vertical-b)
  {
    title: 'Ocean Voyage',
    templateId: 'tmpl-4-corner-vertical-b',
    grid: [
      'SPAM#',
      'POLO#',
      'ALONG',
      '#ANTI',
      '#REEF',
    ],
    acrossClues: [
      'Unwanted junk mail cluttering digital inboxes',
      'Fast-paced equestrian game played on horseback',
      'Parallel to the continuous border of a path',
      'Prefix signifying resistance or opposition',
      'Submerged ridge of jagged coral offshore',
    ],
    downClues: [
      'Mineral spring bath resort offering relaxation',
      'Relating to frigid arctic geography and poles',
      'Solitary without other people around',
      'Classic gambling card bluff game',
      'Looping compressed animated web picture format',
    ],
  },
  // 18. Harbor Haven (tmpl-4-corner-vertical-b)
  {
    title: 'Harbor Haven',
    templateId: 'tmpl-4-corner-vertical-b',
    grid: [
      'ARMS#',
      'NEON#',
      'NAVAL',
      '#LIKE',
      '#MEET',
    ],
    acrossClues: [
      'Upper limbs extending from shoulders to hands',
      'Rare gaseous element lighting up city billboards',
      'Relating to battleships and maritime fleets',
      'Experience fond admiration for a companion',
      'Gather into a scheduled conference or match',
    ],
    downClues: [
      'Timeless traditional feminine moniker',
      'Sovereign empire or territory ruled by kings',
      'Full-length cinema entertainment film',
      'Legless scaled reptile gliding through grass',
      'Permit, lease out, or grant entrance',
    ],
  },
  // 19. Living Room (tmpl-6-corner-l-a)
  {
    title: 'Living Room',
    templateId: 'tmpl-6-corner-l-a',
    grid: [
      '##THE',
      '#THEY',
      'THERE',
      'EASE#',
      'ATE##',
    ],
    acrossClues: [
      'Definite grammatical article',
      'Plural pronoun representing third-party people',
      'At that specific geographical location',
      'State of untroubled tranquility or facility',
      'Ingested evening dinner at a table',
    ],
    downClues: [
      'Plural demonstrative indicating items near here',
      'Within this exact immediate room',
      'Sensory organ enabling visual sight',
      'Pointing out that particular item over there',
      'Infusion beverage prepared with dried leaves',
    ],
  },
  // 20. Alpine View (tmpl-6-corner-l-a)
  {
    title: 'Alpine View',
    templateId: 'tmpl-6-corner-l-a',
    grid: [
      '##AND',
      '#AREA',
      'SWISS',
      'EAST#',
      'EYE##',
    ],
    acrossClues: [
      'Grammatical conjunction joining elements',
      'Geographical expanse or surface square footage',
      'Relating to mountain chalets of Switzerland',
      'Direction from which morning sunrise breaks',
      'Ocular organ providing visual acuity',
    ],
    downClues: [
      'Ascend upwards or wake from morning sleep',
      'Sheltered twigs and moss cradling bird eggs',
      'German language neuter definite article',
      'To a far distance outside the area',
      'Observe with eyes or understand intuitively',
    ],
  },
  // 21. Rustic Hearth (tmpl-6-corner-l-a)
  {
    title: 'Rustic Hearth',
    templateId: 'tmpl-6-corner-l-a',
    grid: [
      '##FOR',
      '#HAVE',
      'LIVED',
      'IRON#',
      'PER##',
    ],
    acrossClues: [
      'Preposition designating aim, beneficiary, or cause',
      'Hold in lawful possession or personal custody',
      'Experienced existence in a previous era',
      'Heavy magnetic metal forged into blacksmith tools',
      'According to each unit, as miles per hour',
    ],
    downClues: [
      'Benevolent assistance bestowed upon a friend',
      'Kitchen appliance for roasting poultry and loaves',
      'Bright scarlet primary shade of ripe pomegranates',
      'Employ skilled labor in return for compensation',
      'Border of the mouth assisting articulation',
    ],
  },
  // 22. Desert Oasis (tmpl-6-corner-l-b)
  {
    title: 'Desert Oasis',
    templateId: 'tmpl-6-corner-l-b',
    grid: [
      'THE##',
      'WEST#',
      'OASIS',
      '#RARE',
      '##YET',
    ],
    acrossClues: [
      'Definite article identifying particular entities',
      'Compass point toward where sunset sinks',
      'Verdant desert sanctuary with freshwater springs',
      'Infrequently encountered, or lightly seared steak',
      'Up until this hour, or nevertheless',
    ],
    downClues: [
      'First even cardinal number',
      'Detect acoustic frequencies using the ears',
      'Structured composition presenting an argument',
      'Rubber pneumatic tread mounted upon a vehicle wheel',
      'Put down, or a matched assortment of items',
    ],
  },
  // 23. Glacial Chill (tmpl-6-corner-l-b)
  {
    title: 'Glacial Chill',
    templateId: 'tmpl-6-corner-l-b',
    grid: [
      'ICE##',
      'SANS#',
      'OLDER',
      '#MEMO',
      '##DID',
    ],
    acrossClues: [
      'Crystalline frozen water formed below freezing',
      'Lacking, as in clean typography letterforms',
      'Having lived more elapsed years than another',
      'Concise written reminder circulated in offices',
      'Executed, completed, or brought about an act',
    ],
    downClues: [
      'Global standards organization abbreviation prefix',
      'Peaceful stillness undisturbed by storm winds',
      'Brought to a final conclusion or stopped',
      'Prefix meaning half or partial',
      'Slender cylindrical bar made of polished alloy',
    ],
  },
  // 24. Sunny Patio (tmpl-6-corner-l-b)
  {
    title: 'Sunny Patio',
    templateId: 'tmpl-6-corner-l-b',
    grid: [
      'TOP##',
      'OVAL#',
      'METAL',
      '#NINE',
      '##ODD',
    ],
    acrossClues: [
      'Upper apex surface or highest mountain crest',
      'Egg-shaped continuous curved plane figure',
      'Solid conducting material such as bronze or copper',
      'Integer immediately preceding double digits',
      'Unevenly divisible by two, or eccentric in nature',
    ],
    downClues: [
      'Male domestic cat, or classic friendly name',
      'Insulated baking chamber for bread and cakes',
      'Paved terrace adjoining a house for dining',
      'Solid ground surface of the continents',
      'Served as guide at the front of an expedition',
    ],
  },
];

function buildSeedPuzzle(seed: RawSeedPuzzle): MiniCrosswordData {
  const grid: string[][] = seed.grid.map(row => row.split(''));
  const { acrossSlots, downSlots } = calculateCrosswordNumbering(grid);

  const acrossClues: CrosswordClue[] = acrossSlots.map((slot, index) => ({
    number: slot.number,
    direction: 'across',
    word: slot.coords.map(([r, c]) => grid[r][c]).join(''),
    clue: seed.acrossClues[index],
    startRow: slot.startRow,
    startCol: slot.startCol,
    length: slot.length,
  }));

  const downClues: CrosswordClue[] = downSlots.map((slot, index) => ({
    number: slot.number,
    direction: 'down',
    word: slot.coords.map(([r, c]) => grid[r][c]).join(''),
    clue: seed.downClues[index],
    startRow: slot.startRow,
    startCol: slot.startCol,
    length: slot.length,
  }));

  return {
    title: seed.title,
    date: '2026-10-12',
    templateId: seed.templateId,
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
    templateId: base.templateId,
    grid: base.grid.map(row => [...row]),
    acrossClues: base.acrossClues.map(c => ({ ...c })),
    downClues: base.downClues.map(c => ({ ...c })),
  };
}
