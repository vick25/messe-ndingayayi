import { Mass, Song, Reading, LiturgicalText } from "./types";

let PouchDB: any = null;
let db: any = null;

// Initialize PouchDB with proper ESM handling
const initPouchDB = async () => {
  if (db) return db;

  try {
    // Use dynamic import to properly load PouchDB
    const pouchdbBrowser = await import("pouchdb-browser");
    const pouchdbFind = await import("pouchdb-find");

    // // Get the actual PouchDB constructor
    // PouchDB = pouchdbBrowser.default ?? pouchdbBrowser;
    // const PouchDBFind = pouchdbFind.default ?? pouchdbFind;

    // // Verify we have a valid constructor
    // if (!PouchDB || typeof PouchDB !== "function") {
    //   throw new Error("PouchDB is not a valid constructor");
    // }

    // Get the actual PouchDB constructor with robust ESM/CJS interop
    PouchDB = pouchdbBrowser.default;
    if (PouchDB && typeof PouchDB !== "function" && (PouchDB as any).default) {
      PouchDB = (PouchDB as any).default;
    }
    if (!PouchDB || typeof PouchDB !== "function") {
      PouchDB = pouchdbBrowser;
    }

    // Get the actual PouchDBFind plugin
    let findPlugin = pouchdbFind.default;
    if (
      findPlugin &&
      typeof findPlugin !== "function" &&
      (findPlugin as any).default
    ) {
      findPlugin = (findPlugin as any).default;
    }
    if (!findPlugin || typeof findPlugin !== "function") {
      findPlugin = pouchdbFind;
    }

    // Verify we have a valid constructor
    if (!PouchDB || typeof PouchDB !== "function") {
      throw new Error("PouchDB is not a valid constructor");
    }

    // Register the find plugin before creating an instance
    PouchDB.plugin(findPlugin);

    // Register the find plugin before creating an instance
    // if (PouchDBFind) {
    // PouchDB.plugin(PouchDBFind);
    // }

    // Create database instance
    db = new PouchDB("liturgia_db");
    return db;
  } catch (error) {
    console.error("Failed to initialize PouchDB:", error);
    throw error;
  }
};

export const initDB = async () => {
  try {
    const database = await initPouchDB();

    await database.createIndex({
      index: { fields: ["type", "reference"] },
    });

    const info = await database.info();

    if (info.doc_count === 0) {
      console.log("Seeding database...");
    }
  } catch (err) {
    console.error("DB Init Error:", err);
  }
};

const seedData = async () => {
  const database = await initPouchDB();

  const songs: Song[] = [
    {
      _id: "song:1117",
      type: "song",
      title: "Seigneur, rassemble-nous",
      reference: "1117",
      book: "Toyembani",
      lyrics:
        "Refrain\nSeigneur, rassemble-nous dans la paix de ton amour.\n\nCouplet 1\nNos pas nous ont conduits vers ta maison,\nNos cœurs sont pleins de joie et de chansons.",
      sheetMusicUrls: [
        "https://picsum.photos/seed/sheet1/800/1100",
        "https://picsum.photos/seed/sheet2/800/1100",
      ],
      audios: {
        choir: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
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
      lyrics:
        "Refrain\nKembo na Nzambe o likolo !\n\nCouplet 1\nNkembo na Nzambe o likolo, mpe amani o nse na bato balingami na ye.",
      sheetMusicUrls: ["https://picsum.photos/seed/sheet3/800/1100"],
      audios: {
        choir: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      },
      categories: ["Gloria"],
      liturgicalTimes: ["ORDINARY", "EASTER", "CHRISTMAS"],
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
      content:
        "Ainsi parle le Seigneur : Crie à pleine gorge, ne te retiens pas ! Élève la voix comme un cor ! Dénonce à mon peuple ses crimes, à la maison de Jacob ses péchés.",
    },
    {
      _id: "reading:psalm_today",
      type: "reading",
      readingType: "PSALM",
      reference: "Ps 50 (51), 3-4, 5-6ab, 18-19",
      content:
        "R/ Le sacrifice qui plaît à Dieu, c'est un esprit brisé.\n\nPitié pour moi, mon Dieu, dans ton amour, selon ta grande miséricorde, efface mon péché.\nLave-moi tout entier de ma faute, purifie-moi de mon offense.",
    },
    {
      _id: "reading:gospel_today",
      type: "reading",
      readingType: "GOSPEL",
      reference: "Mt 9, 14-15",
      content:
        "En ce temps-là, les disciples de Jean le Baptiste s'approchèrent de Jésus en disant : « Pourquoi, alors que nous et les pharisiens, nous jeûnons, tes disciples ne jeûnent-ils pas ? »",
    },
  ];

  const liturgicalTexts: LiturgicalText[] = [
    {
      _id: "text:kyrie_standard",
      type: "text",
      title: "Kyrie Eleison",
      content:
        "Seigneur, prends pitié.\nO Christ, prends pitié.\nSeigneur, prends pitié.",
    },
    {
      _id: "text:credo_nicee",
      type: "text",
      title: "Symbole de Nicée-Constantinople",
      content:
        "Je crois en un seul Dieu, le Père tout-puissant, créateur du ciel et de la terre, de l'univers visible et invisible...",
    },
  ];

  const today = new Date().toISOString().split("T")[0];
  const mass: Mass = {
    _id: `mass:${today}`,
    type: "mass",
    date: today,
    title: "Messe du jour",
    season: "ORDINARY",
    sections: [
      {
        id: "entree",
        name: "Entrée",
        items: [{ type: "song", id: "song:1117" }],
      },
      {
        id: "kyrie",
        name: "Kyrie",
        items: [{ type: "text", id: "text:kyrie_standard" }],
      },
      {
        id: "gloria",
        name: "Gloria",
        items: [{ type: "song", id: "song:H10" }],
      },
      {
        id: "liturgie_parole",
        name: "Liturgie de la parole",
        items: [
          { type: "reading", id: "reading:1st_reading_today" },
          { type: "reading", id: "reading:psalm_today" },
          { type: "reading", id: "reading:gospel_today" },
        ],
      },
      {
        id: "credo",
        name: "Credo",
        items: [{ type: "text", id: "text:credo_nicee" }],
      },
    ],
  };

  console.log("Seeding docs...");
  await database.bulkDocs([...songs, ...readings, ...liturgicalTexts, mass]);
  console.log("Seed completed");
};

export const saveDoc = async (doc: any) => {
  try {
    const database = await initPouchDB();
    if (doc._id) {
      try {
        const existing = await database.get(doc._id);
        return await database.put({ ...existing, ...doc });
      } catch (e) {
        return await database.put(doc);
      }
    } else {
      return await database.post(doc);
    }
  } catch (err) {
    console.error("Save Doc Error:", err);
    throw err;
  }
};

export const deleteDoc = async (id: string) => {
  try {
    const database = await initPouchDB();
    const doc = await database.get(id);
    return await database.remove(doc);
  } catch (err) {
    console.error("Delete Doc Error:", err);
    throw err;
  }
};

// Default export - a promise-based db accessor with proper method signatures
export default {
  get: async (id: string) => {
    const database = await initPouchDB();
    return database.get(id);
  },
  find: async (selector: any) => {
    const database = await initPouchDB();
    return database.find(selector);
  },
  info: async () => {
    const database = await initPouchDB();
    return database.info();
  },
  allDocs: async (options?: any) => {
    const database = await initPouchDB();
    return database.allDocs(options);
  },
};
