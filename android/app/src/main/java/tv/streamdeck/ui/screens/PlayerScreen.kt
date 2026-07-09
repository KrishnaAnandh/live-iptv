package tv.streamdeck.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.ui.PlayerView
import tv.streamdeck.R
import tv.streamdeck.data.Channel
import tv.streamdeck.player.PlaybackState
import tv.streamdeck.ui.components.ChannelGridOverlay
import tv.streamdeck.ui.components.ChannelQuickListOverlay
import tv.streamdeck.ui.theme.AccentTeal
import tv.streamdeck.ui.theme.MutedForeground
import tv.streamdeck.viewmodel.PlayerViewModel

@Composable
fun PlayerScreen(
    channels: List<Channel>,
    currentChannel: Channel,
    favoriteIds: List<String>,
    playerViewModel: PlayerViewModel,
    onChannelChange: (Int) -> Unit,
    onToggleFavorite: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val showUi by playerViewModel.showUi.collectAsStateWithLifecycle()
    val overlayState by playerViewModel.overlayState.collectAsStateWithLifecycle()
    val playbackState by playerViewModel.playbackState.collectAsStateWithLifecycle()
    val focusRequester = remember { FocusRequester() }
    val favoriteFocusRequester = remember { FocusRequester() }
    var pendingFavoriteFocus by remember { mutableStateOf(false) }

    val favoriteChannels = remember(channels, favoriteIds) {
        val favMap = channels.associateBy { it.id }
        favoriteIds.mapNotNull { favMap[it] }
    }

    val quickAccessChannels = remember(channels, favoriteChannels) {
        if (favoriteChannels.isNotEmpty()) favoriteChannels else channels.take(20)
    }

    val favoriteSet = remember(favoriteIds) { favoriteIds.toSet() }
    val favoriteItems = remember(favoriteChannels, favoriteSet, favoriteIds) {
        if (favoriteChannels.isNotEmpty()) favoriteChannels
        else channels.filter { favoriteSet.contains(it.id) }
    }
    val nonFavoriteItems = remember(channels, favoriteSet) {
        channels.filter { !favoriteSet.contains(it.id) }
    }

    LaunchedEffect(currentChannel) {
        playerViewModel.playChannel(currentChannel)
    }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(showUi, pendingFavoriteFocus) {
        if (showUi && pendingFavoriteFocus) {
            favoriteFocusRequester.requestFocus()
            pendingFavoriteFocus = false
        }
    }

    fun navigateChannel(delta: Int) {
        val newIndex = (currentChannel.index + delta).coerceIn(0, channels.lastIndex)
        onChannelChange(newIndex)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .focusRequester(focusRequester)
            .focusable()
            .onKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onKeyEvent false
                if (overlayState != OverlayState.Hidden) return@onKeyEvent false

                playerViewModel.bringUpUi()

                when {
                    event.key == Key.DirectionUp -> {
                        pendingFavoriteFocus = true
                        true
                    }
                    event.key == Key.DirectionDown -> {
                        playerViewModel.openQuickList()
                        true
                    }
                    event.key == Key.DirectionLeft || event.key == Key.MediaPrevious -> {
                        navigateChannel(-1)
                        true
                    }
                    event.key == Key.DirectionRight || event.key == Key.MediaNext -> {
                        navigateChannel(1)
                        true
                    }
                    event.key == Key.Spacebar || event.key == Key.MediaPlayPause -> {
                        playerViewModel.togglePlayPause()
                        true
                    }
                    else -> false
                }
            },
    ) {
        AndroidView(
            factory = { context ->
                PlayerView(context).apply {
                    useController = false
                    player = playerViewModel.player
                }
            },
            update = { view ->
                view.player = playerViewModel.player
            },
            modifier = Modifier.fillMaxSize(),
        )

        AnimatedVisibility(
            visible = showUi,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Black.copy(alpha = 0.4f), Color.Transparent),
                                startY = 0f,
                                endY = 200f,
                            ),
                        ),
                )
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f)),
                                startY = Float.POSITIVE_INFINITY,
                                endY = Float.POSITIVE_INFINITY - 400f,
                            ),
                        ),
                )

                Column(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(24.dp),
                ) {
                    Text(
                        text = currentChannel.name,
                        style = MaterialTheme.typography.displayMedium,
                        color = Color.White,
                    )
                    Text(
                        text = currentChannel.group,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MutedForeground,
                    )
                }

                IconButton(
                    onClick = {
                        onToggleFavorite(currentChannel.id)
                        playerViewModel.bringUpUi()
                    },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(24.dp)
                        .focusRequester(favoriteFocusRequester)
                        .focusable()
                        .onKeyEvent { event ->
                            if (event.type != KeyEventType.KeyDown) return@onKeyEvent false
                            when (event.key) {
                                Key.Enter, Key.NumPadEnter, Key.DirectionCenter -> {
                                    onToggleFavorite(currentChannel.id)
                                    playerViewModel.bringUpUi()
                                    true
                                }
                                Key.DirectionDown, Key.Back, Key.Escape -> {
                                    focusRequester.requestFocus()
                                    true
                                }
                                else -> false
                            }
                        },
                ) {
                    val isFav = favoriteIds.contains(currentChannel.id)
                    Icon(
                        imageVector = if (isFav) Icons.Filled.Star else Icons.Outlined.Star,
                        contentDescription = stringResource(
                            if (isFav) R.string.remove_favorite else R.string.add_favorite,
                        ),
                        tint = if (isFav) AccentTeal else Color.White,
                        modifier = Modifier.padding(8.dp),
                    )
                }
            }
        }

        if (playbackState is PlaybackState.Loading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = AccentTeal)
            }
        }

        if (playbackState is PlaybackState.Error) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(bottom = 16.dp),
                    )
                    Text(
                        text = stringResource(R.string.stream_unavailable),
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                    )
                }
            }
        }

        when (overlayState) {
            OverlayState.List -> {
                ChannelQuickListOverlay(
                    channels = quickAccessChannels,
                    currentChannel = currentChannel,
                    hasFavorites = favoriteChannels.isNotEmpty(),
                    initialSelectedIndex = currentChannel.index,
                    onSelectChannel = { channel ->
                        onChannelChange(channel.index)
                        playerViewModel.setOverlayHidden()
                    },
                    onOpenGrid = { playerViewModel.openGrid() },
                    onClose = { playerViewModel.setOverlayHidden() },
                )
            }
            OverlayState.Grid -> {
                ChannelGridOverlay(
                    favoriteItems = favoriteItems,
                    nonFavoriteItems = nonFavoriteItems,
                    currentChannel = currentChannel,
                    initialSelectedIndex = currentChannel.index,
                    onSelectChannel = { channel ->
                        onChannelChange(channel.index)
                        playerViewModel.setOverlayHidden()
                    },
                    onClose = { playerViewModel.setOverlayHidden() },
                )
            }
            OverlayState.Hidden -> Unit
        }
    }
}
