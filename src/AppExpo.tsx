import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { 
  Home, 
  BookOpen, 
  Settings, 
  Music, 
  ChevronRight, 
  Search, 
  Plus, 
  ArrowLeft,
  FileText,
  Play,
  X,
  Check,
  Image as ImageIcon
} from 'lucide-react-native';
import { initDB, findDocsByType, getMassByDate, saveDoc } from './dbExpo';
import { Mass, Song, Reading } from './types';

const { width, height } = Dimensions.get('window');

export default function AppExpo() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [mass, setMass] = useState<Mass | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);

  // Formulaire nouveau chant
  const [newSong, setNewSong] = useState<Partial<Song>>({
    type: 'song',
    title: '',
    reference: '',
    book: 'Toyembani',
    lyrics: '',
    categories: [],
    sheetMusicUrls: []
  });

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayMass = await getMassByDate(today);
    const allSongs = await findDocsByType<Song>('song');
    setMass(todayMass);
    setSongs(allSongs);
  };

  useEffect(() => {
    const setup = async () => {
      await initDB();
      await loadData();
      setLoading(false);
    };
    setup();
  }, []);

  const handleSaveSong = async () => {
    if (!newSong.title || !newSong.reference) {
      Alert.alert("Erreur", "Le titre et la référence sont obligatoires.");
      return;
    }

    try {
      const songToSave = {
        ...newSong,
        _id: `song:${newSong.reference.replace(/\s+/g, '_')}`,
        type: 'song'
      } as Song;

      await saveDoc(songToSave);
      await loadData();
      setShowAddModal(false);
      setNewSong({ type: 'song', title: '', reference: '', book: 'Toyembani', lyrics: '', categories: [], sheetMusicUrls: [] });
      Alert.alert("Succès", "Le chant a été ajouté au répertoire.");
    } catch (err) {
      Alert.alert("Erreur", "Impossible de sauvegarder le chant.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement de la liturgie...</Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>{mass?.title || 'Messe du jour'}</Text>
              <Text style={styles.heroSubtitle}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>

            {mass?.sections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.name.toUpperCase()}</Text>
                {section.items.map((item, idx) => {
                  const song = songs.find(s => s._id === item.id);
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.card}
                      onPress={() => song && setSelectedSong(song)}
                    >
                      <View style={styles.cardLeft}>
                        <View style={styles.iconContainer}>
                          <Music size={20} color="#6366f1" />
                        </View>
                        <View>
                          <Text style={styles.cardTitle}>{song?.title || item.id}</Text>
                          <Text style={styles.cardSubtitle}>{song?.reference} • {song?.book}</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#d1d5db" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        );

      case 'repertoire':
        const filteredSongs = songs.filter(s => 
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.reference.includes(searchQuery)
        );

        return (
          <View style={styles.flex1}>
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color="#9ca3af" />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Rechercher un chant..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <ScrollView style={styles.content}>
              {filteredSongs.map((song) => (
                <TouchableOpacity 
                  key={song._id} 
                  style={styles.card}
                  onPress={() => setSelectedSong(song)}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <Music size={20} color="#6366f1" />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{song.title}</Text>
                      <Text style={styles.cardSubtitle}>{song.reference} • {song.book}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        );

      default:
        return (
          <View style={styles.centered}>
            <Settings size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Paramètres</Text>
            <TouchableOpacity 
              style={[styles.adminToggle, isAdmin && styles.adminToggleActive]}
              onPress={() => setIsAdmin(!isAdmin)}
            >
              <Text style={[styles.adminToggleText, isAdmin && styles.adminToggleTextActive]}>
                {isAdmin ? 'Mode Administrateur Activé' : 'Passer en mode Administrateur'}
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Liturgia</Text>
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>

      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.nav}>
        <NavButton 
          active={activeTab === 'home'} 
          onPress={() => setActiveTab('home')}
          icon={<Home size={24} color={activeTab === 'home' ? '#6366f1' : '#9ca3af'} />}
          label="Messe"
        />
        <NavButton 
          active={activeTab === 'repertoire'} 
          onPress={() => setActiveTab('repertoire')}
          icon={<BookOpen size={24} color={activeTab === 'repertoire' ? '#6366f1' : '#9ca3af'} />}
          label="Chants"
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onPress={() => setActiveTab('settings')}
          icon={<Settings size={24} color={activeTab === 'settings' ? '#6366f1' : '#9ca3af'} />}
          label="Plus"
        />
      </View>

      {/* Add Song Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Nouveau Chant</Text>
            <TouchableOpacity onPress={handleSaveSong}>
              <Check size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Titre du chant</Text>
            <TextInput 
              style={styles.input}
              placeholder="Ex: Seigneur, rassemble-nous"
              value={newSong.title}
              onChangeText={(t) => setNewSong({...newSong, title: t})}
            />
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>Référence</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: 1117"
                  value={newSong.reference}
                  onChangeText={(t) => setNewSong({...newSong, reference: t})}
                />
              </View>
              <View style={{ width: 20 }} />
              <View style={styles.flex1}>
                <Text style={styles.inputLabel}>Recueil</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Toyembani"
                  value={newSong.book}
                  onChangeText={(t) => setNewSong({...newSong, book: t})}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Paroles</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              placeholder="Saisissez les paroles ici..."
              multiline
              numberOfLines={10}
              value={newSong.lyrics}
              onChangeText={(t) => setNewSong({...newSong, lyrics: t})}
            />

            <Text style={styles.inputLabel}>URL de la partition (Image)</Text>
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, styles.flex1]}
                placeholder="https://..."
                onChangeText={(t) => setNewSong({...newSong, sheetMusicUrls: t ? [t] : []})}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Song Detail Modal */}
      <Modal
        visible={!!selectedSong}
        animationType="slide"
        onRequestClose={() => setSelectedSong(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedSong(null)}>
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selectedSong?.title}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.songMeta}>
              <Text style={styles.songRef}>{selectedSong?.reference} • {selectedSong?.book}</Text>
              <Text style={styles.songAuthor}>{selectedSong?.author || 'Auteur inconnu'}</Text>
            </View>

            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsText}>{selectedSong?.lyrics}</Text>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => setShowSheetModal(true)}
              >
                <FileText size={24} color="#6366f1" />
                <Text style={styles.actionLabel}>Partition</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Play size={24} color="#6366f1" />
                <Text style={styles.actionLabel}>Écouter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Sheet Music Modal */}
        <Modal visible={showSheetModal} transparent animationType="fade">
          <View style={styles.fullScreenModal}>
            <SafeAreaView style={styles.flex1}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShowSheetModal(false)} style={styles.closeBtn}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Partition</Text>
                <View style={{ width: 40 }} />
              </View>
              
              <ScrollView 
                contentContainerStyle={styles.sheetScroll}
                maximumZoomScale={3}
                minimumZoomScale={1}
              >
                {selectedSong?.sheetMusicUrls && selectedSong.sheetMusicUrls.length > 0 ? (
                  selectedSong.sheetMusicUrls.map((url, idx) => (
                    <Image 
                      key={idx}
                      source={{ uri: url }}
                      style={styles.sheetImage}
                      resizeMode="contain"
                    />
                  ))
                ) : (
                  <View style={styles.noSheet}>
                    <ImageIcon size={64} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.noSheetText}>Aucune partition disponible</Text>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

function NavButton({ active, onPress, icon, label }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.navButton}>
      {icon}
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  headerBrand: { fontSize: 22, fontWeight: '800', color: '#6366f1', letterSpacing: -0.5 },
  adminBtn: { padding: 8, backgroundColor: '#f5f3ff', borderRadius: 10 },
  content: { flex: 1, padding: 20 },
  hero: { marginBottom: 30 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 4 },
  heroSubtitle: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 12, letterSpacing: 1.5 },
  card: { 
    backgroundColor: '#fff', padding: 16, borderRadius: 20, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  cardSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  searchContainer: { backgroundColor: '#fff', paddingBottom: 10 },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', 
    marginHorizontal: 20, marginTop: 10, padding: 12, borderRadius: 15 
  },
  searchInput: { flex: 1, marginLeft: 10, color: '#1f2937', fontSize: 16, padding: 0 },
  searchPlaceholder: { marginLeft: 10, color: '#9ca3af', fontSize: 16 },
  nav: { 
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, 
    borderTopWidth: 1, borderTopColor: '#f3f4f6', justifyContent: 'space-around' 
  },
  navButton: { alignItems: 'center', width: 80 },
  navLabel: { fontSize: 11, color: '#9ca3af', marginTop: 5, fontWeight: '700' },
  navLabelActive: { color: '#6366f1' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 15, color: '#6b7280', fontWeight: '500' },
  emptyText: { marginTop: 15, color: '#9ca3af', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  adminToggle: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#f3f4f6' },
  adminToggleActive: { backgroundColor: '#e0e7ff' },
  adminToggleText: { color: '#4b5563', fontWeight: '700' },
  adminToggleTextActive: { color: '#6366f1' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' 
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  modalContent: { flex: 1, padding: 25 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#4b5563', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 15, fontSize: 16, color: '#1f2937' },
  textArea: { height: 150, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center' },
  songMeta: { marginBottom: 30 },
  songRef: { fontSize: 14, fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 },
  songAuthor: { fontSize: 16, color: '#6b7280' },
  lyricsContainer: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 20, marginBottom: 30 },
  lyricsText: { fontSize: 17, lineHeight: 28, color: '#374151', textAlign: 'center' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  actionBtn: { alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6', width: width * 0.4 },
  actionLabel: { marginTop: 8, fontWeight: '700', color: '#4b5563' },
  fullScreenModal: { flex: 1, backgroundColor: '#000' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 10 },
  sheetScroll: { alignItems: 'center', paddingBottom: 40 },
  sheetImage: { width: width, height: height * 0.8, marginBottom: 20 },
  noSheet: { height: height * 0.6, justifyContent: 'center', alignItems: 'center' },
  noSheetText: { color: 'rgba(255,255,255,0.5)', marginTop: 20, fontSize: 16 }
});
