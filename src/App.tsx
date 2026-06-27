import React, { useState, useEffect } from "react";
import { Sparkles, Heart, RefreshCw, Coffee, Info, AlertTriangle, HelpCircle, Music, VolumeX, Volume2 } from "lucide-react";
import StudyNook from "./components/StudyNook";
import TaskInput from "./components/TaskInput";
import ActionCenter from "./components/ActionCenter";
import CozyClock from "./components/CozyClock";
import { AnalysisResponse } from "./types";
import { ambientSynth, AMBIENT_THEMES, AmbientThemeId } from "./lib/audioManager";

export default function App() {
  const [tasksDescription, setTasksDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [currentThemeId, setCurrentThemeId] = useState<AmbientThemeId>(ambientSynth.getTheme());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [isOfflineModeActive, setIsOfflineModeActive] = useState<boolean>(false);
  const [roomLog, setRoomLog] = useState<string>(
    "🕯️ Welcome to your cozy study corner. The fire is warm, and we have all the time we need."
  );

  // Global handler to play a cute synthesized bubble/wooden block tap sound on button clicks
  useEffect(() => {
    const playCuteTapSound = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Cute cozy bubble / wooden tap pitch bend
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);
        
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        // Suppress audio context errors in quiet contexts
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest("button")) {
        playCuteTapSound();
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const handleToggleMusic = () => {
    const isNowPlaying = ambientSynth.toggle(currentThemeId);
    setIsMusicPlaying(isNowPlaying);
    if (isNowPlaying) {
      const activeTheme = AMBIENT_THEMES.find(t => t.id === currentThemeId);
      setRoomLog(`🎵 Procedural Lo-Fi chord progressions activated: ${activeTheme?.name}.`);
    } else {
      setRoomLog("🔇 Audio loop paused. Silence returns to your peaceful workspace.");
    }
  };

  const handleSelectTheme = (themeId: AmbientThemeId) => {
    ambientSynth.setTheme(themeId);
    setCurrentThemeId(themeId);
    setIsThemeMenuOpen(false);
    
    // Automatically start playing if it was paused to show instant reactive feedback
    if (!isMusicPlaying) {
      ambientSynth.toggle(themeId);
      setIsMusicPlaying(true);
    }
    
    const activeTheme = AMBIENT_THEMES.find(t => t.id === themeId);
    setRoomLog(`🎵 Sound environment switched to ${activeTheme?.name}. Enjoy the cozy vibes!`);
  };

  const handleCalmMessage = (message: string) => {
    setRoomLog(message);
  };

  const handleAnalyze = async () => {
    if (!tasksDescription.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasksDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The cozy server is taking a little nap. Let's try again in a bit!");
      }

      setAnalysisResult(data);
      if (data.fallbackActive) {
        setIsOfflineModeActive(true);
        setRoomLog(
          "✨ [Cozy Offline Mode Active] The primary AI is taking a rest, but we've brewed up a perfect step-by-step path for you offline! Check the Action Center on your right."
        );
      } else {
        setIsOfflineModeActive(false);
        setRoomLog(
          "✨ Freshly brewed plan! Look at the Action Center on your right. We've broken down your tasks into friendly, cozy steps."
        );
      }
    } catch (err: any) {
      console.error(err);
      setIsOfflineModeActive(true);
      setError(err.message || "Failed to reach your cozy companion. Check your server status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setAnalysisResult(null);
    setTasksDescription("");
    setError(null);
    setRoomLog("🧹 Cleared the workspace notepad. Ready for a new beginning whenever you are.");
  };

  return (
    <div className="min-h-screen bg-[var(--color-cozy-cream-base)] font-sans text-[var(--color-cozy-brown-dark)] flex flex-col selection:bg-[var(--color-cozy-pink-dark)] selection:text-[var(--color-cozy-brown-dark)] cozy-fade-in">
      
      {/* Premium Top Navigation Bar */}
      <nav className="h-16 bg-[var(--color-cozy-brown-dark)] text-[var(--color-cozy-cream-base)] flex items-center px-4 md:px-6 border-b-4 border-[var(--color-cozy-green-dark)] shadow-[0_4px_0_0_var(--color-cozy-pink-dark)] z-10 sticky top-0">
        {/* Pixel Art Logo block */}
        <div className="w-8 h-8 mr-3 md:mr-4 bg-[var(--color-cozy-pink-dark)] border-2 border-[var(--color-cozy-cream-base)] flex items-center justify-center animate-bounce flex-shrink-0" style={{ animationDuration: '3s' }}>
          <div className="w-2.5 h-2.5 bg-[var(--color-cozy-brown-dark)] rounded-sm" />
        </div>
        
        {/* Title */}
        <h1 className="text-xs md:text-lg font-mono font-bold tracking-tighter uppercase flex-1 truncate mr-2">
          THE LAST-MINUTE LIFE SAVER // YOUR COZY COMPANION
        </h1>

        {/* Live Status and Clock */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto">
          {/* lo-fi music toggle with theme selector split button */}
          <div className="relative flex items-center">
            <button
              id="global-music-toggle"
              onClick={handleToggleMusic}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border-2 border-r-0 rounded-l text-xs font-mono font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none cursor-pointer focus:outline-none h-9 ${
                isMusicPlaying
                  ? "bg-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)] border-[var(--color-cozy-cream-base)]"
                  : "bg-[var(--color-cozy-brown-light)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)]"
              }`}
              title="Toggle Lo-Fi Study Synth Audio Loop"
            >
              {isMusicPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span className="hidden md:inline">LOFI PLAYING</span>
                  <span className="md:hidden">LOFI ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">PLAY LOFI LOOP</span>
                  <span className="md:hidden">PLAY LOFI</span>
                </>
              )}
            </button>

            {/* Split Theme Selector Dropdown Button */}
            <button
              id="global-theme-selector-trigger"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`px-2 py-1.5 border-2 rounded-r text-xs font-mono font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none cursor-pointer focus:outline-none flex items-center h-9 ${
                isThemeMenuOpen
                  ? "bg-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)] border-[var(--color-cozy-cream-base)]"
                  : "bg-[var(--color-cozy-brown-light)] text-[var(--color-cozy-cream-base)] border-[var(--color-cozy-brown-dark)]"
              }`}
              title="Select Ambient Atmosphere Theme"
            >
              <span className="text-sm mr-1">
                {AMBIENT_THEMES.find(t => t.id === currentThemeId)?.icon}
              </span>
              <span className="text-[10px] hidden md:inline">THEME ▾</span>
            </button>

            {/* Dropdown Box Menu */}
            {isThemeMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsThemeMenuOpen(false)} 
                />
                <div className="absolute right-0 top-11 w-64 bg-[var(--color-cozy-cream-paper)] border-4 border-[var(--color-cozy-brown-dark)] rounded-lg p-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50 flex flex-col space-y-1.5 text-[var(--color-cozy-brown-dark)]">
                  <div className="px-1.5 py-1 border-b border-dashed border-[var(--color-cozy-brown-light)]/40 mb-1">
                    <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[var(--color-cozy-brown-light)]">
                      Ambient Sound Themes:
                    </span>
                  </div>
                  {AMBIENT_THEMES.map((theme) => {
                    const isSelected = theme.id === currentThemeId;
                    return (
                      <button
                        key={theme.id}
                        id={`theme-option-${theme.id}`}
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`w-full text-left p-2 rounded border transition-all text-xs flex items-start space-x-2.5 cursor-pointer focus:outline-none ${
                          isSelected
                            ? "bg-[var(--color-cozy-pink-light)] border-[var(--color-cozy-pink-dark)] font-bold text-[var(--color-cozy-brown-dark)]"
                            : "bg-white hover:bg-[var(--color-cozy-cream-base)] border-gray-200 hover:border-[var(--color-cozy-brown-dark)] text-gray-700"
                        }`}
                      >
                        <span className="text-base select-none mt-0.5">{theme.icon}</span>
                        <div className="flex-1">
                          <div className="font-mono text-xs font-bold flex items-center justify-between">
                            <span>{theme.name}</span>
                            {isSelected && (
                              <span className="text-[8px] font-mono bg-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)] px-1 rounded uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 font-sans mt-0.5 leading-tight">
                            {theme.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {isOfflineModeActive ? (
            <span className="hidden lg:inline-block text-xs bg-[var(--color-cozy-pink-dark)] text-[var(--color-cozy-brown-dark)] font-bold px-2.5 py-1 border-2 border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_#000] uppercase tracking-wide animate-pulse" title="Using ultra-cozy offline templates and fallback helpers. No API Key required!">
              💤 LOCAL FALLBACK MODE
            </span>
          ) : (
            <span className="hidden lg:inline-block text-xs bg-[var(--color-cozy-green-pastel)] text-[var(--color-cozy-brown-dark)] font-bold px-2.5 py-1 border-2 border-[var(--color-cozy-brown-dark)] shadow-[2px_2px_0_0_#000] uppercase tracking-wide">
              STATUS: COZY & LIVE
            </span>
          )}
          <CozyClock />
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Input Workspace & Study Nook Sandbox) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Study Nook Interactive Environment */}
          <div>
            <div className="flex items-center space-x-1.5 mb-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-cozy-pink-dark)]" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-cozy-brown-light)]">
                Interactive Study Nook Simulator
              </h3>
            </div>
            <StudyNook 
              onCalmMessage={handleCalmMessage} 
              onOfflineModeDetected={() => setIsOfflineModeActive(true)}
            />
          </div>

          {/* Active room notification ticker */}
          <div className="px-4 py-2.5 bg-[var(--color-cozy-pink-light)] border-2 border-[var(--color-cozy-pink-dark)] text-xs text-[var(--color-cozy-brown-dark)] font-mono rounded flex items-center space-x-2 shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-cozy-brown-dark)] animate-ping" />
            <span className="italic">{roomLog}</span>
          </div>

          {/* Notebook mind dump input */}
          <TaskInput
            tasksDescription={tasksDescription}
            setTasksDescription={setTasksDescription}
            isLoading={isLoading}
            onAnalyze={handleAnalyze}
          />
          
        </section>

        {/* Right Column (Action Center Dashboard & Solutions) */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Error notice if API call fails */}
          {error && (
            <div className="p-4 bg-red-50 border-4 border-red-300 rounded-lg text-red-800 text-sm font-sans flex items-start space-x-3 shadow-md animate-bounce">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">A tiny glitch in the tea brewing:</p>
                <p className="mt-1">{error}</p>
                <button 
                  onClick={handleAnalyze}
                  className="mt-2.5 px-3 py-1 bg-red-100 hover:bg-red-200 border border-red-300 rounded text-xs font-mono font-bold text-red-900 transition-colors cursor-pointer"
                >
                  Try Brewing Again
                </button>
              </div>
            </div>
          )}

          {/* Path Action Center */}
          <ActionCenter
            data={analysisResult}
            isLoading={isLoading}
            onClear={handleClear}
          />

          {/* Cozy Guidelines Card */}
          <div className="bg-white pixel-border-sm p-5 rounded-lg text-xs text-[var(--color-cozy-brown-dark)] space-y-3 leading-relaxed">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
              <Info className="w-4 h-4 text-[var(--color-cozy-pink-dark)]" />
              <span className="font-bold uppercase tracking-wider font-mono">How to use this space:</span>
            </div>
            <p>
              1. **Dump your thoughts**: Type your stress, deadlines, or chaotic checklist into the Left Notebook.
            </p>
            <p>
              2. **Brew a friendly plan**: Click <strong className="text-[var(--color-cozy-pink-dark)]">Create My Cozy Path</strong>. The Gemini companion will organize your tasks by urgency, offer custom encouragement, and propose a calming action guide.
            </p>
            <p>
              3. **Sip & relax**: Touch the interactive items in your <strong className="text-[var(--color-cozy-pink-dark)]">Study Nook</strong> (the sleeping orange cat, steaming mug of lavender tea, window pane, or desk lamp) to log sweet comfort notes.
            </p>
            <p>
              4. **Speak out loud**: Tap the speaker button next to your proactive nudge to hear a soft voice support your hard work.
            </p>
          </div>

        </section>

      </main>

      {/* Retro Footnote */}
      <footer className="py-4 bg-[var(--color-cozy-brown-dark)] border-t-4 border-[var(--color-cozy-green-dark)] text-center text-[var(--color-cozy-pink-dark)] text-[10px] font-mono tracking-wider">
        THE LAST-MINUTE LIFE SAVER © 2026 // MADE WITH EMpathy & PIXEL LOVE
      </footer>

    </div>
  );
}
