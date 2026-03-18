import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  BookOpen,
  Settings,
  Music,
  ChevronRight,
  Play,
  Pause,
  FileText,
  Search,
  ArrowLeft,
  Filter,
  Book,
  Type as TypeIcon,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Calendar,
  Layout,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import db, { initDB, saveDoc, deleteDoc } from "./db";
import { Mass, Song, Reading, LiturgicalText, LiturgicalSeason } from "./types";
import { SEASON_COLORS } from "./constants";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ContentItem =
  | { type: "song"; data: Song }
  | { type: "reading"; data: Reading }
  | { type: "text"; data: LiturgicalText };

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "home" | "repertoire" | "settings"
  >("home");
  const [currentMass, setCurrentMass] = useState<Mass | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [allReadings, setAllReadings] = useState<Reading[]>([]);
  const [allTexts, setAllTexts] = useState<LiturgicalText[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [editingMass, setEditingMass] = useState<Partial<Mass> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

  const categories = [
    "Tous",
    "Entrée",
    "Kyrie",
    "Gloria",
    "Psaume",
    "Alléluia",
    "Offertoire",
    "Sanctus",
    "Anamnèse",
    "Communion",
    "Envoi",
  ];

  useEffect(() => {
    const setup = async () => {
      await initDB();
      await fetchData();
    };
    setup();
  }, []);

  const fetchData = async () => {
    try {
      const info = await db.info();
      console.log("DB info", info);

      const today = new Date().toISOString().split("T")[0];

      // Fetch today's mass
      try {
        const mass = (await db.get(`mass:${today}`)) as unknown as Mass;
        setCurrentMass(mass);
      } catch (e) {
        const result = await db.find({
          selector: { type: "mass" },
          limit: 1,
        });
        if (result.docs.length > 0)
          setCurrentMass(result.docs[0] as unknown as Mass);
      }

      // Fetch all songs
      const songsResult = await db.find({ selector: { type: "song" } });
      setAllSongs(songsResult.docs as unknown as Song[]);

      // Fetch all readings
      const readingsResult = await db.find({ selector: { type: "reading" } });
      setAllReadings(readingsResult.docs as unknown as Reading[]);

      // Fetch all texts
      const textsResult = await db.find({ selector: { type: "text" } });
      setAllTexts(textsResult.docs as unknown as LiturgicalText[]);

      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  const theme = useMemo(() => {
    const season = currentMass?.season || "ORDINARY";
    return SEASON_COLORS[season];
  }, [currentMass]);

  const filteredSongs = useMemo(() => {
    return allSongs.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "Tous" ||
        s.categories.some(
          (c) => c.toLowerCase() === selectedCategory.toLowerCase(),
        );
      return matchesSearch && matchesCategory;
    });
  }, [allSongs, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getItemData = (item: { type: string; id: string }) => {
    if (item.type === "song") return allSongs.find((s) => s._id === item.id);
    if (item.type === "reading")
      return allReadings.find((r) => r._id === item.id);
    if (item.type === "text") return allTexts.find((t) => t._id === item.id);
    return null;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Header */}
      <header
        className="px-6 pt-12 pb-6 text-white shadow-lg transition-colors duration-500"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeTab === "home"
                ? "Messe du Jour"
                : activeTab === "repertoire"
                  ? "Répertoire"
                  : "Paramètres"}
            </h1>
            <p className="text-white/80 text-sm font-medium">
              {currentMass?.title} •{" "}
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
            <BookOpen size={20} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <ContentDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              theme={theme}
            />
          ) : activeTab === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-6"
            >
              {currentMass ? (
                currentMass.sections.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      {section.name}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const data = getItemData(item);
                        if (!data) return null;

                        return (
                          <button
                            key={item.id}
                            onClick={() =>
                              setSelectedItem({
                                type: item.type as any,
                                data: data as any,
                              })
                            }
                            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all"
                          >
                            <div className="flex items-center gap-4 text-left">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                style={{ backgroundColor: theme.primary }}
                              >
                                {item.type === "song" && <Music size={18} />}
                                {item.type === "reading" && <Book size={18} />}
                                {item.type === "text" && <TypeIcon size={18} />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 line-clamp-1">
                                  {"title" in data
                                    ? data.title
                                    : "readingType" in data
                                      ? `${data.readingType === "FIRST" ? "1ère Lecture" : data.readingType === "PSALM" ? "Psaume" : data.readingType === "SECOND" ? "2ème Lecture" : "Évangile"}`
                                      : "Texte"}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {"reference" in (data as any)
                                    ? (data as any).reference
                                    : "book" in (data as any)
                                      ? (data as any).book
                                      : ""}
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              size={20}
                              className="text-gray-300 group-hover:text-gray-500"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-200">
                    <Calendar size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Aucune messe programmée
                    </h3>
                    <p className="text-sm text-gray-400 max-w-[200px] mx-auto">
                      Contactez votre administrateur pour programmer la
                      célébration d'aujourd'hui.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : activeTab === "repertoire" ? (
            <motion.div
              key="repertoire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-6"
            >
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou numéro..."
                  className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-gray-400 border border-gray-100",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredSongs.length > 0 ? (
                  filteredSongs.map((song) => (
                    <button
                      key={song._id}
                      onClick={() =>
                        setSelectedItem({ type: "song", data: song })
                      }
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                          <Music size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {song.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {song.reference} • {song.book}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <Search size={32} />
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold">
                        Aucun chant trouvé
                      </p>
                      <p className="text-xs text-gray-400">
                        Essayez de modifier votre recherche ou catégorie
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <AdminPanel
              onEditSong={(song) => setEditingSong(song)}
              onEditMass={(mass) => setEditingMass(mass)}
              allSongs={allSongs}
              theme={theme}
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingSong && (
          <SongEditor
            song={editingSong}
            onClose={() => setEditingSong(null)}
            onSave={() => {
              setEditingSong(null);
              fetchData();
            }}
          />
        )}
        {editingMass && (
          <MassEditor
            mass={editingMass}
            allSongs={allSongs}
            allReadings={allReadings}
            allTexts={allTexts}
            onClose={() => setEditingMass(null)}
            onSave={() => {
              setEditingMass(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {!selectedItem && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-between items-center z-50">
          <NavButton
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
            icon={<Home size={24} />}
            label="Messe"
            theme={theme}
          />
          <NavButton
            active={activeTab === "repertoire"}
            onClick={() => setActiveTab("repertoire")}
            icon={<BookOpen size={24} />}
            label="Chants"
            theme={theme}
          />
          <NavButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            icon={<Settings size={24} />}
            label="Plus"
            theme={theme}
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label, theme }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "scale-110" : "opacity-40",
      )}
      style={{ color: active ? theme.primary : undefined }}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">
        {label}
      </span>
    </button>
  );
}

function ContentDetail({
  item,
  onBack,
  theme,
}: {
  item: ContentItem;
  onBack: () => void;
  theme: any;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<
    "choir" | "soprano" | "alto" | "tenor" | "bass"
  >("choir");
  const [viewMode, setViewMode] = useState<"lyrics" | "sheets">("lyrics");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const title =
    item.type === "song"
      ? item.data.title
      : item.type === "reading"
        ? item.data.readingType === "FIRST"
          ? "1ère Lecture"
          : item.data.readingType === "PSALM"
            ? "Psaume"
            : item.data.readingType === "SECOND"
              ? "2ème Lecture"
              : "Évangile"
        : item.data.title;
  const subtitle =
    item.type === "song"
      ? item.data.reference
      : item.type === "reading"
        ? item.data.reference
        : "Texte Liturgique";

  const hasSheets =
    item.type === "song" &&
    item.data.sheetMusicUrls &&
    item.data.sheetMusicUrls.length > 0;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "absolute inset-0 bg-white z-[60] flex flex-col",
        isFullScreen && "fixed inset-0 z-[100]",
      )}
    >
      <header className="p-6 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 active:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center px-4">
          <h2 className="font-bold text-gray-900 line-clamp-1">{title}</h2>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {hasSheets && (
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-gray-400 active:text-gray-900"
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          )}
          {!isFullScreen && <div className="w-10" />}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {item.type === "song" && !isFullScreen && (
          <div className="bg-gray-50 rounded-3xl p-6 space-y-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                  <Music size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Lecteur Audio</h4>
                  <p className="text-xs text-gray-500">Piste : {activeTrack}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: theme.primary }}
              >
                {isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {(["choir", "soprano", "alto", "tenor", "bass"] as const).map(
                (track) => (
                  <button
                    key={track}
                    onClick={() => setActiveTrack(track)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                      activeTrack === track
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-gray-400 border border-gray-100",
                    )}
                  >
                    {track.charAt(0).toUpperCase() + track.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {hasSheets && !isFullScreen && (
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("lyrics")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                viewMode === "lyrics"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400",
              )}
            >
              <FileText size={18} />
              Paroles
            </button>
            <button
              onClick={() => setViewMode("sheets")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                viewMode === "sheets"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400",
              )}
            >
              <ImageIcon size={18} />
              Partitions
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              {viewMode === "lyrics" ? (
                <FileText size={16} />
              ) : (
                <ImageIcon size={16} />
              )}
              <span className="text-xs font-bold uppercase tracking-widest">
                {viewMode === "lyrics" ? "Contenu" : "Partitions"}
              </span>
            </div>
          </div>

          {viewMode === "lyrics" || !hasSheets ? (
            <div className="prose prose-indigo max-w-none">
              {(item.type === "song" ? item.data.lyrics : item.data.content)
                .split("\n\n")
                .map((block, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4 rounded-2xl",
                      block.startsWith("Refrain") || block.startsWith("R/")
                        ? "bg-indigo-50/50 border-l-4 border-indigo-500 italic"
                        : "bg-white",
                    )}
                  >
                    <p className="whitespace-pre-line text-gray-700 leading-relaxed font-medium">
                      {block}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <div
              className={cn(
                "space-y-4",
                isFullScreen &&
                  "fixed inset-0 top-20 bg-gray-900 p-4 overflow-y-auto z-[110]",
              )}
            >
              {item.data.sheetMusicUrls?.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt={`Partition page ${i + 1}`}
                    className="w-full rounded-2xl shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
                    Page {i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {item.type === "song" && !isFullScreen && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Auteur
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {item.data.author || "Inconnu"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Langue
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {item.data.language || "N/A"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdminPanel({
  onEditSong,
  onEditMass,
  allSongs,
  theme,
  isAdmin,
  setIsAdmin,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Settings size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Paramètres
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Settings size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">
                Mode Administrateur
              </h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Accès aux outils de gestion
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              isAdmin ? "bg-indigo-600" : "bg-gray-200",
            )}
          >
            <div
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                isAdmin ? "left-7" : "left-1",
              )}
            />
          </button>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">
                Synchronisation CouchDB
              </h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {(import.meta as any).env.VITE_COUCHDB_URL
                  ? "Connecté au serveur distant"
                  : "Mode local uniquement"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              (import.meta as any).env.VITE_COUCHDB_URL ? "bg-emerald-500" : "bg-gray-300",
            )}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Layout size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Gestion
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() =>
                onEditSong({
                  type: "song",
                  audios: {},
                  sheetMusicUrls: [],
                  categories: [],
                  liturgicalTimes: [],
                })
              }
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Plus size={24} />
              </div>
              <span className="text-sm font-bold text-gray-700">
                Nouveau Chant
              </span>
            </button>

            <button
              onClick={() =>
                onEditMass({ type: "mass", sections: [], season: "ORDINARY" })
              }
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <span className="text-sm font-bold text-gray-700">
                Programmer Messe
              </span>
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400">
            <BookOpen size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Répertoire ({allSongs.length})
            </span>
          </div>
          <div className="space-y-2">
            {allSongs.slice(0, 5).map((song: any) => (
              <div
                key={song._id}
                className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">
                    {song.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {song.reference}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditSong(song)}
                    className="p-2 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteDoc(song._id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">
            À propos
          </span>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl text-white space-y-2">
          <h4 className="font-bold">Liturgia App v1.0</h4>
          <p className="text-xs text-white/70 leading-relaxed">
            Une application conçue pour faciliter la préparation et la
            participation aux célébrations liturgiques.
          </p>
          <div className="pt-2 flex items-center gap-2 opacity-50 text-[10px] font-bold uppercase tracking-widest">
            <span>© 2026 Liturgia Team</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SongEditor({ song, onClose, onSave }: any) {
  const [formData, setFormData] = useState(song);

  const handleSave = async () => {
    await saveDoc({
      ...formData,
      type: "song",
      _id: formData._id || `song:${formData.reference || Date.now()}`,
    });
    onSave();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <header className="p-6 flex items-center justify-between border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-400">
          <X size={24} />
        </button>
        <h2 className="font-bold text-gray-900">
          {song._id ? "Modifier Chant" : "Nouveau Chant"}
        </h2>
        <button onClick={handleSave} className="p-2 text-indigo-600 font-bold">
          <Save size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Titre
          </label>
          <input
            type="text"
            className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Référence / Numéro
            </label>
            <input
              type="text"
              className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.reference || ""}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Recueil
            </label>
            <input
              type="text"
              className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.book || ""}
              onChange={(e) =>
                setFormData({ ...formData, book: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Catégorie Liturgique
          </label>
          <select
            className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.categories?.[0] || ""}
            onChange={(e) =>
              setFormData({ ...formData, categories: [e.target.value] })
            }
          >
            <option value="">Sélectionner une catégorie</option>
            <option value="Entrée">Entrée</option>
            <option value="Kyrie">Kyrie</option>
            <option value="Gloria">Gloria</option>
            <option value="Psaume">Psaume</option>
            <option value="Alléluia">Alléluia</option>
            <option value="Offertoire">Offertoire</option>
            <option value="Sanctus">Sanctus</option>
            <option value="Anamnèse">Anamnèse</option>
            <option value="Communion">Communion</option>
            <option value="Envoi">Envoi</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Paroles
          </label>
          <textarea
            rows={8}
            className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.lyrics || ""}
            onChange={(e) =>
              setFormData({ ...formData, lyrics: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            URL Partition (Image)
          </label>
          <input
            type="text"
            placeholder="https://..."
            className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.sheetMusicUrls?.[0] || ""}
            onChange={(e) =>
              setFormData({ ...formData, sheetMusicUrls: [e.target.value] })
            }
          />
        </div>
      </div>
    </motion.div>
  );
}

function MassEditor({
  mass,
  allSongs,
  allReadings,
  allTexts,
  onClose,
  onSave,
}: any) {
  const [formData, setFormData] = useState(mass);

  const handleSave = async () => {
    await saveDoc({
      ...formData,
      type: "mass",
      _id: formData._id || `mass:${formData.date}`,
    });
    onSave();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <header className="p-6 flex items-center justify-between border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-400">
          <X size={24} />
        </button>
        <h2 className="font-bold text-gray-900">Programmer Messe</h2>
        <button onClick={handleSave} className="p-2 text-emerald-600 font-bold">
          <Save size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Date
            </label>
            <input
              type="date"
              className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.date || ""}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Temps Liturgique
            </label>
            <select
              className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={formData.season || "ORDINARY"}
              onChange={(e) =>
                setFormData({ ...formData, season: e.target.value })
              }
            >
              <option value="ORDINARY">Temps Ordinaire</option>
              <option value="LENT">Carême</option>
              <option value="ADVENT">Avent</option>
              <option value="EASTER">Pâques</option>
              <option value="CHRISTMAS">Noël</option>
              <option value="FEAST">Fête / Solennité</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Titre de la Messe
          </label>
          <input
            type="text"
            placeholder="ex: 4ème Dimanche du Temps Ordinaire"
            className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-xs text-amber-700 font-medium">
            Note: La sélection détaillée des chants et lectures par section sera
            disponible dans la prochaine mise à jour. Pour l'instant, vous
            pouvez définir les informations générales.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
