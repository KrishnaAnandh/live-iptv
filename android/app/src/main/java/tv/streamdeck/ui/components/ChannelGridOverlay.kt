package tv.streamdeck.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import tv.streamdeck.R
import tv.streamdeck.data.Channel
import tv.streamdeck.ui.theme.AccentTeal
import tv.streamdeck.ui.theme.PrimarySlate

@Composable
fun ChannelGridOverlay(
    favoriteItems: List<Channel>,
    nonFavoriteItems: List<Channel>,
    currentChannel: Channel,
    initialSelectedIndex: Int,
    onSelectChannel: (Channel) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val allItems = remember(favoriteItems, nonFavoriteItems) {
        favoriteItems + nonFavoriteItems
    }
    var searchTerm by remember { mutableStateOf("") }
    val filteredItems = remember(allItems, searchTerm) {
        if (searchTerm.isBlank()) allItems
        else allItems.filter { it.name.contains(searchTerm, ignoreCase = true) }
    }

    var selectedGridIndex by remember(filteredItems, initialSelectedIndex) {
        val idx = filteredItems.indexOfFirst { it.index == initialSelectedIndex }.coerceAtLeast(0)
        mutableIntStateOf(idx)
    }

    val gridState = rememberLazyGridState()
    val focusRequester = remember { FocusRequester() }
    val searchFocusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current
    var isSearchFocused by remember { mutableStateOf(false) }
    val columns = 6

    LaunchedEffect(selectedGridIndex, filteredItems) {
        if (filteredItems.isNotEmpty()) {
            val safeIndex = selectedGridIndex.coerceIn(0, filteredItems.lastIndex)
            gridState.animateScrollToItem(safeIndex)
        }
    }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(isSearchFocused) {
        if (isSearchFocused) {
            keyboardController?.show()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f))
            .focusRequester(focusRequester)
            .focusable()
            .onPreviewKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false

                if (isSearchFocused) {
                    return@onPreviewKeyEvent when (event.key) {
                        Key.DirectionDown -> {
                            focusRequester.requestFocus()
                            keyboardController?.hide()
                            true
                        }
                        Key.Back, Key.Escape -> {
                            focusRequester.requestFocus()
                            keyboardController?.hide()
                            true
                        }
                        else -> false
                    }
                }

                if (filteredItems.isEmpty()) {
                    return@onPreviewKeyEvent when (event.key) {
                        Key.DirectionUp -> {
                            searchFocusRequester.requestFocus()
                            true
                        }
                        Key.Back, Key.Escape -> {
                            onClose()
                            true
                        }
                        else -> false
                    }
                }

                when (event.key) {
                    Key.DirectionUp -> {
                        if (selectedGridIndex < columns) {
                            searchFocusRequester.requestFocus()
                        } else {
                            selectedGridIndex = (selectedGridIndex - columns).coerceAtLeast(0)
                        }
                        true
                    }
                    Key.DirectionDown -> {
                        selectedGridIndex = (selectedGridIndex + columns).coerceAtMost(filteredItems.lastIndex)
                        true
                    }
                    Key.DirectionLeft -> {
                        selectedGridIndex = (selectedGridIndex - 1).coerceAtLeast(0)
                        true
                    }
                    Key.DirectionRight -> {
                        selectedGridIndex = (selectedGridIndex + 1).coerceAtMost(filteredItems.lastIndex)
                        true
                    }
                    Key.Back, Key.Escape -> {
                        onClose()
                        true
                    }
                    Key.Enter, Key.NumPadEnter, Key.DirectionCenter -> {
                        filteredItems.getOrNull(selectedGridIndex)?.let(onSelectChannel)
                        true
                    }
                    else -> false
                }
            },
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
            ) {
                IconButton(onClick = onClose, modifier = Modifier.align(Alignment.CenterVertically)) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.White,
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 32.dp)
                        .background(PrimarySlate.copy(alpha = 0.5f), MaterialTheme.shapes.medium)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                ) {
                    BasicTextField(
                        value = searchTerm,
                        onValueChange = {
                            searchTerm = it
                            selectedGridIndex = 0
                        },
                        textStyle = MaterialTheme.typography.bodyLarge.copy(color = Color.White),
                        cursorBrush = SolidColor(AccentTeal),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(searchFocusRequester)
                            .onFocusChanged { isSearchFocused = it.isFocused },
                        decorationBox = { inner ->
                            if (searchTerm.isEmpty()) {
                                Text(
                                    text = stringResource(R.string.search_channels),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = Color.Gray,
                                )
                            }
                            inner()
                        },
                    )
                }
            }

            LazyVerticalGrid(
                columns = GridCells.Fixed(columns),
                state = gridState,
                contentPadding = PaddingValues(bottom = 16.dp),
                modifier = Modifier.fillMaxSize(),
            ) {
                if (favoriteItems.isNotEmpty() && searchTerm.isBlank()) {
                    item(span = { GridItemSpan(columns) }) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 8.dp),
                        ) {
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
                        }
                    }
                }

                if (favoriteItems.isNotEmpty() && searchTerm.isBlank() && nonFavoriteItems.isNotEmpty()) {
                    item(span = { GridItemSpan(columns) }) {
                        HorizontalDivider(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            color = Color.White.copy(alpha = 0.2f),
                        )
                    }
                }

                itemsIndexed(
                    items = filteredItems,
                    key = { _, ch -> ch.id },
                ) { index, channel ->
                    ChannelCard(
                        channel = channel,
                        isSelected = index == selectedGridIndex,
                        isCurrent = channel.index == currentChannel.index,
                    )
                }
            }
        }
    }
}
