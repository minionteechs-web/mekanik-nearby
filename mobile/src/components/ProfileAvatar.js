import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { getProfileInitials, getProfileColor } from '../utils/profileAvatar';

export const ProfileAvatar = ({
    name,
    size = 40,
    onPress,
    active = false,
    style,
}) => {
    const initials = getProfileInitials(name);
    const color = getProfileColor(name);
    const fontSize = Math.max(10, Math.round(size * 0.36));

    const content = (
        <View
            style={[
                styles.circle,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
                active && styles.active,
                style,
            ]}
        >
            <Text style={[styles.text, { fontSize }]}>{initials}</Text>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    active: {
        borderColor: '#FF6B35',
    },
    text: {
        color: '#fff',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
