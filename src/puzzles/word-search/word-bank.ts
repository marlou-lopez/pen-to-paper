export interface WordTheme {
  name: string;
  words: string[];
}

export const WORD_THEMES: WordTheme[] = [
  {
    name: 'Astronomy',
    words: ['GALAXY', 'NEBULA', 'PLANET', 'COMET', 'ASTEROID', 'ECLIPSE', 'PULSAR', 'QUASAR', 'ORBIT', 'SUPERNOVA', 'TELESCOPE', 'CONSTELLATION', 'SOLAR', 'ZENITH', 'AURORA'],
  },
  {
    name: 'Ocean Life',
    words: ['DOLPHIN', 'OCTOPUS', 'JELLYFISH', 'STARFISH', 'CORAL', 'WHALE', 'SEAHORSE', 'ANEMONE', 'BARNACLE', 'LOBSTER', 'MANTA', 'PLANKTON', 'STINGRAY', 'WALRUS', 'TURTLE'],
  },
  {
    name: 'Ancient History',
    words: ['PYRAMID', 'PHARAOH', 'EMPIRE', 'GLADIATOR', 'PAPYRUS', 'ACROPOLIS', 'COLOSSEUM', 'CHARIOT', 'TEMPLE', 'DYNASTY', 'SARCOPHAGUS', 'SPHINX', 'CENTURION', 'HIEROGLYPH'],
  },
  {
    name: 'Inventions',
    words: ['COMPASS', 'PRINTING', 'TELEGRAPH', 'STEAM', 'ELECTRIC', 'AIRPLANE', 'BICYCLE', 'BATTERY', 'MICROSCOPE', 'CAMERA', 'TRANSISTOR', 'SUBMARINE', 'SATELLITE', 'RADAR'],
  },
  {
    name: 'World Geography',
    words: ['ARCHIPELAGO', 'PENINSULA', 'PLATEAU', 'GLACIER', 'CANYON', 'VOLCANO', 'ESTUARY', 'TUNDRA', 'SAVANNA', 'FJORD', 'ATOLL', 'CATARACT', 'STRAIT', 'OASIS', 'DELTA'],
  },
];
