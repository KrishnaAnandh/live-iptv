package tv.streamdeck.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class M3uParserTest {
  private val sampleM3u = """
#EXTM3U
#EXTINF:-1 tvg-id="bbc.uk" tvg-logo="https://example.com/bbc.png" group-title="News",BBC News
https://example.com/bbc.m3u8
#EXTINF:-1 tvg-id="" group-title="Sports",No Logo Channel
https://example.com/nologo.m3u8
#EXTINF:-1 tvg-logo="https://example.com/cnn.png" group-title="News",CNN
http://example.com/cnn.m3u8
#EXTINF:-1 tvg-id="espn" tvg-logo="https://example.com/espn.png",ESPN
not-a-valid-url
  """.trimIndent()

    @Test
    fun parse_extractsChannelsWithLogosOnly() {
        val channels = M3uParser.parse(sampleM3u)

        assertEquals(2, channels.size)
        assertEquals("BBC News", channels[0].name)
        assertEquals("bbc.uk", channels[0].id)
        assertEquals("https://example.com/bbc.png", channels[0].logo)
        assertEquals("News", channels[0].group)
        assertEquals("https://example.com/bbc.m3u8", channels[0].url)
        assertEquals(0, channels[0].index)

        assertEquals("CNN", channels[1].name)
        assertEquals("channel-2", channels[1].id)
        assertEquals("http://example.com/cnn.m3u8", channels[1].url)
        assertEquals(2, channels[1].index)
    }

    @Test
    fun parse_filtersChannelsWithoutLogo() {
        val channels = M3uParser.parse(sampleM3u)
        assertTrue(channels.none { it.name == "No Logo Channel" })
    }

    @Test
    fun parse_emptyContent_returnsEmptyList() {
        assertEquals(emptyList<Channel>(), M3uParser.parse(""))
    }
}
