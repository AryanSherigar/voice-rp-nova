import React, { useState } from 'react';
import { InputType, PlayerInput } from '../types';
import { Button } from './Button';

interface Props {
  onInput: (input: PlayerInput) => void;
  isProcessing: boolean;
}

export const ActionPanel: React.FC<Props> = ({ onInput, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<InputType>(InputType.DO);
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onInput({ type: activeTab, content });
    setContent('');
  };

  const handleContinue = () => {
    // Send a passive action to trigger the next turn
    onInput({ type: InputType.STORY, content: "(The player observes and waits...)" });
    setContent('');
  };

  const tabs = [
    { id: InputType.DO, icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, label: 'Do' },
    { id: InputType.SAY, icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>, label: 'Say' },
    { id: InputType.STORY, icon: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, label: 'Story' },
  ];

  return (
    <div className="bg-navy-900 border-t border-navy-800 p-4 shrink-0">
      <div className="max-w-3xl mx-auto w-full">
        {/* Input Tabs */}
        <div className="flex gap-2 mb-3">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all border ${
                        activeTab === tab.id
                        ? 'bg-navy-800 text-teal-400 border-navy-700 shadow-sm'
                        : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-navy-800/50'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative group">
           <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
              disabled={isProcessing}
              placeholder={`What do you ${activeTab.toLowerCase()}?`}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 placeholder-slate-700 resize-none h-20"
           />
           <div className="absolute bottom-2 right-2 flex gap-2">
               <Button 
                   type="button" 
                   variant="secondary" 
                   onClick={handleContinue}
                   disabled={isProcessing}
                   title="Advance the story without acting"
                   className="!py-1.5 !px-3 !text-[10px] !bg-navy-800 hover:!bg-navy-700 border border-navy-700 text-slate-400 hover:text-teal-400"
               >
                   <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                   </svg>
                   Continue
               </Button>
               <Button 
                   type="submit" 
                   disabled={!content.trim()} 
                   isLoading={isProcessing && !!content} 
                   className="!py-1.5 !px-3 !text-[10px]"
               >
                   Confirm
               </Button>
           </div>
        </form>
      </div>
    </div>
  );
};