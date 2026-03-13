import React, { useState, useEffect } from 'react';
import { DirectorDecision, StoryDNAState } from '../types';
import { Button } from './Button';

interface Props {
  directorState: DirectorDecision;
  dna: StoryDNAState;
  onUpdate: (update: Partial<DirectorDecision>) => void;
}

export const DirectorOverlay: React.FC<Props> = ({ directorState, dna, onUpdate }) => {
  const [localInstruction, setLocalInstruction] = useState(directorState.narrativeFocus);

  // Sync local state when external state changes (e.g. from AI update)
  useEffect(() => {
    setLocalInstruction(directorState.narrativeFocus);
  }, [directorState.narrativeFocus]);

  const handlePacingChange = (pacing: 'Slow' | 'Normal' | 'Fast') => {
    onUpdate({ pacing });
  };

  const handleTensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ tension: parseInt(e.target.value) });
  };

  const handleInstructionSubmit = () => {
    onUpdate({ narrativeFocus: localInstruction });
  };

  const handleInjectTwist = () => {
    onUpdate({ 
        tension: Math.min(directorState.tension + 30, 100),
        narrativeFocus: "DIRECTOR OVERRIDE: Introduce a sudden, shocking twist or betrayal immediately."
    });
    setLocalInstruction("DIRECTOR OVERRIDE: Introduce a sudden, shocking twist or betrayal immediately.");
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 p-6 border-b border-navy-800 bg-navy-950/95 backdrop-blur-md relative z-40 shadow-2xl">
      
      {/* 1. Dashboard: Tension & Pacing */}
      <div className="flex-1 min-w-[300px] flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-teal-500 text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                Director Override
            </h3>
            <span className="text-[10px] text-teal-500/50 font-mono uppercase">System Active</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* Tension Control */}
              <div className="bg-navy-900 border border-navy-800 rounded p-4 hover:border-navy-700 transition-colors relative group">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-2 z-10 relative">
                      <span>Tension</span>
                      <span className="text-teal-500 font-mono text-base">{directorState.tension}%</span>
                  </div>
                  {/* Custom Styled Slider */}
                  <input 
                      type="range" 
                      min="0" max="100" 
                      value={directorState.tension} 
                      onChange={handleTensionChange}
                      style={{
                        background: `linear-gradient(to right, #14b8a6 ${directorState.tension}%, #1e293b ${directorState.tension}%)`
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-navy-950 focus:outline-none focus:ring-0 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-navy-900 [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-teal-400 transition-all"
                  />
              </div>

              {/* Pacing Control */}
              <div className="bg-navy-900 border border-navy-800 rounded p-4 hover:border-navy-700 transition-colors">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Pacing</div>
                  <div className="flex bg-navy-950 rounded p-1 border border-navy-800">
                      {['Slow', 'Normal', 'Fast'].map((p) => (
                          <button
                            key={p}
                            onClick={() => handlePacingChange(p as any)}
                            className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${
                                directorState.pacing === p 
                                ? 'bg-teal-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-navy-800'
                            }`}
                          >
                              {p}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Directive Input */}
      <div className="flex-[2] min-w-[300px] bg-navy-900 border border-navy-800 rounded p-4 relative group hover:border-navy-700 transition-colors">
          <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block tracking-widest flex justify-between">
              <span>Current Directive</span>
              <span className="text-slate-600 text-[9px] lowercase font-normal italic">Instructions for the AI narrator</span>
          </label>
          <div className="flex gap-4">
              <input 
                  value={localInstruction}
                  onChange={(e) => setLocalInstruction(e.target.value)}
                  onBlur={handleInstructionSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleInstructionSubmit()}
                  className="flex-1 bg-navy-950 border border-navy-800 rounded p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 font-mono transition-all"
                  placeholder="e.g. Reveal the villain's motive..."
              />
              <Button 
                onClick={handleInjectTwist} 
                className="!bg-teal-600/10 !border-teal-500 !text-teal-500 hover:!bg-teal-600 hover:!text-white !px-6 !py-0 !text-xs !font-bold tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(20,184,166,0.1)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]"
              >
                  ⚡ Twist
              </Button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-navy-700">
             {directorState.suggestedHints && directorState.suggestedHints.length > 0 ? (
                 directorState.suggestedHints.map((hint, i) => (
                     <button 
                        key={i} 
                        onClick={() => { setLocalInstruction(hint); onUpdate({ narrativeFocus: hint }); }}
                        className="text-[10px] bg-navy-950 border border-navy-700 rounded px-3 py-1.5 text-slate-400 hover:border-teal-500/50 hover:text-teal-400 whitespace-nowrap transition-colors"
                     >
                        + {hint}
                     </button>
                 ))
             ) : (
                <span className="text-[10px] text-slate-600 italic px-1">Awaiting suggestions...</span>
             )}
          </div>
      </div>

      {/* 3. DNA Monitor (Read Only) */}
      <div className="flex-1 min-w-[200px] border-l border-navy-800 pl-6 hidden xl:block">
         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Story DNA</h3>
         <div className="space-y-3">
            <MiniDNA label="Order" value={dna.orderChaos} color="bg-slate-500" />
            <MiniDNA label="Hope" value={dna.hopeDespair} color="bg-orange-500" />
            <MiniDNA label="Trust" value={dna.trustBetrayal} color="bg-teal-500" />
         </div>
      </div>

    </div>
  );
};

const MiniDNA: React.FC<{ label: string, value: number, color?: string }> = ({ label, value, color='bg-slate-500' }) => (
    <div className="flex items-center gap-2 text-[10px]">
        <span className="w-8 text-slate-400 text-right">{label}</span>
        <div className="flex-1 h-1 bg-navy-900 rounded-full overflow-hidden">
            <div className={`h-full ${color} opacity-70`} style={{ width: `${value}%` }}></div>
        </div>
        <span className="w-6 text-slate-600 font-mono text-[9px]">{value}</span>
    </div>
);