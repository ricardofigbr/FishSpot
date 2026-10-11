import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { SpotsContext, FishingSpot } from '../../contexts/SpotsContext';
import SpotModal from '../../components/SpotModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListScreen() {
  const { spots, updateSpot, deleteSpot } = useContext(SpotsContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FishingSpot | null>(null);

  // Estado para armazenar a imagem que está sendo exibida em foco
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleOpenEdit = (spot: FishingSpot) => {
    setEditingSpot(spot);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={localStyles.container}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={localStyles.card}>
            <View style={localStyles.cardHeader}>
              {item.image ? (
                <TouchableOpacity onPress={() => setSelectedImage(item.image ?? null)}>
                  <Image source={{ uri: item.image }} style={localStyles.circularAvatar} />
                </TouchableOpacity>
              ) : (
                <View style={[localStyles.circularAvatar, localStyles.placeholderAvatar]}>
                  <Text style={localStyles.placeholderText}>Foto</Text>
                </View>
              )}

              <View style={localStyles.infoContainer}>
                <Text style={localStyles.title}>{item.name}</Text>
                {item.description ? <Text style={localStyles.description}>{item.description}</Text> : null}
              </View>
            </View>

            {item.photos && item.photos.length > 0 && (
              <View style={localStyles.galleryContainer}>
                <Text style={localStyles.galleryLabel}>Outras fotos do local:</Text>
                <FlatList
                  data={item.photos}
                  horizontal
                  keyExtractor={(imgUri, index) => index.toString()}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item: imgUri }) => (
                    <TouchableOpacity onPress={() => setSelectedImage(imgUri)}>
                      <Image source={{ uri: imgUri }} style={localStyles.galleryImage} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            
            <View style={localStyles.buttonContainer}>
              <TouchableOpacity 
                style={[localStyles.button, localStyles.editButton]}
                onPress={() => handleOpenEdit(item)}
              >
                <Text style={localStyles.buttonText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[localStyles.button, localStyles.deleteButton]}
                onPress={() => deleteSpot(item.id)}
              >
                <Text style={localStyles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={localStyles.emptyText}>Nenhum ponto de pesca salvo.</Text>}
      />

      {/* Modal para foco/visualização de foto em tela cheia */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity 
          style={localStyles.fullImageOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity 
            style={localStyles.closeButton} 
            onPress={() => setSelectedImage(null)}
          >
            <Text style={localStyles.closeButtonText}>✕ Fechar</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={localStyles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </TouchableOpacity>
      </Modal>

      <SpotModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSpot(null);
        }}
        title="Editar Ponto de Pesca"
        initialData={editingSpot ? {
          name: editingSpot.name,
          description: editingSpot.description,
          image: editingSpot.image,
          photos: editingSpot.photos
        } : undefined}
        onSave={(name, description, mainImage, galleryPhotos) => {
          if (editingSpot) {
            updateSpot(editingSpot.id, name, description, mainImage, galleryPhotos);
            setModalVisible(false);
            setEditingSpot(null);
            Alert.alert('Sucesso', 'Ponto de pesca atualizado com sucesso!');
          }
        }}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  circularAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: '#e5e7eb' },
  placeholderAvatar: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 12, color: '#666' },
  infoContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  description: { fontSize: 14, color: '#666', marginTop: 4 },
  galleryContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  galleryLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 },
  galleryImage: { width: 60, height: 60, borderRadius: 6, marginRight: 8, backgroundColor: '#ddd' },
  buttonContainer: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  button: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center', marginHorizontal: 5 },
  editButton: { backgroundColor: '#2196F3' },
  deleteButton: { backgroundColor: '#f44336' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },

  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fullImage: {
    width: '95%',
    height: '80%',
  },
});