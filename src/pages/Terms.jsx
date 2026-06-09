import { Link } from 'react-router-dom';
import { TERMS_SECTIONS } from '../constants/termsContent';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import './Terms.css';

export function Terms() {
    return (
        <div className="terms-page">
            <div className="page-theme-corner">
                <ThemeToggle compact />
            </div>
            <div className="terms-header">
                <BrandLogo size={56} />
                <h1>Legal</h1>
                <p>Last updated June 2026</p>
            </div>
            <div className="terms-body">
                {TERMS_SECTIONS.map((section) => (
                    <section key={section.id} id={section.id} className="terms-section">
                        <h2>{section.title}</h2>
                        {section.paragraphs.map((text) => (
                            <p key={text}>{text}</p>
                        ))}
                    </section>
                ))}
            </div>
            <div className="terms-footer">
                <Link to="/register">Back to sign up</Link>
            </div>
        </div>
    );
}
