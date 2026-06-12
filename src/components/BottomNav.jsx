import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, ShieldAlert, ClipboardList, Wrench } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { getStoredUser, subscribeToUserUpdates } from '../utils/profilePrefs';
import './BottomNav.css';

export function BottomNav() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => getStoredUser());

    useEffect(() => subscribeToUserUpdates(setUser), []);
    const isMechanic = user?.role === 'mechanic';

    if (!user) return null;

    if (isMechanic) {
        return (
            <nav className="bottom-nav">
                <NavLink to="/mechanic-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Wrench size={22} />
                    <span>Jobs</span>
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `nav-item nav-profile ${isActive ? 'active' : ''}`}>
                    <ProfileAvatar name={user.username} avatarUrl={user.avatar_url} size={28} active={false} />
                    <span>Profile</span>
                </NavLink>
            </nav>
        );
    }

    return (
        <nav className="bottom-nav driver-nav">
            <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Home size={22} />
                <span>Home</span>
            </NavLink>
            <NavLink to="/mechanics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Search size={22} />
                <span>Find</span>
            </NavLink>
            <button className="nav-sos-fab" onClick={() => navigate('/sos')} aria-label="Emergency SOS">
                <ShieldAlert size={26} />
            </button>
            <NavLink to="/activity" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <ClipboardList size={22} />
                <span>Activity</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-item nav-profile ${isActive ? 'active' : ''}`}>
                <ProfileAvatar name={user.username} avatarUrl={user.avatar_url} size={28} active={false} />
                <span>Profile</span>
            </NavLink>
        </nav>
    );
}
