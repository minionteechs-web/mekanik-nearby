import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import './AppShell.css';

const AUTH_PATHS = ['/login', '/register', '/', '/mechanic-onboard'];

export function AppShell() {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('mekanik_user') || 'null');
    const hideNav = AUTH_PATHS.includes(location.pathname)
        || location.pathname.startsWith('/chat')
        || location.pathname === '/sos';

    if (!user && !AUTH_PATHS.includes(location.pathname)) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={`app-shell ${hideNav ? 'no-nav' : ''}`}>
            <main className="app-shell-content">
                <Outlet />
            </main>
            {!hideNav && <BottomNav />}
        </div>
    );
}
