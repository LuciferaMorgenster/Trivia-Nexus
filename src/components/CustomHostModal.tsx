import React, { useState } from 'react';
import { X, Sparkles, Volume2, Loader2, Wand2 } from 'lucide-react';
import { HostProfile, VoiceName } from '../types/trivia';

interface CustomHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveHost: (newHost: HostProfile) => void;
  onPlayTestAudio: (text: string, voiceName: VoiceName, style: string) => Promise<void>;
}

const VOICES: { name: VoiceName; desc: string; vibe: string }[] = [
  { name: 'Puck', desc: 'Energetic & Playful', vibe: 'Bright, youthful, versatile' },
  { name: 'Charon', desc: 'Deep & Authoritative', vibe: 'Refined, academic, sophisticated' },
  { name: 'Kore', desc: 'Dynamic & Charismatic', vibe: 'High-energy, TV presenter style' },
  { name: 'Fenrir', desc: 'Commanding & Stern', vibe: 'Gruff, booming, military cadence' },
  { name: 'Zephyr', desc: 'Smooth & Melodic', vibe: 'Cosmic, intriguing, calming' },
];

const ICONS = ['GraduationCap', 'Zap', 'ShieldAlert', 'Sparkles', 'Bot'];

export const CustomHostModal: React.FC<CustomHostModalProps> = ({
  isOpen,
  onClose,
  onSaveHost,
  onPlayTestAudio,
}) => {
  const [name, setName] = useState('Professor Quirk');
  const [alias, setAlias] = useState('The Eccentric Inventor');
  const [tone, setTone] = useState(
    'Hyperactive, brilliant, easily distracted scientist who treats trivia questions as top-secret laboratory experiments.'
  );
  const [speechStyle, setSpeechStyle] = useState(
    'Fast-paced, eccentric scientist with dramatic excitement'
  );
  const [catchphrase, setCatchphrase] = useState('Eureka! Or perhaps... utter catastrophe!');
  const [voiceName, setVoiceName] = useState<VoiceName>('Puck');
  const [avatarIcon, setAvatarIcon] = useState('Bot');
  const [avatarBg, setAvatarBg] = useState('from-amber-500 to-rose-600');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [sampleGreeting, setSampleGreeting] = useState(
    'Greetings lab assistant! Calibrate your frontal lobes, our trivia test is officially underway!'
  );
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  if (!isOpen) return null;

  const handleTestAudio = async () => {
    setIsTestingVoice(true);
    try {
      await onPlayTestAudio(sampleGreeting, voiceName, speechStyle);
    } catch (err) {
      console.error('Test audio error:', err);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `custom-${Date.now()}`;
    const newHost: HostProfile = {
      id,
      name: name.trim() || 'Custom Host',
      alias: alias.trim() || 'The Challenger',
      tagline: catchphrase,
      tone: tone.trim() || 'Energetic and witty quiz show host',
      speechStyle: speechStyle.trim() || 'Charismatic presenter',
      voiceName,
      avatarIcon,
      avatarBg,
      accentColor,
      catchphrase,
      bio: `Custom personality created by the contestant: ${tone}`,
      sampleGreeting,
    };
    onSaveHost(newHost);
    onClose();
  };

  const presetTemplates = [
    {
      name: 'Chef Bruno Roaste',
      alias: 'The Kitchen Dictator',
      tone: 'Fierce, sarcastic celebrity chef who compares bad guesses to raw chicken and celebrates good answers like Michelin stars.',
      speechStyle: 'Passionate Italian-French chef with fiery exasperation',
      voice: 'Fenrir' as VoiceName,
      catchphrase: 'It is RAW! Your logic is undercooked!',
      greeting: 'Listen to me! In my kitchen of trivia, there is no room for soggy answers! Let us see if you can cook!',
      bg: 'from-red-600 to-orange-700',
      icon: 'ShieldAlert',
    },
    {
      name: 'Luna Stellaria',
      alias: 'The Sci-Fi Time Traveler',
      tone: 'Intrepid chrononaut from the year 3042 who is fascinated by ancient Earth history and 21st century human quirks.',
      speechStyle: 'Charming futuristic explorer with starry wonder',
      voice: 'Kore' as VoiceName,
      catchphrase: 'Synchronizing timeline coordinates... engage!',
      greeting: 'Tachyon engines primed! Greetings from the 31st century! Let us test your historical memory across the continuum!',
      bg: 'from-violet-600 to-fuchsia-700',
      icon: 'Sparkles',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <Wand2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-display">AI Host Studio</h2>
            <p className="text-sm text-slate-400">
              Design a custom personality, voice persona, and banter attitude
            </p>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mb-6 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 block">
            Quick Inspo Templates:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presetTemplates.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => {
                  setName(t.name);
                  setAlias(t.alias);
                  setTone(t.tone);
                  setSpeechStyle(t.speechStyle);
                  setCatchphrase(t.catchphrase);
                  setVoiceName(t.voice);
                  setSampleGreeting(t.greeting);
                  setAvatarBg(t.bg);
                  setAvatarIcon(t.icon);
                }}
                className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/50 border border-slate-700 hover:border-indigo-500/50 transition-all text-xs"
              >
                <div className="font-bold text-indigo-300">{t.name}</div>
                <div className="text-slate-400 text-[11px] truncate">{t.alias}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Host Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Captain Quasar"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Alias / Subtitle
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Master of Mysteries"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Host Personality & Attitude
            </label>
            <textarea
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              rows={2}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Describe their comedic style, snark level, and behavior..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Speech Style Delivery
              </label>
              <input
                type="text"
                value={speechStyle}
                onChange={(e) => setSpeechStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Boisterous, fast-talking, sarcastic"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Signature Catchphrase
              </label>
              <input
                type="text"
                value={catchphrase}
                onChange={(e) => setCatchphrase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Prepare for cognitive implosion!"
              />
            </div>
          </div>

          {/* Voice Model Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Gemini TTS & Live Voice Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setVoiceName(v.name)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    voiceName === v.name
                      ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-500/50 text-white'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    {v.name}
                    {voiceName === v.name && <Sparkles size={14} className="text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Greeting & Voice Audition */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Audition Greeting (Test Audio)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sampleGreeting}
                onChange={(e) => setSampleGreeting(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestAudio}
                disabled={isTestingVoice}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {isTestingVoice ? (
                  <Loader2 size={14} className="animate-spin text-pink-400" />
                ) : (
                  <Volume2 size={14} />
                )}
                <span>Audition Voice</span>
              </button>
            </div>
          </div>

          {/* Avatar Aesthetic Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Badge Icon
              </label>
              <div className="flex gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setAvatarIcon(icon)}
                    className={`p-2.5 rounded-xl border transition-all text-xs font-mono ${
                      avatarIcon === icon
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {icon.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Aura Gradient
              </label>
              <div className="flex gap-2">
                {[
                  'from-amber-500 to-rose-600',
                  'from-cyan-500 to-blue-600',
                  'from-emerald-500 to-teal-700',
                  'from-purple-500 to-pink-600',
                ].map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setAvatarBg(bg)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${bg} border-2 transition-transform ${
                      avatarBg === bg ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all"
            >
              Save & Choose Host
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
