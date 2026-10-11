import React, { useRef, useState } from 'react';

import {
  Alert,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import styles from './styles';

function CameraScreen() {
  const cameraRef = useRef<CameraView | null>(null);

  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [cameraPermission, requestCameraPermission] =
    useCameraPermissions();

  async function requestPermissions() {
    try {
      const cameraResult = await requestCameraPermission();

      if (!cameraResult.granted) {
        Alert.alert(
          'Permissão necessária',
          'É necessário permitir o uso da câmera.'
        );

        return;
      }

      Alert.alert(
        'Permissão concedida',
        'Agora você pode tirar fotos.'
      );
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível solicitar a permissão.'
      );
    }
  }

  function toggleCameraFacing() {
    setFacing(current =>
      current === 'back' ? 'front' : 'back'
    );
  }

  async function takePicture() {
    if (!cameraRef.current || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: true,
      });

      if (!photo || !photo.uri) {
        throw new Error(
          'A câmera não retornou uma foto válida.'
        );
      }

      const fileName =
        photo.uri.split('/').pop();

      console.log('Nome do arquivo:', fileName);
      console.log('URI temporária:', photo.uri);
      console.log('Base64:', photo.base64);

      console.log(
        'Tamanho do Base64:',
        photo.base64
          ? photo.base64.length
          : 0
      );

      setCapturedImage(photo.uri);
      setModalVisible(true);

      Alert.alert(
        'Foto capturada com sucesso',
        'A foto está disponível para visualização.'
      );
    } catch (error) {
      console.error(
        'Erro ao capturar a foto:',
        error
      );

      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível capturar a foto.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!cameraPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Verificando permissões...
        </Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>
          Permissão necessária
        </Text>

        <Text style={styles.permissionMessage}>
          Autorize o uso da câmera para tirar fotos.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
        >
          <Text style={styles.permissionButtonText}>
            Conceder permissão
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.cameraPreview}
          facing={facing}
          mode="picture"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
            disabled={isSaving}
          >
            <Image
              style={styles.icon}
              source={require('../../../assets/flip.png')}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isSaving && styles.disabledButton,
            ]}
            onPress={takePicture}
            disabled={isSaving}
          >
            <Image
              style={styles.captureIcon}
              source={require('../../../assets/camera.png')}
            />
          </TouchableOpacity>
        </View>

        {isSaving && (
          <View style={styles.savingContainer}>
            <Text style={styles.savingText}>
              Capturando foto...
            </Text>
          </View>
        )}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Image
              style={styles.closeIcon}
              source={require('../../../assets/close.png')}
            />
          </TouchableOpacity>

          {capturedImage && (
            <Image
              style={styles.previewImage}
              source={{ uri: capturedImage }}
              resizeMode="contain"
            />
          )}

          <Text style={styles.savedMessage}>
            Foto capturada
          </Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default function Camera() {
  return (
    <SafeAreaProvider>
      <CameraScreen />
    </SafeAreaProvider>
  );
}
