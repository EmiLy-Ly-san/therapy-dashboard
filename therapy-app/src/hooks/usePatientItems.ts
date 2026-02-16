/**
 * Hook qui gère toute la logique "data" de la page Library
 *
 * Objectif :
 * - Charger les items du patient
 * - Générer les miniatures pour les photos (signed url)
 * - Gérer les loaders (initial / refresh)
 * - Exposer une fonction refresh() simple
 *
 * Comme ça :
 * - library.tsx reste petit et lisible
 * - la logique Supabase est ici
 */

import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getSignedUrl } from '../lib/storageUrls';

export type FilterType = 'all' | 'text' | 'files';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MIN_LOADER_MS = 500;

export function usePatientItems(filterType: FilterType) {
  // Liste complète des items
  const [items, setItems] = useState<any[]>([]);

  // Miniatures : { [itemId]: signedUrl }
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  // Erreur affichée à l'utilisateur
  const [errorMessage, setErrorMessage] = useState('');

  // Gestion loaders
  const [isLoading, setIsLoading] = useState(true); // premier chargement
  const [isRefreshing, setIsRefreshing] = useState(false); // bouton refresh
  const [showLoader, setShowLoader] = useState(true); // loader min 500ms

  /**
   * Génère les miniatures pour les items de type "photo".
   * On crée une signedUrl pour chaque photo.
   */
  async function buildThumbs(list: any[]) {
    const next: Record<string, string> = {};

    for (const it of list) {
      const typeValue = String(it.type || '');
      if (typeValue !== 'photo') continue;

      const bucket = it.storage_bucket ? String(it.storage_bucket) : '';
      const path = it.storage_path ? String(it.storage_path) : '';
      if (!bucket || !path) continue;

      try {
        // URL temporaire (10 min)
        const url = await getSignedUrl(bucket, path, 60 * 10);
        if (url) next[String(it.id)] = url;
      } catch (e) {
        // Si une miniature échoue, on ignore : la liste marche quand même
        console.log('thumb error', e);
      }
    }

    setThumbUrls(next);
  }

  /**
   * Charge les items du patient depuis Supabase.
   * reason = initial (page load) ou refresh (bouton).
   */
  async function loadItems(reason: 'initial' | 'refresh' = 'refresh') {
    setErrorMessage('');

    // 1) Loader selon la raison
    if (reason === 'initial') setIsLoading(true);
    else setIsRefreshing(true);

    setShowLoader(true);
    const startTime = Date.now();

    // 2) Récupère l'utilisateur connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      // On force un minimum de durée de loader (pour un effet plus doux)
      const elapsed = Date.now() - startTime;
      await wait(Math.max(0, MIN_LOADER_MS - elapsed));

      setIsLoading(false);
      setIsRefreshing(false);
      setShowLoader(false);
      setErrorMessage("Tu n'es pas connecté(e).");
      return;
    }

    const userId = userData.user.id;

    // 3) Requête Supabase : on récupère les champs utiles
    const { data, error } = await supabase
      .from('items')
      .select(
        'id, type, title, text_content, created_at, storage_bucket, storage_path, mime_type',
      )
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });

    // 4) Loader min 500ms
    const elapsed = Date.now() - startTime;
    await wait(Math.max(0, MIN_LOADER_MS - elapsed));

    // 5) Stop loader
    setIsLoading(false);
    setIsRefreshing(false);
    setShowLoader(false);

    // 6) Erreur éventuelle
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    // 7) Stocke la liste
    const list = data || [];
    setItems(list);

    // 8) Génère miniatures (photos) en arrière-plan (mais ici on await pour simplicité)
    await buildThumbs(list);
  }

  // items filtrés selon le filtre UI
  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const typeValue = String(item.type || '');
      if (filterType === 'all') return true;
      if (filterType === 'text') return typeValue === 'text';
      return typeValue !== 'text';
    });
  }, [items, filterType]);

  // “busy” = loader en cours
  const isBusy = isLoading || isRefreshing;

  // on affiche le loader uniquement s’il est actif et qu’on est busy
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
