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
  Modal
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
  Play
} from 'lucide-react-native';
import { initDB, findDocsByType, getMassByDate } from './dbExpo';
import { Mass, Song, Reading } from './types';

const { width } = Dimensions.get('window');

export default function AppExpo() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [mass, setMass] = useState<Mass | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const setup = async () => {
      await initDB();
      const today = new Date().toISOString().split('T')[0];
      const todayMass = await getMassByDate(today);
      const allSongs = await findDocsByType<Song>('song');
      
      setMass(todayMass);
      setSongs(allSongs);
      setLoading(false);
    };
    setup();
  }, []);

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
            <View style={styles.searchBar}>
              <Search size={20} color="#9ca3af" />
              <Text style={styles.searchPlaceholder}>Rechercher un chant...</Text>
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
            </ScrollView>
          </View>
        );

      default:
        return (
          <View style={styles.centered}>
            <Settings size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Paramètres bientôt disponibles</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Liturgia</Text>
        <TouchableOpacity style={styles.adminBtn}>
          <Plus size={20} color="#6366f1" />
        </TouchableOpacity>
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
              <Text style={styles.songAuthor}>{selectedSong?.author}</Text>
            </View>

            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsText}>{selectedSong?.lyrics}</Text>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn}>
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
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', 
    margin: 20, padding: 12, borderRadius: 15 
  },
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
  emptyText: { marginTop: 15, color: '#9ca3af', fontSize: 16, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' 
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  modalContent: { flex: 1, padding: 25 },
  songMeta: { marginBottom: 30 },
  songRef: { fontSize: 14, fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 },
  songAuthor: { fontSize: 16, color: '#6b7280' },
  lyricsContainer: { backgroundColor: '#f9fafb', padding: 20, borderRadius: 20, marginBottom: 30 },
  lyricsText: { fontSize: 17, lineHeight: 28, color: '#374151', textAlign: 'center' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  actionBtn: { alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6', width: width * 0.4 },
  actionLabel: { marginTop: 8, fontWeight: '700', color: '#4b5563' }
});
