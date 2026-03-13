import React, { useState } from 'react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  topOverlay?: React.ReactNode; // New slot for Director Overlay
  onExit?: () => void;
  showExit?: boolean;
  isDirectorMode?: boolean;
  onToggleDirector?: () => void;
}

export const Layout: React.FC<Props> = ({ 
  children, 
  leftSidebar, 
  rightSidebar, 
  topOverlay,
  onExit, 
  showExit,
  isDirectorMode,
  onToggleDirector
}) => {
  const [showMobileLeft, setShowMobileLeft] = useState(false);
  const [showMobileRight, setShowMobileRight] = useState(false);

  return (
    <div className="h-screen bg-navy-950 text-slate-300 flex flex-col overflow-hidden font-sans selection:bg-teal-500/30">
      
      {/* Header */}
      <header className="h-14 bg-navy-900 border-b border-navy-800 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Left Toggle */}
          {leftSidebar && (
            <button onClick={() => setShowMobileLeft(true)} className="md:hidden text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          )}

          <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center font-bold text-navy-950 text-xs shadow-[0_0_10px_rgba(20,184,166,0.5)]">
            RP
          </div>
          <span className="font-bold text-slate-100 tracking-wide hidden sm:block">RP Agent <span className="text-slate-600 text-xs font-normal ml-2">v2.5</span></span>
        </div>

        <div className="flex items-center gap-3">
           {onToggleDirector && (
               <button 
                  onClick={onToggleDirector}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all border ${
                      isDirectorMode 
                      ? 'bg-teal-500/10 text-teal-500 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
                      : 'bg-navy-800 text-slate-500 border-navy-700 hover:text-teal-400 hover:border-teal-500/50'
                  }`}
               >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                   DIRECTOR
               </button>
           )}

           {showExit && onExit && (
             <Button variant="secondary" className="!py-1 !px-3 !text-[10px]" onClick={onExit}>Exit</Button>
           )}
           {/* Mobile Right Toggle */}
           {rightSidebar && (
             <button onClick={() => setShowMobileRight(true)} className="md:hidden text-slate-400 hover:text-white">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
             </button>
           )}
           <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-xs font-bold text-teal-500 hidden sm:flex">
             AI
           </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar (Desktop) */}
        {leftSidebar && (
          <aside className="hidden md:flex w-72 flex-col border-r border-navy-800 bg-navy-950/50 overflow-y-auto z-10">
            {leftSidebar}
          </aside>
        )}

        {/* Center Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-navy-950 relative">
          
          {/* Director Overlay Slot - Slides down or sits on top */}
          {topOverlay && (
              <div className="w-full bg-[#05090C]/95 backdrop-blur border-b border-teal-500/20 z-30 animate-fade-in shadow-2xl">
                  {topOverlay}
              </div>
          )}

          {children}
        </main>

        {/* Right Sidebar (Desktop) */}
        {rightSidebar && (
          <aside className="hidden lg:flex w-80 flex-col border-l border-navy-800 bg-navy-950/50 overflow-y-auto z-10">
            {rightSidebar}
          </aside>
        )}

        {/* Mobile Left Drawer */}
        {showMobileLeft && leftSidebar && (
          <div className="absolute inset-0 z-40 md:hidden flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileLeft(false)}></div>
            <div className="relative w-4/5 max-w-xs bg-navy-900 h-full shadow-2xl overflow-y-auto border-r border-navy-700 flex flex-col animate-fade-in">
              <div className="p-4 border-b border-navy-800 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500">World Data</span>
                <button onClick={() => setShowMobileLeft(false)}><svg className="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
              </div>
              {leftSidebar}
            </div>
          </div>
        )}

        {/* Mobile Right Drawer */}
        {showMobileRight && rightSidebar && (
          <div className="absolute inset-0 z-40 lg:hidden flex justify-end">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileRight(false)}></div>
            <div className="relative w-4/5 max-w-xs bg-navy-900 h-full shadow-2xl overflow-y-auto border-l border-navy-700 flex flex-col animate-fade-in">
               <div className="p-4 border-b border-navy-800 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500">Dramatis Personae</span>
                <button onClick={() => setShowMobileRight(false)}><svg className="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
              </div>
              {rightSidebar}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};