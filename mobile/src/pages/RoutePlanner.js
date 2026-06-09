import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { ChevronLeft, Map, Navigation, Download, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { downloadRouteMechanics } from '../utils/routePlanner';
import { geocodePlace } from '../utils/geocode';
import { formatBytes } from '../utils/format';

export const RoutePlanner = ({ navigation }) => {
    const [start, setStart] = useState('Lagos');
    const [end, setEnd] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [result, setResult] = useState(null);
    const [preview, setPreview] = useState(null);

    const handlePreview = async () => {
        if (!start.trim() || !end.trim()) {
            return Alert.alert('Error', 'Enter both start and destination');
        }
        const startLoc = await geocodePlace(start.trim());
        const endLoc = await geocodePlace(end.trim());
        if (!startLoc || !endLoc) {
            return Alert.alert('Error', 'Could not find locations. Try Lagos, Ibadan, Abuja.');
        }
        setPreview({ start: startLoc, end: endLoc });
    };

    const handleDownload = async () => {
        if (!start.trim() || !end.trim()) {
            return Alert.alert('Error', 'Enter both start and destination');
        }
        setDownloading(true);
        try {
            const payload = await downloadRouteMechanics(start.trim(), end.trim());
            setResult(payload);
            Alert.alert('Success', `Saved ${payload.count} mechanics for offline use.`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Download failed. Check your connection.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color={COLORS.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Route Planner</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Card style={styles.inputCard}>
                    <Text style={styles.sectionTitle}>Plan Your Trip</Text>
                    <Input
                        label="Starting Point"
                        placeholder="e.g. Lagos"
                        value={start}
                        onChangeText={setStart}
                    />
                    <Input
                        label="Destination"
                        placeholder="e.g. Ibadan"
                        value={end}
                        onChangeText={setEnd}
                    />
                    <Button
                        variant="secondary"
                        style={styles.planBtn}
                        disabled={!start || !end}
                        onPress={handlePreview}
                    >
                        <Navigation size={18} color="white" style={{ marginRight: 8 }} /> Preview Route
                    </Button>
                    {preview && (
                        <Text style={styles.previewText}>
                            {preview.start.label} → {preview.end.label}
                        </Text>
                    )}
                </Card>

                <Card style={styles.offlineCard}>
                    <View style={styles.offlineHeader}>
                        <Map size={32} color={COLORS.brand} />
                        <View style={styles.offlineInfo}>
                            <Text style={styles.offlineTitle}>Go Offline</Text>
                            <Text style={styles.offlineSubtitle}>
                                Download mechanic contacts along your route for areas with poor network.
                            </Text>
                        </View>
                    </View>

                    {result ? (
                        <View style={styles.successBox}>
                            <CheckCircle size={20} color={COLORS.success} />
                            <Text style={styles.successText}>
                                {result.count} mechanics saved ({formatBytes(JSON.stringify(result).length)})
                            </Text>
                        </View>
                    ) : (
                        <Button
                            onPress={handleDownload}
                            disabled={downloading || !end}
                            style={styles.downloadBtn}
                        >
                            <Download size={18} color="white" style={{ marginRight: 8 }} />
                            {downloading ? 'Downloading...' : 'Download Route Data'}
                        </Button>
                    )}
                </Card>

                <View style={styles.tipBox}>
                    <Text style={styles.tipTitle}>Pro Tip</Text>
                    <Text style={styles.tipText}>
                        Download route data before leaving major cities. Nigerian highways often have inconsistent network coverage.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textMain, marginLeft: SPACING.md },
    scroll: { padding: SPACING.xl, paddingTop: 0, paddingBottom: 40 },
    inputCard: { marginBottom: SPACING.xl },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: SPACING.lg },
    planBtn: { marginTop: SPACING.sm },
    previewText: { marginTop: SPACING.md, color: COLORS.textMuted, fontSize: 13 },
    offlineCard: { backgroundColor: 'rgba(255, 107, 53, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.1)' },
    offlineHeader: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.xl },
    offlineInfo: { flex: 1 },
    offlineTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textMain },
    offlineSubtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginTop: 4 },
    downloadBtn: { width: '100%' },
    successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: SPACING.md, borderRadius: RADIUS.md, justifyContent: 'center' },
    successText: { color: COLORS.success, fontWeight: '600', fontSize: 14 },
    tipBox: { marginTop: SPACING.xxl, padding: SPACING.xl, backgroundColor: '#1A1A1A', borderRadius: RADIUS.lg },
    tipTitle: { fontSize: 16, fontWeight: '700', color: COLORS.brand, marginBottom: 8 },
    tipText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
});
