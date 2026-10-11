import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { SpotsContext } from '../../contexts/SpotsContext';
import SpotModal from '../../components/SpotModal';
import styles from './styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSpotDistance } from '../../services/iscaboxApi';

export default function MapScreen() {
  const {
    spots,
    spotsPendingWrites,
    spotsError,
    iscaboxSpots,
    addSpot,
    refreshIscaboxSpots,
  } = useContext(SpotsContext);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<Location.LocationObjectCoords | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (location) {
        void refreshIscaboxSpots(location);
      }
    }, [location, refreshIscaboxSpots])
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
    } catch {
      Alert.alert('Erro', 'Não foi possível obter a localização atual.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>A obter localização atual...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      <View style={styles.mapFrame}>
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
            {iscaboxSpots.map((spot) => (
              <Marker
                key={`iscabox-${spot.id}`}
                coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
                title={spot.name}
                description={
                  spot.description
                    ? `${formatSpotDistance(spot.distanceKm)} • ${spot.description}`
                    : formatSpotDistance(spot.distanceKm)
                }
                pinColor="#2e7d32"
              />
            ))}
          </MapView>
        )}
      </View>

      {(spotsError || spotsPendingWrites) && (
        <View style={styles.syncNotice}>
          <Text style={styles.syncNoticeText}>
            {spotsError ?? 'Há gravações aguardando confirmação do Firebase. Elas ficam pendentes enquanto esta sessão permanecer aberta.'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleOpenCreateModal}>
        <Text style={styles.saveButtonText}>Salvar ponto de pesca</Text>
      </TouchableOpacity>

      <SpotModal
        key={modalVisible ? 'new-spot-open' : 'new-spot-closed'}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Criar Ponto de Pesca"
        onSave={(name, description, mainImage, galleryPhotos) => {
          if (!pendingCoords) return;

          void addSpot({
              latitude: pendingCoords.latitude,
              longitude: pendingCoords.longitude,
              name,
              description,
              image: mainImage,
              photos: galleryPhotos,
            })
            .then(() => {
              setModalVisible(false);
              Alert.alert(
                'Solicitação enviada',
                'O Firebase ainda precisa confirmar o salvamento. Se houver falha, o aviso do mapa ou da lista explicará o que fazer.',
              );
            })
            .catch((error) => {
              Alert.alert(
                'Não foi possível salvar',
                error instanceof Error ? error.message : 'Tente novamente quando estiver conectado.',
              );
            });
        }}
      />
    </SafeAreaView>
  );
}
