import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import List from '../pages/list/listpage';

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
    </Tab.Navigator>
  );
}