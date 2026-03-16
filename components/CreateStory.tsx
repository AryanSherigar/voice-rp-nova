import React, { useState } from 'react';
import { CreateStoryFormData } from '../types';
import { Button } from './Button';

const MIN_CHARACTERS = 2;

const createEmptyCharacter = () => ({
  name: '',
  role: '',
  description: '',
  goal: '',
  lore: ''
});

interface Props {
  onSubmit: (data: CreateStoryFormData) => void;
  onCancel: () => void;
}

export const CreateStory: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateStoryFormData>({
    title: '',
    settingName: '',
    settingDescription: '',
    characters: [createEmptyCharacter(), createEmptyCharacter()]
  });

  const handleCharChange = (index: number, field: string, value: string) => {
    const newChars = [...formData.characters];
    newChars[index] = { ...newChars[index], [field]: value };
    setFormData({ ...formData, characters: newChars });
  };

  const addCharacter = () => {
    setFormData({
      ...formData,
      characters: [...formData.characters, createEmptyCharacter()]
    });
  };

  const removeCharacter = (index: number) => {
    if (formData.characters.length <= MIN_CHARACTERS) {
      return;
    }

    setFormData({
      ...formData,
      characters: formData.characters.filter((_, charIndex) => charIndex !== index)
    });
  };

  const hasMinimumCharacters = formData.characters.length >= MIN_CHARACTERS;
  const hasRequiredCharacterNames = formData.characters.every(char => char.name.trim().length > 0);
  const isFormValid =
    formData.title.trim().length > 0 &&
    formData.settingName.trim().length > 0 &&
    hasMinimumCharacters &&
    hasRequiredCharacterNames;

  return (
    <div className="min-h-screen bg-[#050505] p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-[#0F1218] border border-white/5 rounded-2xl p-8 shadow-2xl relative">
        <header className="mb-10 border-b border-white/5 pb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-wide">PROTOCOL CONFIGURATION</h2>
            <p className="text-slate-500 mt-1 text-sm">Define initial parameters for the simulation engine.</p>
          </div>
          <div className="text-[10px] font-mono text-orange-500 uppercase">Step 1 of 1</div>
        </header>

        <div className="space-y-10">
          {/* World Details */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                World Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Simulation Title</label>
                <input 
                  className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm"
                  placeholder="e.g. The Last Starship"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Setting Name</label>
                <input 
                  className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm"
                  placeholder="e.g. Bridge of the USS Aegis"
                  value={formData.settingName}
                  onChange={e => setFormData({...formData, settingName: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-2">Setting Premise</label>
                <textarea 
                  className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-slate-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all text-sm h-32"
                  placeholder="Describe the starting location and the current situation..."
                  value={formData.settingDescription}
                  onChange={e => setFormData({...formData, settingDescription: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Characters */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                Entity Definitions
            </h3>
            <p className="text-xs text-slate-500">At least {MIN_CHARACTERS} characters are required to initialize.</p>
            <div className="space-y-4">
              {formData.characters.map((char, i) => (
                <div key={i} className="bg-[#050505] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] text-orange-500 font-bold uppercase block tracking-widest">Entity {i + 1}</span>
                    <Button
                      variant="ghost"
                      onClick={() => removeCharacter(i)}
                      disabled={formData.characters.length <= MIN_CHARACTERS}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input 
                      className="bg-[#0F1218] border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-orange-500 focus:outline-none"
                      placeholder="Name"
                      value={char.name}
                      onChange={e => handleCharChange(i, 'name', e.target.value)}
                    />
                    <input 
                      className="bg-[#0F1218] border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-orange-500 focus:outline-none"
                      placeholder="Role (e.g. Captain)"
                      value={char.role}
                      onChange={e => handleCharChange(i, 'role', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        className="w-full bg-[#0F1218] border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-orange-500 focus:outline-none"
                        placeholder="Brief description / Personality"
                        value={char.description}
                        onChange={e => handleCharChange(i, 'description', e.target.value)}
                    />
                    <input 
                        className="w-full bg-[#0F1218] border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-orange-500 focus:outline-none"
                        placeholder="Current goal"
                        value={char.goal || ''}
                        onChange={e => handleCharChange(i, 'goal', e.target.value)}
                    />
                    <input 
                        className="w-full bg-[#0F1218] border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-teal-500 focus:outline-none placeholder-slate-600"
                        placeholder="Secret / Lore (Triggers on name)"
                        value={char.lore}
                        onChange={e => handleCharChange(i, 'lore', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={addCharacter}>Add character</Button>
          </section>

          <div className="flex justify-between pt-8 border-t border-white/5">
            <Button variant="ghost" onClick={onCancel}>ABORT</Button>
            <Button 
              onClick={() => onSubmit(formData)} 
              disabled={!isFormValid}
              variant="primary"
            >
              INITIALIZE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
