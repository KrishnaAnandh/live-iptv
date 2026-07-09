package tv.streamdeck.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

sealed class ChannelLoadState {
    data object Loading : ChannelLoadState()
    data class Success(val channels: List<Channel>) : ChannelLoadState()
    data class Error(val message: String) : ChannelLoadState()
}

class ChannelRepository(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build(),
    private val m3uUrl: String = M3U_URL,
) {
    private val _state = MutableStateFlow<ChannelLoadState>(ChannelLoadState.Loading)
    val state: StateFlow<ChannelLoadState> = _state.asStateFlow()

    private var cachedChannels: List<Channel> = emptyList()
    private var lastFetchTimeMs: Long = 0L

    suspend fun loadChannels(forceRefresh: Boolean = false) {
        val now = System.currentTimeMillis()
        if (!forceRefresh && cachedChannels.isNotEmpty() && now - lastFetchTimeMs < CACHE_TTL_MS) {
            _state.value = ChannelLoadState.Success(cachedChannels)
            return
        }

        _state.value = ChannelLoadState.Loading

        try {
            val channels = withContext(Dispatchers.IO) { fetchAndParse() }
            cachedChannels = channels
            lastFetchTimeMs = now
            _state.value = if (channels.isEmpty()) {
                ChannelLoadState.Error("No channels found")
            } else {
                ChannelLoadState.Success(channels)
            }
        } catch (e: Exception) {
            _state.value = ChannelLoadState.Error(
                e.message ?: "Failed to fetch channels",
            )
        }
    }

    fun getCachedChannels(): List<Channel> = cachedChannels

    private fun fetchAndParse(): List<Channel> {
        val request = Request.Builder().url(m3uUrl).get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IllegalStateException("Failed to fetch channels: ${response.message}")
            }
            val body = response.body?.string() ?: throw IllegalStateException("Empty response body")
            return M3uParser.parse(body)
        }
    }

    companion object {
        const val M3U_URL = "https://iptv-org.github.io/iptv/index.m3u"
        private const val CACHE_TTL_MS = 3_600_000L // 1 hour
    }
}
