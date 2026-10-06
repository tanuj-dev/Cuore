package com.cuore.call

import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.cuore.MainActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native support for CuoreCare calls:
 *   • Picture-in-Picture (keep the call visible while the user is in another app)
 *   • show-over-lock-screen for the incoming-call UI
 *   • the Android 14+ full-screen-intent permission check
 *
 * Everything is defensive: an unsupported OS version or a missing activity returns a
 * neutral value rather than throwing, so a call can never fail because of this module.
 */
class CuoreCallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        CallActivityState.module = this
    }

    override fun getName(): String = NAME

    override fun getConstants(): MutableMap<String, Any> =
        hashMapOf("pipSupported" to isPipSupported())

    private fun isPipSupported(): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            reactContext.packageManager.hasSystemFeature(
                PackageManager.FEATURE_PICTURE_IN_PICTURE
            )

    private fun mainActivity(): MainActivity? = reactContext.currentActivity as? MainActivity

    // ── Call lifecycle ──────────────────────────────────────────────────────

    /**
     * Tell the activity a call is (not) live. While true, pressing Home enters
     * Picture-in-Picture instead of backgrounding the call, and on Android 12+ the
     * activity auto-enters PiP.
     */
    @ReactMethod
    fun setCallActive(active: Boolean, mode: String) {
        CallActivityState.callActive = active
        CallActivityState.callMode = mode
        mainActivity()?.let { activity ->
            activity.runOnUiThread { activity.updatePictureInPictureParams() }
        }
    }

    @ReactMethod
    fun enterPictureInPicture(promise: Promise) {
        val activity = mainActivity()
        if (activity == null) {
            promise.resolve(false)
            return
        }
        activity.runOnUiThread { promise.resolve(activity.enterPictureInPictureIfPossible()) }
    }

    @ReactMethod
    fun isInPictureInPictureMode(promise: Promise) {
        val activity = mainActivity()
        promise.resolve(
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
                activity?.isInPictureInPictureMode == true
        )
    }

    // ── Lock screen ─────────────────────────────────────────────────────────

    /**
     * Let the incoming-call screen appear over the keyguard (and wake the display), the
     * way the system dialer does. Enabled only while a call is ringing — the rest of the
     * app must stay behind the lock screen.
     */
    @ReactMethod
    fun setShowWhenLocked(show: Boolean) {
        val activity = mainActivity() ?: return
        activity.runOnUiThread {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    activity.setShowWhenLocked(show)
                    activity.setTurnScreenOn(show)
                    if (show) {
                        val km =
                            activity.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
                        km?.requestDismissKeyguard(activity, null)
                    }
                } else {
                    @Suppress("DEPRECATION")
                    val flags =
                        android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                            android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                            android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    if (show) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
                }
            } catch (e: Exception) {
                // Never let a window-flag failure break a ringing call.
            }
        }
    }

    // ── Android 14+ full-screen intent permission ───────────────────────────

    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                promise.resolve(true) // granted at install time before Android 14
                return
            }
            val nm =
                reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            promise.resolve(nm.canUseFullScreenIntent())
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun openFullScreenIntentSettings() {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return
            val intent =
                Intent(
                    Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:" + reactContext.packageName)
                )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            // ignore — the notification still rings as a heads-up banner
        }
    }

    // ── Events ──────────────────────────────────────────────────────────────

    fun emitPipChanged(inPictureInPictureMode: Boolean) {
        try {
            val params = com.facebook.react.bridge.Arguments.createMap()
            params.putBoolean("isInPictureInPictureMode", inPictureInPictureMode)
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(PIP_EVENT, params)
        } catch (e: Exception) {
            // JS not ready — the state re-syncs when the activity resumes.
        }
    }

    // Required by NativeEventEmitter.
    @ReactMethod fun addListener(eventName: String) = Unit

    @ReactMethod fun removeListeners(count: Int) = Unit

    override fun invalidate() {
        if (CallActivityState.module === this) CallActivityState.module = null
        super.invalidate()
    }

    companion object {
        const val NAME = "CuoreCall"
        const val PIP_EVENT = "CuoreCallPipChanged"
    }
}
