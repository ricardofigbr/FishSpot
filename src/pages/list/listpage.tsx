import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SpotsContext, FishingSpot } from '../../contexts/SpotsContext';
import SpotModal from '../../components/SpotModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';

export default function ListScreen() {
  const {
    spots,
    spotsLoading,
    spotsPendingWrites,
    spotsError,
    updateSpot,
    deleteSpot,
  } = useContext(SpotsContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FishingSpot | null>(null);

  // Estado para armazenar a imagem que está sendo exibida em foco
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleOpenEdit = (spot: FishingSpot) => {
    setEditingSpot(spot);
    setModalVisible(true);
  };

  const handleDelete = async (spotId: string) => {
    try {
      await deleteSpot(spotId);
    } catch (error) {
      Alert.alert(
        'Não foi possível excluir',
        error instanceof Error ? error.message : 'Tente novamente quando estiver conectado.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={(
          spotsError || spotsPendingWrites
            ? (
              <Text style={[styles.emptyText, styles.syncMessage]}>
                {spotsError ?? 'Alterações aguardando sincronização.'}
              </Text>
            )
            : null
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {item.image ? (
                <TouchableOpacity onPress={() => setSelectedImage(item.image ?? null)}>
                  <Image source={{ uri: item.image }} style={styles.circularAvatar} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.circularAvatar, styles.placeholderAvatar]}>
                  <Text style={styles.placeholderText}>Foto</Text>
                </View>
              )}

              <View style={styles.infoContainer}>
                <Text style={styles.title}>{item.name}</Text>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              </View>
            </View>

            {item.photos && item.photos.length > 0 && (
              <View style={styles.galleryContainer}>
                <Text style={styles.galleryLabel}>Outras fotos do local:</Text>
                <FlatList
                  data={item.photos}
                  horizontal
                  keyExtractor={(imgUri, index) => index.toString()}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item: imgUri }) => (
                    <TouchableOpacity onPress={() => setSelectedImage(imgUri)}>
                      <Image source={{ uri: imgUri }} style={styles.galleryImage} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.editButton]}
                onPress={() => handleOpenEdit(item)}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]}
                onPress={() => void handleDelete(item.id)}
              >
                <Text style={styles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <Text style={styles.emptyText}>
            {spotsLoading
              ? 'Carregando seus pontos...'
              : 'Nenhum ponto de pesca salvo nesta conta.'}
          </Text>
        )}
      />

      {/* Modal para foco/visualização de foto em tela cheia */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity 
          style={styles.fullImageOverlay}
          activeOpacity={1} 
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeButtonText}>✕ Fechar</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.fullImage}
              resizeMode="contain" 
            />
          )}
        </TouchableOpacity>
      </Modal>

      <SpotModal
        key={modalVisible ? editingSpot?.id ?? 'new-spot' : 'closed'}
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
            void updateSpot(editingSpot.id, name, description, mainImage, galleryPhotos)
              .then(() => {
                setModalVisible(false);
                setEditingSpot(null);
                Alert.alert(
                  'Solicitação enviada',
                  'O Firebase ainda precisa confirmar a alteração. Consulte o aviso desta lista se houver algum problema.',
                );
              })
              .catch((error) => {
                Alert.alert(
                  'Não foi possível atualizar',
                  error instanceof Error ? error.message : 'Tente novamente quando estiver conectado.',
                );
              });
          }
        }}
      />
    </SafeAreaView>
  );
}
