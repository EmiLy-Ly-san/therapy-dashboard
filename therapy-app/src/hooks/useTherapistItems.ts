/**
 * Hook data pour la bibliothèque therapist
 *
 * Objectif :
 * - Charger les items visibles par le therapist
 *   (grâce à la RLS : uniquement ceux partagés)
 * - Générer les miniatures pour les photos (signed url)
 * - Gérer les loaders (initial / refresh)
 */

import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getSignedUrl } from '../lib/storageUrls';

export type TherapistFilterType = 'all' | 'text' | 'files';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MIN_LOADER_MS = 500;

export function useTherapistItems(filterType: TherapistFilterType) {
  const [items, setItems] = useState<any[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  async function buildThumbs(list: any[]) {
    const next: Record<string, string> = {};

    for (const it of list) {
      const typeValue = String(it.type || '');
      if (typeValue !== 'photo') continue;

      const bucket = it.storage_bucket ? String(it.storage_bucket) : '';
      const path = it.storage_path ? String(it.storage_path) : '';
      if (!bucket || !path) continue;

      try {
        const url = await getSignedUrl(bucket, path, 60 * 10);
        if (url) next[String(it.id)] = url;
      } catch (e) {
        console.log('thumb error', e);
      }
    }

    setThumbUrls(next);
  }

  async function loadItems(reason: 'initial' | 'refresh' = 'refresh') {
    setErrorMessage('');

    if (reason === 'initial') setIsLoading(true);
    else setIsRefreshing(true);

    setShowLoader(true);
    const startTime = Date.now();

    // ⚠️ Important : côté therapist, on ne filtre pas par patient_id.
    // On fait juste from('items') et la RLS fait le tri (items partagés seulement).
    const { data, error } = await supabase
      .from('items')
      .select(
        'id, type, title, text_content, created_at, storage_bucket, storage_path, mime_type, patient_id',
      )
      .order('created_at', { ascending: false });

    const elapsed = Date.now() - startTime;
    await wait(Math.max(0, MIN_LOADER_MS - elapsed));

    setIsLoading(false);
    setIsRefreshing(false);
    setShowLoader(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const list = data || [];
    setItems(list);

    await buildThumbs(list);
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const typeValue = String(item.type || '');
      if (filterType === 'all') return true;
      if (filterType === 'text') return typeValue === 'text';
      return typeValue !== 'text';
    });
  }, [items, filterType]);

  const isBusy = isLoading || isRefreshing;
  const shouldShowLoader = showLoader && isBusy;

  return {
    items,
    visibleItems,
    thumbUrls,
    errorMessage,
    isLoading,
    isRefreshing,
    isBusy,
    shouldShowLoader,
    loadItems,
  };
}
