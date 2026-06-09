import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const OPTIONS = [
    { id: 'auto', label: 'Auto', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeToggle() {
    const { mode, setMode } = useTheme();

    return (
        <div className="theme-toggle" role="group" aria-label="Appearance">
            {OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    type="button"
                    className={`theme-toggle-btn ${mode === id ? 'active' : ''}`}
                    onClick={() => setMode(id)}
                    aria-pressed={mode === id}
                >
                    <Icon size={16} />
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
