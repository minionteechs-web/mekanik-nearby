import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { auth } from '../utils/api';
import { updateStoredUser } from '../utils/profilePrefs';
import './ProfilePhotoPicker.css';

export function ProfilePhotoPicker({ name, avatarUrl, onUpdated, size = 96 }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please choose a photo (JPEG, PNG, or WebP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Photo must be under 5 MB.');
            return;
        }

        setError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await auth.uploadAvatar(formData);
            const next = updateStoredUser(res.data.user);
            onUpdated?.(next);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="profile-photo-picker">
            <button
                type="button"
                className="profile-photo-trigger"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile photo"
            >
                <ProfileAvatar name={name} avatarUrl={avatarUrl} size={size} className="large" />
                <span className="profile-photo-badge">
                    <Camera size={16} />
                </span>
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="profile-photo-input"
                onChange={handleFile}
            />
            <p className="profile-photo-hint">
                {uploading ? 'Uploading...' : 'Tap to add or change photo'}
            </p>
            {error && <p className="profile-photo-error">{error}</p>}
        </div>
    );
}
