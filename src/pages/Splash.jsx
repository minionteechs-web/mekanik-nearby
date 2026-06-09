import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initSocket } from '../utils/api';
import { BrandLogo } from '../components/BrandLogo';
import './Splash.css';

export function Splash() {
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('mekanik_user') || 'null');

        if (user?.token) {
            initSocket();
        }

        const timer = setTimeout(() => {
            if (user?.token) {
                navigate(user.role === 'mechanic' ? '/mechanic-dashboard' : '/home');
            } else {
                navigate('/login');
            }
        }, 2600);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="splash-screen">
            <div className="splash-logo-wrap glow">
                <BrandLogo size={128} />
            </div>
            <p className="splash-tagline">Because every journey deserves a happy ending.</p>
            <div className="splash-loader" />
        </div>
    );
}
