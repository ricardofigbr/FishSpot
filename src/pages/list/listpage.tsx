import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SpotsContext } from '../../contexts/SpotsContext';
// import styles from './styles'; // Descomente se for usar seu arquivo de estilos

export default function ListScreen() {
  // Pegamos apenas o que a lista precisa do Contexto
  const { spots, openForEditing, deleteSpot } = useContext(SpotsContext);

  return (
    <View style={localStyles.container}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={localStyles.card}>
            <Text style={localStyles.title}>{item.name}</Text>
            {item.description ? <Text style={localStyles.description}>{item.description}</Text> : null}
            
            {item.photo && (
              <Image source={{ uri: item.photo }} style={localStyles.image} />
            )}
            
            <View style={localStyles.buttonContainer}>
              <TouchableOpacity 
                style={[localStyles.button, localStyles.editButton]}
                onPress={() => openForEditing(item)} // Abre o SpotModal preenchido
              >
                <Text style={localStyles.buttonText}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[localStyles.button, localStyles.deleteButton]}
                onPress={() => deleteSpot(item.id)} // Exclui direto
              >
                <Text style={localStyles.buttonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={localStyles.emptyText}>Nenhum ponto de pesca salvo.</Text>}
      />
    </View>
  );
}

// Estilos locais provisórios (substitua pelo seu styles.ts se preferir)
const localStyles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#666', marginTop: 5 },
  image: { width: '100%', height: 150, borderRadius: 8, marginTop: 10 },
  buttonContainer: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  button: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center', marginHorizontal: 5 },
  editButton: { backgroundColor: '#2196F3' },
  deleteButton: { backgroundColor: '#f44336' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' }
});