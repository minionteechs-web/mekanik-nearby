import React from 'react';
import { View } from 'react-native';
import { BottomTabBar } from './BottomTabBar';
import { useAuth } from '../utils/authContext';
import { useTheme } from '../utils/themeContext';

export const ScreenLayout = ({ navigation, currentRoute, children }) => {
    const { user } = useAuth();
    const { colors } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgDark }}>
            <View style={{ flex: 1 }}>{children}</View>
            <BottomTabBar navigation={navigation} current={currentRoute} user={user} />
        </View>
    );
};
