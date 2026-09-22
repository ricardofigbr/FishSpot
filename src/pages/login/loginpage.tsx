import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { style } from './styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export function TelaSegura() {
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    (async () => {
      try {
        const authentication = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Autentique-se para entrar',
          cancelLabel: 'Cancelar',
          fallbackLabel: 'Usar senha',
        });

        if (authentication.success) {
          await AsyncStorage.setItem('@fishspot_logged_in', 'true');
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomRoutes' }],
          });
        } else {
          navigation.goBack();
        }
      } catch (e) {
        console.error(e);
        navigation.goBack();
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[style.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 15, fontSize: 16, fontWeight: '500' }}>Autenticando...</Text>
    </SafeAreaView>
  );
}

export default function Login() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [isRegistering, setIsRegistering] = useState(false);
  const [renderBiometric, setRenderBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Campos de login manual
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Campos de cadastro
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compativel && isEnrolled);
    })();
  }, []);

  const handleLoginWithPassword = async () => {
    if (!loginUser.trim() || !loginPass.trim()) {
      Alert.alert('Atenção', 'Preencha usuário e senha.');
      return;
    }

    try {
      const savedUserJson = await AsyncStorage.getItem('@fishspot_user');
      if (!savedUserJson) {
        Alert.alert('Erro', 'Nenhuma conta cadastrada neste dispositivo. Registre-se primeiro.');
        return;
      }

      const savedUser = JSON.parse(savedUserJson);

      if (
        savedUser.username.toLowerCase() === loginUser.trim().toLowerCase() &&
        savedUser.password === loginPass
      ) {
        await AsyncStorage.setItem('@fishspot_logged_in', 'true');
        navigation.reset({ index: 0, routes: [{ name: 'BottomRoutes' }] });
      } else {
        Alert.alert('Erro', 'Usuário ou senha incorretos.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível fazer o login.');
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos de permissão para acessar a galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const newUser = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password,
        photo: photo,
      };

      await AsyncStorage.setItem('@fishspot_user', JSON.stringify(newUser));
      await AsyncStorage.setItem('@fishspot_logged_in', 'true');

      Alert.alert('Sucesso', 'Conta cadastrada com sucesso!');
      navigation.reset({ index: 0, routes: [{ name: 'BottomRoutes' }] });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o cadastro.');
    }
  };

  if (renderBiometric) {
    return <TelaSegura />;
  }

  if (isRegistering) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={[style.container, { justifyContent: 'center' }]}>
          <ScrollView contentContainerStyle={{ paddingVertical: 30, width: '100%', alignItems: 'center' }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Criar Conta</Text>
            
            <TouchableOpacity onPress={pickImage} style={{ marginBottom: 20 }}>
              {photo ? (
                <Image source={{ uri: photo }} style={{ width: 90, height: 90, borderRadius: 45 }} />
              ) : (
                <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#555', fontWeight: '500' }}>+ Foto</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={style.formContainer}>
              <TextInput
                style={style.input}
                placeholder="Nome Completo"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={style.input}
                placeholder="Usuário"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                style={style.input}
                placeholder="Senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity style={style.primaryButton} onPress={handleRegister}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cadastrar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsRegistering(false)} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ color: '#2563eb', fontSize: 15 }}>Já tem conta? Faça login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <StatusBar style="auto" />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[style.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Login</Text>

        <View style={style.formContainer}>
          <TextInput
            style={style.input}
            placeholder="Usuário"
            autoCapitalize="none"
            value={loginUser}
            onChangeText={setLoginUser}
          />
          <TextInput
            style={style.input}
            placeholder="Senha"
            secureTextEntry
            value={loginPass}
            onChangeText={setLoginPass}
          />

          <TouchableOpacity style={style.primaryButton} onPress={handleLoginWithPassword}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entrar</Text>
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity style={[style.primaryButton, { backgroundColor: '#10b981' }]} onPress={() => setRenderBiometric(true)}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Entrar com Biometria</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsRegistering(true)} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#2563eb', fontSize: 15 }}>não tem conta? registre aqui</Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="auto" />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}