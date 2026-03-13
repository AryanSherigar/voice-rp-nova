import React from 'react';
import { CharacterState } from '../types';

export const CharacterCard: React.FC<{ char: CharacterState }> = ({ char }) => {
  const isDead = char.status.toLowerCase() === 'dead' || char.status.toLowerCase() === 'deceased';

  return (
    <div className={`bg-navy-900 border ${isDead ? 'border-red-900/50 opacity-80' : 'border-navy-800'} rounded p-4 mb-3 hover:border-navy-700 transition-colors relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className={`font-bold text-sm leading-tight ${isDead ? 'text-red-400 line-through' : 'text-slate-200'}`}>{char.name}</h4>
          <span className="text-[10px] text-slate-500 uppercase">{char.role}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isDead ? 'bg-red-950 text-red-500 border-red-900' : 'bg-navy-800 text-slate-400 border-navy-700'}`}>
          {char.status}
        </span>
      </div>
      
      <div className="space-y-2 relative">
        {isDead && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-950/70 backdrop-blur-[1px] rounded border border-red-900/20">
                <span className="text-xs font-bold uppercase text-red-600 tracking-[0.2em] border-y-2 border-red-900/50 py-1 px-4 bg-navy-950/80 shadow-lg">
                    Deceased
                </span>
            </div>
        )}
        <StatBar label="Trust" value={char.emotions.trust} color="bg-teal-500" />
        <StatBar label="Fear" value={char.emotions.fear} color="bg-slate-500" />
      </div>

      <div className="mt-3 pt-3 border-t border-navy-800">
         <div className="text-[10px] text-slate-600 uppercase font-bold mb-1">Current Goal</div>
         <p className="text-xs text-slate-400 italic">"Survive the current encounter."</p>
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-slate-500 w-8 font-medium">{label}</span>
    <div className="flex-1 h-1 bg-navy-950 rounded-full overflow-hidden">
        <div 
            className={`h-full ${color} transition-all duration-500`} 
            style={{ width: `${value}%` }}
        ></div>
    </div>
  </div>
);