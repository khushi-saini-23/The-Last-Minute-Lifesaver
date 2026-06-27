import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, CheckSquare, Square, Award, AlertCircle, Heart, Star, Compass, FileText, Trash2, Save, X } from "lucide-react";
import { motion } from "motion/react";
import { AnalysisResponse, PriorityLevel } from "../types";

interface ActionCenterProps {
  data: AnalysisResponse | null;
  isLoading: boolean;
  onClear: () => void;
}

export default function ActionCenter({ data, isLoading, onClear }: ActionCenterProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  
  const [stepNotes, setStepNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("cozy_step_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingNoteKey, setEditingNoteKey] = useState<string | null>(null);
  const [noteInputText, setNoteInputText] = useState<string>("");

  // Confetti celebration state
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiParticles, setConfettiParticles] = useState<Array<{
    id: number;
    left: number;
    top: number;
    color: string;
    size: number;
    delay: number;
    duration: number;
    rotationSpeed: number;
    driftType: number;
  }>>([]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("cozy_step_notes", JSON.stringify(stepNotes));
  }, [stepNotes]);

  // Clear checked steps and notes when new data arrives
  useEffect(() => {
    setCheckedSteps({});
    setStepNotes({});
    setEditingNoteKey(null);
    setShowConfetti(false);
    // Stop any speech when new data loads
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
  }, [data]);

  // Check checklist completion and trigger confetti celebration!
  useEffect(() => {
    if (!data) return;
    const totalSteps = data.analyzed_tasks.reduce((acc, t) => acc + t.action_plan.length, 0);
    if (totalSteps === 0) return;

    const checkedCount = Object.keys(checkedSteps).filter((k) => checkedSteps[k]).length;
    
    if (checkedCount === totalSteps) {
      // Create 55 cute pixel-art particles for the cozy explosion
      const particles = Array.from({ length: 55 }).map((_, i) => {
        const colors = [
          "bg-[#fbc490]", // cozy warm peach/orange
          "bg-[var(--color-cozy-pink-dark)]", // cozy pink dark
          "bg-[var(--color-cozy-green-pastel)]", // pastel light green
          "bg-[#c8b6ff]", // lavender purple
          "bg-[#ffd166]", // amber yellow
          "bg-[#4ea8de]", // soft sky blue
        ];
        return {
          id: i,
          left: Math.random() * 100, // percentage wide
          top: -15 - Math.random() * 15, // start staggered above top edge
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() > 0.5 ? 6 : 10, // square size in px
          delay: Math.random() * 1.5, // staggered drop start
          duration: 3.5 + Math.random() * 2.5, // gravity speed
          rotationSpeed: 100 + Math.random() * 250, // rotation rate
          driftType: Math.floor(Math.random() * 3), // random drift path
        };
      });
      setConfettiParticles(particles);
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [checkedSteps, data]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-[var(--color-cozy-cream-paper)] pixel-border p-8 rounded-lg flex flex-col items-center justify-center min-h-[400px]">
        {/* Cozy Loading Animation */}
        <div className="relative w-24 h-24 mb-6">
          {/* Animated Retro Sparkles and Tea Cup */}
          <div className="absolute top-0 inset-x-0 flex justify-center space-x-1 animate-bounce">
            <span className="w-1.5 h-4 bg-pink-300 rounded-full animate-pulse" />
            <span className="w-1.5 h-6 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1.5 h-5 bg-pink-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          <div className="absolute bottom-4 left-4 w-16 h-12 bg-[var(--color-cozy-pink-dark)] border-4 border-[var(--color-cozy-brown-dark)] rounded-b-xl shadow-lg">
            <div className="absolute top-2 right-[-8px] w-4 h-5 border-4 border-l-0 border-[var(--color-cozy-brown-dark)] rounded-r-lg" />
          </div>
        </div>
        <p className="font-retro text-2xl text-[var(--color-cozy-brown-dark)] text-center tracking-wider animate-pulse">
          Consulting the Cozy Study Companion...
        </p>
        <p className="text-sm text-[var(--color-cozy-brown-light)] text-center mt-2 max-w-xs italic">
          "Brewing your peaceful path. Pouring some warm thoughts onto your desk. Hang in there."
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full bg-[var(--color-cozy-cream-paper)] pixel-border p-8 rounded-lg flex flex-col items-center justify-center text-center min-h-[400px]">
        <Compass className="w-16 h-16 text-[var(--color-cozy-green-pastel)] mb-4 animate-sway" />
        <h3 className="font-sans font-bold text-lg text-[var(--color-cozy-brown-dark)] mb-2">
          Your Companion's Notepad is Empty
        </h3>
        <p className="text-sm text-[var(--color-cozy-brown-light)] max-w-sm mb-6 leading-relaxed">
          Pour your busy mind, deadlines, or tricky tasks into the notebook on the left and click 
          <strong className="text-[var(--color-cozy-pink-dark)]"> Create My Cozy Path</strong> to generate a warm, calm, prioritized checklist!
        </p>
        
        {/* Micro visual nook mockup inside empty state */}
        <div className="w-full max-w-xs border-2 border-dashed border-[var(--color-cozy-green-pastel)] rounded p-4 bg-[var(--color-cozy-cream-base)] relative">
          <div className="absolute top-2 right-2 text-xs font-mono text-[var(--color-cozy-pink-dark)]">★ STUDY NOOK</div>
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-[var(--color-cozy-pink-light)] rounded-full flex items-center justify-center text-xl select-none">
              🐈
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-cozy-brown-dark)]">The little cat is sleeping...</p>
              <p className="text-[11px] text-[var(--color-cozy-brown-light)]">Pet it or sip tea while you plan.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle checking checklist items
  const toggleStep = (taskIndex: number, stepIndex: number) => {
    const key = `${taskIndex}-${stepIndex}`;
    setCheckedSteps((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Speak the proactive nudge in a soft, calming voice
  const handleSpeakNudge = (nudge: string, index: number) => {
    if (!("speechSynthesis" in window)) {
      alert("Oops! Your browser does not support the Speech Synthesis API in this context, but your companion still wishes you a warm day!");
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    // Stop current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(nudge);
    
    // Attempt to set a soothing, soft voice
    const voices = window.speechSynthesis.getVoices();
    // Prefer English female voices which tend to sound softer by default
    const preferredVoice = voices.find(
      (v) => 
        v.lang.startsWith("en") && 
        (v.name.includes("Samantha") || v.name.includes("Google US English") || v.name.includes("Zira"))
    ) || voices.find((v) => v.lang.startsWith("en"));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Calming, gentle speed and pitch
    utterance.rate = 0.85; // slightly slower
    utterance.pitch = 1.05; // slightly warmer
    utterance.volume = 1.0;

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Get Badge color based on Priority
  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case "High":
        return "bg-rose-100 text-rose-700 border-2 border-rose-300";
      case "Medium":
        return "bg-amber-100 text-amber-700 border-2 border-amber-300";
      case "Low":
        return "bg-emerald-100 text-emerald-700 border-2 border-emerald-300";
      default:
        return "bg-gray-100 text-gray-700 border-2 border-gray-300";
    }
  };

  const handleSaveNote = (key: string, text: string) => {
    if (text.trim() === "") {
      handleDeleteNote(key);
    } else {
      setStepNotes((prev) => ({
        ...prev,
        [key]: text,
      }));
    }
    setEditingNoteKey(null);
  };

  const handleDeleteNote = (key: string) => {
    setStepNotes((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  return (
    <div className="w-full bg-[var(--color-cozy-cream-paper)] pixel-border p-6 rounded-lg relative flex flex-col justify-between">
      
      {/* Pixel-Art Confetti Rain Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className={`absolute ${p.color} border border-black/10`}
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.left}%`,
                top: `${p.top}px`,
                animation: `pixelFallDrift${p.driftType} ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes pixelFallDrift0 {
              0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
              50% { transform: translateY(250px) rotate(180deg) translateX(25px); opacity: 0.9; }
              100% { transform: translateY(600px) rotate(360deg) translateX(50px); opacity: 0; }
            }
            @keyframes pixelFallDrift1 {
              0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
              40% { transform: translateY(220px) rotate(-120deg) translateX(-30px); opacity: 0.9; }
              100% { transform: translateY(600px) rotate(-360deg) translateX(-60px); opacity: 0; }
            }
            @keyframes pixelFallDrift2 {
              0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
              60% { transform: translateY(280px) rotate(240deg) translateX(-10px); opacity: 0.9; }
              100% { transform: translateY(600px) rotate(480deg) translateX(15px); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-2 border-dashed border-[var(--color-cozy-pink-dark)] pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500 animate-bounce" style={{ animationDuration: '4s' }} />
            <h2 className="font-sans font-bold text-lg text-[var(--color-cozy-brown-dark)]">
              Your Companion's Path Planner
            </h2>
          </div>
          <button
            id="clear-plan-btn"
            onClick={onClear}
            className="px-2.5 py-1 text-xs font-mono bg-[var(--color-cozy-pink-light)] border border-[var(--color-cozy-pink-dark)] rounded text-[var(--color-cozy-brown-dark)] hover:bg-[var(--color-cozy-pink-dark)] hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            Clear notepad
          </button>
        </div>

        {/* Big completion congratulations banner if all steps are checked */}
        {showConfetti && (
          <div className="mb-6 p-4 bg-[var(--color-cozy-green-pastel)]/20 border-4 border-dashed border-[var(--color-cozy-green-pastel)] rounded-lg text-center relative overflow-hidden flex flex-col items-center justify-center animate-pulse shadow-[2px_2px_0px_0px_var(--color-cozy-brown-dark)]">
            <div className="text-3xl mb-1.5 select-none animate-bounce">🎉 🐈 🏆 🌟</div>
            <h3 className="font-retro text-base text-[var(--color-cozy-brown-dark)] tracking-wider">
              ALL GENTLE TASKS COMPLETED!
            </h3>
            <p className="text-xs text-[var(--color-cozy-brown-dark)] font-sans italic mt-1 max-w-sm">
              "Biscuit gives you a happy little meow, and stretches his tiny orange paws in proud celebration of your cozy progress! Take a real sip of your chamomile tea now!"
            </p>
          </div>
        )}

        {/* List of Analyzed Tasks */}
        <div className="space-y-6">
          {data.analyzed_tasks.map((task, taskIdx) => (
            <motion.div 
              key={taskIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.45, 
                delay: taskIdx * 0.12, 
                ease: "easeOut" 
              }}
              className="bg-[var(--color-cozy-cream-base)] border-2 border-[var(--color-cozy-brown-dark)] rounded-lg p-5 shadow-[3px_3px_0px_0px_rgba(74,44,17,1)] relative overflow-hidden"
            >
              {/* Corner priority ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded font-retro text-sm uppercase tracking-wide ${getPriorityBadge(task.priority)}`}>
                  {task.priority} Priority
                </span>
                <span className="text-xs font-mono text-[var(--color-cozy-brown-light)] bg-white/70 px-2 py-0.5 border border-amber-900/10 rounded">
                  ⏳ {task.time_urgency}
                </span>
              </div>

              {/* Task Title */}
              <h3 className="font-sans font-bold text-base text-[var(--color-cozy-brown-dark)] mb-3 flex items-center space-x-1">
                <span>✨</span>
                <span>{task.task_title}</span>
              </h3>

              {/* Proactive Nudge Card */}
              <div className="bg-[var(--color-cozy-pink-light)] border border-[var(--color-cozy-pink-dark)] rounded-lg p-3.5 mb-4 flex items-start space-x-3 shadow-inner">
                {/* Audio speaker trigger */}
                <button
                  id={`speak-btn-${taskIdx}`}
                  onClick={() => handleSpeakNudge(task.proactive_nudge, taskIdx)}
                  className={`p-2 rounded-full cursor-pointer transition-colors flex-shrink-0 focus:outline-none ${
                    speakingIndex === taskIdx 
                      ? "bg-[var(--color-cozy-pink-dark)] text-white animate-pulse" 
                      : "bg-white text-[var(--color-cozy-pink-dark)] border border-[var(--color-cozy-pink-dark)] hover:bg-pink-50"
                  }`}
                  title={speakingIndex === taskIdx ? "Click to silence cuddle voice" : "Click to hear your companion read this"}
                >
                  {speakingIndex === taskIdx ? (
                    <VolumeX className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Nudge text with cute notes decoration */}
                <div className="text-xs text-[var(--color-cozy-brown-dark)] font-sans italic leading-relaxed flex-1">
                  "{task.proactive_nudge}"
                  {speakingIndex === taskIdx && (
                    <div className="mt-1 flex items-center space-x-1">
                      <span className="w-1 h-2 bg-[var(--color-cozy-pink-dark)] rounded animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1 h-3 bg-[var(--color-cozy-pink-dark)] rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 h-1.5 bg-[var(--color-cozy-pink-dark)] rounded animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="text-[9px] text-[var(--color-cozy-pink-dark)] font-retro ml-1 uppercase">speaking in soft voice...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Steps Checklist */}
              <div>
                <p className="text-xs font-mono text-[var(--color-cozy-brown-light)] font-bold mb-2.5 uppercase tracking-wider flex items-center">
                  <Star className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Gentle Action Plan (Click to complete)
                </p>
                
                <div className="space-y-2">
                  {task.action_plan.map((step, stepIdx) => {
                    const stepKey = `${taskIdx}-${stepIdx}`;
                    const isChecked = checkedSteps[stepKey];
                    const hasNote = !!stepNotes[stepKey];
                    const isEditingNote = editingNoteKey === stepKey;

                    return (
                      <div
                        id={`step-${taskIdx}-${stepIdx}`}
                        key={stepIdx}
                        onClick={() => toggleStep(taskIdx, stepIdx)}
                        className={`w-full text-left p-3 rounded border border-[var(--color-cozy-brown-dark)] flex flex-col transition-all cursor-pointer select-none ${
                          isChecked 
                            ? "bg-[var(--color-cozy-green-pastel)]/15 border-dashed opacity-50 shadow-inner" 
                            : "bg-white hover:bg-[var(--color-cozy-cream-base)] hover:border-[var(--color-cozy-pink-dark)]"
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-start space-x-3 flex-1 mr-2">
                            {/* Custom Retro Pixel Checkbox Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              {isChecked ? (
                                /* Pixelated custom Checked box */
                                <div className="w-4.5 h-4.5 bg-[var(--color-cozy-brown-dark)] border-2 border-[var(--color-cozy-brown-dark)] flex items-center justify-center rounded-sm">
                                  {/* Small pixel check */}
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                </div>
                              ) : (
                                /* Pixelated empty box */
                                <div className="w-4.5 h-4.5 bg-white border-2 border-[var(--color-cozy-brown-dark)] rounded-sm" />
                              )}
                            </div>

                            {/* Step Description */}
                            <span className={`text-xs font-sans text-[var(--color-cozy-brown-dark)] leading-relaxed ${
                              isChecked ? "line-through text-gray-500" : ""
                            }`}>
                              {step}
                            </span>
                          </div>

                          {/* Action Note icon button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEditingNote) {
                                setEditingNoteKey(null);
                              } else {
                                setEditingNoteKey(stepKey);
                                setNoteInputText(stepNotes[stepKey] || "");
                              }
                            }}
                            className={`p-1.5 rounded transition-all hover:scale-105 focus:outline-none flex-shrink-0 ${
                              hasNote 
                                ? "text-amber-600 hover:text-amber-800 bg-amber-50 border border-amber-300"
                                : "text-gray-400 hover:text-[var(--color-cozy-pink-dark)]"
                            }`}
                            title={hasNote ? "Edit/View note" : "Add private note"}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline Note Editor Form */}
                        {isEditingNote && (
                          <div 
                            className="mt-2.5 ml-7 p-2.5 bg-amber-50/90 border border-amber-300 rounded flex flex-col space-y-2 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-center border-b border-amber-200 pb-1 mb-1">
                              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wide flex items-center">
                                📌 Add Note / Reminder:
                              </span>
                              <button 
                                onClick={() => setEditingNoteKey(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <textarea
                              value={noteInputText}
                              onChange={(e) => setNoteInputText(e.target.value)}
                              placeholder="Write a tiny reminder, tip, or note for yourself here..."
                              className="w-full p-2 text-xs bg-white border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-[var(--color-cozy-brown-dark)] resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2">
                              {hasNote && (
                                <button
                                  onClick={() => {
                                    handleDeleteNote(stepKey);
                                    setEditingNoteKey(null);
                                  }}
                                  className="px-2 py-1 text-[10px] font-mono bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors cursor-pointer flex items-center space-x-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                              <button
                                onClick={() => setEditingNoteKey(null)}
                                className="px-2 py-1 text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNote(stepKey, noteInputText)}
                                className="px-2 py-1 text-[10px] font-mono bg-amber-600 text-white rounded border border-amber-700 hover:bg-amber-700 transition-colors cursor-pointer flex items-center space-x-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Stored Note Sticky Widget */}
                        {hasNote && !isEditingNote && (
                          <div 
                            className="mt-2 ml-7 p-2 bg-amber-50 border border-dashed border-amber-300 text-[11px] rounded font-sans text-[var(--color-cozy-brown-dark)] flex items-start justify-between shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex-1 leading-relaxed">
                              <span className="font-bold text-amber-800 mr-1">📌 Note:</span>
                              <span>{stepNotes[stepKey]}</span>
                            </div>
                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditingNoteKey(stepKey);
                                  setNoteInputText(stepNotes[stepKey]);
                                }}
                                className="text-amber-700 hover:text-amber-950 font-mono text-[9px] underline cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(stepKey)}
                                className="text-red-600 hover:text-red-950 font-mono text-[9px] underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Alert Ribbon with productivity_recommendation in emerald tint */}
      <div className="mt-8 bg-[var(--color-cozy-emerald)] border-2 border-[var(--color-cozy-emerald-text)] p-4 rounded-lg flex items-start space-x-3 shadow-[2px_2px_0px_0px_#1b4332]">
        <div className="p-1 bg-white rounded border border-[var(--color-cozy-emerald-text)] flex-shrink-0 mt-0.5 animate-bounce">
          <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
        </div>
        <div>
          <h4 className="text-xs font-mono font-bold text-[var(--color-cozy-emerald-text)] uppercase tracking-wide mb-1">
            🌱 Cozy Study Buddy Recommendation:
          </h4>
          <p className="text-xs text-[var(--color-cozy-emerald-text)] font-sans leading-relaxed">
            {data.productivity_recommendation}
          </p>
        </div>
      </div>

    </div>
  );
}
