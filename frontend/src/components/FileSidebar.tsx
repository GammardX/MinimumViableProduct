import React, { useState } from 'react';
import type { Note } from '../App';
import '../style/filesidebar.css';

interface FileSidebarProps {
    notes: Note[];
    activeId: string;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onRename: (id: string, newTitle: string) => void; 
    onImport: () => void;
    onExport: (id: string) => void;
}

export default function FileSidebar({
    notes,
    activeId,
    onSelect,
    onCreate,
    onDelete,
    onRename,
    onImport,
    onExport
}: FileSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState("");

    const startEditing = (note: Note, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(note.id);
        setTempTitle(note.title);
    };

    const saveEdit = (id: string) => {
        if (tempTitle.trim() !== "") {
            onRename(id, tempTitle);
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            e.stopPropagation();
            saveEdit(id);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setEditingId(null); 
        }
    };

    return (
        <aside className='file-sidebar'>
            <div className='sidebar-header'>
                <h3>Le tue note</h3>
                <div className='button-files'>
                    <button onClick={onImport} className='btn-icon' title="Carica da file">
                        📂
                    </button>
                    <button 
                        onClick={() => onExport(activeId)} 
                        className='btn-icon' 
                        title="Salva nota su disco"
                        disabled={!activeId}>
                        💾
                    </button>
                    <button onClick={onCreate} className='btn-add' title="Nuova nota">
                        +
                    </button>
                </div>
            </div>
            
            <ul className='file-list'>
                {notes.map((note) => (
                    <li 
                        key={note.id} 
                        className={note.id === activeId ? 'active' : ''}
                        onClick={() => onSelect(note.id)}
                    >
                        <span className="file-icon">📄</span>
                        
                        {editingId === note.id ? (
                            <input
                                type="text"
                                className="file-rename-input"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={() => saveEdit(note.id)}
                                onKeyDown={(e) => handleKeyDown(e, note.id)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span 
                                className="file-name" 
                                onDoubleClick={(e) => startEditing(note, e)}
                                title="Doppio click per rinominare"
                            >
                                {note.title}
                            </span>
                        )}

                        <button 
                            className='btn-delete'
                            onClick={(e) => onDelete(note.id, e)}
                            title="Elimina"
                        >
                            🗑️
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}