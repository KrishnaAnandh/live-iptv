package tv.streamdeck.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import tv.streamdeck.R
import tv.streamdeck.data.ChannelLoadState
import tv.streamdeck.ui.theme.AccentTeal

@Composable
fun BootstrapScreen(
    channelState: ChannelLoadState,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        when (channelState) {
            is ChannelLoadState.Loading -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    CircularProgressIndicator(color = AccentTeal)
                    Text(
                        text = stringResource(R.string.loading_channels),
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            }
            is ChannelLoadState.Error -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "StreamDeck TV",
                        style = MaterialTheme.typography.displayLarge,
                    )
                    Text(
                        text = stringResource(R.string.channel_load_error),
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                    )
                }
            }
            is ChannelLoadState.Success -> Unit
        }
    }
}
