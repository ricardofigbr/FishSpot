import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import List from '../pages/list/listpage';
import Login from '../pages/login/loginpage';

const Tab = createBottomTabNavigator();

export default function BottomRoutes() {
  return (
    <Tab.Navigator
      initialRouteName='Login'
      screenOptions={{ headerShown: false }}
    >
        <Tab.Screen
        name="Login"
        component={Login}
      />
      <Tab.Screen
        name="List"
        component={List}
      />
    </Tab.Navigator>
  );
}
