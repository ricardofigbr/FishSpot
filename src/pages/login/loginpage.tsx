import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { style } from './styles';
import { useNavigation, NavigationProp } from '@react-navigation/native';

export function TelaSegura() {
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    (async () => {
      const authentication = await LocalAuthentication.authenticateAsync();

      if (authentication.success) {
        navigation.navigate("BottomRoutes");
      }
    })();
  }, []);

  return (
    <View>
      <Text>Autenticando...</Text>
    </View>
  );
}

export default function Login() {
  const [biometria, setBiometria] = useState(false);
  const [render, setRender] = useState(false);

  const changeRender = () => setRender(true);

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      setBiometria(compativel);
    })();
  }, []);

  if (render) {
    return <TelaSegura />;
  }

  return (
    <View style={style.container}>
      <Text>
        {biometria
          ? 'Faça o login com biometria'
          : 'Dispositivo não compatível com biometria'}
      </Text>

      <TouchableOpacity onPress={changeRender}>
        <Text>Logar</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}
