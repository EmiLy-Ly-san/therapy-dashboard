/**
 * useTherapistItems.ts
 * --------------------
 * Récupère les contenus visibles par le thérapeute.
 *
 * IMPORTANT :
 * - On passe par item_shares (et revoked_at IS NULL)
 * - Donc on récupère UNIQUEMENT ce qui a été partagé
 *
 * Le hook gère aussi :
 * - filtre all/text/files
 * - thumbs pour les photos
 */

import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getSignedUrl } from '../lib/storageUrls';

export type TherapistFilterType = 'all' | 'text' | 'files';

type LoadReason = 'initial' | 'refresh';

function getTypeValue(item: any) {
  return String(item?.type || '');
}

async function buildThumbs(list: any[]) {
  const next: Record<string, string> = {};

  for (const it of list ?? []) {
    const typeValue = getTypeValue(it);
    if (typeValue !== 'photo') continue;

    const bucket = it?.storage_bucket ? String(it.storage_bucket) : '';
    const path = it?.storage_path ? String(it.storage_path) : '';
    if (!bucket || !path) continue;

    try {
      const signedUrl = await getSignedUrl(bucket, path);
      if (signedUrl) next[String(it.id)] = signedUrl;
    } catch (e) {
      console.log('thumb error', e);
    }
  }

  return next;
}

export function useTherapistItems(filterType: TherapistFilterType) {
  const [items, setItems] = useState<any[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const shouldShowLoader = isBusy && items.length === 0;

  const visibleItems = useMemo(() => {
    if (filterType === 'all') return items;

    if (filterType === 'text') {
      return items.filter((it) => getTypeValue(it) === 'text');
    }

    // files = tout sauf texte (photo + audio + video + file…)
    return items.filter((it) => getTypeValue(it) !== 'text');
  }, [items, filterType]);

  async function loadItems(reason: LoadReason) {
    setErrorMessage('');
    setIsBusy(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        setErrorMessage("Tu n'es pas connecté(e).");
        setIsBusy(false);
        return;
      }

      const therapistId = userData.user.id;

      // On récupère UNIQUEMENT les items partagés (via item_shares)
      // NB: la RLS limite déjà, mais là c’est “secure by design”
      const { data, error } = await supabase
        .from('item_shares')
        .select(
          `
          item:items (
            id, patient_id, type, title, text_content, created_at,
            storage_bucket, storage_path, mime_type
          )
        `,
        )
        .eq('therapist_id', therapistId)
        .is('revoked_at', null)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      const list = (data ?? []).map((r: any) => r.item).filter(Boolean);

      setItems(list);

      // thumbs (photos)
      const nextThumbs = await buildThumbs(list);
      setThumbUrls(nextThumbs);
    } catch (e: any) {
      console.log('LOAD THERAPIST ITEMS ERROR', e);
      setErrorMessage(e?.message ?? JSON.stringify(e));

      // si refresh échoue, on ne casse pas l’écran
      if (reason === 'initial') {
        setItems([]);
        setThumbUrls({});
      }
    } finally {
      setIsBusy(false);
    }
  }

  return {
    visibleItems,
    thumbUrls,
    errorMessage,
    isBusy,
    shouldShowLoader,
    loadItems,
  };
}
