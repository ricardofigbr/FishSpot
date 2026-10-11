import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../pages/login/LoginPage";
import BottomRoutes from "./BottomRoutes";
import Map from "../pages/map/MapPage";
import Camera from "../pages/camera/CameraPage";
import User from "../pages/user/UserPage";
import { SpotsProvider } from "../contexts/SpotsContext";
import { useAuth } from "../contexts/AuthContext";

export default function Routes() {
  const Stack = createNativeStackNavigator();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SpotsProvider>
      <Stack.Navigator
        key={user ? `signed-in-${user.uid}` : "signed-out"}
        initialRouteName={user ? "BottomRoutes" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="BottomRoutes" component={BottomRoutes} />
            <Stack.Screen name="Map" component={Map} />
            <Stack.Screen name="Camera" component={Camera} />
            <Stack.Screen name="User" component={User} />
          </>
        ) : (
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
    </SpotsProvider>
  );
}
