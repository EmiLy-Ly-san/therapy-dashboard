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

  // Ajout : partage (status seulement dans la liste)
  const [therapistId, setTherapistId] = useState<string | null>(null);

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

  // Ajout : récupère le therapist_id lié au patient (si existe)
  async function fetchTherapistIdForPatient(patientId: string) {
    const { data, error } = await supabase
      .from('therapist_patients')
      .select('therapist_id')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const tid = data?.therapist_id ? String(data.therapist_id) : null;
    setTherapistId(tid);
    return tid;
  }

  // Ajout : calcule "partagé ou non" à partir des item_shares (si on a therapist_id)
  function computeIsShared(item: any, tid: string | null) {
    if (!tid) return false;
    const shares = item?.item_shares;
    if (!Array.isArray(shares)) return false;

    return shares.some(
      (s: any) => String(s.therapist_id) === tid && s.revoked_at == null,
    );
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

    // Ajout : récupère therapist_id si pas déjà connu (non bloquant)
    try {
      if (!therapistId) await fetchTherapistIdForPatient(userId);
    } catch (e) {
      console.log('fetch therapist id error', e);
      // On continue quand même : la liste marche sans statut de partage
    }

    // 3) Requête Supabase : on récupère les champs utiles
    // + Ajout : item_shares (pour calculer le status Privé/Partagé en liste)
    const { data, error } = await supabase
      .from('items')
      .select(
        `
        id, type, title, text_content, created_at, storage_bucket, storage_path, mime_type,
        item_shares (
          therapist_id,
          revoked_at
        )
      `,
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

  // Ajout : Map { [itemId]: boolean } pour afficher Privé/Partagé dans la liste
  const sharedByItemId = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const it of items) {
      map[String(it.id)] = computeIsShared(it, therapistId);
    }
    return map;
  }, [items, therapistId]);

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

    // Ajout : status Privé/Partagé
    therapistId,
    sharedByItemId,
  };
}
