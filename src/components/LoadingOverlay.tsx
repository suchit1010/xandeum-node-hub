import { useState, useEffect } from "react";
import xandeumLogo from "@/assets/xandeum-x-logo.png";

const STATUS_MESSAGES = [
  "Connecting to pRPC endpoints...",
  "Discovering pNodes via gossip...",
  "Aggregating network metrics...",
  "Loading interactive dashboard...",
];

interface LoadingOverlayProps {
  isVisible: boolean;
}

export function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setFadeOut(true);
      return;
    }
    setFadeOut(false);
    setMessageIndex(0);
    setProgress(0);
  }, [isVisible]);

  // Cycle through status messages
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Simulate progress
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 8 + 2, 95));
    }, 300);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible && fadeOut) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-out pointer-events-none" />
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Floating glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-xandeum-teal/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-xandeum-orange/20 blur-[80px] animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-xandeum-purple/10 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 px-4">
        {/* Logo container with orbiting ring */}
        <div className="relative">
          {/* Orbiting ring */}
          <svg
            className="absolute inset-0 w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] -translate-x-[15px] -translate-y-[15px] sm:-translate-x-[20px] sm:-translate-y-[20px]"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--xandeum-teal))" />
                <stop offset="50%" stopColor="hsl(var(--xandeum-purple))" />
                <stop offset="100%" stopColor="hsl(var(--xandeum-orange))" />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity="0.3"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.89} 289`}
              transform="rotate(-90 50 50)"
              className="transition-all duration-300 ease-out drop-shadow-[0_0_8px_hsl(var(--xandeum-teal))]"
            />
            {/* Orbiting dot */}
            <circle
              cx="50"
              cy="4"
              r="3"
              fill="hsl(var(--xandeum-orange))"
              className="drop-shadow-[0_0_10px_hsl(var(--xandeum-orange))]"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>

          {/* Logo with glow and pulse */}
          <div className="relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] flex items-center justify-center">
            {/* Glow behind logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-xandeum-teal/40 via-xandeum-purple/30 to-xandeum-orange/40 blur-2xl animate-pulse" />
            </div>
            {/* Logo image */}
            <img
              src={xandeumLogo}
              alt="Xandeum"
              className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] object-contain drop-shadow-[0_0_30px_hsla(var(--xandeum-teal),0.5)] animate-[pulse_2s_ease-in-out_infinite]"
            />
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-3">
          <p className="text-lg sm:text-xl font-medium text-xandeum-teal animate-fade-in transition-all duration-500">
            {STATUS_MESSAGES[messageIndex]}
          </p>
          
          {/* Pulsing dots */}
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-xandeum-teal animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-xandeum-purple animate-pulse" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 rounded-full bg-xandeum-orange animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>

          {/* Progress percentage */}
          <p className="text-sm text-muted-foreground font-mono">
            {Math.round(progress)}% loaded
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
