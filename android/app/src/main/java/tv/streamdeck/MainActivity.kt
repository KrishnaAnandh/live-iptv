package tv.streamdeck

import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import tv.streamdeck.data.ChannelLoadState
import tv.streamdeck.player.ExoPlayerManager
import tv.streamdeck.ui.screens.BootstrapScreen
import tv.streamdeck.ui.screens.PlayerScreen
import tv.streamdeck.ui.theme.StreamDeckTheme
import tv.streamdeck.viewmodel.AppViewModel
import tv.streamdeck.viewmodel.PlayerViewModel

class MainActivity : ComponentActivity() {
    private var appViewModel: AppViewModel? = null
    private var playerViewModel: PlayerViewModel? = null

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            val delta = when (event.keyCode) {
                KeyEvent.KEYCODE_CHANNEL_UP -> 1
                KeyEvent.KEYCODE_CHANNEL_DOWN -> -1
                else -> null
            }
            if (delta != null && appViewModel?.channelState?.value is ChannelLoadState.Success) {
                appViewModel?.changeChannel(delta)
                playerViewModel?.bringUpUi()
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val exoPlayerManager = ExoPlayerManager(applicationContext)

        setContent {
            StreamDeckTheme {
                val appViewModel: AppViewModel = viewModel()
                val playerViewModel: PlayerViewModel = viewModel(
                    factory = PlayerViewModelFactory(application, exoPlayerManager),
                )

                val channelState by appViewModel.channelState.collectAsStateWithLifecycle()
                val currentChannelIndex by appViewModel.currentChannelIndex.collectAsStateWithLifecycle()
                val favorites by appViewModel.favorites.collectAsStateWithLifecycle()

                SideEffect {
                    this@MainActivity.appViewModel = appViewModel
                    this@MainActivity.playerViewModel = playerViewModel
                }

                when (val state = channelState) {
                    is ChannelLoadState.Loading,
                    is ChannelLoadState.Error,
                    -> {
                        BootstrapScreen(
                            channelState = state,
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                    is ChannelLoadState.Success -> {
                        val channels = state.channels
                        val currentChannel = channels.find { it.index == currentChannelIndex }
                            ?: channels.first()

                        PlayerScreen(
                            channels = channels,
                            currentChannel = currentChannel,
                            favoriteIds = favorites,
                            playerViewModel = playerViewModel,
                            onChannelChange = { index ->
                                appViewModel.setCurrentChannelIndex(index)
                            },
                            onToggleFavorite = { channelId ->
                                appViewModel.toggleFavorite(channelId)
                            },
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                }
            }
        }
    }
}
