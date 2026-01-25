// ============================================================
// CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://ryhopyvzareqomjamzjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aG9weXZ6YXJlcW9tamFtempvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjU4OTMsImV4cCI6MjA4MDI0MTg5M30.db-AI3xivMWK5PajXWDgUvXCMr6R5RD_LuvXkBLHjN8';

// ============================================================
// TRACKING
// ============================================================
let timeSpent = 0;
let lastVisibilityChange = Date.now();
const pagesVisited = new Set();
pagesVisited.add(window.location.pathname);

function initTracking() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            timeSpent += Date.now() - lastVisibilityChange;
        } else {
            lastVisibilityChange = Date.now();
        }
    });
}

async function getIpAndLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            ip: data.ip,
            country: data.country_name,
            city: data.city,
            region: data.region,
            latitude: data.latitude,
            longitude: data.longitude
        };
    } catch (error) {
        console.error('Error fetching IP/location:', error);
        return {
            ip: 'unknown',
            country: 'unknown',
            city: 'unknown',
            region: 'unknown',
            latitude: null,
            longitude: null
        };
    }
}

function getOSInfo() {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let version = 'Unknown';
    
    if (ua.indexOf('Win') !== -1) {
        os = 'Windows';
        if (ua.indexOf('Windows NT 10.0') !== -1) version = '10/11';
        else if (ua.indexOf('Windows NT 6.3') !== -1) version = '8.1';
        else if (ua.indexOf('Windows NT 6.2') !== -1) version = '8';
        else if (ua.indexOf('Windows NT 6.1') !== -1) version = '7';
    } else if (ua.indexOf('Mac') !== -1) {
        os = 'macOS';
        const match = ua.match(/Mac OS X ([\d_]+)/);
        if (match) version = match[1].replace(/_/g, '.');
    } else if (ua.indexOf('X11') !== -1 || ua.indexOf('Linux') !== -1) {
        os = 'Linux';
    } else if (ua.indexOf('Android') !== -1) {
        os = 'Android';
        const match = ua.match(/Android ([\d.]+)/);
        if (match) version = match[1];
    } else if (ua.indexOf('like Mac') !== -1) {
        os = 'iOS';
        const match = ua.match(/OS ([\d_]+)/);
        if (match) version = match[1].replace(/_/g, '.');
    }
    
    return { os, version };
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    if (ua.indexOf('Firefox') !== -1) {
        browser = 'Firefox';
        const match = ua.match(/Firefox\/([\d.]+)/);
        if (match) version = match[1];
    } else if (ua.indexOf('Edg') !== -1) {
        browser = 'Edge';
        const match = ua.match(/Edg\/([\d.]+)/);
        if (match) version = match[1];
    } else if (ua.indexOf('Chrome') !== -1) {
        browser = 'Chrome';
        const match = ua.match(/Chrome\/([\d.]+)/);
        if (match) version = match[1];
    } else if (ua.indexOf('Safari') !== -1) {
        browser = 'Safari';
        const match = ua.match(/Version\/([\d.]+)/);
        if (match) version = match[1];
    } else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) {
        browser = 'Opera';
        const match = ua.match(/(?:Opera|OPR)\/([\d.]+)/);
        if (match) version = match[1];
    }
    
    return { browser, version };
}

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'Mobile';
    }
    return 'Desktop';
}

function getNetworkType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        return {
            type: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 'unknown',
            rtt: connection.rtt || 'unknown',
            saveData: connection.saveData || false
        };
    }
    return { type: 'unknown', downlink: 'unknown', rtt: 'unknown', saveData: false };
}

function getStorageInfo() {
    let localStorage = false;
    let sessionStorage = false;
    let cookies = false;
    
    try {
        window.localStorage.setItem('test', 'test');
        window.localStorage.removeItem('test');
        localStorage = true;
    } catch (e) {}
    
    try {
        window.sessionStorage.setItem('test', 'test');
        window.sessionStorage.removeItem('test');
        sessionStorage = true;
    } catch (e) {}
    
    cookies = navigator.cookieEnabled;
    
    return { localStorage, sessionStorage, cookies };
}

async function getDeviceInfo() {
    const osInfo = getOSInfo();
    const browserInfo = getBrowserInfo();
    const networkInfo = getNetworkType();
    const storageInfo = getStorageInfo();
    const ipLocation = await getIpAndLocation();
    
    const currentTimeSpent = document.hidden ? 
        timeSpent : 
        timeSpent + (Date.now() - lastVisibilityChange);
    
    return {
        ip_address: ipLocation.ip,
        country: ipLocation.country,
        city: ipLocation.city,
        region: ipLocation.region,
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
        device_type: getDeviceType(),
        os: osInfo.os,
        os_version: osInfo.version,
        browser: browserInfo.browser,
        browser_version: browserInfo.version,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        screen_orientation: screen.orientation?.type || 'unknown',
        color_depth: window.screen.colorDepth,
        pixel_ratio: window.devicePixelRatio || 1,
        language: navigator.language,
        languages: navigator.languages?.join(', ') || navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezone_offset: new Date().getTimezoneOffset(),
        network_type: networkInfo.type,
        network_downlink: networkInfo.downlink,
        network_rtt: networkInfo.rtt,
        network_save_data: networkInfo.saveData,
        touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        max_touch_points: navigator.maxTouchPoints || 0,
        local_storage_enabled: storageInfo.localStorage,
        session_storage_enabled: storageInfo.sessionStorage,
        cookies_enabled: storageInfo.cookies,
        referrer: document.referrer || 'direct',
        current_page: window.location.pathname,
        pages_visited: Array.from(pagesVisited),
        time_spent_seconds: Math.round(currentTimeSpent / 1000),
        hardware_concurrency: navigator.hardwareConcurrency || 'unknown',
        device_memory: navigator.deviceMemory || 'unknown',
        timestamp: new Date().toISOString(),
        local_time: new Date().toString()
    };
}

// ============================================================
// TRANSLATIONS
// ============================================================
const translations = {
    en: {
        // Header
        getApprovedNow: "Get Approved Now",
        settings: "Settings",
        language: "Language",
        theme: "Theme",
        
        // Hero
        heroTitle: "NEED A LOAN?",
        heroTitleSpan: "You Have Come to the Right Place.",
        heroSubtitle: "Harmonie Finansies is one of the best lending services in South Africa. We have been serving our clients for the past 8 years.",
        getStarted: "Get Started",
        
        // About
        aboutTitle: "About",
        us: "Us",
        aboutIntro: "Obtain More Financial Capital with Our Crowdfunding Network.",
        aboutPara1: "Whether you want to refinance debt, fund strategic growth, or execute a significant business transaction, and your requirements exceed what a single commercial bank can offer, we can help through syndicated financing.",
        aboutPara2: "Our approach involves collaborating with you and a crowdfunding network to raise more capital. Together, we create a personalized solution aligned with your company's goals. We are experts in leading, organizing, and managing multi-bank credit facilities.",
        
        // Products
        productsTitle: "The Loan",
        products: "Products",
        weOffer: "We Offer",
        termLoan: "Term Loan",
        termLoanDesc: "Get funding in under 24 hours for up to R18.5 million with flexible repayment terms. Terms range from six to 24 months.",
        applyNow: "Apply Now",
        debtConsolidation: "Debt Consolidation",
        debtConsolidationDesc: "Save up to 60% on what you're currently paying throughout all of your advances and credit loans while extending your term and lowering your rates. Terms range from six to 18 months.",
        bridgeLoan: "Bridge/Merchant Cash Advance (MCA) Loan",
        bridgeLoanDesc: "Gain a quick advance of working capital—up to R9.25 million—to boost your profit margins and increase cash flow to meet any other business needs. Terms range up to nine months.",
        lineOfCredit: "Revolving Line of Credit",
        lineOfCreditDesc: "Only pay for what you pull—apply for fast credit approvals of up to R4.6 million. Businesses must operate for over three years and have a minimum revenue of R925,000 per month. Terms range up to 24 months.",
        personalLoan: "Personal Loan",
        personalLoanDesc: "Secure funding for personal needs with flexible repayment options. Get up to R500,000 with competitive interest rates. Terms range from 12 to 60 months based on your credit profile.",
        dayToDayLoan: "Day to Day Loan",
        dayToDayLoanDesc: "Quick access to short-term cash for daily expenses and emergencies. Borrow up to R50,000 with rapid approval and disbursement. Terms range from 1 to 6 months.",
        propertyLoan: "Property Loan",
        propertyLoanDesc: "Finance your property purchase or refinance existing property debt. Get up to R10 million for residential or commercial properties. Terms range from 10 to 30 years with competitive rates.",
        
        // Comparison
        differenceTitle: "The H-Fin",
        difference: "Difference",
        differenceSubtitle: "See how H-Fin's product loans compare to the traditional advances that banks offer.",
        withBanks: "With Banks",
        bank1: "700 FICO® minimum",
        bank2: "30–60 days to pull funds",
        bank3: "5+ years in business required",
        bank4: "90 days to process application",
        bank5: "Copy and paste financing solutions",
        bank6: "2 years' positive cash flow tax returns required",
        bank7: "Affects business credit score",
        bank8: "Longer repayment schedule",
        withHFin: "With H-Fin",
        hfin1: "550 FICO® minimum",
        hfin2: "1 day to access capital",
        hfin3: "1+ years in business required",
        hfin4: "1 day to process application",
        hfin5: "Tailor-made financing solutions",
        hfin6: "No tax returns required",
        hfin7: "Does not affect business or personal credit score",
        hfin8: "Shorter repayment schedule",
        
        // Process
        processTitle: "How It",
        works: "Works",
        processSubtitle: "Get your loan in just 3 simple steps",
        step1Title: "Fill Out the Application Form",
        step1Desc: "Go to our website and use the online form. It only takes 5 minutes to complete.",
        step2Title: "Upload Documents",
        step2Desc: "We need 3 months of bank statements, a payslip, and a copy of your ID for background checks.",
        step3Title: "Get Your Cash",
        step3Desc: "Once processed, we'll call you to confirm bank details and send the cash directly to your account.",
        
        // Contact
        contactTitle: "Request a",
        callback: "Callback",
        contactSubtitle: "Fill out the form below and we'll get back to you within 24 hours",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone Number",
        messageLabel: "Tell us a bit about yourself",
        sendMessage: "Send Your Message",
        
        // FAQ
        faqTitle: "Any",
        questions: "Questions",
        faq1Q: "What products does H-Fin offer?",
        faq1A: "H-Fin offers term loans, lines of credit, debt consolidation products, and bridge/MCA loans.",
        faq2Q: "What is the maximum funding amount?",
        faq2A: "H-Fin can fund your business up to R18.5 million per contract.",
        faq3Q: "How long are your terms?",
        faq3A: "Term ranges depend on what you qualify for, but they can last from six to 24 months.",
        faq4Q: "How do I qualify?",
        faq4A: "Base level qualification requirements include: A 550+ FICO® score, your last three months' bank statements, over one year of being in business, and R370,000 minimum of monthly revenue.",
        faq5Q: "How quickly can I receive funding?",
        faq5A: "You can receive your funds as soon as you accept your deal. This means you could get your funds the same day you apply.",
        faq6Q: "Does H-Fin pull hard or soft inquiries?",
        faq6A: "H-Fin pulls soft inquiries only.",
        
        // Chat
        chatWithUs: "Chat with us",
        
        // Footer
        termsTitle: "Terms &",
        conditions: "Conditions",
        term1: "• Loans are subject to availability and approval.",
        term2: "• Interest rates are based on individual credit scoring.",
        term3: "• Loan Limits: From R50,000 to R80,000,000",
        term4: "• Interest Rates: 2% to 10% per year",
        term5: "• Registration: Registered under FSP593769",
        copyright: "© 2026 H-Fin. All Rights Reserved."
    },
    af: {
        // Header
        getApprovedNow: "Kry Nou Goedkeuring",
        settings: "Instellings",
        language: "Taal",
        theme: "Tema",
        
        // Hero
        heroTitle: "BENODIG JY 'N LENING?",
        heroTitleSpan: "Jy het by die Regte Plek Gekom.",
        heroSubtitle: "Harmonie Finansies is een van die beste leningsdienste in Suid-Afrika. Ons dien al agt jaar lank ons kliënte.",
        getStarted: "Begin Nou",
        
        // About
        aboutTitle: "Oor",
        us: "Ons",
        aboutIntro: "Verkry Meer Finansiële Kapitaal met Ons Gemeenskapsfondsinsamelingsnetwerk.",
        aboutPara1: "Of jy skuld wil herfinansier, strategiese groei wil befonds, of 'n beduidende besigheidstransaksie wil uitvoer, en jou vereistes oorskry wat 'n enkele kommersiële bank kan bied, ons kan help deur gesindikateerde finansiering.",
        aboutPara2: "Ons benadering behels samewerking met jou en 'n gemeenskapsfondsinsamelingsnetwerk om meer kapitaal in te samel. Saam skep ons 'n persoonlike oplossing wat met jou maatskappy se doelwitte ooreenstem. Ons is kenners in die leiding, organisering en bestuur van multi-bank kredietfasiliteite.",
        
        // Products
        productsTitle: "Die Lening",
        products: "Produkte",
        weOffer: "Wat Ons Bied",
        termLoan: "Termlening",
        termLoanDesc: "Kry befondsing in minder as 24 uur vir tot R18.5 miljoen met buigsame terugbetalingsterme. Terme wissel van ses tot 24 maande.",
        applyNow: "Doen Nou Aansoek",
        debtConsolidation: "Skuldkonsolidasie",
        debtConsolidationDesc: "Bespaar tot 60% op wat jy tans betaal oor al jou voorskotte en kredietlenings terwyl jy jou termyn verleng en jou tariewe verlaag. Terme wissel van ses tot 18 maande.",
        bridgeLoan: "Brug/Handelaar Kontantvoorskot (MCA) Lening",
        bridgeLoanDesc: "Kry 'n vinnige voorskot van bedryfskapitaal—tot R9.25 miljoen—om jou winsmarges te verhoog en kontantvloei te vermeerder om enige ander besigheidsbehoeftes te voldoen. Terme wissel tot nege maande.",
        lineOfCredit: "Roterende Kredietlyn",
        lineOfCreditDesc: "Betaal net vir wat jy trek—doen aansoek vir vinnige kredietgoedkeurings van tot R4.6 miljoen. Besighede moet vir meer as drie jaar bedryf en 'n minimum inkomste van R925,000 per maand hê. Terme wissel tot 24 maande.",
        personalLoan: "Persoonlike Lening",
        personalLoanDesc: "Verseker befondsing vir persoonlike behoeftes met buigsame terugbetalingsopsies. Kry tot R500,000 met mededingende rentekoerse. Terme wissel van 12 tot 60 maande gebaseer op jou kredietprofiel.",
        dayToDayLoan: "Dag-tot-Dag Lening",
        dayToDayLoanDesc: "Vinnige toegang tot korttermyn kontant vir daaglikse uitgawes en noodgevalle. Leen tot R50,000 met vinnige goedkeuring en uitbetaling. Terme wissel van 1 tot 6 maande.",
        propertyLoan: "Eiendomslening",
        propertyLoanDesc: "Befonds jou eiendomsaankoop of herfinansier bestaande eiendomsskuld. Kry tot R10 miljoen vir residensiële of kommersiële eiendomme. Terme wissel van 10 tot 30 jaar met mededingende tariewe.",
        
        // Comparison
        differenceTitle: "Die H-Fin",
        difference: "Verskil",
        differenceSubtitle: "Sien hoe H-Fin se produklenings vergelyk met die tradisionele voorskotte wat banke bied.",
        withBanks: "Met Banke",
        bank1: "700 FICO® minimum",
        bank2: "30–60 dae om fondse te trek",
        bank3: "5+ jaar in besigheid vereis",
        bank4: "90 dae om aansoek te verwerk",
        bank5: "Knip-en-plak finansieringsoplossings",
        bank6: "2 jaar se positiewe kontantvloei belastingopgawes vereis",
        bank7: "Beïnvloed besigheidskredietpunt",
        bank8: "Langer terugbetalingskedule",
        withHFin: "Met H-Fin",
        hfin1: "550 FICO® minimum",
        hfin2: "1 dag om toegang tot kapitaal te kry",
        hfin3: "1+ jaar in besigheid vereis",
        hfin4: "1 dag om aansoek te verwerk",
        hfin5: "Pasgemaakte finansieringsoplossings",
        hfin6: "Geen belastingopgawes vereis nie",
        hfin7: "Beïnvloed nie besigheids- of persoonlike kredietpunt nie",
        hfin8: "Korter terugbetalingskedule",
        
        // Process
        processTitle: "Hoe Dit",
        works: "Werk",
        processSubtitle: "Kry jou lening in net 3 eenvoudige stappe",
        step1Title: "Vul die Aansoekvorm In",
        step1Desc: "Gaan na ons webwerf en gebruik die aanlyn vorm. Dit neem net 5 minute om te voltooi.",
        step2Title: "Laai Dokumente Op",
        step2Desc: "Ons benodig 3 maande se bankstate, 'n betaalstrook, en 'n kopie van jou ID vir agtergrondondersoeke.",
        step3Title: "Kry Jou Kontant",
        step3Desc: "Sodra verwerk, sal ons jou bel om bankbesonderhede te bevestig en die kontant direk na jou rekening te stuur.",
        
        // Contact
        contactTitle: "Versoek 'n",
        callback: "Terugoproep",
        contactSubtitle: "Vul die vorm hieronder in en ons sal jou binne 24 uur kontak",
        firstName: "Voornaam",
        lastName: "Van",
        email: "E-pos",
        phone: "Telefoonnommer",
        messageLabel: "Vertel ons 'n bietjie van jouself",
        sendMessage: "Stuur Jou Boodskap",
        
        // FAQ
        faqTitle: "Enige",
        questions: "Vrae",
        faq1Q: "Watter produkte bied H-Fin aan?",
        faq1A: "H-Fin bied termlenings, kredietlyne, skuldkonsolidasieprodukte, en brug/MCA lenings aan.",
        faq2Q: "Wat is die maksimum befondsingsberag?",
        faq2A: "H-Fin kan jou besigheid tot R18.5 miljoen per kontrak befonds.",
        faq3Q: "Hoe lank is julle terme?",
        faq3A: "Termynreekse hang af van waarvoor jy kwalifiseer, maar dit kan van ses tot 24 maande duur.",
        faq4Q: "Hoe kwalifiseer ek?",
        faq4A: "Basiese kwalifikasievereistes sluit in: 'n 550+ FICO® telling, jou laaste drie maande se bankstate, meer as een jaar in besigheid, en R370,000 minimum van maandelikse inkomste.",
        faq5Q: "Hoe vinnig kan ek befondsing ontvang?",
        faq5A: "Jy kan jou fondse ontvang sodra jy jou ooreenkoms aanvaar. Dit beteken jy kan jou fondse dieselfde dag wat jy aansoek doen, kry.",
        faq6Q: "Trek H-Fin harde of sagte navrae?",
        faq6A: "H-Fin trek slegs sagte navrae.",
        
        // Chat
        chatWithUs: "Gesels met ons",
        
        // Footer
        termsTitle: "Terme &",
        conditions: "Voorwaardes",
        term1: "• Lenings is onderhewig aan beskikbaarheid en goedkeuring.",
        term2: "• Rentekoerse is gebaseer op individuele kredietpuntebepaling.",
        term3: "• Leninglimiete: Van R50,000 tot R80,000,000",
        term4: "• Rentekoerse: 2% tot 10% per jaar",
        term5: "• Registrasie: Geregistreer onder FSP593769",
        copyright: "© 2026 H-Fin. Alle Regte Voorbehou."
    }
};

let currentLanguage = localStorage.getItem('hfin_language') || 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('hfin_language', lang);
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        }
    });
}

// ============================================================
// THEME
// ============================================================
function initTheme() {
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

// ============================================================
// SETTINGS
// ============================================================
function initSettings() {
    const settingsButton = document.getElementById('settingsButton');
    const settingsPanel = document.getElementById('settingsPanel');
    const languageSelect = document.getElementById('languageSelect');
    
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
// FIRST VISIT LANGUAGE SELECTOR
// ============================================================
function showLanguageSelector() {
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
        
        // Add hover effects
        modal.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
            btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
        });
    }
}

// ============================================================
// INITIALIZATION
// ============================================================
initUI();
initTheme();
initSettings();
initTracking();
initChat();
setLanguage(currentLanguage);
showLanguageSelector();

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