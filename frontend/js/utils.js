// ===== Utility Functions =====

// Date and Time Utilities
const DateUtils = {
    // Format date for display
    formatDate(date, format = 'short') {
        if (!date) return '';
        
        const d = new Date(date);
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { 
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    },
    
    // Get relative time (e.g., "2 minutes ago")
    getRelativeTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        return this.formatDate(date);
    },
    
    // Check if pharmacy is open
    isPharmacyOpen(operatingHours) {
        if (!operatingHours) return false;
        
        const now = new Date();
        const currentDay = now.toLocaleLowerCase().substring(0, 3); // mon, tue, etc.
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
        
        const todayHours = operatingHours[currentDay];
        if (!todayHours || todayHours.closed) return false;
        
        const openTime = this.timeToMinutes(todayHours.open);
        const closeTime = this.timeToMinutes(todayHours.close);
        
        // Handle overnight hours (e.g., 22:00 - 06:00)
        if (closeTime < openTime) {
            return currentTime >= openTime || currentTime <= closeTime;
        }
        
        return currentTime >= openTime && currentTime <= closeTime;
    },
    
    // Convert time string to minutes
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },
    
    // Get pharmacy status
    getPharmacyStatus(operatingHours) {
        if (!operatingHours) return 'UNKNOWN';
        
        const isOpen = this.isPharmacyOpen(operatingHours);
        if (isOpen) {
            // Check if closing soon (within 1 hour)
            const now = new Date();
            const currentDay = now.toLocaleLowerCase().substring(0, 3);
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const todayHours = operatingHours[currentDay];
            
            if (todayHours && !todayHours.closed) {
                const closeTime = this.timeToMinutes(todayHours.close);
                const timeDiff = closeTime - currentTime;
                
                if (timeDiff <= 60 && timeDiff > 0) {
                    return 'CLOSING_SOON';
                }
            }
            
            return 'OPEN';
        }
        
        return 'CLOSED';
    }
};

// String Utilities
const StringUtils = {
    // Capitalize first letter
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    // Convert to title case
    titleCase(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },
    
    // Truncate string with ellipsis
    truncate(str, length = 50, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    },
    
    // Remove extra spaces and trim
    cleanSpaces(str) {
        if (!str) return '';
        return str.replace(/\s+/g, ' ').trim();
    },
    
    // Generate slug from string
    slugify(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    // Highlight search terms
    highlightText(text, query) {
        if (!text || !query) return text;
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },
    
    // Escape regex special characters
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// Number Utilities
const NumberUtils = {
    // Format currency
    formatCurrency(amount, currency = 'INR') {
        if (!amount && amount !== 0) return '';
        
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        
        return formatter.format(amount);
    },
    
    // Format large numbers (e.g., 1.2K, 1.5M)
    formatLargeNumber(num) {
        if (!num && num !== 0) return '';
        
        const absNum = Math.abs(num);
        if (absNum >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (absNum >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    // Calculate distance between two coordinates
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },
    
    // Convert degrees to radians
    deg2rad(deg) {
        return deg * (Math.PI/180);
    },
    
    // Format distance
    formatDistance(distance) {
        if (!distance && distance !== 0) return '';
        
        if (distance < 1) {
            return Math.round(distance * 1000) + 'm';
        }
        return distance.toFixed(1) + 'km';
    },
    
    // Generate random ID
    generateId(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};

// Array Utilities
const ArrayUtils = {
    // Remove duplicates from array
    unique(arr, key = null) {
        if (!key) {
            return [...new Set(arr)];
        }
        
        const seen = new Set();
        return arr.filter(item => {
            const value = key.split('.').reduce((obj, k) => obj?.[k], item);
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    },
    
    // Sort array by property
    sortBy(arr, key, direction = 'asc') {
        return [...arr].sort((a, b) => {
            const aVal = key.split('.').reduce((obj, k) => obj?.[k], a);
            const bVal = key.split('.').reduce((obj, k) => obj?.[k], b);
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // Group array by property
    groupBy(arr, key) {
        return arr.reduce((groups, item) => {
            const value = key.split('.').reduce((obj, k) => obj?.[k], item);
            groups[value] = groups[value] || [];
            groups[value].push(item);
            return groups;
        }, {});
    },
    
    // Chunk array into smaller arrays
    chunk(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
};

// DOM Utilities
const DOMUtils = {
    // Create element with attributes
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },
    
    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    },
    
    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    }
};

// URL Utilities
const URLUtils = {
    // Get URL parameters
    getParams() {
        return new URLSearchParams(window.location.search);
    },
    
    // Set URL parameter
    setParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    },
    
    // Remove URL parameter
    removeParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    },
    
    // Build URL with parameters
    buildURL(base, params = {}) {
        const url = new URL(base);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });
        return url.toString();
    }
};

// Validation Utilities
const ValidationUtils = {
    // Validate email
    isValidEmail(email) {
        return REGEX_PATTERNS.email.test(email);
    },
    
    // Validate phone
    isValidPhone(phone) {
        return REGEX_PATTERNS.phone.test(phone);
    },
    
    // Validate password strength
    isStrongPassword(password) {
        return REGEX_PATTERNS.password.test(password);
    },
    
    // Sanitize HTML
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    
    // Check if string is empty or whitespace
    isEmpty(str) {
        return !str || str.trim().length === 0;
    },
    
    // Validate required fields
    validateRequired(fields) {
        const errors = {};
        
        Object.entries(fields).forEach(([key, value]) => {
            if (this.isEmpty(value)) {
                errors[key] = `${StringUtils.titleCase(key)} is required`;
            }
        });
        
        return errors;
    }
};

// Device Detection
const DeviceUtils = {
    // Check if mobile device
    isMobile() {
        return window.innerWidth <= 767;
    },
    
    // Check if tablet
    isTablet() {
        return window.innerWidth > 767 && window.innerWidth <= 1023;
    },
    
    // Check if desktop
    isDesktop() {
        return window.innerWidth > 1023;
    },
    
    // Check if touch device
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    // Get device type
    getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    },
    
    // Check if online
    isOnline() {
        return navigator.onLine;
    }
};

// Storage Utilities
const StorageUtils = {
    // Set item with expiry
    setWithExpiry(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    // Get item with expiry check
    getWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            const now = new Date();
            
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            localStorage.removeItem(key);
            return null;
        }
    },
    
    // Clear expired items
    clearExpired() {
        const now = new Date();
        
        Object.keys(localStorage).forEach(key => {
            try {
                const itemStr = localStorage.getItem(key);
                const item = JSON.parse(itemStr);
                
                if (item.expiry && now.getTime() > item.expiry) {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                // Not a structured item, skip
            }
        });
    }
};

// Performance Utilities
const PerformanceUtils = {
    // Debounce function
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Measure execution time
    measureTime(func, ...args) {
        const start = performance.now();
        const result = func(...args);
        const end = performance.now();
        console.log(`Execution time: ${end - start} milliseconds`);
        return result;
    }
};

// Analytics Utilities
const AnalyticsUtils = {
    // Track event
    trackEvent(eventName, properties = {}) {
        // Basic event tracking
        console.log('Event tracked:', eventName, properties);
        
        // In a real app, you would send this to your analytics service
        // Example: gtag('event', eventName, properties);
    },
    
    // Track page view
    trackPageView(page) {
        this.trackEvent('page_view', {
            page: page,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer
        });
    },
    
    // Track search
    trackSearch(query, results) {
        this.trackEvent('search', {
            query: query,
            results_count: results.length,
            timestamp: new Date().toISOString()
        });
    }
};

// Export utilities
window.DateUtils = DateUtils;
window.StringUtils = StringUtils;
window.NumberUtils = NumberUtils;
window.ArrayUtils = ArrayUtils;
window.DOMUtils = DOMUtils;
window.URLUtils = URLUtils;
window.ValidationUtils = ValidationUtils;
window.DeviceUtils = DeviceUtils;
window.StorageUtils = StorageUtils;
window.PerformanceUtils = PerformanceUtils;
window.AnalyticsUtils = AnalyticsUtils;