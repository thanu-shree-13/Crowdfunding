export function Loader() {
  return (
    <div className="fixed inset-0 z-50 bg-transparent flex flex-col items-center justify-center pointer-events-none">
      
      {/* Main container - allows clicks to pass through but loader stays visible */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-auto">
        
        {/* ETH SVG */}
        <div className="w-48 h-48 animate-float relative">
          <svg viewBox="0 0 256 417" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] relative z-10">
            <defs>
              <linearGradient id="ethGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>
            
            {/* Top */}
            <polygon
              points="127.9,0 124.1,13.4 124.1,279.1 127.9,282.9 255.8,210.3"
              fill="url(#ethGradient)"
              className="drop-shadow-lg"
            />
            
            {/* Left */}
            <polygon
              points="127.9,0 0,210.3 127.9,282.9 127.9,150"
              fill="#22c55e"
              fillOpacity="0.9"
            />
            
            {/* Right */}
            <polygon
              points="127.9,150 127.9,282.9 255.8,210.3"
              fill="#4ade80"
              fillOpacity="0.9"
            />
            
            {/* Bottom Left */}
            <polygon
              points="127.9,306 127.9,416.9 0,234.6"
              fill="#15803d"
              fillOpacity="0.8"
            />
            
            {/* Bottom Right */}
            <polygon
              points="127.9,416.9 255.8,234.6 127.9,306"
              fill="#22c55e"
              fillOpacity="0.8"
            />
          </svg>
        </div>

        {/* Text Section */}
        <div className="mt-12 text-center">
          <p className="text-green-400 text-xl font-bold tracking-wider animate-textGlow">
            SECURING BLOCKCHAIN
          </p>
          
          {/* Loading Bar */}
          <div className="mt-6 w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-loadingBar shadow-glow"></div>
          </div>
          
          {/* Status Text */}
          <p className="mt-3 text-green-500/80 text-sm font-mono tracking-wider">
            INITIALIZING SECURE CONNECTION...
          </p>
        </div>
      </div>
    </div>
  );
}