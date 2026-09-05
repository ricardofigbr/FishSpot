import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import List from '../pages/list/listpage';
import Map from '../pages/map/mappage';
import Camera from '../pages/camera/camerapage';

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
      <Tab.Screen
        name="Camera"
        component={Camera}
      />
    </Tab.Navigator>
  );
}