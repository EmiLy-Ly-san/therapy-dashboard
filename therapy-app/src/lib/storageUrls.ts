/**
 * storageUrls.ts
 * ----------------
 * Petit helper pour Supabase Storage.
 *
 * Objectif :
 * - Générer une URL "signée" (temporaire) pour lire un fichier privé.
 * - Très pratique pour afficher une miniature (Image) ou ouvrir un PDF.
 *
 * Pourquoi une URL signée ?
 * - Le bucket n'est PAS public.
 * - Donc on ne peut pas accéder au fichier directement.
 * - Supabase génère une URL valable X minutes.
 */

import { supabase } from './supabase';

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number = 60 * 10, // 10 minutes
) {
  // 1) Demande à Supabase une URL temporaire pour CE fichier
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  // 2) Si erreur -> on "throw" pour que l'appelant puisse gérer
  if (error) throw error;

  // 3) Retourne l'URL (ou string vide si pas trouvé)
  return data?.signedUrl ?? '';
}
