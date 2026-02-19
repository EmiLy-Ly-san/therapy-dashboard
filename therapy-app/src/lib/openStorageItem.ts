/**
 * openStorageItem.ts
 * -------------------
 * Helper commun pour :
 * - Récupérer une signed URL
 * - Ouvrir le fichier dans le navigateur
 *
 * Utilisé par :
 * - PatientLibraryPage
 * - TherapistLibraryPage
 * - TherapistPatientLibraryPage
 */

import { Linking } from 'react-native';
import { getSignedUrl } from './storageUrls';

export async function openStorageItem(item: any) {
  const bucket = item?.storage_bucket ? String(item.storage_bucket) : '';

  const path = item?.storage_path ? String(item.storage_path) : '';

  if (!bucket || !path) return;

  try {
    const signedUrl = await getSignedUrl(bucket, path);
    if (signedUrl) {
      await Linking.openURL(signedUrl);
    }
  } catch (e) {
    console.log('openStorageItem error', e);
  }
}
