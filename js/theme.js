export function initTheme() {
    const themeDropdown = document.getElementById('themeSelect');
    const themes = {
        'orange-dark': { accent: '#F9501B', light: 'rgba(249, 80, 27, 0.1)', mode: 'dark' },
        'orange-light': { accent: '#F9501B', light: 'rgba(249, 80, 27, 0.1)', mode: 'light' },
        'red-dark': { accent: '#E53935', light: 'rgba(229, 57, 53, 0.1)', mode: 'dark' },
        'red-light': { accent: '#E53935', light: 'rgba(229, 57, 53, 0.1)', mode: 'light' },
        'blue-dark': { accent: '#1E88E5', light: 'rgba(30, 136, 229, 0.1)', mode: 'dark' },
        'blue-light': { accent: '#1E88E5', light: 'rgba(30, 136, 229, 0.1)', mode: 'light' },
        'green-dark': { accent: '#43A047', light: 'rgba(67, 160, 71, 0.1)', mode: 'dark' },
        'green-light': { accent: '#43A047', light: 'rgba(67, 160, 71, 0.1)', mode: 'light' },
        'purple-dark': { accent: '#8E24AA', light: 'rgba(142, 36, 170, 0.1)', mode: 'dark' },
        'purple-light': { accent: '#8E24AA', light: 'rgba(142, 36, 170, 0.1)', mode: 'light' }
    };

    const savedTheme = localStorage.getItem('hfin_theme') || 'orange-dark';
    themeDropdown.value = savedTheme;
    applyTheme(savedTheme, themes);

    themeDropdown.addEventListener('change', (e) => {
        const themeValue = e.target.value;
        localStorage.setItem('hfin_theme', themeValue);
        applyTheme(themeValue, themes);
    });
}

function applyTheme(themeValue, themes) {
    const theme = themes[themeValue];
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--accent-color-light', theme.light);
    
    if (theme.mode === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}