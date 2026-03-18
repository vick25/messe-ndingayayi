import * as SQLite from 'expo-sqlite';
import { Mass, Song, Reading, LiturgicalText } from "./types";

/**
 * Service de base de données pour Expo Go utilisant SQLite.
 * Ce fichier est destiné à être utilisé dans un environnement React Native / Expo.
 */

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Ouvre ou récupère l'instance de la base de données
 */
const getDatabase = async () => {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('liturgia.db');
  }
  return _db;
};

/**
 * Initialise la structure de la base de données et insère les données de test si vide
 */
export const initDB = async () => {
  try {
    const db = await getDatabase();

    // Création d'une table unique pour stocker nos documents en JSON
    // Cela permet de simuler un comportement NoSQL (comme PouchDB) sur SQLite
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_type ON documents (type);
    `);

    // Vérifier si la base est vide
    const firstRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM documents');
    
    if (firstRow && firstRow.count === 0) {
      console.log("Expo DB: Seeding initial data...");
      await seedData();
    }
  } catch (err) {
    console.error("Expo DB Init Error:", err);
  }
};

/**
 * Insère ou met à jour un document
 */
export const saveDoc = async (doc: any) => {
  try {
    const db = await getDatabase();
    const id = doc._id || `${doc.type}:${Date.now()}`;
    const type = doc.type;
    const data = JSON.stringify({ ...doc, _id: id });

    await db.runAsync(
      'INSERT OR REPLACE INTO documents (id, type, data) VALUES (?, ?, ?)',
      [id, type, data]
    );
    return { id, ok: true };
  } catch (err) {
    console.error("Expo DB Save Error:", err);
    throw err;
  }
};

/**
 * Récupère un document par son ID
 */
export const getDoc = async <T>(id: string): Promise<T | null> => {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ data: string }>(
      'SELECT data FROM documents WHERE id = ?',
      [id]
    );
    return row ? JSON.parse(row.data) as T : null;
  } catch (err) {
    console.error("Expo DB Get Error:", err);
    return null;
  }
};

/**
 * Récupère tous les documents d'un certain type
 */
export const findDocsByType = async <T>(type: string): Promise<T[]> => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM documents WHERE type = ?',
      [type]
    );
    return rows.map(row => JSON.parse(row.data) as T);
  } catch (err) {
    console.error("Expo DB Find Error:", err);
    return [];
  }
};

/**
 * Supprime un document
 */
export const deleteDoc = async (id: string) => {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
    return { ok: true };
  } catch (err) {
    console.error("Expo DB Delete Error:", err);
    throw err;
  }
};

/**
 * Récupère la messe pour une date spécifique
 */
export const getMassByDate = async (date: string): Promise<Mass | null> => {
  return getDoc<Mass>(`mass:${date}`);
};

/**
 * Données initiales (Seed)
 */
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
      { id: "kyrie", name: "Kyrie", items: [] },
      { id: "gloria", name: "Gloria", items: [{ type: "song", id: "song:H10" }] },
      { id: "parole_1", name: "1ère Lecture", items: [] },
      { id: "psaume", name: "Psaume", items: [] },
      { id: "parole_2", name: "2ème Lecture", items: [] },
      { id: "evangile", name: "Évangile", items: [{ type: "reading", id: "reading:gospel_today" }] },
      { id: "credo", name: "Credo", items: [] },
      { id: "universelle", name: "Prière Universelle", items: [] },
      { id: "offertoire", name: "Offertoire", items: [] },
      { id: "sanctus", name: "Sanctus", items: [] },
      { id: "anamnese", name: "Anamnèse", items: [] },
      { id: "communion", name: "Communion", items: [] },
      { id: "envoi", name: "Envoi", items: [] },
    ],
  };

  for (const doc of [...songs, ...readings, mass]) {
    await saveDoc(doc);
  }
};
