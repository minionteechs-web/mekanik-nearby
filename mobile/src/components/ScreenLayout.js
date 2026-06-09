import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBar } from './BottomTabBar';
import { useAuth } from '../utils/authContext';
import { COLORS } from '../constants/theme';

export const ScreenLayout = ({ navigation, currentRoute, children }) => {
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.content}>{children}</View>
            <BottomTabBar navigation={navigation} current={currentRoute} user={user} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    content: { flex: 1 },
});
