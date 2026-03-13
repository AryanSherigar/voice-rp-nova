import React, { useState } from 'react';
import { CharacterState } from '../types';
import { Button } from './Button';
import { CharacterCard } from './CharacterCard';

interface Props {
  characters: CharacterState[];
  onAdd: (char: CharacterState) => void;
  onUpdate: (char: CharacterState) => void;
  onDelete: (id: string) => void;
}

export const CharacterManager: React.FC<Props> = ({ characters, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CharacterState>>({});

  const startEdit = (char?: CharacterState) => {
    if (char) {
      setIsEditing(char.id);
      setEditForm(JSON.parse(JSON.stringify(char))); // Deep copy
    } else {
      setIsEditing('new');
      setEditForm({
        name: '',
        role: '',
        description: '',
        status: 'Normal',
        emotions: { trust: 50, fear: 10, anger: 0, hope: 50 }
      });
    }
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.role) return;

    if (isEditing === 'new') {
      const newChar: CharacterState = {
        id: `char_${Date.now()}`,
        name: editForm.name,
        role: editForm.role,
        description: editForm.description || '',
        status: editForm.status || 'Normal',
        emotions: editForm.emotions || { trust: 50, fear: 10, anger: 0, hope: 50 }
      };
      onAdd(newChar);
    } else {
      if (editForm.id) {
         onUpdate(editForm as CharacterState);
      }
    }
    setIsEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dramatis Personae</h3>
        <button 
            onClick={() => startEdit()}
            className="text-[10px] bg-teal-600/10 text-teal-400 hover:bg-teal-600/20 px-2 py-1 rounded border border-teal-500/20 transition-colors uppercase font-bold"
        >
            + New
        </button>
      </div>

      {isEditing === null && (
        <div className="space-y-3">
          {characters.map(char => (
            <div key={char.id} className="relative group">
               <CharacterCard char={char} />
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-900/90 rounded border border-navy-700 flex p-1">
                   <button onClick={() => startEdit(char)} className="p-1 hover:text-teal-400 text-slate-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   </button>
                   <button onClick={() => onDelete(char.id)} className="p-1 hover:text-red-400 text-slate-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {isEditing !== null && (
        <div className="bg-navy-900 border border-navy-700 rounded p-4 animate-fade-in">
           <h4 className="text-xs font-bold text-white mb-3 uppercase">{isEditing === 'new' ? 'New Character' : 'Edit Character'}</h4>
           <div className="space-y-3">
              <input 
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
              />
              <input 
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                  placeholder="Role"
                  value={editForm.role}
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
              />
              <input 
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                  placeholder="Status (e.g. Healthy)"
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
              />
              <textarea 
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none h-20 resize-none"
                  placeholder="Description"
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
              />
              
              {/* Emotions */}
              <div className="space-y-2 pt-2 border-t border-navy-800">
                 <label className="text-[10px] text-slate-500 uppercase font-bold">Emotions</label>
                 {['trust', 'fear', 'anger', 'hope'].map(emotion => (
                     <div key={emotion} className="flex items-center gap-2">
                         <span className="text-[10px] text-slate-400 w-10 capitalize">{emotion}</span>
                         <input 
                            type="range" min="0" max="100" 
                            className="flex-1 h-1 bg-navy-950 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500"
                            value={editForm.emotions?.[emotion as keyof typeof editForm.emotions] || 0}
                            onChange={(e) => setEditForm({
                                ...editForm, 
                                emotions: { ...editForm.emotions!, [emotion]: parseInt(e.target.value) }
                            })}
                         />
                         <span className="text-[9px] text-slate-500 w-6 text-right">{editForm.emotions?.[emotion as keyof typeof editForm.emotions]}</span>
                     </div>
                 ))}
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