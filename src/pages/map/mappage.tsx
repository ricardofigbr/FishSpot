import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { SpotsContext } from '../../contexts/SpotsContext';
import SpotModal from '../../components/SpotModal';
import styles from './styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  const { spots, addSpot, refreshSpots } = useContext(SpotsContext);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Location.LocationObjectCoords | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshSpots();
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita o acesso à localização para utilizar o mapa.');
        setLoading(false);
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation.coords);
      } catch (error) {
        console.error('Erro ao obter localização:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleOpenCreateModal = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setPendingCoords(currentLocation.coords);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização atual.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <SafeAreaView style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>A obter localização atual...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {/* Container do mapa ajustado sem depender de estilos inexistentes */}
      <View style={{ flex: 1, width: '100%', height: '100%' }}>
        {location && (
          <MapView
            style={[styles.map, { flex: 1, width: '100%', height: '100%' }]}
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
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleOpenCreateModal}>
        <Text style={styles.saveButtonText}>Salvar ponto de pesca</Text>
      </TouchableOpacity>

      <SpotModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Criar Ponto de Pesca"
        onSave={(name, description, mainImage, galleryPhotos) => {
          if (pendingCoords) {
            addSpot({
              latitude: pendingCoords.latitude,
              longitude: pendingCoords.longitude,
              name,
              description,
              image: mainImage,
              photos: galleryPhotos,
            });
            setModalVisible(false);
            Alert.alert('Sucesso', 'Ponto de pesca criado com sucesso!');
          }
        }}
      />
    </SafeAreaView>
  );
}