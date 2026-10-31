# Trivia Nexus — Dynamic AI Host Showdown

**Trivia Nexus** is an interactive, broadcast-style trivia game powered by Google Gemini models. It features dynamic AI host personalities, real-time two-way voice conversations, high-fidelity spoken commentary, and real-time fact-checking powered by Google Search.

---

## ✨ Key Features

### 🎙️ Dynamic, User-Chosen AI Host Personalities
* **Preset Host Roster:**
  * **Sir Victor Sterling** *(Voice: Charon)* — *The Oxford Cynic:* Aristocratic wit, dry humor, and scholarly roasts.
  * **Roxy Sparks** *(Voice: Kore)* — *The Neon Dynamo:* 90s game-show adrenaline, neon hype, and celebration explosions.
  * **Sgt. Major Vance** *(Voice: Fenrir)* — *The Iron Drill:* Tactical military discipline and barking motivational debriefs.
  * **Dr. Zephyr Noir** *(Voice: Zephyr)* — *The Cosmic Riddler:* Mystical philosopher who treats trivia like quantum secrets.
  * **Chip Sparkplug** *(Voice: Puck)* — *The Pixel Bot:* Retro arcade companion with 8-bit jokes and hyperactive optimism.
* **AI Host Studio (Custom Creator):** Craft any custom host personality from scratch with tailored comedic style, tone, speech delivery, and signature catchphrases, complete with real-time voice auditions.

### 🔊 Spoken Host Audio (`gemini-3.8-flash-tts`)
* High-fidelity speech generation featuring custom `speechMetadata` (speaker identity, dramatic delivery style) and distinct voice profiles (*Puck, Charon, Kore, Fenrir, Zephyr*).
* Dynamic voiceovers for question introductions, correct answer celebrations, roasts, hints, and final podium debriefs.
* Reactive UI visuals with pulsing audio visualizers and animated wave bars.

### 💬 Live Voice Conversations (`gemini-3.8-live` API)
* **Contestant Live Mic Intercom:** Talk to your host in real-time via two-way audio streaming.
* High-performance audio architecture with 16kHz PCM microphone capture paired with gapless 24kHz PCM scheduled playback.
* Real-time live transcription for both contestant and host, instant interruption detection, and live volume metering.
* Mid-game interactivity: Ask for hints, debate answer logic, or request a roast on the fly.

### 🔍 Fact Verification & Search Grounding (`gemini-3.8-flash`)
* **Google Search Grounding:** Utilizes search tools (`tools: [{ googleSearch: {} }]`) to generate trivia grounded in current events, breaking milestones, and verifiable facts.
* **Search Intel Lifeline:** Summon a live Google Search fact-checker mid-game to verify answers and inspect clickable source citations.

### 🎮 Game Show Features & Lifelines
* **Interactive Lifelines:** 50/50 option eliminator, Host's Secret Clue, and Search Intel fact-checking.
* **Gameplay Dynamics:** Streak score multipliers, animated countdown timers, synthesized audio sound effects, and confetti celebrations.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* A valid **Google Gemini API Key** with access to Gemini Flash, Live API, and TTS models.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/trivia-nexus.git
   cd trivia-nexus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the application:
   ```bash
   npm start
   ```

---

## 🛠️ Tech Stack

* **AI Models:**
  * `gemini-3.8-flash` (Question Generation & Search Grounding)
  * `gemini-3.8-flash-tts` (Dynamic Audio Generation)
  * `gemini-3.8-live` (Real-Time Live Voice API)
* **Audio Processing:** Web Audio API, PCM 16kHz capture, PCM 24kHz playback stream
* **Tools:** Google Search Grounding Integration

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
