import React, { useState } from 'react';
import { StoryCard, CharacterState, Location } from '../types';
import { Button } from './Button';

interface Props {
  cards: StoryCard[];
  characters: CharacterState[];
  locations: Location[]; // Added locations prop
  onAdd: (card: StoryCard) => void;
  onUpdate: (card: StoryCard) => void;
  onDelete: (id: string) => void;
}

export const StoryCardManager: React.FC<Props> = ({ cards, characters, locations, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null); // 'new' or cardId
  const [editForm, setEditForm] = useState<Partial<StoryCard>>({});

  const startEdit = (card?: StoryCard) => {
    if (card) {
      setIsEditing(card.id);
      setEditForm({ ...card });
    } else {
      setIsEditing('new');
      setEditForm({ title: '', keys: [], entry: '', characterId: '', locationId: '' });
    }
  };

  const handleSave = () => {
    if (!editForm.title || !editForm.entry) return;

    if (isEditing === 'new') {
      const newCard: StoryCard = {
        id: `card_${Date.now()}`,
        title: editForm.title || 'Untitled',
        keys: editForm.keys || [],
        entry: editForm.entry || '',
        isActive: false,
        characterId: editForm.characterId || undefined,
        locationId: editForm.locationId || undefined
      };
      onAdd(newCard);
    } else {
      if (editForm.id) {
         onUpdate(editForm as StoryCard);
      }
    }
    setIsEditing(null);
  };

  const handleKeysChange = (value: string) => {
    // Split by comma, trim whitespace
    const keys = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    setEditForm({ ...editForm, keys });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Story Cards</h3>
        <button 
            onClick={() => startEdit()}
            className="text-[10px] bg-teal-600/10 text-teal-400 hover:bg-teal-600/20 px-2 py-1 rounded border border-teal-500/20 transition-colors uppercase font-bold"
        >
            + New
        </button>
      </div>

      {/* List View */}
      {isEditing === null && (
        <div className="space-y-3">
          {cards.length === 0 && (
             <div className="text-xs text-slate-600 italic text-center py-4 border border-dashed border-navy-800 rounded">
                No story cards defined. <br/> Add keys to inject lore.
             </div>
          )}
          {cards.map(card => {
             const linkedChar = characters.find(c => c.id === card.characterId);
             const linkedLoc = locations.find(l => l.id === card.locationId);
             
             return (
              <div 
                  key={card.id} 
                  className={`bg-navy-900 border ${card.isActive ? 'border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.1)]' : 'border-navy-800'} rounded p-3 hover:border-navy-700 transition-all group`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                     <span className="font-bold text-slate-200 text-xs">{card.title}</span>
                     <div className="flex gap-1 flex-wrap">
                        {linkedChar && (
                            <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/50 uppercase">
                            Char: {linkedChar.name}
                            </span>
                        )}
                        {linkedLoc && (
                            <span className="text-[9px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800/50 uppercase">
                            Loc: {linkedLoc.name}
                            </span>
                        )}
                     </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(card)} className="text-slate-500 hover:text-teal-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => onDelete(card.id)} className="text-slate-500 hover:text-red-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {card.keys.map((k, i) => (
                      <span key={i} className="text-[9px] bg-navy-950 text-slate-500 px-1.5 py-0.5 rounded border border-navy-800">
                          {k}
                      </span>
                  ))}
                </div>
                
                <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed">
                  {card.entry}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Form */}
      {isEditing !== null && (
        <div className="bg-navy-900 border border-navy-700 rounded p-4 animate-fade-in">
            <h4 className="text-xs font-bold text-white mb-3 uppercase">{isEditing === 'new' ? 'New Card' : 'Edit Card'}</h4>
            
            <div className="space-y-3">
                <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Title</label>
                    <input 
                        className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                        value={editForm.title}
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        placeholder="e.g. The Magic Sword"
                    />
                </div>

                <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Keywords (comma separated)</label>
                    <input 
                        className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                        value={editForm.keys?.join(', ')}
                        onChange={e => handleKeysChange(e.target.value)}
                        placeholder="e.g. sword, blade, excalibur"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Link Character</label>
                        <select 
                            className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                            value={editForm.characterId || ''}
                            onChange={e => setEditForm({...editForm, characterId: e.target.value || undefined})}
                        >
                            <option value="">-- None --</option>
                            {characters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Link Location</label>
                        <select 
                            className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                            value={editForm.locationId || ''}
                            onChange={e => setEditForm({...editForm, locationId: e.target.value || undefined})}
                        >
                            <option value="">-- None --</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Entry Content</label>
                    <textarea 
                        className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none h-24 resize-none"
                        value={editForm.entry}
                        onChange={e => setEditForm({...editForm, entry: e.target.value})}
                        placeholder="Context to inject when keywords are triggered..."
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="secondary" onClick={() => setIsEditing(null)} className="flex-1 !py-1 !text-[10px]">Cancel</Button>
                    <Button variant="primary" onClick={handleSave} className="flex-1 !py-1 !text-[10px]">Save</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};