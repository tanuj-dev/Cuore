package com.cuore.call

/**
 * Tiny process-wide bridge between the JS call state and MainActivity.
 *
 * MainActivity has to know whether a CuoreCare call is live at the exact moment the user
 * presses Home (`onUserLeaveHint`) — a moment where it cannot ask JavaScript. The call
 * manager pushes the flag down through CuoreCallModule.setCallActive() instead.
 */
object CallActivityState {
    @Volatile
    @JvmStatic
    var callActive: Boolean = false

    @Volatile
    @JvmStatic
    var callMode: String = "video"

    /** Set by the native module so the activity can emit PiP transitions back to JS. */
    @Volatile
    @JvmStatic
    var module: CuoreCallModule? = null

    @JvmStatic
    fun emitPipChanged(inPictureInPictureMode: Boolean) {
        module?.emitPipChanged(inPictureInPictureMode)
    }
}
