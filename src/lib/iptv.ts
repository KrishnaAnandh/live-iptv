import { cache } from 'react';

export interface Channel {
  id: string;
  index: number;
  name: string;
  logo: string | null;
  url: string;
  group: string;
}

const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export const getChannels = cache(async (): Promise<Channel[]> => {
  try {
    const response = await fetch(M3U_URL, { next: { revalidate: 3600 } }); // Revalidate every hour
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.statusText}`);
    }
    const m3uContent = await response.text();
    const lines = m3uContent.split('\n');

    const channels: Channel[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF:')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && (nextLine.startsWith('http://') || nextLine.startsWith('https://'))) {
          const infoLine = line.substring(line.indexOf(' ') + 1);
          const name = infoLine.substring(infoLine.lastIndexOf(',') + 1);

          const tvgIdMatch = infoLine.match(/tvg-id="([^"]*)"/);
          const tvgLogoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
          const groupTitleMatch = infoLine.match(/group-title="([^"]*)"/);
          
          if (name && nextLine) {
            channels.push({
              id: tvgIdMatch ? tvgIdMatch[1] : `channel-${currentIndex}`,
              index: currentIndex,
              name,
              logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
              url: nextLine,
              group: groupTitleMatch ? groupTitleMatch[1] : 'Uncategorized',
            });
            currentIndex++;
          }
          i++; 
        }
      }
    }
    
    // For performance and better UX on TV, we limit the number of channels.
    return channels.filter(c => c.logo);
  } catch (error) {
    console.error('Error fetching or parsing channels:', error);
    return [];
  }
});