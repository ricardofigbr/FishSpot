import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';
import { useAuth } from '../../contexts/AuthContext';
import {
  firebaseEmailToUsername,
  getAuthErrorMessage,
  normalizeUsername,
  signOutAccount,
  updateAccountProfile,
  updateAccountCredentials,
} from '../../services/firebaseAuth';

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

export default function UserPage() {
  const { user, deviceAuthenticationAvailable, deviceAuthenticationStatus } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState(user?.displayName ?? '');
  const [savedName, setSavedName] = useState(user?.displayName ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoURL ?? null);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(user?.photoURL ?? null);
  const initialUsername = firebaseEmailToUsername(user?.email);
  const [username, setUsername] = useState(initialUsername);
  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = () => {
    setName(user?.displayName ?? savedName);
    setPhotoUrl(user?.photoURL ?? savedPhotoUrl);
    setUsername(firebaseEmailToUsername(user?.email) || savedUsername);
    setCurrentPassword('');
    setNewPassword('');
    setModalVisible(true);
  };

  const handleChoosePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher uma imagem de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Não foi possível escolher a foto', getAuthErrorMessage(error));
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;
    const normalizedUsername = normalizeUsername(username);
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.');
      return;
    }

    if (!usernamePattern.test(normalizedUsername)) {
      Alert.alert('Atenção', 'Use um usuário com 3 a 30 letras, números, ponto, hífen ou sublinhado.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    const usernameChanged = normalizedUsername !== savedUsername;
    if ((usernameChanged || newPassword) && !currentPassword) {
      Alert.alert('Atenção', 'Informe a senha atual para alterar o usuário ou a senha.');
      return;
    }

    setSaving(true);
    try {
      if (usernameChanged || newPassword) {
        await updateAccountCredentials(
          user,
          currentPassword,
          usernameChanged ? normalizedUsername : null,
          newPassword || null,
        );
      }
      await updateAccountProfile(user, name, photoUrl);
      setSavedName(name.trim());
      setSavedPhotoUrl(photoUrl);
      setUsername(normalizedUsername);
      setSavedUsername(normalizedUsername);
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch (error) {
      Alert.alert('Não foi possível atualizar', getAuthErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAccount();
    } catch (error) {
      Alert.alert('Não foi possível sair', getAuthErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Meu Perfil</Text>

      <View style={styles.card}>
        <View style={styles.avatarPlaceholder}>
          {savedPhotoUrl ? (
            <Image source={{ uri: savedPhotoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarPlaceholderText}>
              {savedName ? savedName.slice(0, 1).toUpperCase() : 'FS'}
            </Text>
          )}
        </View>

        <Text style={styles.labelName}>{savedName || 'Usuário'}</Text>
        <Text style={styles.labelUsername}>@{savedUsername}</Text>
        <Text style={styles.biometricInfo}>
          {deviceAuthenticationAvailable
            ? deviceAuthenticationStatus === 'device-credential'
              ? 'Ao voltar ao FishSpot, o padrão ou código de bloqueio deste aparelho será solicitado.'
              : 'Ao voltar ao FishSpot, a biometria ou o código de bloqueio do aparelho será solicitado.'
            : deviceAuthenticationStatus === 'checking'
              ? 'Verificando a autenticação deste aparelho...'
              : deviceAuthenticationStatus === 'not-enrolled'
                ? 'O aparelho tem sensor biométrico, mas não há impressão digital, rosto ou bloqueio de tela configurado para confirmar a identidade.'
                : deviceAuthenticationStatus === 'unsupported'
                  ? 'O sistema não detectou biometria nem padrão ou código de bloqueio configurado.'
                  : 'O app não conseguiu consultar a autenticação do aparelho. Feche e abra o app; se continuar, pode ser necessário instalar uma nova build.'}
        </Text>

        <TouchableOpacity style={styles.editButton} onPress={handleOpenEdit}>
          <Text style={styles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                keyboardDismissMode="none"
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Editar Perfil</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Escolher foto do perfil"
                  style={styles.photoPickerButton}
                  onPress={() => void handleChoosePhoto()}
                >
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
                  ) : (
                    <Text style={styles.photoPickerText}>Escolher foto</Text>
                  )}
                </TouchableOpacity>
                {photoUrl && (
                  <TouchableOpacity onPress={() => setPhotoUrl(null)}>
                    <Text style={styles.removePhotoText}>Remover foto</Text>
                  </TouchableOpacity>
                )}
                <TextInput
                  style={styles.input}
                  accessibilityLabel="Nome do perfil"
                  placeholder="Nome"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  accessibilityLabel="Nome de usuário"
                  placeholder="Usuário"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />
                <TextInput
                  style={styles.input}
                  accessibilityLabel="Senha atual"
                  placeholder="Senha atual (necessária para alterar usuário ou senha)"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.input}
                  accessibilityLabel="Nova senha"
                  placeholder="Nova senha (opcional)"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, saving && styles.disabledButton]}
                    onPress={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Salvar alterações</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
