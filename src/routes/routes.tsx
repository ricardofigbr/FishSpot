import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../pages/login/LoginPage";
import BottomRoutes from "./BottomRoutes";
import Map from "../pages/map/MapPage";
import Camera from "../pages/camera/CameraPage";
import { SpotsProvider } from "../contexts/SpotsContext";
import SpotModal from "../components/SpotModal";

const Stack = createNativeStackNavigator();

export default function Routes() {
  return (
    <SpotsProvider>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={Login} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="Main" 
          component={BottomRoutes} 
          options={{ headerShown: false }} 
        />
        
        {/* Caso Map e Camera não estejam dentro do seu BottomRoutes e precisem 
            ser acessados diretamente pelo Stack, mantenha as telas abaixo: */}
        <Stack.Screen name="Map" component={Map} options={{ headerShown: false }} />
        <Stack.Screen name="Camera" component={Camera} options={{ headerShown: false }} />
      </Stack.Navigator>

      {/* O Modal fica aqui no final, dentro do SpotsProvider, 
          para flutuar acima de todas as telas do aplicativo */}
      <SpotModal />
    </SpotsProvider>
  );
}