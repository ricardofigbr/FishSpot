import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import List from '../pages/list/listpage';
import Map from '../pages/map/mappage';

const Tab = createBottomTabNavigator();

export default function BottomRoutes() {
  return (
    <Tab.Navigator
      initialRouteName="List"
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="List"
        component={List}
      />
      <Tab.Screen
        name="Map"
        component={Map}
      />
    </Tab.Navigator>
  );
}