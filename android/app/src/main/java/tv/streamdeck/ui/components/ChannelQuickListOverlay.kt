package tv.streamdeck.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import tv.streamdeck.R
import tv.streamdeck.data.Channel
import tv.streamdeck.ui.theme.MutedForeground

@Composable
fun ChannelQuickListOverlay(
    channels: List<Channel>,
    currentChannel: Channel,
    hasFavorites: Boolean,
    initialSelectedIndex: Int,
    onSelectChannel: (Channel) -> Unit,
    onOpenGrid: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var selectedListIndex by remember(channels, initialSelectedIndex) {
        val idx = channels.indexOfFirst { it.index == initialSelectedIndex }.coerceAtLeast(0)
        mutableIntStateOf(idx)
    }
    val listState = rememberLazyListState()
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(selectedListIndex) {
        if (channels.isNotEmpty()) {
            listState.animateScrollToItem(selectedListIndex.coerceIn(0, channels.lastIndex))
        }
    }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.3f), Color.Black),
                ),
            )
            .focusRequester(focusRequester)
            .focusable()
            .onPreviewKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                when (event.key) {
                    Key.DirectionLeft -> {
                        selectedListIndex = (selectedListIndex - 1).coerceAtLeast(0)
                        true
                    }
                    Key.DirectionRight -> {
                        selectedListIndex = (selectedListIndex + 1).coerceAtMost(channels.lastIndex)
                        true
                    }
                    Key.DirectionDown -> {
                        onOpenGrid()
                        true
                    }
                    Key.DirectionUp, Key.Back, Key.Escape -> {
                        onClose()
                        true
                    }
                    Key.Enter, Key.NumPadEnter, Key.DirectionCenter -> {
                        channels.getOrNull(selectedListIndex)?.let(onSelectChannel)
                        true
                    }
                    else -> false
                }
            },
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 8.dp, start = 8.dp),
            ) {
                if (hasFavorites) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.padding(end = 8.dp),
                    )
                    Text(
                        text = stringResource(R.string.favorites),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                    )
                } else {
                    Text(
                        text = stringResource(R.string.all_channels),
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                    )
                }
            }

            LazyRow(
                state = listState,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                itemsIndexed(channels, key = { _, ch -> ch.id }) { index, channel ->
                    ChannelCard(
                        channel = channel,
                        isSelected = index == selectedListIndex,
                        isCurrent = channel.index == currentChannel.index,
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = MutedForeground,
                    modifier = Modifier.padding(end = 4.dp),
                )
                Text(
                    text = stringResource(R.string.explore_channels),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MutedForeground,
                )
            }
        }
    }
}
