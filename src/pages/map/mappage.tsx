import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SpotsContext } from '../../contexts/SpotsContext';

export default function MapScreen() {
  const { spots, openForCreation } = useContext(SpotsContext);

  // Função chamada ao segurar o dedo no mapa
  const handleMapLongPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    // Abre o SpotModal vazio, mas já sabendo as coordenadas clicadas
    openForCreation({ lat: latitude, lng: longitude });
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        onLongPress={handleMapLongPress} 
        showsUserLocation={true}
      >
        {spots.map((spot) => {
          // Só renderiza o marcador se o ponto tiver coordenadas
          if (!spot.coordinates) return null;

          return (
            <Marker
              key={spot.id}
              coordinate={{ 
                latitude: spot.coordinates.lat, 
                longitude: spot.coordinates.lng 
              }}
              title={spot.name}
              description={spot.description}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});