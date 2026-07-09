package tv.streamdeck.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tv.streamdeck.data.Channel
import tv.streamdeck.player.ExoPlayerManager
import tv.streamdeck.player.PlaybackState
import tv.streamdeck.ui.screens.OverlayState

class PlayerViewModel(
    application: Application,
    private val exoPlayerManager: ExoPlayerManager,
) : AndroidViewModel(application) {

    val player = exoPlayerManager.player
    val playbackState: StateFlow<PlaybackState> = exoPlayerManager.playbackState

    private val _showUi = MutableStateFlow(true)
    val showUi: StateFlow<Boolean> = _showUi.asStateFlow()

    private val _overlayState = MutableStateFlow(OverlayState.Hidden)
    val overlayState: StateFlow<OverlayState> = _overlayState.asStateFlow()

    private var uiHideJob: kotlinx.coroutines.Job? = null

    fun playChannel(channel: Channel) {
        exoPlayerManager.playChannel(channel)
        bringUpUi()
        setOverlayHidden()
    }

    fun togglePlayPause() {
        exoPlayerManager.togglePlayPause()
        bringUpUi()
    }

    fun bringUpUi() {
        _showUi.value = true
        uiHideJob?.cancel()
        uiHideJob = viewModelScope.launch {
            kotlinx.coroutines.delay(5000)
            if (_overlayState.value == OverlayState.Hidden) {
                _showUi.value = false
            }
        }
    }

    fun setOverlayState(state: OverlayState) {
        _overlayState.value = state
        if (state != OverlayState.Hidden) {
            _showUi.value = true
            uiHideJob?.cancel()
        } else {
            bringUpUi()
        }
    }

    fun setOverlayHidden() {
        setOverlayState(OverlayState.Hidden)
    }

    fun openQuickList() {
        setOverlayState(OverlayState.List)
    }

    fun openGrid() {
        setOverlayState(OverlayState.Grid)
    }

    override fun onCleared() {
        exoPlayerManager.release()
        super.onCleared()
    }
}
