import React, { useEffect, useRef } from 'react';
import { EventLogEntry } from '../types';

export const StoryLog: React.FC<{ history: EventLogEntry[] }> = ({ history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth mask-gradient-top">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Welcome Message Placeholder if empty */}
        {history.length === 0 && (
            <div className="text-center text-slate-600 mt-20 text-sm italic">
                Initializing Simulation...
            </div>
        )}

        {history.map((entry) => (
          <div 
            key={entry.id} 
            className={`animate-fade-in flex flex-col ${
              entry.type === 'PLAYER' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Player Message */}
            {entry.type === 'PLAYER' && (
              <div className="flex flex-col items-end max-w-[85%]">
                 <span className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Action</span>
                 <div className="bg-navy-800 border border-navy-700 text-slate-200 px-4 py-2 rounded-lg rounded-tr-none text-sm shadow-sm">
                    {entry.description}
                 </div>
              </div>
            )}
            
            {/* Narrator Message */}
            {entry.type === 'NARRATOR' && (
              <div className="flex flex-col items-start w-full relative pl-4 border-l-2 border-teal-500/20 py-1">
                 <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-[0.95rem] max-w-none">
                    {entry.description}
                 </div>
              </div>
            )}

            {/* Director/System Message */}
             {entry.type === 'DIRECTOR' && (
              <div className="w-full flex justify-center my-4">
                  <span className="text-[10px] font-mono text-navy-700 bg-navy-900 px-2 py-1 rounded border border-navy-800 uppercase tracking-widest">
                     {entry.description}
                  </span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};