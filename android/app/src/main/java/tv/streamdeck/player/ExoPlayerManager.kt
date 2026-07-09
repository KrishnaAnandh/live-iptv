package tv.streamdeck.player

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import tv.streamdeck.data.Channel

sealed class PlaybackState {
    data object Idle : PlaybackState()
    data object Loading : PlaybackState()
    data object Ready : PlaybackState()
    data class Error(val message: String) : PlaybackState()
}

class ExoPlayerManager(context: Context) {
    val player: ExoPlayer = ExoPlayer.Builder(context).build()

    private val _playbackState = MutableStateFlow<PlaybackState>(PlaybackState.Idle)
    val playbackState: StateFlow<PlaybackState> = _playbackState.asStateFlow()

    private val listener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_BUFFERING -> _playbackState.value = PlaybackState.Loading
                Player.STATE_READY -> _playbackState.value = PlaybackState.Ready
                Player.STATE_IDLE -> if (_playbackState.value !is PlaybackState.Error) {
                    _playbackState.value = PlaybackState.Idle
                }
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            _playbackState.value = PlaybackState.Error("This stream is currently unavailable.")
        }
    }

    init {
        player.addListener(listener)
    }

    fun playChannel(channel: Channel) {
        _playbackState.value = PlaybackState.Loading
        player.setMediaItem(MediaItem.fromUri(channel.url))
        player.prepare()
        player.playWhenReady = true
    }

    fun togglePlayPause() {
        if (player.isPlaying) player.pause() else player.play()
    }

    fun release() {
        player.removeListener(listener)
        player.release()
    }
}
