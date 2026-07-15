import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, MessageSquare } from 'lucide-react';
import type { Note } from '../../types/propertyDetail';

interface NotesPanelProps {
    notes: Note[];
    onAddNote: (text: string) => void;
    onDeleteNote: (id: string) => void;
}

function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function NotesPanel({ notes, onAddNote, onDeleteNote }: NotesPanelProps) {
    const [newNote, setNewNote] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    function handleSave() {
        const text = newNote.trim();
        if (!text) return;
        onAddNote(text);
        setNewNote('');
    }

    function handleDelete(id: string) {
        if (deleteConfirm === id) {
            onDeleteNote(id);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(id);
            // Auto-dismiss after 3s
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    }

    return (
        <div className="space-y-4">
            {/* Notes List */}
            {notes.length === 0 ? (
                <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Qui non c'è nulla…</p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                        {notes.map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="border border-gray-200 rounded-lg p-3 bg-white"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                            {note.text}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            {formatDate(note.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className={`p-1.5 rounded transition-colors cursor-pointer shrink-0 ${deleteConfirm === note.id
                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                                            }`}
                                        title={deleteConfirm === note.id ? 'Clicca di nuovo per confermare' : 'Elimina nota'}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {deleteConfirm === note.id && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Clicca di nuovo per confermare l'eliminazione
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Add Note Form */}
            <div className="border-t border-gray-100 pt-4">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Scrivi una nota..."
                    rows={4}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#72a333]/40 focus:border-[#72a333]/40 placeholder:text-gray-400"
                />
                <button
                    onClick={handleSave}
                    disabled={!newNote.trim()}
                    className="w-full mt-2 bg-[#72a333] hover:bg-[#638f2b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                    Salva
                </button>
            </div>
        </div>
    );
}
