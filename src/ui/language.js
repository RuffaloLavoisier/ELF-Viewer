import { state } from '../state.js';
import { langButtons } from './elements.js';

export function initLanguageToggle() {
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentLanguage = btn.dataset.lang || 'en';
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}
