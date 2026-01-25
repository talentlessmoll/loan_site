let timeSpent = 0;
let lastVisibilityChange = Date.now();
const pagesVisited = new Set();
pagesVisited.add(window.location.pathname);

export function initTracking() {
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

export async function getDeviceInfo() {
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