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
  Image as ImageIcon,
  Calendar,
  Edit2,
  Book
} from 'lucide-react-native';
import { initDB, findDocsByType, getMassByDate, saveDoc, getDoc } from './dbExpo';
import { Mass, Song, Reading } from './types';

const { width, height } = Dimensions.get('window');

export default function AppExpo() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [mass, setMass] = useState<Mass | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [isEditingMass, setIsEditingMass] = useState(false);
  const [availableCategories, setAvailableCategories] = useState(['Entrée', 'Kyrie', 'Gloria', 'Psaume', 'Alléluia', 'Offertoire', 'Sanctus', 'Anamnèse', 'Communion', 'Action de grâce', 'Envoi']);
  const [customCategory, setCustomCategory] = useState('');
  const [selectionModal, setSelectionModal] = useState<{
    visible: boolean;
    sectionId: string;
    type: 'song' | 'reading' | 'text';
  }>({ visible: false, sectionId: '', type: 'song' });

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
    const allReadings = await findDocsByType<Reading>('reading');
    setMass(todayMass);
    setSongs(allSongs);
    setReadings(allReadings);
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

  const handleSelectItem = async (itemId: string) => {
    if (!mass) return;

    let sectionFound = false;
    let newSections = mass.sections.map(section => {
      if (section.id === selectionModal.sectionId) {
        sectionFound = true;
        return {
          ...section,
          items: [{ type: selectionModal.type, id: itemId }]
        };
      }
      return section;
    });

    if (!sectionFound) {
      // Si la section n'existait pas dans l'objet, on l'ajoute
      const sectionName = selectionModal.sectionId.charAt(0).toUpperCase() + selectionModal.sectionId.slice(1).replace('_', ' ');
      newSections.push({
        id: selectionModal.sectionId,
        name: sectionName,
        items: [{ type: selectionModal.type, id: itemId }]
      });
    }

    const updatedMass = { ...mass, sections: newSections };
    await saveDoc(updatedMass);
    setMass(updatedMass);
    setSelectionModal({ ...selectionModal, visible: false });
  };

  const handleRemoveItem = async (sectionId: string) => {
    if (!mass) return;
    const newSections = mass.sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, items: [] };
      }
      return section;
    });
    const updatedMass = { ...mass, sections: newSections };
    await saveDoc(updatedMass);
    setMass(updatedMass);
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
        const liturgicalParts = [
          { name: 'Rites Initiaux', sections: ['entree', 'kyrie', 'gloria'] },
          { name: 'Liturgie de la Parole', sections: ['parole_1', 'psaume', 'parole_2', 'evangile', 'credo', 'universelle'] },
          { name: 'Liturgie Eucharistique', sections: ['offertoire', 'sanctus', 'anamnese', 'communion'] },
          { name: 'Rites de Conclusion', sections: ['envoi'] }
        ];

        return (
          <ScrollView style={styles.content}>
            <View style={styles.hero}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.heroTitle}>{mass?.title || 'Messe du jour'}</Text>
                  <Text style={styles.heroSubtitle}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                </View>
                {isAdmin && (
                  <TouchableOpacity 
                    style={[styles.editBtn, isEditingMass && styles.editBtnActive]}
                    onPress={() => setIsEditingMass(!isEditingMass)}
                  >
                    <Edit2 size={20} color={isEditingMass ? "#fff" : "#6366f1"} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {liturgicalParts.map((part) => (
              <View key={part.name} style={styles.liturgicalPart}>
                <Text style={styles.partTitle}>{part.name}</Text>
                
                {part.sections.map((sectionId) => {
                  const section = mass?.sections.find(s => s.id === sectionId);
                  if (!section && !isEditingMass) return null;
                  
                  // Si la section n'existe pas dans l'objet mass (vieux schéma), on l'affiche quand même si on est en mode édition
                  const displaySection = section || { id: sectionId, name: sectionId.replace('_', ' '), items: [] };

                  return (
                    <View key={sectionId} style={styles.section}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>{displaySection.name.toUpperCase()}</Text>
                        {isEditingMass && (
                          <TouchableOpacity 
                            onPress={() => setSelectionModal({ 
                              visible: true, 
                              sectionId: sectionId, 
                              type: sectionId.includes('parole') || sectionId.includes('lecture') || sectionId.includes('psaume') || sectionId.includes('evangile') ? 'reading' : 'song' 
                            })}
                          >
                            <Plus size={16} color="#6366f1" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {displaySection.items.length > 0 ? (
                        displaySection.items.map((item, idx) => {
                          const song = songs.find(s => s._id === item.id);
                          const reading = readings.find(r => r._id === item.id);
                          
                          return (
                            <View key={idx} style={styles.cardContainer}>
                              <TouchableOpacity 
                                style={styles.card}
                                onPress={() => {
                                  if (item.type === 'song' && song) setSelectedSong(song);
                                  if (item.type === 'reading' && reading) setSelectedReading(reading);
                                }}
                              >
                                <View style={styles.cardLeft}>
                                  <View style={styles.iconContainer}>
                                    {item.type === 'song' ? <Music size={20} color="#6366f1" /> : <Book size={20} color="#10b981" />}
                                  </View>
                                  <View style={styles.flex1}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>
                                      {item.type === 'song' ? (song?.title || 'Chant inconnu') : (reading?.reference || 'Lecture inconnue')}
                                    </Text>
                                    <Text style={styles.cardSubtitle}>
                                      {item.type === 'song' ? `${song?.reference || ''} • ${song?.book || ''}` : (reading?.readingType || 'LECTURE')}
                                    </Text>
                                  </View>
                                </View>
                                <ChevronRight size={20} color="#d1d5db" />
                              </TouchableOpacity>
                              {isEditingMass && (
                                <TouchableOpacity 
                                  style={styles.removeBtn}
                                  onPress={() => handleRemoveItem(sectionId)}
                                >
                                  <X size={16} color="#ef4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })
                      ) : (
                        isEditingMass && (
                          <TouchableOpacity 
                            style={styles.emptyCard}
                            onPress={() => setSelectionModal({ 
                              visible: true, 
                              sectionId: sectionId, 
                              type: sectionId.includes('parole') || sectionId.includes('lecture') || sectionId.includes('psaume') || sectionId.includes('evangile') ? 'reading' : 'song' 
                            })}
                          >
                            <Text style={styles.emptyCardText}>Ajouter un élément...</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        );

      case 'repertoire':
        const categories = ['Entrée', 'Kyrie', 'Gloria', 'Psaume', 'Alléluia', 'Offertoire', 'Sanctus', 'Anamnèse', 'Communion', 'Action de grâce', 'Envoi'];
        
        const filteredSongs = songs.filter(s => {
          const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               s.reference.includes(searchQuery);
          const matchesCategory = !selectedCategory || (s.categories && s.categories.includes(selectedCategory));
          return matchesSearch && matchesCategory;
        });

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
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
              >
                <TouchableOpacity 
                  style={[styles.categoryBtn, !selectedCategory && styles.categoryBtnActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.categoryBtnText, !selectedCategory && styles.categoryBtnTextActive]}>Tous</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryBtnText, selectedCategory === cat && styles.categoryBtnTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
                    <View style={styles.flex1}>
                      <Text style={styles.cardTitle}>{song.title}</Text>
                      <Text style={styles.cardSubtitle}>{song.reference} • {song.book}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#d1d5db" />
                </TouchableOpacity>
              ))}
              {filteredSongs.length === 0 && (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>Aucun chant trouvé</Text>
                </View>
              )}
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

            <Text style={styles.inputLabel}>Moment Liturgique</Text>
            <View style={styles.chipContainer}>
              {availableCategories.map(cat => (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.chip, newSong.categories?.includes(cat) && styles.chipActive]}
                  onPress={() => {
                    const current = newSong.categories || [];
                    if (current.includes(cat)) {
                      setNewSong({...newSong, categories: current.filter(c => c !== cat)});
                    } else {
                      setNewSong({...newSong, categories: [...current, cat]});
                    }
                  }}
                >
                  <Text style={[styles.chipText, newSong.categories?.includes(cat) && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.row, { marginTop: 10 }]}>
              <TextInput 
                style={[styles.input, styles.flex1]}
                placeholder="Ajouter un autre moment..."
                value={customCategory}
                onChangeText={setCustomCategory}
              />
              <TouchableOpacity 
                style={styles.addChipBtn}
                onPress={() => {
                  if (customCategory.trim()) {
                    const cat = customCategory.trim();
                    if (!availableCategories.includes(cat)) {
                      setAvailableCategories([...availableCategories, cat]);
                    }
                    const current = newSong.categories || [];
                    if (!current.includes(cat)) {
                      setNewSong({...newSong, categories: [...current, cat]});
                    }
                    setCustomCategory('');
                  }
                }}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Selection Modal */}
      <Modal visible={selectionModal.visible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectionModal({ ...selectionModal, visible: false })}>
              <X size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Sélectionner {selectionModal.type === 'song' ? 'un chant' : 'une lecture'}</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#9ca3af" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Rechercher..."
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          <ScrollView style={styles.modalContent}>
            {selectionModal.type === 'song' ? (
              songs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(song => (
                <TouchableOpacity 
                  key={song._id} 
                  style={styles.card}
                  onPress={() => handleSelectItem(song._id)}
                >
                  <Text style={styles.cardTitle}>{song.title}</Text>
                  <Text style={styles.cardSubtitle}>{song.reference}</Text>
                </TouchableOpacity>
              ))
            ) : (
              readings.map(reading => (
                <TouchableOpacity 
                  key={reading._id} 
                  style={styles.card}
                  onPress={() => handleSelectItem(reading._id)}
                >
                  <Text style={styles.cardTitle}>{reading.reference}</Text>
                  <Text style={styles.cardSubtitle}>{reading.readingType}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Reading Detail Modal */}
      <Modal
        visible={!!selectedReading}
        animationType="slide"
        onRequestClose={() => setSelectedReading(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedReading(null)}>
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>{selectedReading?.readingType}</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.songRef}>{selectedReading?.reference}</Text>
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsText}>{selectedReading?.content}</Text>
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { padding: 10, backgroundColor: '#f5f3ff', borderRadius: 12 },
  editBtnActive: { backgroundColor: '#6366f1' },
  liturgicalPart: { marginBottom: 30, backgroundColor: '#f9fafb', padding: 15, borderRadius: 25 },
  partTitle: { fontSize: 18, fontWeight: '800', color: '#4b5563', marginBottom: 15, marginLeft: 5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9ca3af', marginBottom: 10, letterSpacing: 1.2, marginLeft: 5 },
  cardContainer: { position: 'relative' },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fee2e2', padding: 5, borderRadius: 10, zIndex: 10, borderWidth: 1, borderColor: '#fecaca' },
  emptyCard: { padding: 20, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center' },
  emptyCardText: { color: '#9ca3af', fontWeight: '600' },
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
  categoryScroll: { marginTop: 15 },
  categoryContent: { paddingHorizontal: 20, gap: 10 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  categoryBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  categoryBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  categoryBtnTextActive: { color: '#fff' },
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
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  chipTextActive: { color: '#fff' },
  addChipBtn: { backgroundColor: '#6366f1', width: 50, height: 50, borderRadius: 12, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
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
