Trivia Nexus — Dynamic AI Host Showdown
An interactive, broadcast-style trivia game powered by Google Gemini models featuring dynamic AI host personalities, real-time voice conversations, high-fidelity spoken commentary, and Google Search fact verification.
Key Features Implemented
Dynamic, User-Chosen AI Host Personalities
Preset Host Roster:
Sir Victor Sterling (Voice: Charon) — The Oxford Cynic; aristocratic wit, dry humor, and scholarly roasts.
Roxy Sparks (Voice: Kore) — The Neon Dynamo; 90s game-show adrenaline, neon hype, and celebration explosions.
Sgt. Major Vance (Voice: Fenrir) — The Iron Drill; tactical military discipline and barking motivational debriefs.
Dr. Zephyr Noir (Voice: Zephyr) — The Cosmic Riddler; mystical philosopher who treats trivia like quantum secrets.
Chip Sparkplug (Voice: Puck) — The Pixel Bot; retro arcade companion with 8-bit jokes and hyperactive optimism.
AI Host Studio (Custom Creator): Craft any host personality from scratch with tailored comedic style, tone, speech delivery, catchphrase, and audition their voice in real-time.
Spoken Host Audio via gemini-3.8-flash-tts
High-fidelity speech generation with custom speechMetadata (speaker name, dramatic delivery style) and distinct voice models (Puck, Charon, Kore, Fenrir, Zephyr).
Audio commentary for question introductions, correct answers, roasts, hints, and final round podium debriefs with reactive visualizer pulsing and audio wave bars.
Live Voice Conversations via gemini-3.8-live (Live API)
Contestant Live Mic Intercom: Talk to your chosen host in real time over two-way voice streaming.
16kHz PCM audio microphone capture paired with gapless 24kHz PCM scheduled playback.
Real-time live transcriptions for both you and the host, instant interruption detection, and live audio volume meters.
Ask for hints, debate answer logic, or request a comedic roast mid-game.
Google Search Grounding via gemini-3.8-flash
Search grounding (tools: [{ googleSearch: {} }]) ensures questions are factually grounded in up-to-date events, breaking milestones, and verifiable lore.
Search Intel Lifeline: Contestants can summon a live Google Search referee fact-check to verify the question and display clickable source citations.
Interactive Lifelines & Game Show Features: 50/50 option eliminator, Host's Secret Clue, streak multipliers, countdown timers, synthesized audio effects, and celebration confetti.
