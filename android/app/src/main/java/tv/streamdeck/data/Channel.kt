package tv.streamdeck.data

data class Channel(
    val id: String,
    val index: Int,
    val name: String,
    val logo: String?,
    val url: String,
    val group: String,
)
