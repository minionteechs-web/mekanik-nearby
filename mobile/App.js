import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screens
import { Splash } from './src/pages/Splash';
import { Login } from './src/pages/Login';
import { Register } from './src/pages/Register';
import { Home } from './src/pages/Home';
import { MechanicList } from './src/pages/MechanicList';
import { MechanicDetail } from './src/pages/MechanicDetail';
import { SOS } from './src/pages/SOS';
import { RoutePlanner } from './src/pages/RoutePlanner';
import { Profile } from './src/pages/Profile';
import { MechanicDashboard } from './src/pages/MechanicDashboard';
import { Chat } from './src/pages/Chat';
import { TwoFactorSetup } from './src/pages/TwoFactorSetup';
import { MechanicOnboard } from './src/pages/MechanicOnboard';
import { Activity } from './src/pages/Activity';

import { AuthProvider } from './src/utils/authContext';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    console.log("[App] Component Mounted");
  }, []);
  
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#121212' }
          }}
        >
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Mechanics" component={MechanicList} />
          <Stack.Screen name="MechanicDetail" component={MechanicDetail} />
          <Stack.Screen name="SOS" component={SOS} />
          <Stack.Screen name="Route" component={RoutePlanner} />
          <Stack.Screen name="Activity" component={Activity} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="MechanicHome" component={MechanicDashboard} />
          <Stack.Screen name="MechanicOnboard" component={MechanicOnboard} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetup} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
