import React, { useState, useRef, useEffect } from "react";
import { Cat, Coffee, Lightbulb, CloudRain, Sun, Smile, BookOpen, Wind, MessageCircle, Send, Loader2, Sparkles, X, Heart, Play, Pause, RotateCcw, Timer } from "lucide-react";

interface StudyNookProps {
  onCalmMessage: (msg: string) => void;
  onOfflineModeDetected?: () => void;
}

type WeatherMood = "rain" | "motes" | "petals" | "clear";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function StudyNook({ onCalmMessage, onOfflineModeDetected }: StudyNookProps) {
  const [isLampOn, setIsLampOn] = useState<boolean>(true);
  const [isRaining, setIsRaining] = useState<boolean>(true);
  const [weatherMood, setWeatherMood] = useState<WeatherMood>("motes");
  const [catPettedCount, setCatPettedCount] = useState<number>(0);
  const [teaSipsCount, setTeaSipsCount] = useState<number>(0);

  // Chat with Biscuit State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true); // Open by default for discovery!
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "🐾 *stretches tiny orange paws and yawns* Hello there, sweet friend! I'm Biscuit, your cozy study buddy cat. If you feel tired, anxious, or just want to tell me what's on your mind, I am right here to listen. Ask me anything! *meows softly*"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Pomodoro Focus Timer State
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);

  const totalTimerSeconds = timerMode === "work" ? 25 * 60 : 5 * 60;

  // Customizable Desk Item State
  const [deskItem, setDeskItem] = useState<string>(() => {
    try {
      return localStorage.getItem("cozy_desk_item") || "plant";
    } catch {
      return "plant";
    }
  });

  const handleDeskItemClick = () => {
    playCuteTapSound();
    if (deskItem === "plant") {
      onCalmMessage("🌿 You gently mist the green leaves of your bonsai. A tiny drop of water glistens on the moss.");
    } else if (deskItem === "calendar") {
      onCalmMessage("📅 You flip the page of your tiny desk calendar. Today is a brand new day of gentle progress!");
    } else if (deskItem === "books") {
      onCalmMessage("📚 You tidy up your mini stack of books. They are filled with cozy stories and quiet wisdom.");
    } else if (deskItem === "toy") {
      onCalmMessage("🧸 You give the tiny plush teddy bear a friendly little pat. It smiles back at you warmly!");
    }
  };

  // Daily Reflection State
  const [reflectionPrompt, setReflectionPrompt] = useState<string>("Take a gentle moment to consider: What is one simple thing that brought you comfort today?");
  const [reflectionMood, setReflectionMood] = useState<string>("calm");
  const [reflectionText, setReflectionText] = useState<string>("");
  const [savedReflections, setSavedReflections] = useState<{ id: string; date: string; prompt: string; text: string; mood: string }[]>(() => {
    try {
      const stored = localStorage.getItem("cozy_reflections");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);

  const handleGeneratePrompt = async (selectedMood?: string) => {
    setIsGeneratingPrompt(true);
    const targetMood = selectedMood || reflectionMood;
    try {
      const response = await fetch("/api/reflection-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: targetMood }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      if (data.prompt) {
        setReflectionPrompt(data.prompt);
        if (data.fallbackActive) {
          onOfflineModeDetected?.();
        }
        onCalmMessage(`✨ Generated a new reflection prompt on "${targetMood}". Take your time to write.`);
      }
    } catch (e) {
      console.error(e);
      onOfflineModeDetected?.();
      const frontFallbacks: Record<string, string[]> = {
        gratitude: ["What is a small gesture someone did for you recently that made you feel cared for?", "What part of your space brings you the most peace when you look at it?"],
        calm: ["If you could wrap yourself in one peaceful memory right now, which one would it be?", "Let your shoulders drop. What is one tension you are ready to let go of?"],
        growth: ["What is a gentle lesson you learned this week?", "How have you grown gentler with your own mistakes over the past month?"],
        clarity: ["What is one truth about yourself that you feel certain of today?", "If your mind was a quiet pond, what is resting peacefully at the bottom?"]
      };
      const moodList = frontFallbacks[targetMood] || frontFallbacks.calm;
      const randomPrompt = moodList[Math.floor(Math.random() * moodList.length)];
      setReflectionPrompt(randomPrompt);
      onCalmMessage(`✨ Switched prompt. Take your time to write.`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) {
      onCalmMessage("⚠️ Please write a few thoughts before saving your reflection.");
      return;
    }

    const newReflection = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      prompt: reflectionPrompt,
      text: reflectionText.trim(),
      mood: reflectionMood
    };

    const updated = [newReflection, ...savedReflections];
    setSavedReflections(updated);
    localStorage.setItem("cozy_reflections", JSON.stringify(updated));
    setReflectionText("");
    onCalmMessage("💾 Your cozy reflection has been saved to your personal journal archive.");
  };

  const handleDeleteReflection = (id: string) => {
    const updated = savedReflections.filter(r => r.id !== id);
    setSavedReflections(updated);
    localStorage.setItem("cozy_reflections", JSON.stringify(updated));
    onCalmMessage("🗑️ Journal entry removed.");
  };

  const playTimerDoneSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      // Sweet 3-note chime
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        
        gainNode.gain.setValueAtTime(0, now + idx * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.08, now + idx * 0.15 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.5);
      });
    } catch (e) {
      console.warn("Chime sound failed to initialize:", e);
    }
  };

  const playCuteTapSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Cozy retro soft bubble/wooden block tap sound
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Cute tap sound failed:", e);
    }
  };

  const handleSwitchTimerMode = (mode: "work" | "break") => {
    playCuteTapSound();
    setTimerMode(mode);
    setTimerIsRunning(false);
    setTimerSeconds(mode === "work" ? 25 * 60 : 5 * 60);
    onCalmMessage(
      mode === "work"
        ? "⏱️ Switched to 25-minute Work session. Let's cozy up and focus!"
        : "☕ Switched to 5-minute Rest break. Relax and take a deep breath."
    );
  };

  const handleResetTimer = () => {
    playCuteTapSound();
    setTimerIsRunning(false);
    setTimerSeconds(timerMode === "work" ? 25 * 60 : 5 * 60);
    onCalmMessage("⏱️ Focus timer reset to start position.");
  };

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: number | null = null;
    if (timerIsRunning) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerIsRunning(false);
            playTimerDoneSound();
            
            if (timerMode === "work") {
              onCalmMessage("🏆 Work focus session complete! Excellent focus. Biscuit is meowing for a break!");
              setChatHistory((history) => [
                ...history,
                {
                  role: "model",
                  text: "🐾 *stretches paws and meows happily* Sweet friend! You focused so beautifully for 25 minutes. I am so incredibly proud of you! Now, let's start your 5-minute break, stretch, and sip some lavender tea. *purrs*"
                }
              ]);
            } else {
              onCalmMessage("☀️ Break completed! Ready to dive back into focus?");
              setChatHistory((history) => [
                ...history,
                {
                  role: "model",
                  text: "🐾 *gives you a little nose nudge* Ah, that break felt wonderful! Are we ready to focus on our goals again? Whenever you are ready, let's toggle back to Work and start! *meows softly*"
                }
              ]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsRunning, timerMode]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatLoading, isChatOpen]);

  const handleLampToggle = () => {
    playCuteTapSound();
    setIsLampOn(!isLampOn);
    onCalmMessage(
      !isLampOn 
        ? "💡 You flicked the desk lamp on. A warm, golden glow wraps around your cozy notebook."
        : "🌙 The room dims slightly, turning into a peaceful candle-lit sanctuary."
    );
  };

  const handleRainToggle = () => {
    playCuteTapSound();
    setIsRaining(!isRaining);
    onCalmMessage(
      !isRaining 
        ? "🌧️ Soft, pixelated rain begins to pitter-patter gently against the glass pane."
        : "✨ The clouds clear, revealing a silent, crystal starry night outside your window."
    );
  };

  const handleWeatherMoodChange = (mood: WeatherMood) => {
    playCuteTapSound();
    setWeatherMood(mood);
    const moodMessages: Record<WeatherMood, string> = {
      rain: "🌧️ Cozy rainy weather overlay applied. A misty atmosphere surrounds your little wooden desk.",
      motes: "✨ Floating golden dust motes activated. Warm afternoon light drifts gently through the room.",
      petals: "🌸 Falling cherry blossom petals are dancing through the breeze. How dreamy and serene.",
      clear: "☀️ Cozy clear skies. A clean slate for focused, peaceful learning."
    };
    onCalmMessage(moodMessages[mood]);
  };

  const handleCatClick = () => {
    playCuteTapSound();
    setCatPettedCount((prev) => prev + 1);
    setIsChatOpen(true); // Open chat box so user knows they can talk to Biscuit
    
    const catMessages = [
      "🐈 Biscuit the orange cat purrs warmly, curling tighter on his wool rug.",
      "🐾 Soft paws stretch out. Biscuit gives you a tiny slow blink of absolute trust.",
      "💤 *Soft rhythmic purrs*... Biscuit is sitting happily by your side.",
      "🌸 Biscuit rolls onto his back, inviting you to take a byte-sized breather and chat!"
    ];
    const messageIndex = catPettedCount % catMessages.length;
    onCalmMessage(catMessages[messageIndex]);
  };

  const handleTeaClick = () => {
    playCuteTapSound();
    setTeaSipsCount((prev) => prev + 1);
    const teaMessages = [
      "🍵 *Sip*... Warm lavender chamomile tea flows down, soothing your thoughts.",
      "✨ Steam rises from your favorite mug. Take a slow, deep breath in... and out.",
      "🍂 The warm mug keeps your hands cozy. There is no rush, only this moment.",
      "🍯 A drop of golden honey keeps everything sweet and manageable."
    ];
    const messageIndex = teaSipsCount % teaMessages.length;
    onCalmMessage(teaMessages[messageIndex]);
  };

  // Chat Send Handler
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isChatLoading) return;

    const messageToSend = userText.trim();
    setChatInput("");
    
    // Append user message immediately
    const updatedHistory = [...chatHistory, { role: "user" as const, text: messageToSend }];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);

    try {
      // Map history correctly for the server-side proxy
      const formattedHistory = updatedHistory.slice(0, -1).map((msg) => ({
        role: msg.role,
        message: msg.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: formattedHistory,
          message: messageToSend
        })
      });

      if (!response.ok) {
        throw new Error("Chat response failed");
      }

      const data = await response.json();
      if (data.fallbackActive) {
        onOfflineModeDetected?.();
      }
      setChatHistory((prev) => [...prev, { role: "model" as const, text: data.text }]);
    } catch (err) {
      console.error("Failed to fetch Biscuit response:", err);
      onOfflineModeDetected?.();
      // Fallback sweet cat response
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model" as const,
          text: "🐾 *gives soft, comforting paw nudge* Oh, my sweet friend! My communications got a little tangled in a ball of yarn, but I'm still right here beside you! Take a deep breath and let's conquer this task one tiny baby step at a time. *purrs*"
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="w-full bg-[var(--color-cozy-cream-paper)] pixel-border p-6 rounded-lg relative overflow-hidden transition-colors duration-500">
      
      {/* Dynamic Floating Weather Overlays */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {weatherMood === "rain" && (
          <div className="absolute inset-0">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[2px] h-4 bg-cyan-300/30 rounded"
                style={{
                  top: `${Math.random() * -20}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `driftRain ${1.5 + Math.random() * 1.5}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        )}

        {weatherMood === "motes" && (
          <div className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-200/40 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `driftMotes ${4 + Math.random() * 5}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 4}s`,
                }}
              />
            ))}
          </div>
        )}

        {weatherMood === "petals" && (
          <div className="absolute inset-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2.5 bg-pink-200/60 rounded-tr-xl rounded-bl-xl"
                style={{
                  top: `${Math.random() * -10}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `driftPetals ${5 + Math.random() * 4}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Light cone overlay from lamp */}
      {isLampOn && (
        <div className="absolute right-0 bottom-0 top-0 left-1/3 bg-radial from-amber-100/15 via-transparent to-transparent pointer-events-none mix-blend-screen" />
      )}

      {/* Retro Pixel Art Illustrated Screen Container */}
      <div className="w-full h-56 bg-[#2a1b15] rounded border-4 border-[var(--color-cozy-brown-dark)] relative overflow-hidden flex flex-col justify-between p-3 select-none">
        
        {/* Background Atmosphere - Stars or Rain */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {isRaining ? (
            <div className="w-full h-full flex flex-wrap justify-around">
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-[2px] h-3 bg-blue-300 rounded"
                  style={{
                    animation: `fall ${1 + Math.random() * 1.5}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.7,
                    transform: 'rotate(15deg)'
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-wrap justify-around p-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 bg-yellow-100 rounded-full animate-ping"
                  style={{
                    animationDuration: `${2 + Math.random() * 3}s`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top: Window & Shelf */}
        <div className="flex justify-between z-10">
          {/* Pixel Window */}
          <button 
            id="nook-window-btn"
            onClick={handleRainToggle}
            className="w-18 h-18 bg-[#15202b] border-2 border-[var(--color-cozy-brown-dark)] flex items-center justify-center relative hover:scale-105 transition-transform cursor-pointer"
            title="Click to toggle window view (Rain / Stars)"
          >
            {/* Window divider */}
            <div className="absolute inset-0 border-r-2 border-b-2 border-amber-950/20 pointer-events-none" />
            {isRaining ? (
              <CloudRain className="w-8 h-8 text-blue-300 animate-bounce" style={{ animationDuration: '3s' }} />
            ) : (
              <Sun className="w-8 h-8 text-yellow-300 animate-pulse" />
            )}
            <span className="absolute bottom-0.5 right-0.5 text-[8px] text-gray-400 font-retro">WIN</span>
          </button>

          {/* Clock & Poster */}
          <div className="flex space-x-2">
            <div className="px-2 py-1 bg-[var(--color-cozy-brown-dark)] text-amber-200 border border-amber-900 rounded font-retro text-xs flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping mr-1" />
              <span>STUDY NOOK // ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Desk Surface (Pixel Illustration) */}
        <div className="w-full h-12 bg-[#5c3a21] border-t-4 border-[#3d2411] relative z-10 flex items-center justify-around px-4">
          
          {/* Steaming Mug */}
          <button
            id="nook-mug-btn"
            onClick={handleTeaClick}
            className="relative group focus:outline-none flex flex-col items-center cursor-pointer"
            title="Click to sip your warm tea"
          >
            {/* Animated Steam lines */}
            <div className="flex space-x-0.5 -mt-4 mb-0.5 opacity-70 group-hover:opacity-100">
              <span className="w-0.5 h-2.5 bg-amber-100/80 rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-0.5 h-3.5 bg-amber-100/60 rounded animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="w-0.5 h-2 bg-amber-100/80 rounded animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            
            {/* Retro styled Mug body */}
            <div className="w-6 h-5 bg-[#c8b6ff] border border-amber-950 rounded-b relative flex items-center justify-center">
              {/* Mug handle */}
              <div className="absolute right-[-4px] top-1 w-2.5 h-2.5 border border-amber-950 rounded-full" />
              {/* Flower symbol on cup */}
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-200" />
            </div>
          </button>

          {/* Open Notebook */}
          <div className="w-12 h-6 bg-[var(--color-cozy-cream-paper)] border border-amber-950 rounded-sm relative flex items-center justify-between px-1 shadow-[2px_2px_0px_0px_#111]">
            <div className="w-0.5 h-full bg-red-200" />
            <BookOpen className="w-3.5 h-3.5 text-[var(--color-cozy-brown-dark)]" />
            <div className="w-3 h-0.5 bg-gray-300 absolute top-2 right-1" />
            <div className="w-4 h-0.5 bg-gray-300 absolute top-3 right-1" />
          </div>

          {/* Customizable Desk Item */}
          <button
            id="nook-custom-item-btn"
            onClick={handleDeskItemClick}
            className="relative group focus:outline-none flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
            title={`Your customized desk item. Click to interact!`}
          >
            {deskItem === "plant" && (
              <div className="relative flex flex-col items-center">
                {/* Leaves */}
                <div className="flex -space-x-1 -mb-1">
                  <div className="w-2.5 h-3.5 bg-emerald-500 rounded-full border border-amber-950 rotate-[-15deg] animate-pulse" />
                  <div className="w-2 h-4 bg-emerald-400 rounded-full border border-amber-950 animate-pulse" />
                  <div className="w-2.5 h-3.5 bg-emerald-500 rounded-full border border-amber-950 rotate-[15deg] animate-pulse" />
                </div>
                {/* Pot */}
                <div className="w-4 h-3 bg-amber-600 border border-amber-950 rounded-b-sm" />
              </div>
            )}
            {deskItem === "calendar" && (
              <div className="relative flex flex-col items-center">
                {/* Binding rings */}
                <div className="flex space-x-1.5 -mb-0.5 z-10">
                  <div className="w-1 h-1 bg-gray-400 rounded-full border border-amber-950" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full border border-amber-950" />
                </div>
                {/* Calendar Body */}
                <div className="w-5 h-4.5 bg-white border border-amber-950 rounded-sm flex flex-col items-center justify-between overflow-hidden shadow-sm">
                  <div className="w-full h-1 bg-rose-500 border-b border-amber-950" />
                  <span className="text-[6px] font-mono text-gray-700 font-bold mb-0.5 leading-none">25</span>
                </div>
              </div>
            )}
            {deskItem === "books" && (
              <div className="flex flex-col items-center -space-y-0.5">
                {/* Top Book */}
                <div className="w-5 h-1 bg-cyan-400 border border-amber-950 rounded-sm relative">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white border-l border-amber-950" />
                </div>
                {/* Middle Book */}
                <div className="w-5.5 h-1 bg-amber-400 border border-amber-950 rounded-sm relative">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white border-l border-amber-950" />
                </div>
                {/* Bottom Book */}
                <div className="w-6.5 h-1.5 bg-rose-400 border border-amber-950 rounded-sm relative">
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white border-l border-amber-950" />
                </div>
              </div>
            )}
            {deskItem === "toy" && (
              <div className="relative flex flex-col items-center">
                {/* Ears */}
                <div className="flex justify-between w-4.5 -mb-1">
                  <div className="w-1.5 h-1.5 bg-amber-800 border border-amber-950 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-amber-800 border border-amber-950 rounded-full" />
                </div>
                {/* Bear Head & Body */}
                <div className="w-5 h-4.5 bg-amber-600 border border-amber-950 rounded-full flex items-center justify-center relative shadow-sm">
                  {/* Snout */}
                  <div className="w-1.5 h-1.5 bg-amber-100 rounded-full border border-amber-950/40 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-amber-950 rounded-full" />
                  </div>
                  {/* Tiny eyes */}
                  <div className="absolute top-1 left-1.5 w-0.5 h-0.5 bg-black rounded-full" />
                  <div className="absolute top-1 right-1.5 w-0.5 h-0.5 bg-black rounded-full" />
                </div>
              </div>
            )}
            {/* Tooltip */}
            <span className="absolute -bottom-6 bg-amber-100 text-[8px] border border-amber-950 px-1 font-mono text-[var(--color-cozy-brown-dark)] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase">
              {deskItem} 🎨
            </span>
          </button>

          {/* Sleeping Cat (Biscuit!) */}
          <button
            id="nook-cat-btn"
            onClick={handleCatClick}
            className="relative group focus:outline-none cursor-pointer flex flex-col items-center"
            title="Click to pet Biscuit and start a cozy chat!"
          >
            {/* Sleep Z's */}
            <span className="absolute -top-4 left-0 text-[10px] text-pink-300 font-retro animate-bounce" style={{ animationDuration: '4s' }}>Zzz</span>
            
            {/* Pixel Cat body with hover heartbeat jump */}
            <div className="w-10 h-6 bg-[#fbc490] border-2 border-[#804000] rounded-t-lg rounded-b flex items-end justify-center relative shadow-sm group-hover:scale-110 group-hover:bg-amber-300 transition-all">
              {/* Tail wrapped around */}
              <div className="absolute -bottom-1 -left-1 w-4 h-2 bg-[#fbc490] border-t border-r border-[#804000] rounded-b group-hover:bg-amber-300" />
              {/* Sleeping eyes */}
              <div className="flex space-x-1.5 mb-1.5">
                <span className="w-1.5 h-[1px] bg-[#4d2600]" />
                <span className="w-1.5 h-[1px] bg-[#4d2600]" />
              </div>
              {/* Triangle ears with subtle twitches */}
              <div className="absolute top-[-3px] left-1 w-2 h-2 bg-[#fbc490] border-t border-l border-[#804000] rotate-45 group-hover:bg-amber-300" />
              <div className="absolute top-[-3px] right-1 w-2 h-2 bg-[#fbc490] border-t border-r border-[#804000] rotate-45 group-hover:bg-amber-300" />
            </div>
            {/* Click to chat tooltip banner */}
            <span className="absolute -bottom-6 bg-amber-100 text-[8px] border border-amber-950 px-1 font-mono text-[var(--color-cozy-brown-dark)] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              TALK TO ME 💬
            </span>
          </button>

          {/* Cozy Lamp */}
          <button
            id="nook-lamp-btn"
            onClick={handleLampToggle}
            className="relative group focus:outline-none cursor-pointer flex flex-col items-center"
            title="Toggle workspace lamp"
          >
            {/* Lamp Head */}
            <div className={`w-5 h-4 border border-amber-950 rounded-t-full transition-colors ${isLampOn ? 'bg-yellow-200' : 'bg-gray-500'}`} />
            {/* Lamp stem */}
            <div className="w-1 h-5 bg-amber-900 border-x border-amber-950" />
            {/* Lamp base */}
            <div className="w-4 h-1.5 bg-amber-950 rounded-t" />
            
            {/* Lamp light cone indicator */}
            {isLampOn && (
              <div className="absolute top-4 w-12 h-8 bg-yellow-200/20 blur-[1px] pointer-events-none rounded-b-full scale-x-150 origin-top" />
            )}
          </button>

        </div>
      </div>

      {/* Toggable Weather Mood Selectors & Desk Customization */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-dashed border-[var(--color-cozy-green-pastel)] p-2.5 rounded bg-[var(--color-cozy-cream-base)]">
        <div className="flex flex-col space-y-1.5 justify-center">
          <span className="text-[10px] font-mono font-bold text-[var(--color-cozy-brown-light)] uppercase tracking-wider flex items-center">
            <Wind className="w-3.5 h-3.5 mr-1 text-pink-400" /> Weather Mood Overlay:
          </span>
          <div className="flex flex-wrap gap-1">
            {(["motes", "rain", "petals", "clear"] as WeatherMood[]).map((mood) => (
              <button
                id={`mood-btn-${mood}`}
                key={mood}
                onClick={() => handleWeatherMoodChange(mood)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border uppercase transition-all cursor-pointer focus:outline-none ${
                  weatherMood === mood
                    ? "bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)] shadow-sm"
                    : "bg-white text-[var(--color-cozy-brown-dark)] border-gray-300 hover:border-[var(--color-cozy-pink-dark)]"
                }`}
              >
                {mood === "motes" && "✨ Motes"}
                {mood === "rain" && "🌧️ Mist"}
                {mood === "petals" && "🌸 Petals"}
                {mood === "clear" && "☀️ Clear"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-1.5 justify-center md:border-l md:border-dashed md:border-[var(--color-cozy-brown-light)]/25 md:pl-4">
          <span className="text-[10px] font-mono font-bold text-[var(--color-cozy-brown-light)] uppercase tracking-wider flex items-center">
            🎨 Customize Desk Item:
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { id: "plant", label: "🌱 Plant", name: "Cozy Bonsai" },
              { id: "calendar", label: "📅 Calendar", name: "Mini Calendar" },
              { id: "books", label: "📚 Books", name: "Book Stack" },
              { id: "toy", label: "🧸 Toy", name: "Tiny Teddy" }
            ].map((item) => (
              <button
                id={`desk-item-btn-${item.id}`}
                key={item.id}
                onClick={() => {
                  setDeskItem(item.id);
                  try {
                    localStorage.setItem("cozy_desk_item", item.id);
                  } catch (e) {}
                  onCalmMessage(`🎨 Swapped your desk item to the ${item.name}! Click it on the desk to interact.`);
                }}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded border uppercase transition-all cursor-pointer focus:outline-none ${
                  deskItem === item.id
                    ? "bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)] shadow-sm"
                    : "bg-white text-[var(--color-cozy-brown-dark)] border-gray-300 hover:border-[var(--color-cozy-pink-dark)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Pomodoro Focus Timer Card */}
      <div className="mt-4 bg-white border-4 border-[var(--color-cozy-brown-dark)] p-4 rounded-lg flex flex-col md:flex-row items-center md:items-stretch justify-between shadow-[4px_4px_0_0_var(--color-cozy-brown-dark)] relative">
        {/* Left Column: Timer Controls */}
        <div className="flex-1 flex flex-col justify-between pr-0 md:pr-4 border-b-2 md:border-b-0 md:border-r-2 border-dashed border-[var(--color-cozy-brown-light)]/30 pb-4 md:pb-0 w-full">
          
          {/* Section Header */}
          <div className="flex items-center space-x-2 mb-3">
            <Timer className="w-4 h-4 text-[var(--color-cozy-pink-dark)]" />
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--color-cozy-brown-dark)]">
              Cozy Pomodoro Focus Timer
            </span>
          </div>

          {/* Toggle Session Modes */}
          <div className="flex space-x-2 mb-4">
            <button
              id="pomodoro-work-btn"
              onClick={() => handleSwitchTimerMode("work")}
              className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded border uppercase transition-all cursor-pointer focus:outline-none ${
                timerMode === "work"
                  ? "bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  : "bg-white text-[var(--color-cozy-brown-dark)] border-gray-300 hover:border-[var(--color-cozy-pink-dark)]"
              }`}
            >
              💼 Work (25m)
            </button>
            <button
              id="pomodoro-break-btn"
              onClick={() => handleSwitchTimerMode("break")}
              className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded border uppercase transition-all cursor-pointer focus:outline-none ${
                timerMode === "break"
                  ? "bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  : "bg-white text-[var(--color-cozy-brown-dark)] border-gray-300 hover:border-[var(--color-cozy-pink-dark)]"
              }`}
            >
              ☕ Break (5m)
            </button>
          </div>

          {/* Big Digital Countdown */}
          <div className="flex items-center justify-between bg-amber-50/50 rounded-lg p-3 border-2 border-[var(--color-cozy-brown-dark)] mb-1">
            <div className="font-mono text-3xl font-bold tracking-widest text-[var(--color-cozy-brown-dark)] select-none">
              {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}
              <span className="animate-pulse">:</span>
              {String(timerSeconds % 60).padStart(2, "0")}
            </div>

            {/* Play, Pause, Reset Control Actions */}
            <div className="flex space-x-2">
              <button
                id="pomodoro-toggle-run"
                onClick={() => {
                  setTimerIsRunning(!timerIsRunning);
                  onCalmMessage(
                    !timerIsRunning 
                      ? `⏱️ Focus timer started. Let's make gentle progress together!`
                      : `⏱️ Focus timer paused.`
                  );
                }}
                className={`p-2 rounded border-2 border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all cursor-pointer focus:outline-none ${
                  timerIsRunning
                    ? "bg-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)]"
                    : "bg-[var(--color-cozy-green-pastel)] text-[var(--color-cozy-brown-dark)]"
                }`}
                title={timerIsRunning ? "Pause focus session" : "Start focus session"}
              >
                {timerIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                id="pomodoro-reset"
                onClick={handleResetTimer}
                className="p-2 bg-white text-[var(--color-cozy-brown-dark)] border-2 border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 rounded transition-all cursor-pointer focus:outline-none"
                title="Reset session timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pixel Art Candle Countdown Visualization */}
        <div className="w-full md:w-44 flex flex-col items-center justify-center pt-4 md:pt-0 pl-0 md:pl-4 relative overflow-hidden">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
            Focus Candle
          </span>

          <div className="relative w-24 h-28 flex flex-col justify-end items-center bg-[#2a1b15] border-2 border-[var(--color-cozy-brown-dark)] rounded p-2 overflow-hidden shadow-inner">
            
            {/* Candle Sparks effect if running */}
            {timerIsRunning && (
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute w-1 h-1 bg-yellow-200 animate-ping rounded-full top-6 left-6" style={{ animationDuration: "1.2s" }} />
                <div className="absolute w-1 h-1 bg-amber-400 animate-ping rounded-full top-8 right-8" style={{ animationDuration: "1.8s" }} />
              </div>
            )}

            {/* Candle Flame (only active/bright when running or has time left) */}
            {timerSeconds > 0 && (
              <div className={`relative w-4 h-7 mb-[-2px] ${timerIsRunning ? 'animate-flickerSway' : ''}`} style={{ transformOrigin: 'bottom center' }}>
                {/* Flame aura */}
                <div className="absolute inset-0 bg-amber-500 rounded-full mix-blend-screen opacity-50 blur-[1px] animate-pulse" />
                {/* Flame body */}
                <div className="absolute top-1 left-0.5 right-0.5 bottom-0.5 bg-orange-400 rounded-full mix-blend-screen flex items-center justify-center">
                  {/* Flame inner hot core */}
                  <div className="w-1.5 h-3 bg-yellow-100 rounded-full" />
                </div>
              </div>
            )}

            {/* Wick */}
            {timerSeconds > 0 && (
              <div className="w-[2px] h-2.5 bg-amber-950 flex-shrink-0" />
            )}

            {/* Candle wax cylinder - height diminishes proportionally */}
            <div 
              className="w-8 bg-[var(--color-cozy-pink-dark)] border-x-2 border-t-2 border-amber-950 rounded-t-sm relative transition-all duration-1000 ease-linear shadow-md flex-shrink-0"
              style={{ 
                height: `${Math.max(8, (timerSeconds / totalTimerSeconds) * 44)}px`
              }}
            >
              {/* Highlight strip for 3D look */}
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-pink-200/40" />
              {/* Melting drop tracks on body */}
              {timerIsRunning && (
                <div className="absolute top-1 right-1 w-1 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDuration: "2s" }} />
              )}
            </div>

            {/* Tray/Stand */}
            <div className="w-16 h-2 bg-amber-950 border-t border-amber-900 rounded-t-sm relative z-10">
              {/* Little molten wax pool */}
              <div className="absolute top-[-3px] left-4 right-4 h-1 bg-[#d03d5a] rounded-full opacity-80" />
            </div>

            <span className="text-[8px] font-mono text-amber-200/50 mt-1 uppercase tracking-wide">
              {timerIsRunning ? "🔥 Burning" : "💤 Sleeping"}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Gentle Reflection Card */}
      <div className="mt-4 bg-white border-4 border-[var(--color-cozy-brown-dark)] p-4 rounded-lg shadow-[4px_4px_0_0_var(--color-cozy-brown-dark)] relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--color-cozy-brown-light)]/30 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[var(--color-cozy-pink-dark)]" />
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--color-cozy-brown-dark)]">
              Daily Gentle Reflection
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            {new Date().toLocaleDateString("en-US", { weekday: 'long' })}
          </span>
        </div>

        {/* Mood select pills & Generate button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-gray-400 mr-1 uppercase">Mood:</span>
            {[
              { id: "calm", label: "Calm 🌊", color: "bg-blue-50 hover:bg-blue-100" },
              { id: "gratitude", label: "Gratitude 🌸", color: "bg-rose-50 hover:bg-rose-100" },
              { id: "growth", label: "Growth 🌱", color: "bg-emerald-50 hover:bg-emerald-100" },
              { id: "clarity", label: "Clarity ☀️", color: "bg-amber-50 hover:bg-amber-100" }
            ].map((moodItem) => (
              <button
                key={moodItem.id}
                onClick={() => {
                  setReflectionMood(moodItem.id);
                  handleGeneratePrompt(moodItem.id);
                }}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer focus:outline-none ${
                  reflectionMood === moodItem.id
                    ? "bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)]"
                    : `bg-white text-[var(--color-cozy-brown-dark)] border-gray-300 ${moodItem.color}`
                }`}
              >
                {moodItem.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGeneratePrompt()}
            disabled={isGeneratingPrompt}
            className="px-3 py-1.5 bg-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)] font-mono font-bold text-[10px] rounded border-2 border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center space-x-1 uppercase cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGeneratingPrompt ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                <span>New Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Prompt display area */}
        <div className="bg-[var(--color-cozy-cream-paper)] border-2 border-[var(--color-cozy-brown-dark)] p-3.5 rounded-lg mb-4 text-center relative overflow-hidden">
          {/* Subtle elegant quote marks */}
          <span className="absolute top-1 left-2 text-3xl font-serif text-[var(--color-cozy-pink-dark)]/20 select-none">“</span>
          <p className="font-serif italic text-sm text-[var(--color-cozy-brown-dark)] leading-relaxed px-4">
            {reflectionPrompt}
          </p>
          <span className="absolute bottom-1 right-2 text-3xl font-serif text-[var(--color-cozy-pink-dark)]/20 select-none">”</span>
        </div>

        {/* Input box for writing reflections */}
        <div className="space-y-2">
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write your thoughts here... Take a slow sip of tea, relax your mind, and type freely. Your reflections are stored completely privately."
            className="w-full h-24 p-3 border-2 border-[var(--color-cozy-brown-dark)] rounded font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-cozy-pink-dark)] resize-none bg-amber-50/20"
          />
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-gray-400">
              {reflectionText.length} characters written
            </span>
            <button
              onClick={handleSaveReflection}
              className="px-3.5 py-1.5 bg-[var(--color-cozy-green-pastel)] text-[var(--color-cozy-brown-dark)] border-2 border-[var(--color-cozy-brown-dark)] font-mono font-bold text-xs rounded shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
            >
              💾 Save Reflection
            </button>
          </div>
        </div>

        {/* Saved past journal reflections */}
        {savedReflections.length > 0 && (
          <div className="mt-4 border-t-2 border-dashed border-[var(--color-cozy-brown-light)]/20 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[var(--color-cozy-brown-light)]">
                My Reflection Journal ({savedReflections.length})
              </span>
            </div>
            
            <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1.5">
              {savedReflections.map((entry) => (
                <div key={entry.id} className="bg-amber-50/30 border border-[var(--color-cozy-brown-light)]/40 rounded p-2.5 relative hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono text-gray-400">
                      {entry.date} • <span className="font-bold text-[var(--color-cozy-brown-dark)] uppercase">{entry.mood}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteReflection(entry.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-[10px] font-mono cursor-pointer"
                      title="Delete this reflection"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="font-serif italic text-[11px] text-gray-500 mb-1 leading-snug">
                    "Q: {entry.prompt}"
                  </p>
                  <p className="font-sans text-xs text-[var(--color-cozy-brown-dark)] leading-normal whitespace-pre-wrap">
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Biscuit the Orange Cat Conversational Panel */}
      {isChatOpen && (
        <div className="mt-4 bg-amber-50/80 border-4 border-[var(--color-cozy-brown-dark)] p-4 rounded-lg flex flex-col shadow-[4px_4px_0_0_var(--color-cozy-brown-dark)] cozy-fade-in relative">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[var(--color-cozy-brown-dark)] pb-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#fbc490] border border-[var(--color-cozy-brown-dark)] rounded-full flex items-center justify-center font-mono text-xs">
                🐱
              </div>
              <span className="font-mono font-bold text-xs uppercase tracking-tight text-[var(--color-cozy-brown-dark)]">
                Chatting with Biscuit the Orange Cat
              </span>
            </div>
            
            <button 
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded hover:bg-amber-100 border border-transparent hover:border-amber-950 transition-colors cursor-pointer"
              title="Close companion chat"
            >
              <X className="w-3.5 h-3.5 text-[var(--color-cozy-brown-dark)]" />
            </button>
          </div>

          {/* Messages Log Thread */}
          <div className="w-full h-44 overflow-y-auto bg-white/90 border-2 border-[var(--color-cozy-brown-dark)] p-3 rounded font-sans text-xs space-y-3 flex flex-col shadow-inner">
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex max-w-[85%] flex-col rounded p-2.5 relative leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--color-cozy-pink-light)] border border-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)] self-end rounded-tr-none"
                    : "bg-amber-100/60 border border-amber-300 text-[var(--color-cozy-brown-dark)] self-start rounded-tl-none"
                }`}
              >
                <span className="text-[9px] font-mono font-bold text-[var(--color-cozy-brown-light)] mb-1 uppercase tracking-wide">
                  {msg.role === "user" ? "You" : "🐾 Biscuit"}
                </span>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            ))}

            {/* Typing status */}
            {isChatLoading && (
              <div className="bg-amber-100/40 border border-amber-200 text-[var(--color-cozy-brown-dark)] p-2 rounded rounded-tl-none self-start max-w-[85%] flex items-center space-x-2">
                <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                <span className="italic text-[10px] font-mono">Biscuit is thinking or stretching paw...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[
              "Tell me a short sweet kitty story",
              "I feel overwhelmed by my study checklist",
              "Can we do a quick 3-second breathing exercise?",
              "Give me a fluffy virtual high five!"
            ].map((suggest, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleSendMessage(suggest)}
                disabled={isChatLoading}
                className="text-[10px] font-mono font-bold bg-white hover:bg-amber-100 text-[var(--color-cozy-brown-dark)] px-2 py-1 border border-[var(--color-cozy-brown-dark)] rounded transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                🐱 "{suggest}"
              </button>
            ))}
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(chatInput);
            }} 
            className="mt-3 flex items-center space-x-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Biscuit something (e.g., 'help me relax', 'give me encouragement')..."
              className="flex-1 bg-white border-2 border-[var(--color-cozy-brown-dark)] rounded px-3 py-2 text-xs font-sans text-[var(--color-cozy-brown-dark)] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-cozy-pink-dark)]"
              maxLength={250}
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatLoading}
              className="bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] p-2 border-2 border-[var(--color-cozy-brown-dark)] hover:bg-[var(--color-cozy-brown-light)] active:bg-[var(--color-cozy-brown-dark)] rounded transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send to Biscuit"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Absolute decorative little heart */}
          <div className="absolute top-2.5 right-10 animate-pulse text-red-400">
            <Heart className="w-3.5 h-3.5 fill-red-400" />
          </div>
        </div>
      )}

      {/* Atmospheric logs button shortcut */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="mt-4 w-full flex items-center justify-center space-x-1.5 py-1.5 border-2 border-dashed border-amber-400 text-[var(--color-cozy-brown-dark)] font-mono font-bold text-[10px] uppercase tracking-wider bg-amber-50 hover:bg-amber-100 hover:border-amber-600 rounded transition-all cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
          <span>Click to chat with Biscuit the Orange Cat</span>
        </button>
      )}

      {/* Interactive simulation status console */}
      <div className="mt-4 bg-[var(--color-cozy-cream-base)] border-2 border-[var(--color-cozy-brown-dark)] p-3 rounded flex items-start space-x-3 shadow-[2px_2px_0px_0px_rgba(74,44,17,1)]">
        <div className="p-2 bg-[var(--color-cozy-pink-light)] border border-[var(--color-cozy-pink-dark)] rounded flex-shrink-0 animate-sway">
          <Smile className="w-5 h-5 text-[var(--color-cozy-brown-dark)]" />
        </div>
        <div className="text-sm text-[var(--color-cozy-brown-dark)] font-sans leading-relaxed">
          <p className="font-semibold text-xs text-[var(--color-cozy-brown-light)] uppercase tracking-wider font-mono">
            Room Atmosphere Logs:
          </p>
          <p className="italic text-xs mt-0.5">
            "Your tea is hot, and the space is safe. You're doing fine."
          </p>
        </div>
      </div>

      {/* Styled Fall and Weather Drift Animations */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(15deg); opacity: 0.8; }
          100% { transform: translateY(220px) rotate(15deg); opacity: 0; }
        }
        @keyframes driftRain {
          0% { transform: translateY(0) translateX(0) rotate(20deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(350px) translateX(60px) rotate(20deg); opacity: 0; }
        }
        @keyframes driftMotes {
          0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
          50% { transform: translateY(-30px) translateX(25px) scale(1.2); opacity: 0.8; }
          100% { transform: translateY(-60px) translateX(50px) scale(0.8); opacity: 0; }
        }
        @keyframes driftPetals {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          15% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(350px) translateX(-80px) rotate(360deg); opacity: 0; }
        }
        @keyframes flickerSway {
          0%, 100% { transform: scale(1) skewX(0deg); }
          30% { transform: scale(1.05) skewX(4deg) translateY(-0.5px); }
          60% { transform: scale(0.95) skewX(-2deg) translateY(0px); }
          85% { transform: scale(1) skewX(1deg); }
        }
        .animate-flickerSway {
          animation: flickerSway 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
