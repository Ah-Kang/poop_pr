import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEconomyClient, ECONOMY_EVENT, GUEST_ECONOMY_KEY, economyErrorMessage } from './client.js';

export function useEconomy({ authUser, isAuthLoading, isSaveLoaded }) {
  const owner = isAuthLoading ? null : authUser?.id || 'guest';
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const client = useMemo(() => createEconomyClient({ userId: authUser?.id || null }), [authUser?.id]);
  const ready = Boolean(owner && isSaveLoaded);
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    if (!ready || busy.current) return;
    const version = ++requestVersion.current;
    try {
      const snapshot = await client.load();
      if (ownerRef.current !== owner || version !== requestVersion.current) return;
      setRecord({ owner, ...snapshot });
      setError('');
    } catch (failure) {
      if (ownerRef.current === owner && version === requestVersion.current) setError(economyErrorMessage(failure.message));
    }
  }, [client, owner, ready]);
  useEffect(() => {
    setError('');
    refresh();
    const sync = (event) => {
      if (event.type === 'storage' && event.key !== GUEST_ECONOMY_KEY) return;
      refresh();
    };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener(ECONOMY_EVENT, sync);
    const interval = setInterval(refresh, 60000); // Refresh Korea midnight and other devices.
    return () => {
      requestVersion.current++;
      clearInterval(interval);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener(ECONOMY_EVENT, sync);
    };
  }, [refresh]);
  const act = async (action) => {
    if (busy.current || !ready) return null;
    busy.current = true;
    requestVersion.current++;
    setPending(true);
    setError('');
    try {
      const snapshot = await client.act(action);
      if (ownerRef.current !== owner) return null;
      setRecord({ owner, ...snapshot });
      return snapshot;
    } catch (failure) {
      if (ownerRef.current === owner) setError(economyErrorMessage(failure.message));
      return null;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { ...(record?.owner === owner ? record : {}), error, pending, act, refresh, isGuest: owner === 'guest' };
}
