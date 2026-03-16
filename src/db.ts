import PouchDBRaw from 'pouchdb-browser';
import PouchDBFindRaw from 'pouchdb-find';
import { Mass, Song, Reading, LiturgicalText } from './types';

// Handle ESM/CJS interop for PouchDB and its plugins
const PouchDB = (PouchDBRaw as any).default || PouchDBRaw;
const PouchDBFind = (PouchDBFindRaw as any).default || PouchDBFindRaw;

PouchDB.plugin(PouchDBFind);

const db = new PouchDB('liturgia_db');

export const initDB = async () => {
  try {
    const info = await db.info();
    if (info.doc_count === 0) {
      console.log('Seeding database...');
      await seedData();
    }
  } catch (err) {
    console.error('DB Init Error:', err);
  }
};

const seedData = async () => {
  const songs: Song[] = [
    {
      _id: 'song:1117',
      type: 'song',
      title: 'Seigneur, rassemble-nous',
      reference: '1117',
      book: 'Toyembani',
      lyrics: 'Refrain\nSeigneur, rassemble-nous dans la paix de ton amour.\n\nCouplet 1\nNos pas nous ont conduits vers ta maison,\nNos cœurs sont pleins de joie et de chansons.',
      sheetMusicUrls: ['https://picsum.photos/seed/sheet1/800/1100', 'https://picsum.photos/seed/sheet2/800/1100'],
      audios: { choir: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      categories: ['Entrée'],
      liturgicalTimes: ['ORDINARY'],
      author: 'C. Villeneuve',
      language: 'Français'
    },
    {
      _id: 'song:H10',
      type: 'song',
      title: 'Gloria in Excelsis Deo',
      reference: 'H10',
      book: 'Nzembo ya Eklezya',
      lyrics: 'Refrain\nKembo na Nzambe o likolo !\n\nCouplet 1\nNkembo na Nzambe o likolo, mpe amani o nse na bato balingami na ye.',
      sheetMusicUrls: ['https://picsum.photos/seed/sheet3/800/1100'],
      audios: { choir: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      categories: ['Gloria'],
      liturgicalTimes: ['ORDINARY', 'EASTER', 'CHRISTMAS'],
      author: 'Traditionnel',
      language: 'Lingala'
    }
  ];

  const readings: Reading[] = [
    {
      _id: 'reading:1st_reading_today',
      type: 'reading',
      readingType: 'FIRST',
      reference: 'Is 58, 1-9a',
      content: 'Ainsi parle le Seigneur : Crie à pleine gorge, ne te retiens pas ! Élève la voix comme un cor ! Dénonce à mon peuple ses crimes, à la maison de Jacob ses péchés.'
    },
    {
      _id: 'reading:psalm_today',
      type: 'reading',
      readingType: 'PSALM',
      reference: 'Ps 50 (51), 3-4, 5-6ab, 18-19',
      content: 'R/ Le sacrifice qui plaît à Dieu, c’est un esprit brisé.\n\nPitié pour moi, mon Dieu, dans ton amour, selon ta grande miséricorde, efface mon péché.\nLave-moi tout entier de ma faute, purifie-moi de mon offense.'
    },
    {
      _id: 'reading:gospel_today',
      type: 'reading',
      readingType: 'GOSPEL',
      reference: 'Mt 9, 14-15',
      content: 'En ce temps-là, les disciples de Jean le Baptiste s’approchèrent de Jésus en disant : « Pourquoi, alors que nous et les pharisiens, nous jeûnons, tes disciples ne jeûnent-ils pas ? »'
    }
  ];

  const liturgicalTexts: LiturgicalText[] = [
    {
      _id: 'text:kyrie_standard',
      type: 'text',
      title: 'Kyrie Eleison',
      content: 'Seigneur, prends pitié.\nO Christ, prends pitié.\nSeigneur, prends pitié.'
    },
    {
      _id: 'text:credo_nicee',
      type: 'text',
      title: 'Symbole de Nicée-Constantinople',
      content: 'Je crois en un seul Dieu, le Père tout-puissant, créateur du ciel et de la terre, de l’univers visible et invisible...'
    }
  ];

  const today = new Date().toISOString().split('T')[0];
  const mass: Mass = {
    _id: `mass:${today}`,
    type: 'mass',
    date: today,
    title: 'Messe du jour',
    season: 'ORDINARY',
    sections: [
      {
        id: 'entree',
        name: 'Entrée',
        items: [{ type: 'song', id: 'song:1117' }]
      },
      {
        id: 'kyrie',
        name: 'Kyrie',
        items: [{ type: 'text', id: 'text:kyrie_standard' }]
      },
      {
        id: 'gloria',
        name: 'Gloria',
        items: [{ type: 'song', id: 'song:H10' }]
      },
      {
        id: 'liturgie_parole',
        name: 'Liturgie de la parole',
        items: [
          { type: 'reading', id: 'reading:1st_reading_today' },
          { type: 'reading', id: 'reading:psalm_today' },
          { type: 'reading', id: 'reading:gospel_today' }
        ]
      },
      {
        id: 'credo',
        name: 'Credo',
        items: [{ type: 'text', id: 'text:credo_nicee' }]
      }
    ]
  };

  await db.bulkDocs([...songs, ...readings, ...liturgicalTexts, mass]);
};

export const saveDoc = async (doc: any) => {
  try {
    if (doc._id) {
      try {
        const existing = await db.get(doc._id);
        return await db.put({ ...existing, ...doc });
      } catch (e) {
        return await db.put(doc);
      }
    } else {
      return await db.post(doc);
    }
  } catch (err) {
    console.error('Save Doc Error:', err);
    throw err;
  }
};

export const deleteDoc = async (id: string) => {
  try {
    const doc = await db.get(id);
    return await db.remove(doc);
  } catch (err) {
    console.error('Delete Doc Error:', err);
    throw err;
  }
};

export default db;
