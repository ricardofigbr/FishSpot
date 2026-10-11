import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';
import { useAuth } from '../../contexts/AuthContext';
import {
  firebaseEmailToUsername,
  getAuthErrorMessage,
  signOutAccount,
  updateAccountName,
  updateAccountPassword,
} from '../../services/firebaseAuth';

export default function UserPage() {
  const { user, deviceAuthenticationAvailable, deviceAuthenticationStatus } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState(user?.displayName ?? '');
  const [savedName, setSavedName] = useState(user?.displayName ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const username = firebaseEmailToUsername(user?.email);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword && !currentPassword) {
      Alert.alert('Atenção', 'Informe a senha atual para alterá-la.');
      return;
    }

    try {
      if (newPassword) {
        await updateAccountPassword(user, currentPassword, newPassword);
      }
      await updateAccountName(user, name);
      setSavedName(name.trim());
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch (error) {
      Alert.alert('Não foi possível atualizar', getAuthErrorMessage(error));
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
          <Text style={styles.avatarPlaceholderText}>
            {savedName ? savedName.slice(0, 1).toUpperCase() : 'FS'}
          </Text>
        </View>

        <Text style={styles.labelName}>{savedName || 'Usuário'}</Text>
        <Text style={styles.labelUsername}>@{username}</Text>
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

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setName(savedName);
            setCurrentPassword('');
            setNewPassword('');
            setModalVisible(true);
          }}
        >
          <Text style={styles.buttonText}>Editar Nome</Text>
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
                <Text style={styles.modalTitle}>Editar Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Senha atual (opcional)"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nova senha (opcional)"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Text style={styles.buttonText}>Salvar</Text>
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
