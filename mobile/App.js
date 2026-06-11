import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

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
import { ResetPassword } from './src/pages/ResetPassword';
import { Notifications } from './src/pages/Notifications';
import { Bookings } from './src/pages/Bookings';
import { MechanicOnboard } from './src/pages/MechanicOnboard';
import { Activity } from './src/pages/Activity';
import { Terms } from './src/pages/Terms';

import { AuthProvider } from './src/utils/authContext';
import { ThemeProvider, useTheme } from './src/utils/themeContext';

const Stack = createNativeStackNavigator();

function AppNavigation() {
    const { colors, isDark } = useTheme();

    const navTheme = {
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            background: colors.bgDark,
            card: colors.bgCard,
            text: colors.textMain,
            border: colors.border,
            primary: colors.brand,
        },
    };

    return (
        <NavigationContainer theme={navTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: { backgroundColor: colors.bgDark },
                }}
            >
                <Stack.Screen name="Splash" component={Splash} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="Terms" component={Terms} />
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
                <Stack.Screen name="ResetPassword" component={ResetPassword} />
                <Stack.Screen name="Notifications" component={Notifications} />
                <Stack.Screen name="Bookings" component={Bookings} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppNavigation />
            </AuthProvider>
        </ThemeProvider>
    );
}
