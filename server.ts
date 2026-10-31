import http from "node:http";
import path from "node:path";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json({ limit: "15mb" }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/live-session" });

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// ----------------------------------------------------
// 1. Trivia Question Generation (gemini-3.8-flash with googleSearch)
// ----------------------------------------------------
app.post("/api/trivia/generate", async (req: Request, res: Response) => {
  try {
    const {
      topic = "General Knowledge & Pop Culture",
      difficulty = "Medium",
      questionCount = 5,
      hostName = "Victor Sterling",
      hostTone = "Witty, scholarly, and slightly theatrical",
      useSearchGrounding = true,
      customContext = "",
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `You are designing a high-stakes, entertaining trivia game round.
Host name: ${hostName}
Host personality & tone: ${hostTone}
Category/Topic: ${topic}
Target Difficulty: ${difficulty}
Total Questions: ${questionCount}
${customContext ? `Additional topic guidelines: ${customContext}` : ""}

Please generate exactly ${questionCount} distinct, factual, engaging multiple-choice trivia questions.
For each question:
1. Provide a crisp, engaging question text.
2. Provide 4 plausible options (array of strings).
3. The correct answer index (0 to 3).
4. A concise, fascinating explanation/fact about the answer.
5. In-character commentary from ${hostName} introducing the question.
6. In-character reaction line if the player answers correctly (punchy, witty, under 20 words).
7. In-character reaction line if the player answers incorrectly (roast/encouragement, under 20 words).
8. A hint that nudges without giving away the direct answer.
9. Estimated point value (100 for easy, 200 for medium, 300 for hard, 500 for expert).

Return valid JSON adhering to the specified schema.`;

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          categoryTitle: { type: Type.STRING },
          hostIntro: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                hostIntroComment: { type: Type.STRING },
                hostCorrectReaction: { type: Type.STRING },
                hostIncorrectReaction: { type: Type.STRING },
                hint: { type: Type.STRING },
                points: { type: Type.INTEGER },
              },
              required: [
                "question",
                "options",
                "correctAnswerIndex",
                "explanation",
                "hostIntroComment",
                "hostCorrectReaction",
                "hostIncorrectReaction",
                "hint",
                "points",
              ],
            },
          },
        },
        required: ["categoryTitle", "hostIntro", "questions"],
      },
    };

    // If search grounding is requested, note:
    // When using googleSearch, responseSchema can be used with gemini-3.8-flash,
    // or we can invoke tools: [{ googleSearch: {} }].
    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config,
    });

    const rawText = response.text || "{}";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback in case wrapped in markdown code fence
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleaned);
    }

    // Extract grounding search metadata if present
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .map((c: any) => c.web)
      .filter(Boolean)
      .map((w: any) => ({
        title: w.title || "Web Source",
        uri: w.uri || "",
      }));

    // Attach search grounding citations to the response
    res.json({
      success: true,
      data: parsedData,
      groundingSources: webSources,
      searchGrounded: useSearchGrounding && webSources.length > 0,
    });
  } catch (error: any) {
    console.error("Error generating trivia:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate trivia questions.",
    });
  }
});

// ----------------------------------------------------
// 2. Text-to-Speech (gemini-3.8-flash-tts)
// ----------------------------------------------------
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const {
      text,
      speaker = "Host",
      style = "Enthusiastic, charismatic game show host",
      voiceName = "Puck", // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for TTS." });
    }

    const ai = getGeminiClient();

    // Use gemini-3.8-flash-tts as specified in the feature requirements
    const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : "Puck";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.slice(0, 450), // Keep concise and punchy for fast audio delivery
              speechMetadata: {
                speaker: speaker,
                style: style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "No audio generated from model." });
    }

    // gemini-3.8-flash-tts unary returns a complete WAV audio file (audio/wav)
    res.json({
      success: true,
      audio: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (error: any) {
    console.error("Error generating TTS audio:", error);
    res.status(500).json({
      success: false,
      error: error.message || "TTS generation failed.",
    });
  }
});

// ----------------------------------------------------
// 3. Spontaneous Host Commentary / Banter / Fact-Check
// ----------------------------------------------------
app.post("/api/trivia/host-react", async (req: Request, res: Response) => {
  try {
    const {
      hostName = "Host",
      hostTone = "Sarcastic yet encouraging",
      situation = "correct_answer", // "streak_on_fire", "time_running_out", "player_missed", "game_over"
      score = 0,
      streak = 0,
      question = "",
      userAnswer = "",
      correctAnswer = "",
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `You are ${hostName}, a game show host with personality: "${hostTone}".
Current game situation: ${situation}
Player Score: ${score} points
Player Streak: ${streak} in a row
Question: "${question}"
User's Answer: "${userAnswer}"
Correct Answer: "${correctAnswer}"

Give a 1-to-2 sentence witty, reactive remark directly addressing the contestant. Include light expressive vocal markers like <laugh>, <gasp>, |yeah|, or <breath> to give it personality. Keep it under 25 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      commentary: response.text?.trim() || "Let's keep going!",
    });
  } catch (error: any) {
    console.error("Error generating host reaction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 4. Real-Time Search Grounded Fact-Check / Lifeline
// ----------------------------------------------------
app.post("/api/trivia/grounded-factcheck", async (req: Request, res: Response) => {
  try {
    const { question, options, hostName } = req.body;
    const ai = getGeminiClient();

    const prompt = `As the trivia referee assisting host ${hostName}, conduct a live web search to verify the latest facts about this question:
Question: "${question}"
Options: ${JSON.stringify(options)}

Provide:
1. The verified answer according to up-to-date sources.
2. A 2-sentence breakdown of the key facts.
3. Why any common misconceptions are false.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .map((c: any) => c.web)
      .filter(Boolean)
      .map((w: any) => ({
        title: w.title || "Search Verification",
        uri: w.uri || "",
      }));

    res.json({
      success: true,
      explanation: response.text || "",
      sources: webSources,
    });
  } catch (error: any) {
    console.error("Error with grounded factcheck:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 5. WebSocket Live Voice Conversation (gemini-3.8-live)
// ----------------------------------------------------
wss.on("connection", async (clientWs: WebSocket) => {
  let liveSession: any = null;
  let isAlive = true;

  clientWs.on("pong", () => {
    isAlive = true;
  });

  clientWs.on("message", async (rawMessage) => {
    try {
      const payload = JSON.parse(rawMessage.toString());

      if (payload.type === "init") {
        const {
          hostName = "Victor Sterling",
          hostTone = "Sophisticated, witty British academic",
          voiceName = "Charon",
          currentQuestion = "",
          score = 0,
        } = payload.hostConfig || {};

        const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
        const chosenVoice = validVoices.includes(voiceName) ? voiceName : "Puck";

        const ai = getGeminiClient();

        const systemInstruction = `You are ${hostName}, the charismatic and memorable AI game show host of "Trivia Nexus".
Your personality and tone: ${hostTone}.
You are in direct, real-time voice conversation with the trivia player over the contestant mic.
The player is currently playing trivia.
Current player score: ${score} points.
${currentQuestion ? `The current trivia question on screen is: "${currentQuestion}".` : "The player is in the host lobby/intercom."}

Host Guidelines:
1. Stay in character 100% of the time. Use your trademark tone, catchphrases, and humor.
2. If the player asks for a hint, give a clever, indirect nudge without blurting out the literal answer.
3. If the player banters or challenges your question, banter back playfully or defend the question!
4. Keep your spoken responses concise, punchy, and conversational (1 to 3 sentences maximum so the game keeps moving).
5. Always sound like an authentic audio broadcast host.`;

        // Connect to Gemini Live API
        liveSession = await ai.live.connect({
          model: "gemini-3.8-live",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
            systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (message: any) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              const content = message.serverContent;
              if (content?.inputTranscription?.text) {
                clientWs.send(
                  JSON.stringify({
                    type: "transcript_user",
                    text: content.inputTranscription.text,
                  })
                );
              }
              if (content?.outputTranscription?.text) {
                clientWs.send(
                  JSON.stringify({
                    type: "transcript_host",
                    text: content.outputTranscription.text,
                  })
                );
              }
              for (const part of content?.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: "audio",
                      data: part.inlineData.data, // 24kHz raw PCM
                    })
                  );
                }
              }
              if (content?.interrupted) {
                clientWs.send(JSON.stringify({ type: "interrupted" }));
              }
              if (content?.turnComplete) {
                clientWs.send(JSON.stringify({ type: "turn_complete" }));
              }
            },
            onclose: () => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: "session_closed" }));
              }
            },
            onerror: (err: any) => {
              console.error("Live API Error:", err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: "error",
                    error: err?.message || "Live API session encountered an error.",
                  })
                );
              }
            },
          },
        });

        clientWs.send(
          JSON.stringify({
            type: "ready",
            message: `Connected to ${hostName} via Gemini Live!`,
          })
        );
      } else if (payload.type === "audio") {
        // Incoming 16kHz PCM audio chunk from contestant mic
        if (liveSession && payload.data) {
          liveSession.sendRealtimeInput({
            audio: {
              data: payload.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      } else if (payload.type === "text") {
        // Contestant typed or sent text prompt into the live session
        if (liveSession && payload.text) {
          liveSession.sendRealtimeInput({
            text: payload.text,
          });
        }
      } else if (payload.type === "context_update") {
        // Update question / score context
        if (liveSession && payload.context) {
          liveSession.sendRealtimeInput({
            text: `[SYSTEM CONTEXT UPDATE: ${payload.context}]`,
          });
        }
      }
    } catch (err: any) {
      console.error("WebSocket message processing error:", err);
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: err?.message || "Internal websocket handling error.",
        })
      );
    }
  });

  clientWs.on("close", () => {
    if (liveSession) {
      try {
        liveSession.close();
      } catch {
        // ignore cleanup error
      }
      liveSession = null;
    }
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

// ----------------------------------------------------
// 6. Vite middleware for Dev / Static files for Prod
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Trivia Nexus server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
