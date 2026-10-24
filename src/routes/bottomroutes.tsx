import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import List from '../pages/list/ListPage';
import Map from '../pages/map/MapPage';
import User from '../pages/user/UserPage';
import Iscabox from '../pages/iscaboxAPI/IscaboxApiPage';
import type { BottomTabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  List: 'list',
  Iscabox: 'fish',
  Map: 'map',
  User: 'person',
};

export default function BottomRoutes() {
  return (
    <Tab.Navigator
      initialRouteName="List"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          const baseName = iconMap[route.name] || 'list';

          const iconName = focused ? baseName : (`${baseName}-outline` as keyof typeof Ionicons.glyphMap);

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="List" 
        component={List} 
        options={{ title: 'Lista' }} 
      />
      <Tab.Screen
        name="Iscabox"
        component={Iscabox}
        options={{ title: 'Iscabox' }}
      />
      <Tab.Screen 
        name="Map" 
        component={Map} 
        options={{ title: 'Mapa' }} 
      />
      <Tab.Screen 
        name="User" 
        component={User} 
        options={{ title: 'Perfil' }} 
      />
    </Tab.Navigator>
  );
}
