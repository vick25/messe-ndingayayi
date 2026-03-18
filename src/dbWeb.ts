import { Mass, Song, Reading, LiturgicalText } from "./types";

/**
 * Simulateur de base de données pour le Web (LocalStorage)
 * Offre une interface compatible avec PouchDB/SQLite pour tester les fonctionnalités.
 */

const STORAGE_KEY = 'liturgia_web_db';

// Charger les données depuis le LocalStorage
const loadData = (): Record<string, any> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

// Sauvegarder les données dans le LocalStorage
const saveData = (data: Record<string, any>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const initDB = async () => {
  const data = loadData();
  if (Object.keys(data).length === 0) {
    console.log("Web DB: Seeding initial data...");
    await seedData();
  }
};

const seedData = async () => {
  const songs: Song[] = [
    {
      _id: "song:1117",
      type: "song",
      title: "Seigneur, rassemble-nous",
      reference: "1117",
      book: "Toyembani",
      lyrics: "Refrain\nSeigneur, rassemble-nous dans la paix de ton amour.\n\nCouplet 1\nNos pas nous ont conduits vers ta maison,\nNos cœurs sont pleins de joie et de chansons.",
      sheetMusicUrls: ["https://picsum.photos/seed/sheet1/800/1100"],
      audios: { choir: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      categories: ["Entrée"],
      liturgicalTimes: ["ORDINARY"],
      author: "C. Villeneuve",
      language: "Français",
    },
    {
      _id: "song:H10",
      type: "song",
      title: "Gloria in Excelsis Deo",
      reference: "H10",
      book: "Nzembo ya Eklezya",
      lyrics: "Refrain\nKembo na Nzambe o likolo !\n\nCouplet 1\nNkembo na Nzambe o likolo, mpe amani o nse na bato balingami na ye.",
      sheetMusicUrls: ["https://picsum.photos/seed/sheet3/800/1100"],
      audios: { choir: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      categories: ["Gloria"],
      liturgicalTimes: ["ORDINARY"],
      author: "Traditionnel",
      language: "Lingala",
    },
  ];

  const readings: Reading[] = [
    {
      _id: "reading:1st_reading_today",
      type: "reading",
      readingType: "FIRST",
      reference: "Is 58, 1-9a",
      content: "Ainsi parle le Seigneur : Crie à pleine gorge...",
    },
    {
      _id: "reading:psalm_today",
      type: "reading",
      readingType: "PSALM",
      reference: "Ps 50",
      content: "R/ Le sacrifice qui plaît à Dieu, c'est un esprit brisé.",
    },
    {
      _id: "reading:gospel_today",
      type: "reading",
      readingType: "GOSPEL",
      reference: "Mt 9, 14-15",
      content: "En ce temps-là, les disciples de Jean le Baptiste s'approchèrent de Jésus...",
    }
  ];

  const today = new Date().toISOString().split("T")[0];
  const mass: Mass = {
    _id: `mass:${today}`,
    type: "mass",
    date: today,
    title: "Messe du jour",
    season: "ORDINARY",
    sections: [
      { id: "entree", name: "Entrée", items: [{ type: "song", id: "song:1117" }] },
      { id: "gloria", name: "Gloria", items: [{ type: "song", id: "song:H10" }] },
      { id: "parole", name: "Liturgie de la Parole", items: [
        { type: "reading", id: "reading:1st_reading_today" },
        { type: "reading", id: "reading:psalm_today" },
        { type: "reading", id: "reading:gospel_today" }
      ]},
    ],
  };

  const dbData = loadData();
  [...songs, ...readings, mass].forEach(doc => {
    dbData[doc._id] = doc;
  });
  saveData(dbData);
};

// Interface compatible avec les appels dans App.tsx
const dbWeb = {
  get: async (id: string) => {
    const data = loadData();
    if (data[id]) return data[id];
    throw new Error("Document not found");
  },
  find: async (query: any) => {
    const data = loadData();
    const docs = Object.values(data).filter(doc => {
      if (query.selector.type && doc.type !== query.selector.type) return false;
      return true;
    });
    return { docs };
  },
  info: async () => {
    const data = loadData();
    return { doc_count: Object.keys(data).length };
  },
  put: async (doc: any) => {
    const data = loadData();
    data[doc._id] = doc;
    saveData(data);
    return { ok: true };
  },
  post: async (doc: any) => {
    const data = loadData();
    const id = doc._id || `${doc.type}:${Date.now()}`;
    const newDoc = { ...doc, _id: id };
    data[id] = newDoc;
    saveData(data);
    return { ok: true, id };
  },
  remove: async (doc: any) => {
    const data = loadData();
    delete data[doc._id];
    saveData(data);
    return { ok: true };
  }
};

export const saveDoc = dbWeb.put;
export const deleteDoc = dbWeb.remove;

export default dbWeb;
