/**
 * useDisplayName.ts
 * -----------------
 * Petit hook utilitaire pour récupérer le display_name depuis profiles.
 *
 * Options :
 * - firstNameOnly: si true, renvoie uniquement le premier mot (prénom)
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Options = {
  firstNameOnly?: boolean;
};

export function useDisplayName(options: Options = {}) {
  const { firstNameOnly = false } = options;

  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let canceled = false;

    async function load() {
      setErrorMessage('');
      setIsLoading(true);

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData?.user) {
          if (!canceled) setDisplayName('');
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userData.user.id)
          .maybeSingle();

        if (error) throw error;

        const raw = data?.display_name ? String(data.display_name).trim() : '';

        if (!canceled) {
          if (!raw) {
            setDisplayName('');
          } else if (firstNameOnly) {
            setDisplayName(raw.split(' ')[0]);
          } else {
            setDisplayName(raw);
          }
        }
      } catch (e: any) {
        if (!canceled) {
          setErrorMessage(e?.message ?? JSON.stringify(e));
          setDisplayName('');
        }
      } finally {
        if (!canceled) setIsLoading(false);
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, [firstNameOnly]);

  return { displayName, isLoading, errorMessage };
}
