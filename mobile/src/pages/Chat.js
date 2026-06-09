import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Modal, Linking, Alert } from 'react-native';
import { ChevronLeft, Send, Paperclip, Phone, Video, MoreVertical, User, PhoneOff, MicOff, CameraOff, X } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { initSocket, getSocket, messages as messagesApi, getMediaUrl } from '../utils/api';
import { useAuth } from '../utils/authContext';
import * as ImagePicker from 'expo-image-picker';

export const Chat = ({ route, navigation }) => {
    const { requestId, receiverId, name, receiverPhone } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Call States
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, receiving, active
    const [callType, setCallType] = useState('voice'); 

    const flatListRef = useRef();

    useEffect(() => {
        fetchMessages();
        const socket = getSocket() || initSocket();

        if (socket) {
            socket.on('new_message', (msg) => {
                if (msg.request_id === parseInt(requestId)) {
                    setMessages(prev => [...prev, msg]);
                }
            });

            socket.on('typing', (data) => {
                if (data.request_id === parseInt(requestId)) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            });

            socket.on('call_user', (data) => {
                setCallStatus('receiving');
                setCallType(data.signalType);
                // Signaling is handled by the Web interface 
            });

            socket.on('hangup', () => {
                setCallStatus('idle');
            });
        }

        return () => {
            if (socket) {
                socket.off('new_message');
                socket.off('typing');
                socket.off('call_user');
                socket.off('hangup');
            }
        };
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await messagesApi.getHistory(requestId);
            setMessages(response.data);
        } catch (err) {
            console.error('Fetch messages error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        const msgData = {
            requestId: parseInt(requestId),
            receiverId: parseInt(receiverId),
            content: newMessage,
            messageType: 'text'
        };

        try {
            const response = await messagesApi.send(msgData);
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
        } catch (err) {
            console.error('Send error:', err);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.7,
        });

        if (!result.canceled) {
            const file = result.assets[0];
            const formData = new FormData();
            formData.append('media', {
                uri: file.uri,
                name: file.fileName || 'upload.jpg',
                type: file.mimeType || 'image/jpeg',
            });
            formData.append('requestId', requestId);
            formData.append('receiverId', receiverId);

            try {
                const response = await messagesApi.upload(formData);
                setMessages(prev => [...prev, response.data]);
            } catch (err) {
                alert('Upload failed.');
            }
        }
    };

    const startCall = () => {
        if (receiverPhone) {
            Linking.openURL(`tel:${receiverPhone}`);
        } else {
            Alert.alert('Phone call', 'No phone number on file. Use the web app for in-app voice/video calls.');
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender_id === user?.id;
        const mediaUrl = getMediaUrl(item.content);
        
        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                {item.message_type === 'text' ? (
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
                ) : (
                    <Image source={{ uri: mediaUrl }} style={styles.messageImage} />
                )}
                <Text style={styles.messageTime}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={COLORS.textMain} />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{name || 'Mechanic'}</Text>
                    <Text style={styles.userStatus}>{isTyping ? 'Typing...' : 'Online'}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionIcon} onPress={startCall}><Phone size={20} color={COLORS.brand} /></TouchableOpacity>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                        <Paperclip size={24} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        value={newMessage}
                        onChangeText={(text) => {
                            setNewMessage(text);
                            const socket = getSocket();
                            if (socket) socket.emit('typing', { receiverId, request_id: requestId, senderId: user.id });
                        }}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Send size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* In-App Call UI Overlay */}
            <Modal visible={callStatus !== 'idle'} transparent animationType="slide">
                <View style={styles.callOverlay}>
                    {callStatus === 'receiving' ? (
                        <View style={styles.incomingCard}>
                            <View style={styles.callAvatar}>
                                <User size={60} color="white" />
                            </View>
                            <Text style={styles.callName}>{name}</Text>
                            <Text style={styles.callType}>Incoming {callType} call...</Text>
                            <View style={styles.callButtons}>
                                <TouchableOpacity style={[styles.callCircle, { backgroundColor: '#10B981' }]} onPress={() => setCallStatus('active')}>
                                    <Phone size={30} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.callCircle, { backgroundColor: '#EF4444' }]} onPress={endCall}>
                                    <PhoneOff size={30} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.activeCallView}>
                            <User size={100} color={COLORS.brand} style={{ opacity: 0.5 }} />
                            <Text style={styles.callName}>{name}</Text>
                            <Text style={styles.callType}>{callStatus === 'calling' ? 'Calling...' : 'Active Call'}</Text>
                            
                            <View style={styles.activeControls}>
                                <TouchableOpacity style={styles.controlCircle}><MicOff size={24} color="white" /></TouchableOpacity>
                                <TouchableOpacity style={[styles.controlCircle, { backgroundColor: '#EF4444' }]} onPress={endCall}>
                                    <PhoneOff size={30} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.controlCircle}><CameraOff size={24} color="white" /></TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgDark },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingTop: 50, backgroundColor: COLORS.bgLight, borderBottomWidth: 1, borderBottomColor: '#222' },
    backBtn: { marginRight: 15 },
    userInfo: { flex: 1 },
    userName: { color: COLORS.textMain, fontSize: 18, fontWeight: '700' },
    userStatus: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
    headerActions: { flexDirection: 'row', gap: 15 },
    actionIcon: { padding: 5 },
    messageList: { padding: SPACING.lg },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 12 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.brand, borderBottomRightRadius: 2 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#2A2A2A', borderBottomLeftRadius: 2 },
    messageText: { fontSize: 16, lineHeight: 22 },
    myMessageText: { color: 'white' },
    theirMessageText: { color: COLORS.textMain },
    messageTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },
    messageImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 5, backgroundColor: '#000' },
    inputArea: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.bgLight, borderTopWidth: 1, borderTopColor: '#222', paddingBottom: 30 },
    attachBtn: { marginRight: 15 },
    input: { flex: 1, backgroundColor: COLORS.bgDark, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: 'white', fontSize: 16, maxHeight: 100 },
    sendBtn: { marginLeft: 15, width: 45, height: 45, borderRadius: 25, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center' },
    callOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    incomingCard: { padding: 40, alignItems: 'center', width: '90%', backgroundColor: '#1A1A1A', borderRadius: 30, ...SHADOW.card },
    callAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    callName: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 10 },
    callType: { fontSize: 16, color: COLORS.textMuted, marginBottom: 40 },
    callButtons: { flexDirection: 'row', gap: 40 },
    callCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
    activeCallView: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
    activeControls: { flexDirection: 'row', position: 'absolute', bottom: 60, gap: 20 },
    controlCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }
});
