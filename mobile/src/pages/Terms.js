import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { SPACING, RADIUS } from '../constants/theme';
import { TERMS_SECTIONS } from '../constants/termsContent';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors) => ({
    container: { flex: 1, backgroundColor: colors.bgDark },
    scroll: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
    title: { fontSize: 26, fontWeight: '800', color: colors.brand, marginBottom: 4 },
    updated: { fontSize: 13, color: colors.textMuted, marginBottom: SPACING.xl },
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: SPACING.lg,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textMain, marginBottom: SPACING.sm },
    paragraph: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginBottom: SPACING.md },
    sectionGap: { marginTop: SPACING.xl, paddingTop: SPACING.xl, borderTopWidth: 1, borderTopColor: colors.border },
    back: { marginTop: SPACING.xl, alignSelf: 'center' },
    backText: { color: colors.brand, fontWeight: '700', fontSize: 15 },
});

export function Terms({ navigation }) {
    const styles = useThemedStyles(createStyles);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Legal</Text>
                <Text style={styles.updated}>Last updated June 2026</Text>
                <View style={styles.card}>
                    {TERMS_SECTIONS.map((section, index) => (
                        <View key={section.id} style={index > 0 ? styles.sectionGap : null}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            {section.paragraphs.map((text) => (
                                <Text key={text} style={styles.paragraph}>{text}</Text>
                            ))}
                        </View>
                    ))}
                </View>
                <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
