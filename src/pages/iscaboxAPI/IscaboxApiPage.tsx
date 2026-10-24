import React, { useCallback, useContext, useRef } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpotsContext } from '../../contexts/SpotsContext';
import type { BottomTabParamList } from '../../routes/navigationTypes';
import { formatSpotDistance } from '../../services/iscaboxApi';
import type { IscaboxSpot } from '../../services/iscaboxApi';
import styles from './styles';

export default function IscaboxApiPage() {
  const navigation = useNavigation<BottomTabNavigationProp<BottomTabParamList>>();
  const mapRequestSequence = useRef(0);
  const {
    iscaboxSpots,
    iscaboxLoading,
    iscaboxHasLoaded,
    iscaboxError,
    refreshIscaboxSpots,
  } = useContext(SpotsContext);

  useFocusEffect(
    useCallback(() => {
      void refreshIscaboxSpots();
    }, [refreshIscaboxSpots]),
  );

  const handleGoToSpot = (spot: IscaboxSpot) => {
    mapRequestSequence.current += 1;
    navigation.navigate('Map', {
      focusRequest: {
        latitude: spot.latitude,
        longitude: spot.longitude,
        requestId: `iscabox-${spot.id}-${mapRequestSequence.current}`,
      },
    });
  };

  const renderSpot = ({ item, index }: { item: IscaboxSpot; index: number }) => {
    const sourceUrl = item.sourceUrl;
    return (
      <View style={styles.spotCard}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <View style={styles.spotInfo}>
          <Text style={styles.spotName}>{item.name}</Text>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <Text style={styles.distance}>{formatSpotDistance(item.distanceKm)}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Ir para ${item.name} no mapa`}
            onPress={() => handleGoToSpot(item)}
            style={styles.goToButton}
          >
            <Ionicons name="navigate-outline" size={16} color="#fff" />
            <Text style={styles.goToButtonText}>Ir para</Text>
          </TouchableOpacity>
          {sourceUrl ? (
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => {
                void Linking.openURL(sourceUrl).catch(() => {
                  Alert.alert('Não foi possível abrir a fonte', 'Tente novamente em instantes.');
                });
              }}
              style={styles.sourceButton}
            >
              <Text style={styles.sourceLink}>Ver na Iscabox</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (iscaboxLoading && !iscaboxHasLoaded) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.stateText}>Buscando os pontos mais próximos...</Text>
        </View>
      );
    }

    if (iscaboxError) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={36} color="#6b756d" />
          <Text style={styles.stateTitle}>Não foi possível carregar os pontos</Text>
          <Text style={styles.stateText}>{iscaboxError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={iscaboxLoading}
            onPress={() => void refreshIscaboxSpots(undefined, true)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (iscaboxHasLoaded) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="location-outline" size={36} color="#6b756d" />
          <Text style={styles.stateTitle}>Nenhum ponto encontrado</Text>
          <Text style={styles.stateText}>
            Não há locais de pesca próximos com coordenadas para mostrar.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList
        data={iscaboxSpots}
        keyExtractor={(item) => item.id}
        renderItem={renderSpot}
        contentContainerStyle={[
          styles.listContent,
          iscaboxSpots.length === 0 && styles.emptyListContent,
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Pontos próximos</Text>
              <Text style={styles.subtitle}>Os cinco locais de pesca mais perto de você · Iscabox</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Atualizar pontos próximos"
              accessibilityRole="button"
              disabled={iscaboxLoading}
              onPress={() => void refreshIscaboxSpots(undefined, true)}
              style={styles.refreshButton}
            >
              {iscaboxLoading ? (
                <ActivityIndicator size="small" color="#2e7d32" />
              ) : (
                <Ionicons name="refresh" size={21} color="#2e7d32" />
              )}
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={iscaboxLoading && iscaboxHasLoaded}
            onRefresh={() => void refreshIscaboxSpots(undefined, true)}
            tintColor="#2e7d32"
            colors={['#2e7d32']}
          />
        }
      />
    </SafeAreaView>
  );
}
