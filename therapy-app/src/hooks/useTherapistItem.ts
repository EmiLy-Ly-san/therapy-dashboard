/**
 * useTherapistItem.ts
 * -------------------
 * Hook therapist pour la page item/[id]
 *
 * Rôle :
 * - Charger l'item (lecture seule)
 * - Laisser la RLS faire la sécurité : le therapist ne lit que les items partagés
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type UseTherapistItemState = {
  item: any;
  typeValue: string;
  isText: boolean;
  isPhoto: boolean;
  isLoading: boolean;
  errorMessage: string;
  reload: () => Promise<void>;
};

export function useTherapistItem(itemId: string | null): UseTherapistItemState {
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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

    // RLS : le therapist ne peut lire que les items partagés
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
    setIsLoading(false);
  }, [itemId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    item,
    typeValue,
    isText,
    isPhoto,
    isLoading,
    errorMessage,
    reload,
  };
}
