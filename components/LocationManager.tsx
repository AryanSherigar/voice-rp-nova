import React, { useState } from 'react';
import { Location } from '../types';
import { Button } from './Button';

interface Props {
  locations: Location[];
  currentLocationId: string;
  onAdd: (loc: Location) => void;
  onUpdate: (loc: Location) => void;
  onDelete: (id: string) => void;
}

export const LocationManager: React.FC<Props> = ({ locations, currentLocationId, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Location>>({});

  const startEdit = (loc?: Location) => {
    if (loc) {
      setIsEditing(loc.id);
      setEditForm({ ...loc });
    } else {
      setIsEditing('new');
      setEditForm({ name: '', description: '' });
    }
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.description) return;

    if (isEditing === 'new') {
      const newLoc: Location = {
        id: `loc_${Date.now()}`,
        name: editForm.name,
        description: editForm.description
      };
      onAdd(newLoc);
    } else {
      if (editForm.id) {
         onUpdate(editForm as Location);
      }
    }
    setIsEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Known Locations</h3>
        <button 
            onClick={() => startEdit()}
            className="text-[10px] bg-teal-600/10 text-teal-400 hover:bg-teal-600/20 px-2 py-1 rounded border border-teal-500/20 transition-colors uppercase font-bold"
        >
            + New
        </button>
      </div>

      {isEditing === null && (
        <div className="space-y-2">
          {locations.map(loc => {
            const isCurrent = loc.id === currentLocationId;
            return (
              <div 
                key={loc.id} 
                className={`group relative p-3 rounded border ${isCurrent ? 'bg-navy-800 border-teal-500/50' : 'bg-navy-900 border-navy-800 hover:border-navy-700'}`}
              >
                 <div className="flex justify-between items-start">
                     <div>
                         <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-bold ${isCurrent ? 'text-teal-400' : 'text-slate-300'}`}>{loc.name}</h4>
                            {isCurrent && <span className="text-[8px] bg-teal-500/20 text-teal-400 px-1 rounded uppercase font-bold">Current</span>}
                         </div>
                         <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">{loc.description}</p>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => startEdit(loc)} className="text-slate-500 hover:text-teal-400">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         {!isCurrent && (
                            <button onClick={() => onDelete(loc.id)} className="text-slate-500 hover:text-red-400">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         )}
                     </div>
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {isEditing !== null && (
        <div className="bg-navy-900 border border-navy-700 rounded p-4 animate-fade-in">
           <h4 className="text-xs font-bold text-white mb-3 uppercase">{isEditing === 'new' ? 'New Location' : 'Edit Location'}</h4>
           <div className="space-y-3">
              <input 
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none"
                  placeholder="Location Name"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
              />
              <textarea 
                  className="w-full bg-navy-950 border border-navy-800 rounded p-2 text-xs text-slate-200 focus:border-teal-500 outline-none h-20 resize-none"
                  placeholder="Visual Description"
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
              />
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