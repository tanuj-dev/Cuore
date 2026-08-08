package com.cuore

import android.app.PictureInPictureParams
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.util.Rational
import com.cuore.call.CallActivityState
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Cuore"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    // Keep latest launch intent so notification-open callbacks can read it with singleTask mode.
    setIntent(intent)
  }

  // ── CuoreCare: Picture-in-Picture ────────────────────────────────────────
  // While a consultation is live (CallActivityState.callActive, pushed from JS by the
  // call manager) leaving the app must NOT background the call: the activity slides into
  // a system PiP window so the video keeps playing over whatever the user does next.

  private fun pipSupported(): Boolean =
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
          packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

  private fun buildPipParams(): PictureInPictureParams {
    val builder = PictureInPictureParams.Builder().setAspectRatio(Rational(9, 16))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // Android 12+: the system moves us into PiP itself on Home/gesture-up, which is
      // seamless and avoids the "call frozen for a frame" flicker.
      builder.setAutoEnterEnabled(CallActivityState.callActive)
      builder.setSeamlessResizeEnabled(false)
    }
    return builder.build()
  }

  /** Called from the native module whenever the JS call state changes. */
  fun updatePictureInPictureParams() {
    if (!pipSupported()) return
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    try {
      setPictureInPictureParams(buildPipParams())
    } catch (e: Exception) {
      // Some OEMs reject PiP params outside the resumed state — harmless.
    }
  }

  fun enterPictureInPictureIfPossible(): Boolean {
    if (!pipSupported() || !CallActivityState.callActive) return false
    if (isInPictureInPictureMode) return true
    return try {
      enterPictureInPictureMode(buildPipParams())
    } catch (e: Exception) {
      false
    }
  }

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    // Pre-Android-12 has no auto-enter, so do it explicitly.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      enterPictureInPictureIfPossible()
    }
  }

  override fun onPictureInPictureModeChanged(
      isInPictureInPictureMode: Boolean,
      newConfig: Configuration
  ) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    CallActivityState.emitPipChanged(isInPictureInPictureMode)
  }
}
