import { StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';


// Coordenada usada caso não seja possível obter a localização do celular
const DEFAULT_LOCATION = {
  latitude: 35.6895,
  longitude: 139.6917,
};


export default function Map() {

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Permissão da localização negada!');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    })();
  }, []);


  let text = 'Aguarde...';

  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }


  return (
    <View style={styles.container}>

      <StatusBar style="auto" hidden />

      <MapView
        loadingEnabled={true}
        region={
          !location
            ? {
                latitude: DEFAULT_LOCATION.latitude,
                longitude: DEFAULT_LOCATION.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
        }
        style={styles.map}
      >

        <Marker
          coordinate={
            !location
              ? {
                  latitude: DEFAULT_LOCATION.latitude,
                  longitude: DEFAULT_LOCATION.longitude,
                }
              : {
                  latitude: location.latitude,
                  longitude: location.longitude,
                }
          }
          title="Eu estou aqui!"
          description="Nosso local de aula."
        />

      </MapView>

      <Text>{text}</Text>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  map: {
    width: "100%",
    height: "100%",
  },
});