/**
 * usePatientItem.ts
 * -----------------
 * Hook patient pour la page item/[id]
 *
 * Rôle :
 * - Charger l'item
 * - Préparer les champs (title/text) si type texte
 * - Sauvegarder un texte
 * - Supprimer un item (+ notes + fichier storage si présent)
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type UsePatientItemState = {
  item: any;

  typeValue: string;
  isText: boolean;
  isPhoto: boolean;

  titleValue: string;
  setTitleValue: (v: string) => void;

  textValue: string;
  setTextValue: (v: string) => void;

  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;

  errorMessage: string;

  reload: () => Promise<void>;
  saveText: () => Promise<boolean>;
  deleteItem: () => Promise<boolean>;
};

export function usePatientItem(itemId: string | null): UsePatientItemState {
  const [item, setItem] = useState<any>(null);

  const [titleValue, setTitleValue] = useState('');
  const [textValue, setTextValue] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const typeValue = String(item?.type || '');
  const isText = typeValue === 'text';
  const isPhoto = typeValue === 'photo';

  const reload = useCallback(async () => {
    setErrorMessage('');

    if (!itemId) {
      setErrorMessage("ID manquant (impossible d'ouvrir l'item).");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setItem(null);
      setIsLoading(false);
      return;
    }

    setItem(data);

    if (data?.type === 'text') {
      setTextValue(data.text_content || '');
      setTitleValue(data.title || '');
    } else {
      setTextValue('');
      setTitleValue('');
    }

    setIsLoading(false);
  }, [itemId]);

  const saveText = useCallback(async () => {
    if (!itemId) {
      setErrorMessage("ID manquant (impossible d'enregistrer).");
      return false;
    }

    if (!item || item.type !== 'text') {
      setErrorMessage("Cet item n'est pas un texte.");
      return false;
    }

    setIsSaving(true);
    setErrorMessage('');

    const cleanTitle = titleValue.trim();
    const cleanText = textValue.trim();

    if (cleanText.length === 0) {
      setIsSaving(false);
      setErrorMessage('Le texte ne peut pas être vide.');
      return false;
    }

    const { error } = await supabase
      .from('items')
      .update({
        title: cleanTitle.length > 0 ? cleanTitle : null,
        text_content: cleanText,
      })
      .eq('id', itemId);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return false;
    }

    return true;
  }, [itemId, item, titleValue, textValue]);

  const deleteItem = useCallback(async () => {
    if (!itemId || !item) return false;

    try {
      setIsDeleting(true);
      setErrorMessage('');

      // 1) supprimer les notes liées à cet item
      const { error: notesError } = await supabase
        .from('item_notes')
        .delete()
        .eq('item_id', itemId);

      if (notesError) throw notesError;

      // 2) supprimer le fichier storage s'il existe
      const bucket = item.storage_bucket ? String(item.storage_bucket) : '';
      const path = item.storage_path ? String(item.storage_path) : '';

      if (bucket && path) {
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (storageError) throw storageError;
      }

      // 3) supprimer l'item
      // (avec ON DELETE CASCADE côté DB, item_shares sera supprimé automatiquement)
      const { error: itemError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (itemError) throw itemError;

      return true;
    } catch (e: any) {
      console.log('DELETE ITEM ERROR', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [itemId, item]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    item,
    typeValue,
    isText,
    isPhoto,
    titleValue,
    setTitleValue,
    textValue,
    setTextValue,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    reload,
    saveText,
    deleteItem,
  };
}
