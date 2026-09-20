import React, { useState, useEffect, useContext } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { SpotsContext } from '../contexts/SpotsContext';

export default function SpotModal() {
  const { 
    isModalOpen, 
    isEditing, 
    currentSpot, 
    validationError, 
    saveSpot, 
    closeModal 
  } = useContext(SpotsContext);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Preenche os campos caso seja uma edição
  useEffect(() => {
    if (isModalOpen && currentSpot) {
      setName(currentSpot.name || '');
      setDescription(currentSpot.description || '');
      setPhoto(currentSpot.photo || null);
    }
  }, [isModalOpen, currentSpot]);

  const handleSave = () => {
    saveSpot({ name, description, photo });
  };

  const handleAddPhoto = () => {
    // Simulação do expo-image-picker
    setPhoto('file://imagem_teste.jpg');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalOpen}
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            {isEditing ? 'Editar Ponto de Pesca' : 'Novo Ponto de Pesca'}
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome do Ponto"
            placeholderTextColor="#999"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição (opcional)"
            placeholderTextColor="#999"
            multiline
          />

          <TouchableOpacity style={styles.photoButton} onPress={handleAddPhoto}>
            <Text style={styles.photoButtonText}>
              {photo ? 'Foto Adicionada (Trocar)' : 'Adicionar Foto da Câmera'}
            </Text>
          </TouchableOpacity>

          {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={closeModal}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  photoButton: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  photoButtonText: { color: '#333', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 15, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#ff4c4c' },
  saveButton: { backgroundColor: '#4caf50' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});