import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserPage() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [user, setUser] = useState<{ name: string; username: string; password?: string; photo?: string | null } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const loadUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('@fishspot_user');
      if (userJson) {
        const parsed = JSON.parse(userJson);
        setUser(parsed);
        setName(parsed.name || '');
        setUsername(parsed.username || '');
        setPassword(parsed.password || '');
        setPhoto(parsed.photo || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const updatedUser = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password,
        photo: photo,
      };

      await AsyncStorage.setItem('@fishspot_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Informações atualizadas com sucesso!');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar os dados.');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@fishspot_logged_in');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={localStyles.container}>
      <Text style={localStyles.headerTitle}>Meu Perfil</Text>

      <View style={localStyles.card}>
        {user?.photo ? (
          <Image source={{ uri: user.photo }} style={localStyles.avatar} />
        ) : (
          <View style={localStyles.avatarPlaceholder}>
            <Text style={localStyles.avatarPlaceholderText}>Sem Foto</Text>
          </View>
        )}

        <Text style={localStyles.labelName}>{user?.name || 'Carregando...'}</Text>
        <Text style={localStyles.labelUsername}>@{user?.username || ''}</Text>

        <TouchableOpacity style={localStyles.editButton} onPress={() => setModalVisible(true)}>
          <Text style={localStyles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={localStyles.logoutButton} onPress={handleLogout}>
          <Text style={localStyles.buttonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={localStyles.modalOverlay}>
            <View style={localStyles.modalContent}>
              <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Editar Informações</Text>

                <TouchableOpacity onPress={pickImage} style={{ marginBottom: 15 }}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ width: 80, height: 80, borderRadius: 40 }} />
                  ) : (
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }}>
                      <Text>+ Foto</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TextInput
                  style={localStyles.input}
                  placeholder="Nome Completo"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={localStyles.input}
                  placeholder="Usuário"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
                <TextInput
                  style={localStyles.input}
                  placeholder="Senha"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 }}>
                  <TouchableOpacity style={[localStyles.modalBtn, { backgroundColor: '#6b7280' }]} onPress={() => setModalVisible(false)}>
                    <Text style={localStyles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[localStyles.modalBtn, { backgroundColor: '#2563eb' }]} onPress={handleSave}>
                    <Text style={localStyles.buttonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: { backgroundColor: '#fff', width: '90%', maxWidth: 350, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarPlaceholderText: { color: '#666', fontSize: 12 },
  labelName: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 5 },
  labelUsername: { fontSize: 15, color: '#666', marginBottom: 20 },
  editButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 6, width: '100%', alignItems: 'center', marginBottom: 10 },
  logoutButton: { backgroundColor: '#dc2626', padding: 12, borderRadius: 6, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 350, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 6, width: '100%', fontSize: 14, backgroundColor: '#fff' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 6, alignItems: 'center', marginHorizontal: 5 }
});