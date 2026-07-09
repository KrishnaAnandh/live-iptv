package tv.streamdeck.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = AccentTeal,
    onPrimary = Color.White,
    secondary = PrimarySlate,
    onSecondary = Color.White,
    background = BackgroundDark,
    onBackground = Color.White,
    surface = PrimarySlate,
    onSurface = Color.White,
    surfaceVariant = PrimarySlate,
    onSurfaceVariant = MutedForeground,
)

@Composable
fun StreamDeckTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = StreamDeckTypography,
        content = content,
    )
}
