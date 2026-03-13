import React, { useEffect, useState } from 'react';
import { PREMADE_SCENARIOS } from '../constants';
import { ScenarioTemplate, GameState } from '../types';
import { getSavedGames, loadGame, deleteGame, SaveMetadata } from '../services/storageService';

interface Props {
  onSelectScenario: (scenario: ScenarioTemplate) => void;
  onLoadGame: (state: GameState) => void;
  onCreateNew: () => void;
}

export const Hub: React.FC<Props> = ({ onSelectScenario, onLoadGame, onCreateNew }) => {
  const [saves, setSaves] = useState<SaveMetadata[]>([]);

  useEffect(() => {
    refreshSaves();
  }, []);

  const refreshSaves = () => {
    setSaves(getSavedGames());
  };

  const handleLoad = (id: string) => {
    const state = loadGame(id);
    if (state) {
      onLoadGame(state);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this story?")) {
      deleteGame(id);
      refreshSaves();
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-full p-6 md:p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="border-b border-navy-800 pb-6">
          <h2 className="text-3xl font-display font-bold text-white mb-2">MISSION CONTROL</h2>
          <p className="text-slate-500">Resume an existing timeline or initialize a new protocol.</p>
        </header>

        {/* Saved Games Section */}
        {saves.length > 0 && (
          <section>
             <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
               Active Timelines
             </h3>
             <div className="grid md:grid-cols-2 gap-4">
                {saves.map(save => (
                  <div 
                    key={save.id}
                    onClick={() => handleLoad(save.id)}
                    className="bg-navy-900/50 border border-teal-900/30 hover:border-teal-500 hover:bg-navy-900 p-5 rounded cursor-pointer transition-all group relative"
                  >
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors">{save.title}</h4>
                           <span className="text-[10px] text-slate-500 uppercase font-bold">Turn {save.tick} • {formatDate(save.lastPlayed)}</span>
                        </div>
                        <button 
                          onClick={(e) => handleDelete(e, save.id)}
                          className="text-navy-700 hover:text-red-500 p-1"
                          title="Delete Save"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                     <p className="text-xs text-slate-400 line-clamp-2 italic border-l-2 border-navy-800 pl-2 group-hover:border-teal-500/50">
                        "{save.previewText}"
                     </p>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* New Templates Section */}
        <section>
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Initialize New Simulation</h3>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PREMADE_SCENARIOS.map((scenario) => (
              <div 
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className="bg-navy-900 border border-navy-800 hover:border-slate-600 hover:bg-navy-800 p-6 rounded cursor-pointer transition-all group opacity-80 hover:opacity-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-slate-200 group-hover:text-white">{scenario.title}</h4>
                  <svg className="w-5 h-5 text-navy-700 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 h-12">{scenario.description}</p>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-navy-950 text-slate-500 px-2 py-1 rounded border border-navy-800 uppercase font-bold">Template</span>
                </div>
              </div>
            ))}

            <div 
              onClick={onCreateNew}
              className="border-2 border-dashed border-navy-800 hover:border-orange-500/50 hover:bg-navy-900/50 rounded flex flex-col items-center justify-center p-8 cursor-pointer transition-all group min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-navy-900 border border-navy-700 flex items-center justify-center mb-3 group-hover:border-orange-500/50 transition-colors">
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h4 className="font-bold text-slate-400 group-hover:text-orange-500 text-sm uppercase tracking-wide">Custom Protocol</h4>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};