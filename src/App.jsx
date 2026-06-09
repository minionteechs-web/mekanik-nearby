import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AppShell } from './components/AppShell';
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { MechanicList } from './pages/MechanicList';
import { MechanicDetail } from './pages/MechanicDetail';
import { SOS } from './pages/SOS';
import { RoutePlanner } from './pages/RoutePlanner';
import { Profile } from './pages/Profile';
import { Activity } from './pages/Activity';
import { MechanicDashboard } from './pages/MechanicDashboard';
import { MechanicOnboard } from './pages/MechanicOnboard';
import { Chat } from './pages/Chat';
import { ResetPassword } from './pages/ResetPassword';
import { TwoFactorSetup } from './pages/TwoFactorSetup';

function App() {
    return (
        <ToastProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Splash />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/mechanic-onboard" element={<MechanicOnboard />} />
                        <Route path="/chat/:requestId" element={<Chat />} />

                        <Route element={<AppShell />}>
                            <Route path="/home" element={<Home />} />
                            <Route path="/mechanics" element={<MechanicList />} />
                            <Route path="/mechanic/:id" element={<MechanicDetail />} />
                            <Route path="/sos" element={<SOS />} />
                            <Route path="/route-planner" element={<RoutePlanner />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/two-factor-setup" element={<TwoFactorSetup />} />
                            <Route path="/activity" element={<Activity />} />
                            <Route path="/mechanic-dashboard" element={<MechanicDashboard />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </ToastProvider>
    );
}

export default App;
