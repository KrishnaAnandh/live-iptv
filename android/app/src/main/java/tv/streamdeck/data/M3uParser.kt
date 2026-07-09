package tv.streamdeck.data

object M3uParser {
    private val tvgIdRegex = Regex("""tvg-id="([^"]*)"""")
    private val tvgLogoRegex = Regex("""tvg-logo="([^"]*)"""")
    private val groupTitleRegex = Regex("""group-title="([^"]*)"""")

    fun parse(m3uContent: String): List<Channel> {
        val lines = m3uContent.lines()
        val channels = mutableListOf<Channel>()
        var currentIndex = 0

        var i = 0
        while (i < lines.size) {
            val line = lines[i].trim()
            if (line.startsWith("#EXTINF:")) {
                val nextLine = lines.getOrNull(i + 1)?.trim()
                if (nextLine != null && (nextLine.startsWith("http://") || nextLine.startsWith("https://"))) {
                    val infoLine = line.substring(line.indexOf(' ') + 1)
                    val name = infoLine.substring(infoLine.lastIndexOf(',') + 1).trim()

                    val tvgId = tvgIdRegex.find(infoLine)?.groupValues?.getOrNull(1)
                    val tvgLogo = tvgLogoRegex.find(infoLine)?.groupValues?.getOrNull(1)
                    val groupTitle = groupTitleRegex.find(infoLine)?.groupValues?.getOrNull(1)

                    if (name.isNotEmpty()) {
                        channels.add(
                            Channel(
                                id = tvgId?.takeIf { it.isNotEmpty() } ?: "channel-$currentIndex",
                                index = currentIndex,
                                name = name,
                                logo = tvgLogo?.takeIf { it.isNotEmpty() },
                                url = nextLine,
                                group = groupTitle?.takeIf { it.isNotEmpty() } ?: "Uncategorized",
                            ),
                        )
                        currentIndex++
                    }
                    i++
                }
            }
            i++
        }

        return channels.filter { it.logo != null }
    }
}
