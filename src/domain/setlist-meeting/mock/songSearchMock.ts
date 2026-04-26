/**
 * 곡 검색 API mock — 외부 음원 DB 를 흉내낸 정적 목록.
 * 추후 SONG 검색 API 가 도입되면 useSongSearch 같은 훅의 fetcher 만 교체하면 된다.
 */
export interface SongSearchResult {
  /** 외부 DB 의 트랙 식별자(예: ISRC, MusicBrainz id 등). 현재는 mock 슬러그. */
  externalId: string;
  title: string;
  artist: string;
  album?: string;
  /** 'mm:ss'. */
  duration?: string;
}

export const MOCK_SONG_DB: SongSearchResult[] = [
  {
    externalId: 'queen-bohemian',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: '5:55',
  },
  {
    externalId: 'queen-wewillrock',
    title: 'We Will Rock You',
    artist: 'Queen',
    album: 'News of the World',
    duration: '2:01',
  },
  {
    externalId: 'queen-wearethechampions',
    title: 'We Are the Champions',
    artist: 'Queen',
    album: 'News of the World',
    duration: '3:00',
  },
  {
    externalId: 'led-zeppelin-stairway',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    duration: '8:02',
  },
  {
    externalId: 'beatles-hey-jude',
    title: 'Hey Jude',
    artist: 'The Beatles',
    album: 'Hey Jude',
    duration: '7:11',
  },
  {
    externalId: 'beatles-let-it-be',
    title: 'Let It Be',
    artist: 'The Beatles',
    album: 'Let It Be',
    duration: '4:03',
  },
  {
    externalId: 'beatles-here-comes',
    title: 'Here Comes the Sun',
    artist: 'The Beatles',
    album: 'Abbey Road',
    duration: '3:05',
  },
  {
    externalId: 'oasis-wonderwall',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    duration: '4:18',
  },
  {
    externalId: 'oasis-dont-look',
    title: "Don't Look Back in Anger",
    artist: 'Oasis',
    album: "(What's the Story) Morning Glory?",
    duration: '4:48',
  },
  {
    externalId: 'nirvana-smells',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    album: 'Nevermind',
    duration: '5:01',
  },
  {
    externalId: 'nirvana-come-as',
    title: 'Come as You Are',
    artist: 'Nirvana',
    album: 'Nevermind',
    duration: '3:39',
  },
  {
    externalId: 'rhcp-californication',
    title: 'Californication',
    artist: 'Red Hot Chili Peppers',
    album: 'Californication',
    duration: '5:21',
  },
  {
    externalId: 'rhcp-otherside',
    title: 'Otherside',
    artist: 'Red Hot Chili Peppers',
    album: 'Californication',
    duration: '4:15',
  },
  {
    externalId: 'radiohead-creep',
    title: 'Creep',
    artist: 'Radiohead',
    album: 'Pablo Honey',
    duration: '3:58',
  },
  {
    externalId: 'radiohead-karma',
    title: 'Karma Police',
    artist: 'Radiohead',
    album: 'OK Computer',
    duration: '4:21',
  },
  {
    externalId: 'metallica-master',
    title: 'Master of Puppets',
    artist: 'Metallica',
    album: 'Master of Puppets',
    duration: '8:35',
  },
  {
    externalId: 'metallica-enter',
    title: 'Enter Sandman',
    artist: 'Metallica',
    album: 'Metallica',
    duration: '5:32',
  },
  {
    externalId: 'tool-vicarious',
    title: 'Vicarious',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '7:06',
  },
  {
    externalId: 'tool-jambi',
    title: 'Jambi',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '7:28',
  },
  {
    externalId: 'tool-the-pot',
    title: 'The Pot',
    artist: 'Tool',
    album: '10,000 Days',
    duration: '6:21',
  },
  {
    externalId: 'pink-floyd-wish',
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    album: 'Wish You Were Here',
    duration: '5:34',
  },
  {
    externalId: 'pink-floyd-comfortably',
    title: 'Comfortably Numb',
    artist: 'Pink Floyd',
    album: 'The Wall',
    duration: '6:23',
  },
  {
    externalId: 'eagles-hotel',
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    duration: '6:30',
  },
  {
    externalId: 'guns-sweet',
    title: "Sweet Child o' Mine",
    artist: "Guns N' Roses",
    album: 'Appetite for Destruction',
    duration: '5:56',
  },
  {
    externalId: 'acdc-back',
    title: 'Back in Black',
    artist: 'AC/DC',
    album: 'Back in Black',
    duration: '4:15',
  },
  {
    externalId: 'iu-night',
    title: '밤편지',
    artist: '아이유 (IU)',
    album: 'Palette',
    duration: '4:13',
  },
  {
    externalId: 'iu-good-day',
    title: '좋은 날',
    artist: '아이유 (IU)',
    album: 'Real',
    duration: '3:50',
  },
  {
    externalId: 'jaurim-hahaha',
    title: '하하하쏭',
    artist: '자우림',
    album: '음모론',
    duration: '3:48',
  },
  {
    externalId: 'jaurim-kkochbal',
    title: '꽃',
    artist: '자우림',
    album: 'Ashes to Ashes',
    duration: '4:47',
  },
  {
    externalId: 'cherryfilter-flying',
    title: '낭만고양이',
    artist: '체리필터',
    album: 'Made in Korea',
    duration: '4:09',
  },
];

/** 부분 매칭 검색. 추후 외부 API fetcher 로 교체. */
export function searchMockSongs(query: string, limit = 30): SongSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_SONG_DB.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album ?? '').toLowerCase().includes(q) ||
      (s.duration ?? '').includes(q),
  ).slice(0, limit);
}
