// ===== Application Configuration =====

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
    
    // User Management
    profile: '/users/profile',
    updateProfile: '/users/profile',
    changePassword: '/users/change-password',
    
    // Medicine Search
    searchMedicines: '/search',
    getMedicine: '/medicines/:id',
    getAlternatives: '/medicines/:id/alternatives',
    getSuggestions: '/search/suggestions',
    
    // Pharmacies
    searchPharmacies: '/pharmacies/search',
    getPharmacy: '/pharmacies/:id',
    getNearbyPharmacies: '/pharmacies/nearby',
    
    // Inventory
    checkAvailability: '/inventory/check',
    getInventory: '/inventory/:pharmacyId',
    updateInventory: '/inventory/update',
    
    // Reservations
    createReservation: '/reservations',
    getUserReservations: '/reservations/user',
    cancelReservation: '/reservations/:id/cancel',
    
    // Favorites
    getFavorites: '/users/favorites',
    addFavorite: '/users/favorites',
    removeFavorite: '/users/favorites/:id',
    
    // Notifications
    getNotifications: '/notifications',
    markAsRead: '/notifications/:id/read',
    
    // Analytics (for pharmacists/admin)
    getAnalytics: '/analytics',
    getStats: '/analytics/stats'
};

// Application Settings
const APP_CONFIG = {
    name: 'Find my Med',
    version: '1.0.0',
    description: 'Real-time Medicine Availability Platform',
    
    // Search Configuration
    search: {
        minQueryLength: 2,
        debounceDelay: 300,
        maxSuggestions: 10,
        maxResults: 50
    },
    
    // Geolocation Settings
    geolocation: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        defaultRadius: 10000 // 10km in meters
    },
    
    // Voice Recognition Settings
    voiceRecognition: {
        lang: 'en-US',
        continuous: false,
        interimResults: false,
        maxAlternatives: 1
    },
    
    // Accessibility Settings
    accessibility: {
        fontSize: {
            small: 'font-size-small',
            medium: 'font-size-medium',
            large: 'font-size-large'
        },
        highContrast: 'high-contrast',
        reducedMotion: 'reduced-motion',
        voiceMode: 'voice-mode-active'
    },
    
    // Notification Settings
    notifications: {
        duration: {
            success: 3000,
            info: 5000,
            warning: 7000,
            error: 10000
        },
        maxVisible: 5
    },
    
    // Cache Settings
    cache: {
        expiry: {
            medicines: 3600000, // 1 hour
            pharmacies: 1800000, // 30 minutes
            userProfile: 300000,  // 5 minutes
            searchResults: 600000 // 10 minutes
        }
    },
    
    // PWA Settings
    pwa: {
        updateCheckInterval: 300000, // 5 minutes
        skipWaiting: true
    },
    
    // Real-time Updates
    realtime: {
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        pingInterval: 30000
    }
};

// Error Messages
const ERROR_MESSAGES = {
    network: 'Network error. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    unauthorized: 'Please log in to continue.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'Requested resource not found.',
    serverError: 'Server error. Please try again later.',
    validationError: 'Please check your input and try again.',
    locationError: 'Unable to get your location. Please enable location services.',
    voiceNotSupported: 'Voice recognition is not supported in your browser.',
    offlineError: 'This feature is not available offline.',
    quotaExceeded: 'Storage quota exceeded. Please clear some data.'
};

// Success Messages
const SUCCESS_MESSAGES = {
    loginSuccess: 'Welcome back!',
    registerSuccess: 'Account created successfully!',
    logoutSuccess: 'Logged out successfully.',
    profileUpdated: 'Profile updated successfully.',
    passwordChanged: 'Password changed successfully.',
    reservationCreated: 'Medicine reserved successfully.',
    reservationCancelled: 'Reservation cancelled.',
    favoriteAdded: 'Added to favorites.',
    favoriteRemoved: 'Removed from favorites.',
    settingsSaved: 'Settings saved successfully.'
};

// Medicine Categories
const MEDICINE_CATEGORIES = [
    'Pain Relief',
    'Antibiotics',
    'Diabetes',
    'Respiratory',
    'Cardiovascular',
    'Gastrointestinal',
    'Neurological',
    'Dermatology',
    'Vitamins & Supplements',
    'First Aid',
    'Baby Care',
    'Women\'s Health',
    'Men\'s Health',
    'Eye Care',
    'Dental Care'
];

// Pharmacy Services
const PHARMACY_SERVICES = [
    'Prescription Filling',
    'Health Consultations',
    'Blood Pressure Check',
    'Diabetes Screening',
    'Vaccination Services',
    'Medicine Delivery',
    '24/7 Emergency',
    'Online Consultation',
    'Insurance Accepted',
    'Senior Discounts'
];

// Status Types
const STATUS_TYPES = {
    medicine: {
        IN_STOCK: 'In Stock',
        LOW_STOCK: 'Low Stock',
        OUT_OF_STOCK: 'Out of Stock',
        DISCONTINUED: 'Discontinued'
    },
    pharmacy: {
        OPEN: 'Open',
        CLOSED: 'Closed',
        CLOSING_SOON: 'Closing Soon',
        TEMPORARILY_CLOSED: 'Temporarily Closed'
    },
    reservation: {
        PENDING: 'Pending',
        CONFIRMED: 'Confirmed',
        READY: 'Ready for Pickup',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        EXPIRED: 'Expired'
    }
};

// User Roles
const USER_ROLES = {
    CUSTOMER: 'customer',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin'
};

// Local Storage Keys
const STORAGE_KEYS = {
    authToken: 'authToken',
    userData: 'userData',
    userSettings: 'userSettings',
    searchHistory: 'searchHistory',
    favorites: 'favorites',
    recentSearches: 'recentSearches',
    locationData: 'locationData',
    offlineData: 'offlineData'
};

// Regular Expressions
const REGEX_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[+]?[(]?[\+]?\d{2,3}[)]?[-\s\.]?\d{3,4}[-\s\.]?\d{4,6}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    postalCode: /^\d{5,6}$/
};

// Map Configuration
const MAP_CONFIG = {
    defaultCenter: { lat: 19.0760, lng: 72.8777 }, // Mumbai coordinates
    defaultZoom: 12,
    markers: {
        user: {
            icon: '📍',
            color: '#4CAF50'
        },
        pharmacy: {
            icon: '🏥',
            color: '#2196F3'
        },
        selected: {
            icon: '⭐',
            color: '#FF9800'
        }
    }
};

// Export configuration for use in other modules
window.APP_CONFIG = APP_CONFIG;
window.API_BASE_URL = API_BASE_URL;
window.API_ENDPOINTS = API_ENDPOINTS;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
window.MEDICINE_CATEGORIES = MEDICINE_CATEGORIES;
window.PHARMACY_SERVICES = PHARMACY_SERVICES;
window.STATUS_TYPES = STATUS_TYPES;
window.USER_ROLES = USER_ROLES;
window.STORAGE_KEYS = STORAGE_KEYS;
window.REGEX_PATTERNS = REGEX_PATTERNS;
window.MAP_CONFIG = MAP_CONFIG;