import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initSocket } from '../utils/api';
import { Car, Settings, Wrench } from 'lucide-react';
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
        }, 2800);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="splash-screen">
            <div className="splash-animation-container">
                <div className="splash-car-wrapper">
                    <Car size={64} className="icon-car" />
                </div>
                <div className="splash-tools-wrapper">
                    <Settings size={32} className="icon-gear" />
                    <Wrench size={32} className="icon-wrench" />
                </div>
            </div>
            <div className="splash-content">
                <h1 className="splash-logo">Mekanik NG</h1>
                <p className="splash-tagline">Because every journey deserves a happy ending.</p>
            </div>
            <div className="splash-loader"></div>
        </div>
    );
}
