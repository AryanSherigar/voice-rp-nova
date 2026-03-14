import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EventLogEntry } from '../types';

export const StoryLog: React.FC<{ history: EventLogEntry[] }> = ({ history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAutoPlayedEntryIdRef = useRef<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<{ entryId: string; src: string } | null>(null);
  const [shouldPlayAudio, setShouldPlayAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getNarratorAudio = (entry: EventLogEntry) => {
    if (entry.type !== 'NARRATOR') return null;
    if (!entry.audioBase64?.trim()) return null;

    const mimeType = entry.audioMimeType?.trim() || 'audio/mpeg';
    return {
      entryId: entry.id,
      src: `data:${mimeType};base64,${entry.audioBase64}`,
    };
  };

  const latestNarratorWithAudio = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const audio = getNarratorAudio(history[i]);
      if (audio) return audio;
    }

    return null;
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (!latestNarratorWithAudio) return;
    if (lastAutoPlayedEntryIdRef.current === latestNarratorWithAudio.entryId) return;

    lastAutoPlayedEntryIdRef.current = latestNarratorWithAudio.entryId;
    setActiveAudio(latestNarratorWithAudio);
    setShouldPlayAudio(true);
  }, [latestNarratorWithAudio]);

  useEffect(() => {
    if (!shouldPlayAudio || !activeAudio) return;

    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setIsSpeaking(false);
      });
    }

    setShouldPlayAudio(false);
  }, [activeAudio, shouldPlayAudio]);

  const handleReplay = (entry: EventLogEntry) => {
    const narratorAudio = getNarratorAudio(entry);
    if (!narratorAudio) return;

    setActiveAudio(narratorAudio);
    setShouldPlayAudio(true);
  };

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
                 {entry.audioBase64 && (
                   <span className="mt-1 text-[10px] text-teal-500 uppercase tracking-wide">Voice input attached</span>
                 )}
              </div>
            )}
            
            {/* Narrator Message */}
            {entry.type === 'NARRATOR' && (
              <div className="flex flex-col items-start w-full relative pl-4 border-l-2 border-teal-500/20 py-1">
                 <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-[0.95rem] max-w-none">
                    {entry.description}
                 </div>
                 {getNarratorAudio(entry) && (
                   <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleReplay(entry)}
                        className="text-[10px] text-teal-400 uppercase tracking-wide border border-teal-500/40 rounded px-2 py-1 hover:bg-teal-500/10 transition-colors"
                      >
                        Replay voice
                      </button>
                      {activeAudio?.entryId === entry.id && isSpeaking && (
                        <span className="text-[10px] text-teal-300 uppercase tracking-wide animate-pulse">
                          Speaking...
                        </span>
                      )}
                   </div>
                 )}
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
        <audio
          ref={audioRef}
          src={activeAudio?.src}
          className="hidden"
          preload="auto"
          onPlay={() => setIsSpeaking(true)}
          onPause={() => setIsSpeaking(false)}
          onEnded={() => setIsSpeaking(false)}
          onError={() => setIsSpeaking(false)}
        />
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};
