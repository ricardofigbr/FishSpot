import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface SpotModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  initialData?: {
    name: string;
    description: string;
    image?: string;
    photos?: string[];
  };
  onSave: (name: string, description: string, mainImage?: string, galleryPhotos?: string[]) => void;
}

export default function SpotModal({ visible, onClose, title, initialData, onSave }: SpotModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setMainImage(initialData.image);
      setGalleryPhotos(initialData.photos || []);
    } else {
      setName('');
      setDescription('');
      setMainImage(undefined);
      setGalleryPhotos([]);
    }
  }, [initialData, visible]);

  const pickMainImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMainImage(result.assets[0].uri);
    }
  };

  const pickGalleryPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setGalleryPhotos([...galleryPhotos, result.assets[0].uri]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'O nome do ponto de pesca é obrigatório.');
      return;
    }
    onSave(name.trim(), description.trim(), mainImage, galleryPhotos);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={localStyles.modalOverlay}>
        <View style={localStyles.modalContent}>
          <Text style={localStyles.modalTitle}>{title}</Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={localStyles.label}>Nome do Ponto *</Text>
            <TextInput
              style={localStyles.input}
              placeholder="Ex: Lagoa Azul"
              value={name}
              onChangeText={setName}
            />

            <Text style={localStyles.label}>Descrição</Text>
            <TextInput
              style={[localStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Detalhes sobre o local, iscas, peixes..."
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <Text style={localStyles.label}>Foto Principal</Text>
            <TouchableOpacity style={localStyles.imagePickerButton} onPress={pickMainImage}>
              {mainImage ? (
                <Image source={{ uri: mainImage }} style={localStyles.previewImage} />
              ) : (
                <Text style={localStyles.imagePickerText}>+ Adicionar Foto Principal</Text>
              )}
            </TouchableOpacity>

            <Text style={localStyles.label}>Fotos da Galeria ({galleryPhotos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {galleryPhotos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={localStyles.galleryThumbnail} />
              ))}
              <TouchableOpacity style={localStyles.addGalleryButton} onPress={pickGalleryPhoto}>
                <Text style={localStyles.imagePickerText}>+</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={localStyles.buttonContainer}>
              <TouchableOpacity style={[localStyles.btn, localStyles.cancelBtn]} onPress={onClose}>
                <Text style={localStyles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[localStyles.btn, localStyles.saveBtn]} onPress={handleSave}>
                <Text style={localStyles.btnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 15, fontSize: 14 },
  imagePickerButton: { borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 5, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 15, backgroundColor: '#f9f9f9' },
  previewImage: { width: '100%', height: '100%', borderRadius: 5 },
  imagePickerText: { color: '#666', fontWeight: '500' },
  galleryThumbnail: { width: 70, height: 70, borderRadius: 5, marginRight: 10 },
  addGalleryButton: { width: 70, height: 70, borderRadius: 5, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 5, alignItems: 'center', marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#6b7280' },
  saveBtn: { backgroundColor: '#2563eb' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});