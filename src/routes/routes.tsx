import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../pages/login/loginpage";
import BottomRoutes from "./bottomroutes";
import Map from "../pages/map/mappage";
import Camera from "../pages/camera/camerapage";


export default function Routes(){
    const Stack = createNativeStackNavigator()

    return(
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

        </Stack.Navigator>
    )
}