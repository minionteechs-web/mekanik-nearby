import { Link } from 'react-router-dom';
import './TermsAgreement.css';

export function TermsAgreement({ checked, onChange }) {
    return (
        <label className="terms-agreement">
            <input
                type="checkbox"
                className="terms-agreement-checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className="terms-agreement-text">
                I agree to the{' '}
                <Link to="/terms#terms" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/terms#privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                </Link>
            </span>
        </label>
    );
}
