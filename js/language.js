import { setLanguage } from './translations.js';

export { setLanguage };

export function initLanguageSelector() {
    const hasVisited = localStorage.getItem('hfin_has_visited');
    
    if (!hasVisited) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--bg-card);
                border: 1px solid var(--border-color-hover);
                border-radius: 12px;
                padding: 40px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            ">
                <h2 style="margin-bottom: 20px; font-size: 24px;">Welcome to H-Fin</h2>
                <p style="margin-bottom: 30px; opacity: 0.8;">Please select your preferred language</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button id="selectEnglish" style="
                        background: var(--accent-color);
                        color: #F2F2EB;
                        border: none;
                        padding: 16px 32px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.3s;
                    ">English</button>
                    <button id="selectAfrikaans" style="
                        background: var(--accent-color);
                        color: #F2F2EB;
                        border: none;
                        padding: 16px 32px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.3s;
                    ">Afrikaans</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('selectEnglish').addEventListener('click', () => {
            setLanguage('en');
            localStorage.setItem('hfin_has_visited', 'true');
            document.body.removeChild(modal);
        });
        
        document.getElementById('selectAfrikaans').addEventListener('click', () => {
            setLanguage('af');
            localStorage.setItem('hfin_has_visited', 'true');
            document.body.removeChild(modal);
        });
        
        modal.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
            btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
        });
    }
}