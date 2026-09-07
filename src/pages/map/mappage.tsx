import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { SpotsContext } from '../list/spotscontext';
import styles from './styles';

export default function MapScreen() {
  const { spots, addSpot } = useContext(SpotsContext);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à localização para utilizar o mapa.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation.coords);
      setLoading(false);
    })();
  }, []);

  const handleSaveSpot = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation.coords);
      addSpot(currentLocation.coords);
      Alert.alert('Sucesso', 'Ponto de pesca salvo! Você pode editá-lo na tela de lista.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização atual.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Obtendo localização atual...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          {spots?.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              title={spot.name}
              description={spot.description}
            />
          ))}
        </MapView>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSpot}>
        <Text style={styles.saveButtonText}>Salvar ponto de pesca</Text>
      </TouchableOpacity>
    </View>
  );
}

