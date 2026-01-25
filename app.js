// ============================================================
// CONFIGURATION
// ============================================================
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './js/config.js';
import { translations } from './js/translations.js';
import { getDeviceInfo, initTracking } from './js/tracking.js';
import { setLanguage, initLanguageSelector } from './js/language.js';
import { initTheme } from './js/theme.js';


// ============================================================
// TRACKING (moved to ./js/tracking.js)
// ============================================================

// ============================================================
// TRANSLATIONS (moved to ./js/translations.js)
// ============================================================
// removed const translations = {...}
// removed let currentLanguage = ...
// removed function setLanguage() {...}

// ============================================================
// THEME (moved to ./js/theme.js)
// ============================================================
// removed function initTheme() {...}
// removed function applyTheme() {...}

// ============================================================
// SETTINGS
// ============================================================
function initSettings() {
    const settingsButton = document.getElementById('settingsButton');
    const settingsPanel = document.getElementById('settingsPanel');
    const languageSelect = document.getElementById('languageSelect');
    
    const currentLanguage = localStorage.getItem('hfin_language') || 'en';
    languageSelect.value = currentLanguage;
    
    settingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsButton.contains(e.target)) {
            settingsPanel.classList.remove('active');
        }
    });
    
    languageSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
}

// ============================================================
// UI INTERACTIONS
// ============================================================
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const wasActive = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
            });
            
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .slide-left, .slide-right, .scale-in').forEach(el => {
        observer.observe(el);
    });

    document.querySelectorAll('.product-grid, .process-grid, .faq-grid').forEach(grid => {
        const items = grid.querySelectorAll('.stagger-item');
        
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('visible');
                        }, index * 100);
                    });
                    staggerObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        staggerObserver.observe(grid);
    });
}

function initUI() {
    initFAQ();
    initSmoothScroll();
    initAnimations();
}

// ============================================================
// CHAT
// ============================================================
async function checkUnreadMessages() {
    const chatId = localStorage.getItem('hfin_chat_id');
    if (!chatId) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/loan?id=eq.${chatId}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const data = await response.json();
        if (data.length > 0 && data[0].chat) {
            const unreadCount = data[0].chat.filter(msg => msg.sender === 'support' && !msg.read).length;
            const notification = document.getElementById('chatNotification');
            
            if (unreadCount > 0) {
                notification.textContent = unreadCount > 9 ? '9+' : unreadCount;
                notification.style.display = 'flex';
            } else {
                notification.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking unread messages:', error);
    }
}

function initChat() {
    const chatButton = document.getElementById('chatButton');
    
    chatButton.addEventListener('click', () => {
        window.open('./chat.html', 'H-Fin Customer Support', 'width=450,height=700,left=100,top=100');
    });
    
    // Check for unread messages periodically if user has a chat
    if (localStorage.getItem('hfin_chat_id')) {
        checkUnreadMessages();
        setInterval(checkUnreadMessages, 5000);
    }
}

// ============================================================
// FIRST VISIT LANGUAGE SELECTOR (moved to ./js/language.js)
// ============================================================
// removed function showLanguageSelector() {...}

// ============================================================
// INITIALIZATION
// ============================================================
initUI();
initTheme();
initSettings();
initTracking();
initChat();
setLanguage(localStorage.getItem('hfin_language') || 'en');
initLanguageSelector();

// ============================================================
// CONTACT FORM
// ============================================================
document.querySelector('.contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    const deviceInfo = await getDeviceInfo();
    
    const formData = {
        name: `${form.firstName.value} ${form.lastName.value}`,
        email: form.email.value,
        phone: form.phone.value,
        intro: form.message.value,
        device_info: deviceInfo
    };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/loan`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('Thank you for your message! We will contact you within 24 hours.');
            form.reset();
        } else {
            throw new Error('Failed to submit form');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error submitting your request. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
});