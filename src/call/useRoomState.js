import { useEffect, useState } from 'react';
import { getRoomSnapshot, subscribeRoom } from './zegoRoom';

/**
 * The live room, as React state. The room itself lives in module state
 * (zegoRoom.js) so it survives every screen; this is only a window onto it.
 */
export function useRoomState() {
  const [state, setState] = useState(getRoomSnapshot);
  useEffect(() => subscribeRoom(setState), []);
  return state;
}

export default useRoomState;
