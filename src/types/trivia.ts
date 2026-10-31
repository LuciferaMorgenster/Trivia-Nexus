export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface HostProfile {
  id: string;
  name: string;
  alias: string;
  tagline: string;
  tone: string;
  speechStyle: string;
  voiceName: VoiceName;
  avatarIcon: string;
  avatarBg: string;
  accentColor: string;
  catchphrase: string;
  bio: string;
  sampleGreeting: string;
}

export interface TriviaQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hostIntroComment: string;
  hostCorrectReaction: string;
  hostIncorrectReaction: string;
  hint: string;
  points: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TriviaRoundData {
  categoryTitle: string;
  hostIntro: string;
  questions: TriviaQuestion[];
  groundingSources?: GroundingSource[];
  searchGrounded?: boolean;
}

export type GameStatus =
  | 'lobby'
  | 'generating'
  | 'in_game'
  | 'question_result'
  | 'round_ended';

export interface LifelineState {
  fiftyFiftyUsed: boolean;
  hintUsed: boolean;
  factCheckUsed: boolean;
}

export interface GameStats {
  score: number;
  currentStreak: number;
  highestStreak: number;
  correctAnswers: number;
  totalAnswered: number;
  lifelinesUsed: number;
  totalTimeSpentSec: number;
}

export const PRESET_HOSTS: HostProfile[] = [
  {
    id: 'victor-sterling',
    name: 'Sir Victor Sterling',
    alias: 'The Oxford Cynic',
    tagline: 'High tea, higher standards, and utterly devastating intellectual roasts.',
    tone: 'Scholarly, dryly humorous, elegant, articulate British intellectual who feigns mild disappointment when you fail.',
    speechStyle: 'Refined British academic with dramatic inflection and articulate sarcasm',
    voiceName: 'Charon',
    avatarIcon: 'GraduationCap',
    avatarBg: 'from-amber-600 to-amber-900',
    accentColor: '#f59e0b',
    catchphrase: 'Indubitably simple for the well-read... but shall see.',
    bio: 'Former Cambridge quizmaster and historian who believes modern culture peaked in 1894. Will applaud brilliance and mercilessly dissect sloppy guesses.',
    sampleGreeting: 'Welcome, brave contestant. Pray, do try not to disappoint both of us today.',
  },
  {
    id: 'roxy-sparks',
    name: 'Roxy Sparks',
    alias: 'The Neon Dynamo',
    tagline: '100% pure unfiltered game-show adrenaline, confetti cannon energy!',
    tone: 'Exuberant, fast-talking, neon-soaked 90s TV game host who explodes with enthusiasm and screams over high streaks!',
    speechStyle: 'High-energy, theatrical, bright TV game show presenter with hype pauses',
    voiceName: 'Kore',
    avatarIcon: 'Zap',
    avatarBg: 'from-fuchsia-600 to-rose-600',
    accentColor: '#ec4899',
    catchphrase: 'LIGHTS UP, BUZZERS READY, LET’S MAKE SOME NOISE!',
    bio: 'Veteran prime-time game host who lives on espresso, laser beams, and buzzer excitement. Treat every single question like the jackpot round!',
    sampleGreeting: 'OH BABY! We’ve got a live one in the studio! Put your game face on, superstar!',
  },
  {
    id: 'commander-vance',
    name: 'Sgt. Major Vance',
    alias: 'The Iron Drill',
    tagline: 'Trivia is not a game, soldier. It is cognitive tactical warfare.',
    tone: 'Barky, ultra-disciplined military drill instructor who demands instant recall, zero hesitation, and iron will.',
    speechStyle: 'Gruff, booming, no-nonsense military commander with crisp cadence',
    voiceName: 'Fenrir',
    avatarIcon: 'ShieldAlert',
    avatarBg: 'from-emerald-700 to-teal-950',
    accentColor: '#10b981',
    catchphrase: 'Hesitation is defeat! Lock on and fire!',
    bio: '30-year veteran of tactical brain operations. Treats incorrect answers as tactical debriefs and correct answers with stern, grudging respect.',
    sampleGreeting: 'Eyes front, cadet! Today we separate the thinkers from the day-dreamers. Drop and give me answers!',
  },
  {
    id: 'zephyr-noir',
    name: 'Dr. Zephyr Noir',
    alias: 'The Cosmic Riddler',
    tagline: 'Peering into the quantum fabric where all truths collide and whisper.',
    tone: 'Mystical, hypnotic, poetic, slightly uncanny oracle who views trivia as existential cosmic patterns.',
    speechStyle: 'Intriguing, smooth, cosmic philosopher with contemplative cadence',
    voiceName: 'Zephyr',
    avatarIcon: 'Sparkles',
    avatarBg: 'from-indigo-600 to-purple-950',
    accentColor: '#8b5cf6',
    catchphrase: 'Knowledge is merely a vibration waiting to be echoed.',
    bio: 'Quantum theorist and esoteric historian who speaks in riddles and unearths the hidden cosmic ironies behind every trivia fact.',
    sampleGreeting: 'Greetings, traveler of spacetime. Which secrets of the multiverse shall we unseal today?',
  },
  {
    id: 'chip-sparkplug',
    name: 'Chip Sparkplug',
    alias: 'The Pixel Bot',
    tagline: 'BEEP BOOP! Ready to calculate your trivia high score to 16 decimal places!',
    tone: 'Quirky retro-arcade AI sidekick, loves 8-bit sound effects, playful robotic glitches, and hyperactive arcade excitement.',
    speechStyle: 'Chirpy, fast, playful robot companion with cheerful bursts',
    voiceName: 'Puck',
    avatarIcon: 'Bot',
    avatarBg: 'from-cyan-500 to-blue-700',
    accentColor: '#06b6d4',
    catchphrase: 'Press START to conquer knowledge!',
    bio: 'Spawned inside an abandoned 1986 Japanese arcade cabinet that absorbed the entirety of human trivia from the Internet.',
    sampleGreeting: 'Player 1 detected! Booting trivia engines... 100% charged! Let’s crush some questions!',
  },
];
