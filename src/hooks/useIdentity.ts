import { useEffect, useState } from 'react';
import netlify from 'netlify-identity-widget';

type NUser = ReturnType<typeof netlify.currentUser>;

export function useIdentity() {
  const [user, setUser] = useState<NUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onInit = (u: NUser) => { setUser(u); setLoading(false); };
    const onLogin = (u: NonNullable<NUser>) => { setUser(u); netlify.close(); };
    const onLogout = () => setUser(null);

    netlify.on('init', onInit);
    netlify.on('login', onLogin);
    netlify.on('logout', onLogout);

    return () => {
      netlify.off('init', onInit);
      netlify.off('login', onLogin);
      netlify.off('logout', onLogout);
    };
  }, []);

  return {
    user,
    loading,
    openLogin: () => netlify.open(),
    logout: () => netlify.logout(),
  };
}
