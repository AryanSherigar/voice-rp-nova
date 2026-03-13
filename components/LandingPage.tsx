import React from 'react';

interface Props {
  onEnter: () => void;
}

export const LandingPage: React.FC<Props> = ({ onEnter }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05090C] text-center px-4 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-teal-900/10 blur-[100px]"></div>
      </div>

      <div className="max-w-3xl animate-fade-in relative z-10 flex flex-col items-center">
        
        {/* Status Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900 border border-navy-800 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-xs font-medium text-teal-400 tracking-wide font-mono">System Online</span>
        </div>

        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6">
          RP Agent
        </h1>

        {/* Subtitle with colored highlights */}
        <p className="text-xl md:text-2xl text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto mb-12">
          A story where characters <span className="text-teal-400 font-medium">remember</span>, <span className="text-blue-400 font-medium">adapt</span>, and <span className="text-purple-400 font-medium">choose</span>.
        </p>

        {/* Action Button */}
        <button 
          onClick={onEnter}
          className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-navy-950 rounded-full font-bold text-lg hover:bg-slate-200 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <span>Enter World</span>
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};