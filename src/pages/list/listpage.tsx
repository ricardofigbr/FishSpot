import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  ListRenderItemInfo,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SpotsContext, FishingSpot } from './spotscontext';
import styles from './styles';

export default function ListScreen() {
  const { spots, updateSpot, deleteSpot } = useContext(SpotsContext);
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);

  const handleEdit = (spot: FishingSpot) => {
    setSelectedSpot(spot);
    setName(spot.name);
    setDescription(spot.description);
    setMainImage(spot.image || null);
    setGalleryPhotos(spot.photos || []);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (selectedSpot) {
      updateSpot(
        selectedSpot.id, 
        name, 
        description, 
        mainImage || undefined, 
        galleryPhotos
      );
      setModalVisible(false);
      setSelectedSpot(null);
    }
  };

  const pickImage = async (target: 'main' | 'gallery') => {
    Alert.alert(
      'Selecionar Imagem',
      'Escolha a origem:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar Foto', onPress: () => launchPicker(target, 'camera') },
        { text: 'Galeria', onPress: () => launchPicker(target, 'library') },
      ],
      { cancelable: true }
    );
  };

  const launchPicker = async (target: 'main' | 'gallery', type: 'camera' | 'library') => {
    let perm = type === 'camera' 
      ? await ImagePicker.requestCameraPermissionsAsync() 
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos de permissão para acessar a imagem.');
      return;
    }

    let result = type === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: target === 'gallery' });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (target === 'main') {
        setMainImage(result.assets[0].uri);
      } else {
        const newUris = result.assets.map(a => a.uri);
        setGalleryPhotos(prev => [...prev, ...newUris]);
      }
    }
  };

  const removeGalleryPhoto = (indexToRemove: number) => {
    setGalleryPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const confirmDelete = (spot: FishingSpot) => {
    Alert.alert(
      'Excluir Ponto',
      `Você tem certeza que quer deletar "${spot.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', onPress: () => deleteSpot(spot.id), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: ListRenderItemInfo<FishingSpot>) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {item.image && (
            <TouchableOpacity onPress={() => setZoomImageUri(item.image ?? null)}>
              <Image source={{ uri: item.image }} style={{ width: 45, height: 45, borderRadius: 22.5, marginRight: 10 }} resizeMode="cover" />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.date}>{item.createdAt}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      {/* Miniaturas de fotos adicionais da descrição */}
      {item.photos && item.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {item.photos.map((photoUri, idx) => (
            <TouchableOpacity key={idx} onPress={() => setZoomImageUri(photoUri)}>
              <Image source={{ uri: photoUri }} style={{ width: 55, height: 55, borderRadius: 6, marginRight: 8 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.coords}>
        Lat: {item.latitude.toFixed(5)} | Lon: {item.longitude.toFixed(5)}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Text style={styles.btnText}>Editar / Fotos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
          <Text style={styles.btnText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {(spots?.length || 0) === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum ponto de pesca salvo ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal de Edição */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Editar Ponto & Fotos</Text>

              {/* Foto Principal (Ícone) */}
              <Text style={styles.label}>Foto de Ícone Principal:</Text>
              <TouchableOpacity style={{ alignSelf: 'center', marginBottom: 15 }} onPress={() => pickImage('main')}>
                {mainImage ? (
                  <Image source={{ uri: mainImage }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                ) : (
                  <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#555', textAlign: 'center' }}>Add Ícone</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Fotos da Descrição / Galeria */}
              <Text style={styles.label}>Fotos Adicionais (Descrição):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                <TouchableOpacity 
                  style={{ width: 60, height: 60, borderRadius: 6, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
                  onPress={() => pickImage('gallery')}
                >
                  <Text style={{ fontSize: 24, color: '#555' }}>+</Text>
                </TouchableOpacity>
                {galleryPhotos.map((uri, index) => (
                  <View key={index} style={{ position: 'relative', marginRight: 8 }}>
                    <TouchableOpacity onPress={() => setZoomImageUri(uri)}>
                      <Image source={{ uri }} style={{ width: 60, height: 60, borderRadius: 6 }} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => removeGalleryPhoto(index)}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <Text style={styles.label}>Nome do Ponto:</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Ponto dos Robalos"
              />

              <Text style={styles.label}>Descrição:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Isca recomendada..."
                multiline
              />

              <View style={styles.modalButtons}>
                <Button title="Cancelar" color="#888" onPress={() => setModalVisible(false)} />
                <Button title="Salvar" color="#2e7d32" onPress={handleSave} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Zoom de Imagem */}
      <Modal visible={!!zoomImageUri} transparent animationType="fade" onRequestClose={() => setZoomImageUri(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 }} 
            onPress={() => setZoomImageUri(null)}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕ Fechar</Text>
          </TouchableOpacity>
          {zoomImageUri && (
            <Image source={{ uri: zoomImageUri }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}