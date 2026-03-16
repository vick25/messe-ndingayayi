
export type LiturgicalSeason = 'ORDINARY' | 'LENT' | 'ADVENT' | 'EASTER' | 'CHRISTMAS' | 'FEAST';

export interface LiturgicalColor {
  primary: string;
  secondary: string;
  text: string;
}

export interface AudioTracks {
  choir?: string;
  soprano?: string;
  alto?: string;
  tenor?: string;
  bass?: string;
}

export interface Song {
  _id: string;
  type: 'song';
  title: string;
  reference: string;
  book?: string;
  lyrics: string;
  sheetMusicUrls?: string[];
  audios: AudioTracks;
  categories: string[];
  liturgicalTimes: LiturgicalSeason[];
  author?: string;
  language?: string;
}

export interface LiturgicalText {
  _id: string;
  type: 'text';
  title: string;
  content: string;
}

export interface Reading {
  _id: string;
  type: 'reading';
  readingType: 'FIRST' | 'PSALM' | 'SECOND' | 'GOSPEL';
  content: string;
  reference: string;
}

export interface MassSection {
  id: string;
  name: string;
  items: Array<{
    type: 'song' | 'text' | 'reading';
    id: string;
  }>;
}

export interface Mass {
  _id: string; // YYYY-MM-DD
  type: 'mass';
  date: string;
  title: string;
  season: LiturgicalSeason;
  sections: MassSection[];
}
