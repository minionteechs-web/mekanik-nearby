import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { ProfileAvatar } from './ProfileAvatar';
import { auth } from '../utils/api';
import { useTheme } from '../utils/themeContext';
import { SPACING } from '../constants/theme';

export const ProfilePhotoPicker = ({ name, avatarUrl, onUpdated, size = 88 }) => {
    const { colors } = useTheme();
    const [uploading, setUploading] = useState(false);

    const pickAndUpload = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Allow photo access to set your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setUploading(true);
        try {
            const formData = new FormData();
            const filename = asset.uri.split('/').pop() || 'avatar.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('avatar', {
                uri: asset.uri,
                name: filename,
                type,
            });

            const res = await auth.uploadAvatar(formData);
            onUpdated?.(res.data.user);
            Alert.alert('Updated', 'Profile photo saved.');
        } catch (err) {
            Alert.alert('Upload failed', err.response?.data?.message || 'Could not upload photo');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ alignItems: 'center', gap: SPACING.sm }}>
            <TouchableOpacity onPress={pickAndUpload} disabled={uploading} activeOpacity={0.85}>
                <View>
                    <ProfileAvatar name={name} avatarUrl={avatarUrl} size={size} />
                    <View
                        style={{
                            position: 'absolute',
                            right: 0,
                            bottom: 0,
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: colors.brand,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 3,
                            borderColor: colors.bgDark,
                        }}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Camera size={14} color="#fff" />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {uploading ? 'Uploading...' : 'Tap to add or change photo'}
            </Text>
        </View>
    );
};
