import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { style } from './styles';
import { useNavigation, NavigationProp } from '@react-navigation/native';

export default function Login() {
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    const autenticar = async () => {
      try {
        const authentication =
          await LocalAuthentication.authenticateAsync({
            promptMessage: 'Autentique-se para entrar no FishSpot',
            cancelLabel: 'Cancelar',
          });

        if (authentication.success) {
          navigation.navigate('BottomRoutes');
        }
      } catch (error) {
        console.error('Erro na autenticação:', error);
      }
    };

    autenticar();
  }, [navigation]);

  return (
    <View style={style.container}>
      <Text>Autenticando...</Text>

      <StatusBar style="auto" />
    </View>
  );
}