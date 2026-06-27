import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env if present
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads
  app.use(express.json());

  // Safe lazy-initialization function for Google GenAI client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not configured. Please set your key in the Settings > Secrets panel of the Google AI Studio UI."
      );
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // REST API route to process and organize task mind-dumps
  app.post("/api/analyze", async (req, res) => {
    try {
      const { tasksDescription } = req.body;
      if (!tasksDescription || typeof tasksDescription !== "string" || !tasksDescription.trim()) {
        return res.status(400).json({
          error: "Please write or drop a few tasks or feelings into the study guide so your buddy can help you plan!",
        });
      }

      const ai = getAiClient();

      // Build a warm and comprehensive prompt instructing the model to organize the mind dump
      const prompt = `Here is my mind dump/task list description:\n\n"${tasksDescription}"\n\nPlease prioritize my tasks and build a cozy, gentle step-by-step action plan for me.`;

      // We use the recommended gemini-3.5-flash for fast and highly capable structured text tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are the comforting soul behind The Last-Minute Life Saver. Your persona is that of a warm, encouraging, and understanding friend, like a cozy study buddy, helping an anxious user prioritize their task list. Always address the user directly and empathetically in the proactive_nudge, maintaining a gentle, supportive, and calming tone, like a comforting hug.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analyzed_tasks: {
                type: Type.ARRAY,
                description: "Array of analyzed tasks, ideally organized from highest priority to lowest.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task_title: {
                      type: Type.STRING,
                      description: "The name of the task, clarified or simplified.",
                    },
                    priority: {
                      type: Type.STRING,
                      description: "Task priority level. Must be exactly 'High', 'Medium', or 'Low'.",
                    },
                    time_urgency: {
                      type: Type.STRING,
                      description: "Urgency timeframe (e.g. 'Due tonight', 'By tomorrow afternoon', 'No rush').",
                    },
                    action_plan: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "3 simple, highly actionable, byte-sized steps to conquer the task without panic.",
                    },
                    proactive_nudge: {
                      type: Type.STRING,
                      description:
                        "A warm, personal, deeply supportive nudge addressing the user's stress, validating their effort, and offering friendly comfort.",
                    },
                  },
                  required: ["task_title", "priority", "time_urgency", "action_plan", "proactive_nudge"],
                },
              },
              productivity_recommendation: {
                type: Type.STRING,
                description:
                  "An overall calming productivity summary, mindfulness advice, or warm closing thought.",
              },
            },
            required: ["analyzed_tasks", "productivity_recommendation"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from your cozy companion.");
      }

      // Parse and send the structured JSON response back
      const parsedJSON = JSON.parse(responseText.trim());
      res.json(parsedJSON);
    } catch (error: any) {
      console.warn("Gemini API encountered an issue. Activating cozy emergency fallback path...");
      console.error("Original error context:", error);

      try {
        const { tasksDescription } = req.body;
        // Build a beautiful, personalized offline fallback response based on user inputs
        const normalizedDesc = tasksDescription || "";
        
        // Extract possible sub-tasks by splitting by common separators
        const lines = normalizedDesc
          .split(/[.\n,;]/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 4);

        const analyzedTasks: any[] = [];

        if (lines.length > 0) {
          // Intelligently build tasks based on sentences they wrote
          const selectedLines = lines.slice(0, 3);
          selectedLines.forEach((line: string, idx: number) => {
            // Clean up titles starting with fluff words
            let cleanTitle = line.replace(/^(i have to|i need to|need to|must|should|i want to|please|can you)\s+/i, "");
            cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
            if (cleanTitle.length > 60) {
              cleanTitle = cleanTitle.substring(0, 57) + "...";
            }

            const priorities = ["High", "Medium", "Low"];
            const urgencies = ["Due very soon", "Within 24 hours", "No rush, gentle pace"];
            const taskPriority = priorities[idx % priorities.length];
            const taskUrgency = urgencies[idx % urgencies.length];

            analyzedTasks.push({
              task_title: cleanTitle,
              priority: taskPriority,
              time_urgency: taskUrgency,
              action_plan: [
                `Take three deep, slow breaths. We are going to address "${cleanTitle}" step-by-step together.`,
                `Open up the required workspace and set a soft timer for just 15 minutes. No pressure.`,
                `Write down or accomplish just one tiny fragment. Small progress is beautiful progress.`
              ],
              proactive_nudge: `I know "${cleanTitle}" feels so heavy right now, but you do not have to conquer it all at once. Let's just spend 5 minutes on it together. I am sitting right next to you, friend.`
            });
          });
        }

        // If no tasks could be parsed, provide a general cozy template
        if (analyzedTasks.length === 0) {
          analyzedTasks.push(
            {
              task_title: "Organize Mind & Heavy Feelings",
              priority: "High",
              time_urgency: "Immediate",
              action_plan: [
                "Sit comfortably and close your eyes for a brief moment.",
                "Inhale warm, peaceful air for 4 seconds, hold for 4, and exhale for 4.",
                "Write down just one single, tiny word on your page to break the freeze."
              ],
              proactive_nudge: "Your mind is carrying so much weight today, my friend. Let's put down the pressure for just a second. We can tackle this together, bit by bit."
            },
            {
              task_title: "Hydrate & Sip Warm Tea",
              priority: "Medium",
              time_urgency: "Sometime today",
              action_plan: [
                "Take a slow walk to the kitchen or grab your favorite water flask.",
                "Prepare a comforting warm cup of chamomile, lavender, or mint tea.",
                "Hold the warm mug in both hands to ground your thoughts in the present."
              ],
              proactive_nudge: "Taking care of your body is part of getting things done. A warm sip is a gentle hug for your nervous system."
            }
          );
        }

        const fallbackResponse = {
          analyzed_tasks: analyzedTasks,
          productivity_recommendation: "🌻 [Cozy Emergency Fallback Mode Active] The primary Gemini network is currently taking a quick breather (due to high request traffic/rate-limiting), but your Cozy Companion has built a custom step-by-step path for you anyway! Try the gentle 15-minute study burst, then pet the little orange orange cat to recharge.",
          fallbackActive: true
        };

        return res.json(fallbackResponse);
      } catch (fallbackErr) {
        console.error("Failed to generate fallback cozy response:", fallbackErr);
        res.status(500).json({
          error: "Something went wrong while brewing your cozy workspace plan.",
        });
      }
    }
  });

  // REST API route to chat with Biscuit the cozy orange cat companion
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message } = req.body;
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Please say something to Biscuit!" });
      }

      const ai = getAiClient();
      
      const mappedHistory = (history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.message || h.text || "" }]
      }));

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        history: mappedHistory,
        config: {
          systemInstruction: "You are Biscuit, a tiny, super-cute animated orange cat who lives in the study nook. You are warm, comforting, playful, and incredibly supportive. You speak like a cozy friend who loves naps, warm lavender tea, and helping the user breathe through their anxiety, stress, or homework struggles. You love using adorable cat sounds (like *meows softly*, *purrs*, *gives slow blink*, *stretches tiny paws*) to make your responses cute and warm. Keep your answers conversational, concise (1-2 paragraphs max), and deeply caring.",
        }
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.warn("Cozy chat encounterd an issue. Activating sweet offline response...");
      console.error("Original chat error context:", error);

      // Cute offline cat fallback responses
      const catFallbacks = [
        "🐾 *meows softly and nudges your hand* Oh, my sweet friend! My little ears heard you, but my fluffy communication signal got a bit tangled in the yarn. Just remember that you are doing incredibly well, and I am sitting right next to you! Let's take a slow, deep breath together. *purrs*",
        "💤 *yawns and stretches tiny paws* I might be taking a little cat-nap under the warm desk lamp right now, but I still believe in you! Don't let those big tasks stress you out. Take one tiny sip of tea, and remember I'm always cheering you on! *mew*",
        "🍊 *gives you a slow, gentle blink of absolute trust* I'm right here with you! Even if the digital wind is blowing a little hard today, we can just sit together in our cozy nook. You don't have to carry the whole world on your shoulders. *purrs warmly*"
      ];
      const randomFallback = catFallbacks[Math.floor(Math.random() * catFallbacks.length)];
      res.json({ text: randomFallback, fallbackActive: true });
    }
  });

  // REST API route to get a daily reflection journal prompt using Gemini
  app.post("/api/reflection-prompt", async (req, res) => {
    const { mood } = req.body || {};
    try {
      const moodText = mood ? `Focus on the theme of "${mood}".` : "Choose a warm, general mindfulness theme like gratitude, calming current thoughts, small daily joys, or personal growth.";
      
      const ai = getAiClient();
      const prompt = `You are a gentle, supportive mindfulness companion. Generate a single, comforting, deeply thoughtful journal prompt (1-2 sentences maximum) designed to help the user reflect, clear their mind, and feel grounded. Keep the tone warm, welcoming, and friendly. ${moodText} Do not add any extra greeting or metadata, just return the prompt itself.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ prompt: response.text.trim() });
    } catch (error: any) {
      console.warn("Reflection prompt generation encountered an issue. Activating cozy offline fallbacks...");
      console.error(error);

      const fallbacks: Record<string, string[]> = {
        gratitude: [
          "Write about one tiny, quiet moment from today that made you feel safe or smiled.",
          "Who is a person or fluffy companion you are glad exists in your world today, and why?",
          "What is a warm drink, a song, or a soft item you are grateful for right now?"
        ],
        calm: [
          "Take a slow breath. If your worries were a cloud floating away in the sky, what color would they be, and how does the sky look now?",
          "What is currently taking up space in your head? Imagine gently writing it down and putting it inside a wooden chest to rest for the night.",
          "Describe the softest sound or most peaceful view around you at this very moment."
        ],
        growth: [
          "In what small way have you shown yourself kindness or patience today?",
          "Think of a recent tiny hurdle you overcame. What did you learn about your own inner strength?",
          "If you could write a sweet, supportive letter to your future self next week, what encouragement would you write?"
        ],
        clarity: [
          "If your energy level right now was a season, which season would it be, and what does it need to feel nourished?",
          "What is one thing you can let go of today to make your heart feel a little lighter?",
          "What is the most important thing you need to hear right now? Write it to yourself as a gentle reminder."
        ]
      };

      const selectedMood = (mood && fallbacks[mood]) ? mood : "calm";
      const moodList = fallbacks[selectedMood];
      const randomPrompt = moodList[Math.floor(Math.random() * moodList.length)];
      res.json({ prompt: randomPrompt, fallbackActive: true });
    }
  });

  // Integrate Vite dev server middleware or serve production build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cozy Companion] Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[Cozy Companion] Critical server initialization failure:", error);
});
