package tv.streamdeck.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONArray

private val Context.favoritesDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "streamdeck_tv_favorites",
)

class FavoritesRepository(private val context: Context) {
    private val favoritesKey = stringPreferencesKey("favorites_json")

    val favorites: Flow<List<String>> = context.favoritesDataStore.data.map { prefs ->
        val json = prefs[favoritesKey] ?: "[]"
        parseFavorites(json)
    }

    suspend fun addFavorite(channelId: String) {
        context.favoritesDataStore.edit { prefs ->
            val current = parseFavorites(prefs[favoritesKey] ?: "[]").toMutableList()
            if (!current.contains(channelId)) {
                current.add(channelId)
                prefs[favoritesKey] = JSONArray(current).toString()
            }
        }
    }

    suspend fun removeFavorite(channelId: String) {
        context.favoritesDataStore.edit { prefs ->
            val current = parseFavorites(prefs[favoritesKey] ?: "[]").toMutableList()
            current.remove(channelId)
            prefs[favoritesKey] = JSONArray(current).toString()
        }
    }

    suspend fun toggleFavorite(channelId: String, isFavorite: Boolean) {
        if (isFavorite) removeFavorite(channelId) else addFavorite(channelId)
    }

    private fun parseFavorites(json: String): List<String> {
        return try {
            val array = JSONArray(json)
            buildList(array.length()) { repeat(array.length()) { add(array.getString(it)) } }
        } catch (_: Exception) {
            emptyList()
        }
    }
}
