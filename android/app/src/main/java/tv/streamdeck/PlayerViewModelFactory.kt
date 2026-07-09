package tv.streamdeck

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import tv.streamdeck.player.ExoPlayerManager
import tv.streamdeck.viewmodel.PlayerViewModel

class PlayerViewModelFactory(
    private val application: Application,
    private val exoPlayerManager: ExoPlayerManager,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(PlayerViewModel::class.java)) {
            return PlayerViewModel(application, exoPlayerManager) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
