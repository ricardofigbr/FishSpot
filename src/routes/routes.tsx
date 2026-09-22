import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../pages/login/LoginPage";
import BottomRoutes from "./BottomRoutes";
import Map from "../pages/map/MapPage";
import Camera from "../pages/camera/CameraPage";
import User from "../pages/user/UserPage";
import { SpotsProvider } from "../contexts/SpotsContext";

export default function Routes() {
  const Stack = createNativeStackNavigator();

  return (
    <SpotsProvider>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="Login"
          component={Login}
        />
        <Stack.Screen 
          name="BottomRoutes"
          component={BottomRoutes}
        />
        <Stack.Screen 
          name="Map"
          component={Map}
        />
        <Stack.Screen 
          name="Camera"
          component={Camera}
        />
        <Stack.Screen 
          name="User"
          component={User}
        />
      </Stack.Navigator>
    </SpotsProvider>
  );
}