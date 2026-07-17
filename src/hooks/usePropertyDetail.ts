import { useState, useEffect, useCallback } from 'react';
import { addPropertyNote, deletePropertyNote, getPropertyById, updatePropertyVisibility } from '../db/propertyRepository';
import { subscribeJsonDb } from '../db/jsonDb';
import type { PropertyDetail, Note } from '../types/propertyDetail';

export function usePropertyDetail(id: string | undefined) {
    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);

    const loadProperty = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!id) {
            setError('ID Unità non fornito');
            setProperty(null);
            setNotes([]);
            setLoading(false);
            return;
        }

        const detail = getPropertyById(id);
        if (!detail) {
            setError(`Unità con ID "${id}" non trovata.`);
            setProperty(null);
            setNotes([]);
            setLoading(false);
            return;
        }

        setProperty(detail);
        setNotes(detail.notes);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        loadProperty();
        return subscribeJsonDb(loadProperty);
    }, [loadProperty]);

    const handleAddNote = useCallback((text: string) => {
        if (!id) return;
        const newNote: Note = addPropertyNote(id, text);
        setNotes((prev) => [newNote, ...prev]);
    }, [id]);

    const handleDeleteNote = useCallback((noteId: string) => {
        if (id) deletePropertyNote(id, noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }, [id]);

    const handleVisibilityChange = useCallback((field: 'isPublic' | 'addressPublic' | 'phonePublic', value: boolean) => {
        if (id) updatePropertyVisibility(id, field, value);
        setProperty((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                visibility: { ...prev.visibility, [field]: value },
            };
        });
    }, [id]);

    return {
        property,
        loading,
        error,
        notes,
        handleAddNote,
        handleDeleteNote,
        handleVisibilityChange,
    };
}
