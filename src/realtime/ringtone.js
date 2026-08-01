// CuoreCare incoming-call ringtone (patient app).
//
// Two layers, so ringing NEVER depends on native asset wiring:
//   1. Vibration — always available, no asset, no linking. This is the guaranteed ring.
//   2. Audio (react-native-sound, already a dependency) — plays a looping ring tone from the
//      bundled `cuorecare_ring.wav`. On Android the file lives in res/raw; on iOS it must be
//      added to the Xcode target's "Copy Bundle Resources" (staged at ios/Cuore/). If it
//      isn't bundled, the load callback errors and we silently fall back to vibration only.
import { Vibration } from 'react-native';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

// vibrate 1s, pause 1s, repeat — matches the audio ring cadence.
const VIBRATION_PATTERN = [0, 1000, 1000];

let ring = null;
let active = false;

export function startRing() {
  active = true;
  try {
    Vibration.vibrate(VIBRATION_PATTERN, true);
  } catch (e) {
    /* ignore */
  }
  try {
    const snd = new Sound('cuorecare_ring.wav', Sound.MAIN_BUNDLE, err => {
      // If the ring was stopped before the async load finished, or the asset is missing,
      // release immediately and leave vibration as the ring.
      if (err || !active) {
        try {
          snd.release();
        } catch (_) {}
        return;
      }
      ring = snd;
      snd.setNumberOfLoops(-1);
      snd.play();
    });
  } catch (e) {
    /* ignore — vibration still rings */
  }
}

export function stopRing() {
  active = false;
  try {
    Vibration.cancel();
  } catch (e) {
    /* ignore */
  }
  if (ring) {
    try {
      ring.stop();
      ring.release();
    } catch (e) {
      /* ignore */
    }
    ring = null;
  }
}
