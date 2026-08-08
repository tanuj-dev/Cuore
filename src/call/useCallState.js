import { useEffect, useState } from 'react';
import { getCallState, subscribeCallState } from './callState';

/** Subscribe a component to the app-wide call state. */
export function useCallState() {
  const [snapshot, setSnapshot] = useState(getCallState);
  useEffect(() => {
    // Re-read on mount in case the state changed between render and effect.
    setSnapshot(getCallState());
    return subscribeCallState(setSnapshot);
  }, []);
  return snapshot;
}

export default useCallState;
