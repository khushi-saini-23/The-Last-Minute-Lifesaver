import React from "react";
import { Sparkles, Heart } from "lucide-react";

interface TaskInputProps {
  tasksDescription: string;
  setTasksDescription: (value: string) => void;
  isLoading: boolean;
  onAnalyze: () => void;
}

export default function TaskInput({
  tasksDescription,
  setTasksDescription,
  isLoading,
  onAnalyze,
}: TaskInputProps) {
  
  const handlePlaceholderClick = (text: string) => {
    setTasksDescription(text);
  };

  const samplePrompts = [
    "I have a math assignment due tomorrow, need to prepare a biology quiz by Friday, and wash my laundry, but I feel so overwhelmed and frozen.",
    "Need to write a 1000-word history essay due in 5 hours, clean my room, and reply to group project emails.",
    "I have three massive deadlines next week but I can't seem to start. I just keep scrolling and feeling anxious."
  ];

  return (
    <div className="w-full bg-[var(--color-cozy-cream-paper)] pixel-border p-6 rounded-lg relative">
      
      {/* Decorative Spiral Binder Rings to look like a physical paper notebook */}
      <div className="absolute top-0 left-8 right-8 -translate-y-3.5 flex justify-between pointer-events-none select-none z-20">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Metal ring loop */}
            <div className="w-2.5 h-6 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-full border border-gray-600 shadow-sm" />
            {/* Punched paper hole */}
            <div className="w-3 h-3 bg-amber-900/10 rounded-full -mt-1.5" />
          </div>
        ))}
      </div>

      <div className="pt-4">
        {/* Notebook Title Section */}
        <div className="flex items-center justify-between mb-4 border-b-2 border-dashed border-[var(--color-cozy-pink-dark)] pb-2">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-[var(--color-cozy-pink-dark)] animate-pulse" />
            <h2 className="font-sans font-bold text-lg text-[var(--color-cozy-brown-dark)]">
              My Cozy Mind Dump
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--color-cozy-brown-light)] italic">
            Pour your stress out...
          </span>
        </div>

        {/* Lined Notebook Paper Textarea */}
        <div className="relative mb-5 bg-[#fffefc] rounded p-2 border-2 border-[var(--color-cozy-pink-dark)] shadow-inner">
          {/* Lined Paper Background effect */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(#8b5a2b 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} 
          />
          
          <textarea
            id="mind-dump-textarea"
            className="w-full h-64 bg-transparent font-sans text-sm text-[var(--color-cozy-brown-dark)] leading-8 placeholder-gray-400 focus:outline-none resize-none p-3 relative z-10"
            placeholder="Share what's on your mind, maybe a deadline, a tricky task, or just a heavy feeling that's keeping you frozen..."
            value={tasksDescription}
            onChange={(e) => setTasksDescription(e.target.value)}
            disabled={isLoading}
          />
          
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[var(--color-cozy-brown-light)] px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
            {tasksDescription.length} characters
          </div>
        </div>

        {/* Quick Helper Prompts */}
        <div className="mb-6">
          <p className="text-xs font-mono text-[var(--color-cozy-brown-light)] font-bold mb-2 uppercase tracking-wide">
            Need a gentle spark? Click to write a cozy template:
          </p>
          <div className="space-y-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                id={`preset-prompt-${idx}`}
                key={idx}
                type="button"
                onClick={() => handlePlaceholderClick(prompt)}
                disabled={isLoading}
                className="w-full text-left p-2.5 bg-[var(--color-cozy-cream-base)] border border-[var(--color-cozy-green-pastel)] rounded text-xs text-[var(--color-cozy-brown-dark)] hover:bg-[var(--color-cozy-pink-light)] hover:border-[var(--color-cozy-pink-dark)] transition-all duration-300 line-clamp-2 cursor-pointer focus:outline-none"
              >
                📝 "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Cozy Button with custom pixel art flower loader */}
        <button
          id="create-path-btn"
          onClick={onAnalyze}
          disabled={isLoading || !tasksDescription.trim()}
          className={`w-full py-3.5 px-6 font-sans font-bold text-sm text-[var(--color-cozy-cream-base)] rounded-lg transition-all transform hover:-translate-y-0.5 focus:outline-none flex items-center justify-center space-x-3 select-none cursor-pointer ${
            isLoading || !tasksDescription.trim()
              ? "bg-[var(--color-cozy-green-pastel)] border-4 border-gray-400 cursor-not-allowed opacity-80"
              : "bg-[var(--color-cozy-brown-dark)] border-4 border-[#251304] hover:bg-[var(--color-cozy-brown-light)] shadow-[4px_4px_0px_0px_rgba(37,19,4,1)] active:translate-y-0.5 active:shadow-none"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              {/* Cute Retro Pixel Art Blooming Flower Loader */}
              <svg 
                className="w-6 h-6 animate-spin text-pink-300" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                {/* 8-bit stylized flower petals */}
                <path d="M12,2 L14,2 L14,4 L12,4 Z" />
                <path d="M12,20 L14,20 L14,22 L12,22 Z" />
                <path d="M2,12 L4,12 L4,14 L2,14 Z" />
                <path d="M20,12 L22,12 L22,14 L20,14 Z" />
                <path d="M5,5 L7,5 L7,7 L5,7 Z" />
                <path d="M17,17 L19,17 L19,19 L17,19 Z" />
                <path d="M17,5 L19,5 L19,7 L17,7 Z" />
                <path d="M5,17 L7,17 L7,19 L5,19 Z" />
                <circle cx="12" cy="12" r="3" className="text-yellow-300" />
              </svg>
              <span className="font-retro text-lg tracking-wider animate-pulse text-amber-200">
                BREWING YOUR PATH...
              </span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-retro text-lg tracking-widest">
                CREATE MY COZY PATH
              </span>
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
            </>
          )}
        </button>

      </div>
    </div>
  );
}
