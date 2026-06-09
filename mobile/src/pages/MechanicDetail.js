import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Linking, Alert } from 'react-native';
import { ChevronLeft, Star, Phone, MessageSquare, MapPin } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { mechanics as mechanicsApi, reviews as reviewsApi, requests as requestsApi } from '../utils/api';
import { LiveMap } from '../components/LiveMap';
import { openGoogleMaps } from '../utils/maps';

export const MechanicDetail = ({ route, navigation }) => {
    const { id } = route.params || {};
    const [mech, setMech] = useState(null);
    const [loading, setLoading] = useState(true);

    // Rating State
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchMechanic = async () => {
            try {
                const response = await mechanicsApi.getDetail(id);
                setMech(response.data);
            } catch (err) {
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        fetchMechanic();
    }, [id]);

    const handleCall = () => {
        if (mech?.phone) {
            Linking.openURL(`tel:${mech.phone}`);
        } else {
            Alert.alert('No phone', 'This mechanic has no phone number on file.');
        }
    };

    const handleMessage = async () => {
        try {
            const res = await requestsApi.getUserRequests();
            const existing = res.data.find(
                (r) => r.mechanic_id === mech.user_id && !['completed', 'cancelled'].includes(r.status)
            );
            if (existing) {
                navigation.navigate('Chat', {
                    requestId: existing.id,
                    receiverId: mech.user_id,
                    name: mech.name,
                    receiverPhone: mech.phone,
                });
            } else {
                navigation.navigate('SOS', { mechanicId: mech.id });
            }
        } catch {
            navigation.navigate('SOS', { mechanicId: mech.id });
        }
    };

    const handleSubmitReview = async () => {
        if (rating > 0 && mech?.user_id) {
            try {
                await reviewsApi.create({
                    mechanic_id: mech.user_id,
                    rating,
                    comment: reviewText,
                });
                setSubmitted(true);
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to submit review');
            }
        }
    };

    if (loading || !mech) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mechanic Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.profileHero}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{mech.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.name}>{mech.name}</Text>
                    <Text style={styles.specialty}>{mech.specialty}</Text>

                    <View style={styles.ratingBadge}>
                        <Star size={18} color={COLORS.brand} fill={COLORS.brand} />
                        <Text style={styles.ratingText}>{mech.rating}</Text>
                        <Text style={styles.reviewCount}>({mech.reviews_count} reviews)</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <Button style={styles.flex1} onPress={handleCall}>
                        <Phone size={18} color="white" style={{ marginRight: 8 }} /> Call
                    </Button>
                    <Button variant="secondary" style={[styles.flex1, styles.msgBtn]} onPress={handleMessage}>
                        <MessageSquare size={18} color="white" style={{ marginRight: 8 }} /> Message
                    </Button>
                </View>

                <Card style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.locationInfo}>
                        <MapPin size={18} color={COLORS.brand} />
                        <Text style={styles.addressText}>{mech.address}, {mech.city}</Text>
                    </View>
                    {mech.lat != null && mech.lng != null && (
                        <TouchableOpacity
                            style={styles.mapBox}
                            onPress={() => openGoogleMaps(mech.lat, mech.lng, mech.name)}
                            activeOpacity={0.9}
                        >
                            <LiveMap
                                region={{
                                    latitude: mech.lat,
                                    longitude: mech.lng,
                                    latitudeDelta: 0.02,
                                    longitudeDelta: 0.02,
                                }}
                                mechanics={[mech]}
                                style={styles.mapBox}
                            />
                        </TouchableOpacity>
                    )}
                </Card>

                <Card style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Leave a Review</Text>
                    {submitted ? (
                        <Text style={styles.successText}>
                            Thank you for your feedback! It helps our community stay safe and informed.
                        </Text>
                    ) : (
                        <View>
                            <View style={styles.starRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                        <Star
                                            size={32}
                                            color={star <= rating ? COLORS.brand : COLORS.textMuted}
                                            fill={star <= rating ? COLORS.brand : 'transparent'}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Input
                                placeholder="Tell us about the service you received"
                                value={reviewText}
                                onChangeText={setReviewText}
                                multiline
                                style={styles.reviewInput}
                            />

                            <Button onPress={handleSubmitReview} disabled={rating === 0}>
                                Submit Review
                            </Button>
                        </View>
                    )}
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgDark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.xl,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textMain,
        marginLeft: SPACING.md,
    },
    scroll: {
        padding: SPACING.xl,
        paddingBottom: 40,
    },
    profileHero: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    avatarTextLarge: {
        fontSize: 40,
        fontWeight: '800',
        color: COLORS.brand,
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    specialty: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: RADIUS.pill,
    },
    ratingText: {
        color: COLORS.textMain,
        fontWeight: '700',
        marginLeft: 6,
        fontSize: 16,
    },
    reviewCount: {
        color: COLORS.textMuted,
        marginLeft: 6,
        fontSize: 14,
    },
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    flex1: {
        flex: 1,
    },
    msgBtn: {
        backgroundColor: COLORS.inputBg,
    },
    sectionCard: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textMain,
        marginBottom: SPACING.md,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.md,
    },
    addressText: {
        color: COLORS.textMuted,
        fontSize: 14,
        flex: 1,
    },
    mapBox: {
        height: 160,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        marginTop: SPACING.md,
    },
    mapPlaceholder: {
        height: 150,
        backgroundColor: '#1A1A1A',
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapText: {
        color: '#444',
        fontSize: 14,
    },
    starRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    reviewInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    successText: {
        color: COLORS.success,
        fontSize: 14,
        lineHeight: 20,
    },
});
