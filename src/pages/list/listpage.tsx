import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import AddItem from './add';
import ListItems from './list';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';

type Item = {
  id: string;
  task: string;
};

export default function Bolinha() {

  const [list, setList] = useState<Item[]>([]);

  const addItem = (text: string) => {

    if (text === '') {
      Toast.show({
        type: 'error',
        text1: 'Valor Vazio',
      });
    } else {
      const newItem: Item = {
        id: uuidv4(),
        task: text,
      };

      setList([newItem, ...list]);
    }
  };

  const DeleteItem = (id: string) => {
    const newList = list.filter((item) => item.id !== id);
    setList(newList);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://reactnative.dev/docs/assets/p_cat1.png' }}
        style={{ width: 200, height: 200 }}
      />

      <Text style={styles.sectionTitle}>Lista ToDo</Text>

      <AddItem addItem={addItem} />

      <ListItems
        deleteItem={DeleteItem}
        listItems={list}
      />

      <StatusBar style="auto" />

      <Toast
        position="top"
        bottomOffset={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '600',
  },
});
