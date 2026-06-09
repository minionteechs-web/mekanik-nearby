import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, Image, Video, Phone, Video as VideoIcon, ChevronLeft, Paperclip, MoreVertical, X, Mic, MicOff, Camera, CameraOff, PhoneOff, Loader2, User } from 'lucide-react';
import Peer from 'simple-peer';
import { messages as messagesApi, getSocket, initSocket, getMediaUrl } from '../utils/api';
import { ICE_SERVERS } from '../utils/webrtc';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import './Chat.css';

export function Chat() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const receiverId = queryParams.get('receiverId');
    const receiverName = queryParams.get('name') || 'User';

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState(null);
    const [typing, setTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // Call States
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, receiving, active
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callType, setCallType] = useState('voice'); // voice, video
    
    const scrollRef = useRef();
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        const userData = localStorage.getItem('mekanik_user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/login');
        }

        fetchMessages();
        const socket = initSocket();
        
        if (socket) {
            socket.on('new_message', (msg) => {
                if (msg.request_id === parseInt(requestId)) {
                    setMessages(prev => [...prev, msg]);
                }
            });

            socket.on('typing', (data) => {
                if (data.request_id === parseInt(requestId)) {
                    setTyping(true);
                    setTimeout(() => setTyping(false), 3000);
                }
            });

            // Signaling listeners
            socket.on('call_user', (data) => {
                setCallStatus('receiving');
                setCallType(data.signalType);
                // In a real app, we'd store the offer and from ID here
                window._pendingCall = data; 
            });

            socket.on('hangup', () => {
                endCall();
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
    }, [requestId, navigate]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await messagesApi.getHistory(requestId);
            setMessages(response.data);
        } catch (err) {
            console.error('Fetch messages error:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const msgData = {
                requestId: parseInt(requestId),
                receiverId: parseInt(receiverId),
                content: newMessage,
                messageType: 'text'
            };
            const response = await messagesApi.send(msgData);
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
        } catch (err) {
            console.error('Send error:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('media', file);
        formData.append('requestId', requestId);
        formData.append('receiverId', receiverId);

        setIsSending(true);
        try {
            const response = await messagesApi.upload(formData);
            setMessages(prev => [...prev, response.data]);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload media.');
        } finally {
            setIsSending(false);
        }
    };

    // --- WebRTC Logic ---

    const startCall = async (type) => {
        setCallType(type);
        setCallStatus('calling');

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            const socket = getSocket();
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: currentStream,
                config: ICE_SERVERS,
            });

            peer.on('signal', (data) => {
                socket.emit('call_user', {
                    offer: data,
                    to: parseInt(receiverId),
                    from: user.id,
                    signalType: type
                });
            });

            peer.on('stream', (remoteStream) => {
                setRemoteStream(remoteStream);
                if (userVideo.current) userVideo.current.srcObject = remoteStream;
            });

            socket.on('call_accepted', (signal) => {
                setCallStatus('active');
                peer.signal(signal);
            });

            connectionRef.current = peer;
        } catch (err) {
            console.error('Media error:', err);
            setCallStatus('idle');
            alert('Could not access camera/microphone.');
        }
    };

    const answerCall = async () => {
        const data = window._pendingCall;
        setCallStatus('active');

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: data.signalType === 'video',
                audio: true
            });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            const socket = getSocket();
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: currentStream,
                config: ICE_SERVERS,
            });

            peer.on('signal', (signal) => {
                socket.emit('call_accepted', { answer: signal, to: data.from });
            });

            peer.on('stream', (remoteStream) => {
                setRemoteStream(remoteStream);
                if (userVideo.current) userVideo.current.srcObject = remoteStream;
            });

            peer.signal(data.offer);
            connectionRef.current = peer;
        } catch (err) {
            console.error('Answer call error:', err);
            endCall();
        }
    };

    const endCall = () => {
        setCallStatus('idle');
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        const socket = getSocket();
        socket.emit('hangup', { to: parseInt(receiverId) });
        setStream(null);
        setRemoteStream(null);
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <div className="chat-user-info">
                    <h3>{receiverName}</h3>
                    <p>{typing ? 'Typing...' : 'Online'}</p>
                </div>
                <div className="chat-header-actions">
                    <button className="icon-btn" onClick={() => startCall('voice')}><Phone size={20} /></button>
                    <button className="icon-btn" onClick={() => startCall('video')}><VideoIcon size={20} /></button>
                    <button className="icon-btn"><MoreVertical size={20} /></button>
                </div>
            </header>

            <div className="messages-list">
                {messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}>
                        {msg.message_type === 'text' ? (
                            <p>{msg.content}</p>
                        ) : msg.message_type === 'image' ? (
                            <img src={getMediaUrl(msg.content)} alt="shared" className="shared-media" onClick={() => window.open(getMediaUrl(msg.content))} />
                        ) : (
                            <video src={getMediaUrl(msg.content)} controls className="shared-media" />
                        )}
                        <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form className="chat-input-area" onSubmit={handleSend}>
                <label className="icon-btn file-label">
                    <Paperclip size={20} />
                    <input type="file" hidden onChange={handleFileUpload} />
                </label>
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        const socket = getSocket();
                        if (socket) socket.emit('typing', {
                            receiverId: parseInt(receiverId, 10),
                            request_id: parseInt(requestId, 10),
                            senderId: user.id,
                        });
                    }}
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim() || isSending}>
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </form>

            {/* Call Overlays */}
            {callStatus !== 'idle' && (
                <div className={`call-overlay ${callStatus}`}>
                    {callStatus === 'receiving' ? (
                        <Card className="incoming-call-card">
                            <div className="pulse-avatar">
                                <User size={48} color="white" />
                            </div>
                            <h2>{receiverName}</h2>
                            <p>In-coming {callType} call...</p>
                            <div className="call-actions">
                                <button className="call-btn accept" onClick={answerCall}><Phone size={24} /></button>
                                <button className="call-btn decline" onClick={endCall}><PhoneOff size={24} /></button>
                            </div>
                        </Card>
                    ) : (
                        <div className="active-call-view">
                            {callType === 'video' ? (
                                <div className="video-grid">
                                    <video ref={userVideo} autoPlay className="remote-video" />
                                    <video ref={myVideo} autoPlay muted className="local-video-pip" />
                                </div>
                            ) : (
                                <div className="voice-call-avatar">
                                    <div className="pulse-ring"></div>
                                    <User size={80} color="var(--color-brand)" />
                                    <h2 style={{ marginTop: '1rem' }}>{receiverName}</h2>
                                    <p>{callStatus === 'calling' ? 'Calling...' : 'Ongoing Call'}</p>
                                </div>
                            )}
                            
                            <div className="active-call-controls">
                                <button className="control-btn"><MicOff size={24} /></button>
                                <button className="control-btn hangup" onClick={endCall}><PhoneOff size={28} /></button>
                                {callType === 'video' && <button className="control-btn"><CameraOff size={24} /></button>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
