import React, { useState, useEffect } from "react";
import { Clock, Star } from "lucide-react";

export default function CozyClock() {
  const [time, setTime] = useState<Date>(new Date());
  const [tick, setTick] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setTick((t) => !t);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 12 instead of 0
    const strHours = hours.toString().padStart(2, "0");
    return `${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="flex items-center space-x-2.5 bg-[var(--color-cozy-brown-dark)] px-3 py-1.5 border-2 border-amber-900 rounded shadow-inner text-amber-200 select-none">
      <Clock className={`w-4 h-4 text-pink-300 ${tick ? 'scale-110' : 'scale-90'} transition-transform duration-200`} />
      <span className="font-retro text-lg tracking-wider md:text-xl">
        {formatTime(time)}
      </span>
      <Star className="w-3 h-3 text-yellow-300 animate-spin" style={{ animationDuration: '8s' }} />
    </div>
  );
}
