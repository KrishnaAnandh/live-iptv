package tv.streamdeck.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import tv.streamdeck.data.ChannelLoadState
import tv.streamdeck.data.ChannelRepository
import tv.streamdeck.data.FavoritesRepository

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val channelRepository = ChannelRepository()
    val channelState: StateFlow<ChannelLoadState> = channelRepository.state

    private val favoritesRepository = FavoritesRepository(application)
    val favorites: StateFlow<List<String>> = favoritesRepository.favorites
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _currentChannelIndex = MutableStateFlow(0)
    val currentChannelIndex: StateFlow<Int> = _currentChannelIndex.asStateFlow()

    init {
        loadChannels()
    }

    fun loadChannels(forceRefresh: Boolean = false) {
        viewModelScope.launch {
            channelRepository.loadChannels(forceRefresh)
            val state = channelRepository.state.value
            if (state is ChannelLoadState.Success && _currentChannelIndex.value == 0) {
                _currentChannelIndex.value = state.channels.first().index
            }
        }
    }

    fun setCurrentChannelIndex(index: Int) {
        _currentChannelIndex.value = index
    }

    fun changeChannel(delta: Int) {
        val state = channelState.value
        if (state !is ChannelLoadState.Success || state.channels.isEmpty()) return
        val newIndex = (_currentChannelIndex.value + delta).coerceIn(0, state.channels.lastIndex)
        _currentChannelIndex.value = newIndex
    }

    fun toggleFavorite(channelId: String) {
        viewModelScope.launch {
            val isFav = favorites.value.contains(channelId)
            favoritesRepository.toggleFavorite(channelId, isFav)
        }
    }
}
