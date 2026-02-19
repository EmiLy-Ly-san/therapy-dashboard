/**
 * useItemShare.ts
 * ----------------
 * Hook "patient side" :
 * - Gère le partage d'un item vers le thérapeute actif
 * - Lit therapist_id actif via therapist_patients
 * - Lit l'état du partage via item_shares
 * - Active/Désactive le partage
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ShareState = {
  therapistId: string | null;
  isShared: boolean;
  isTogglingShare: boolean;
  errorMessage: string;
  refresh: () => Promise<void>;
  setShareEnabled: (enabled: boolean) => Promise<void>;
};

export function useItemShare(itemId: string | null | undefined): ShareState {
  // Ajout : toggle Partager avec le thérapeute
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [isTogglingShare, setIsTogglingShare] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ajout : récupère therapist_id actif
  const fetchTherapistId = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return null;

    const userId = userData.user.id;

    const { data, error } = await supabase
      .from('therapist_patients')
      .select('therapist_id')
      .eq('patient_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.therapist_id ? String(data.therapist_id) : null;
  }, []);

  const refreshShareState = useCallback(
    async (tid: string | null) => {
      if (!itemId) return;

      if (!tid) {
        setIsShared(false);
        return;
      }

      const { data, error } = await supabase
        .from('item_shares')
        .select('id')
        .eq('item_id', String(itemId))
        .eq('therapist_id', tid)
        .is('revoked_at', null)
        .limit(1);

      if (error) throw error;
      setIsShared((data ?? []).length > 0);
    },
    [itemId],
  );

  const refresh = useCallback(async () => {
    setErrorMessage('');

    if (!itemId) return;

    try {
      const tid = await fetchTherapistId();
      setTherapistId(tid);
      await refreshShareState(tid);
    } catch (e: any) {
      console.log('share state load error', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));
    }
  }, [fetchTherapistId, refreshShareState, itemId]);

  // Ajout : applique la valeur du toggle
  const setShareEnabled = useCallback(
    async (enabled: boolean) => {
      if (!itemId) return;

      setIsTogglingShare(true);
      setErrorMessage('');

      try {
        let tid = therapistId;
        if (!tid) {
          tid = await fetchTherapistId();
          setTherapistId(tid);
        }

        if (!tid) {
          setErrorMessage("Aucun thérapeute actif n'est lié à ce patient.");
          // On remet l’état UI cohérent
          setIsShared(false);
          return;
        }

        if (enabled) {
          const { error } = await supabase.from('item_shares').upsert(
            {
              item_id: String(itemId),
              therapist_id: tid,
              shared_at: new Date().toISOString(),
              revoked_at: null,
            },
            { onConflict: 'item_id,therapist_id' },
          );

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('item_shares')
            .update({ revoked_at: new Date().toISOString() })
            .eq('item_id', String(itemId))
            .eq('therapist_id', tid)
            .is('revoked_at', null);

          if (error) throw error;
        }

        await refreshShareState(tid);
      } catch (e: any) {
        console.log('TOGGLE SHARE DETAIL ERROR', e);
        setErrorMessage(e?.message ?? JSON.stringify(e));
      } finally {
        setIsTogglingShare(false);
      }
    },
    [itemId, therapistId, fetchTherapistId, refreshShareState],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    therapistId,
    isShared,
    isTogglingShare,
    errorMessage,
    refresh,
    setShareEnabled,
  };
}
