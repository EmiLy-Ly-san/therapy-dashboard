import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function AppEntryPoint() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    async function chooseWhereToGo() {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult.data.session;

      if (!session) {
        setRedirectTo('/(public)/login');
        return;
      }

      const userEmail = (session.user.email ?? '').toLowerCase();

      const userLooksLikeTherapist =
        userEmail.includes('therapist') || userEmail.includes('psy');

      if (userLooksLikeTherapist) {
        setRedirectTo('/(therapist)/dashboard');
      } else {
        setRedirectTo('/(patient)/dashboard');
      }
    }

    chooseWhereToGo();
  }, []);

  if (!redirectTo) return null;

  // Ici on force le type pour ne pas bloquer
  return <Redirect href={redirectTo as any} />;
}
