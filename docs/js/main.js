// ===== Main Application JavaScript =====

// Global app state
window.findMyMedApp = {
    currentUser: null,
    currentPage: 'home',
    isLoading: false,
    searchResults: [],
    settings: {
        fontSize: 'medium',
        highContrast: false,
        voiceMode: false,
        reducedMotion: false
    }
};

// ===== DOM Ready Event =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Find my Med app initializing...');
    
    // Initialize the application
    initializeApp();
    
    // Load user settings
    loadUserSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Hide loading spinner
    setTimeout(() => {
        hideLoading();
    }, 1000);
    
    // Check for URL parameters
    handleUrlParams();
    
    console.log('Find my Med app initialized successfully');
});

// ===== Application Initialization =====
function initializeApp() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Apply saved accessibility settings
    applyAccessibilitySettings();
    
    // Initialize search functionality
    if (typeof initializeSearch === 'function') {
        initializeSearch();
    }
    
    // Initialize voice recognition if supported
    if (typeof initializeVoiceRecognition === 'function') {
        initializeVoiceRecognition();
    }
    
    // Set up real-time updates
    setupRealTimeUpdates();
    
    // Initialize PWA features
    initializePWA();
}

// ===== Event Listeners Setup =====
function setupEventListeners() {
    // Navigation event listeners
    setupNavigationListeners();
    
    // Accessibility event listeners
    setupAccessibilityListeners();
    
    // Modal event listeners
    setupModalListeners();
    
    // Form event listeners
    setupFormListeners();
    
    // Window event listeners
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Click outside events
    document.addEventListener('click', handleOutsideClicks);
}

// ===== Navigation Functions =====
function navigateTo(page) {
    console.log(`Navigating to: ${page}`);
    
    // Close any open dropdowns
    closeAllDropdowns();
    
    // Update current page
    const oldPage = window.findMyMedApp.currentPage;
    window.findMyMedApp.currentPage = page.replace('/', '');
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // Show target page
    let targetPageId = 'home-page';
    if (page === '/search') targetPageId = 'search-page';
    else if (page === '/pharmacies') targetPageId = 'pharmacies-page';
    else if (page === '/about') targetPageId = 'about-page';
    else if (page === '/contact') targetPageId = 'contact-page';
    else if (page === '/dashboard') targetPageId = 'dashboard-page';
    else if (page === '/profile') targetPageId = 'profile-page';
    
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update document title
        updatePageTitle(page);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Update URL without page reload
        history.pushState({ page: page }, '', page === '/' ? '/' : page);
        
        // Announce page change for screen readers
        announcePageChange(page);
        
        // Load page-specific content
        loadPageContent(page);
    }
    
    // Close mobile menu if open
    closeMobileMenu();
}

function updatePageTitle(page) {
    const titles = {
        '/': 'Find my Med - Real-time Medicine Availability',
        '/search': 'Search Medicines - Find my Med',
        '/pharmacies': 'Find Pharmacies - Find my Med',
        '/about': 'About Us - Find my Med',
        '/contact': 'Contact - Find my Med',
        '/dashboard': 'Dashboard - Find my Med',
        '/profile': 'Profile - Find my Med'
    };
    
    document.title = titles[page] || 'Find my Med';
}

function loadPageContent(page) {
    // Load content specific to each page
    switch(page) {
        case '/search':
            loadSearchPage();
            break;
        case '/pharmacies':
            loadPharmaciesPage();
            break;
        case '/dashboard':
            loadDashboardPage();
            break;
        default:
            // Home page or other pages
            break;
    }
}

// ===== Mobile Navigation =====
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const isOpen = navMenu.classList.contains('show');
    
    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const authButtons = document.getElementById('auth-buttons');
    
    navMenu.classList.add('show');
    
    // Add auth buttons to mobile menu
    if (authButtons && !window.findMyMedApp.currentUser) {
        const authClone = authButtons.cloneNode(true);
        navMenu.appendChild(authClone);
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    trapFocus(navMenu);
    
    // Announce for screen readers
    announceToScreenReader('Menu opened');
}

function closeMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.remove('show');
    
    // Remove cloned auth buttons
    const clonedAuth = navMenu.querySelector('#auth-buttons');
    if (clonedAuth) {
        clonedAuth.remove();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Announce for screen readers
    announceToScreenReader('Menu closed');
}

// ===== Dropdown Functions =====
function toggleAccessibilityMenu() {
    const dropdown = document.getElementById('accessibility-dropdown');
    const isOpen = dropdown.classList.contains('show');
    
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.classList.add('show');
        trapFocus(dropdown);
        announceToScreenReader('Accessibility menu opened');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    const isOpen = dropdown.classList.contains('show');
    
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.classList.add('show');
        trapFocus(dropdown);
        announceToScreenReader('User menu opened');
    }
}

function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.accessibility-dropdown, .user-dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// ===== Authentication Functions =====
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            setCurrentUser(user);
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    }
}

function setCurrentUser(user) {
    window.findMyMedApp.currentUser = user;
    
    // Update UI
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    
    if (authButtons && userProfile && userName && userRole) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'block';
        userName.textContent = user.name;
        userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    
    // Load user-specific content
    loadUserContent();
}

function logout() {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Reset app state
    window.findMyMedApp.currentUser = null;
    
    // Update UI
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (authButtons && userProfile) {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
    
    // Navigate to home
    navigateTo('/');
    
    // Show success message
    showToast('Logged out successfully', 'info');
    
    // Close user menu
    closeAllDropdowns();
}

// ===== Modal Functions =====
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    showModal(modal);
}

function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    showModal(modal);
}

function showModal(modal) {
    if (!modal) return;
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus on first input
    const firstInput = modal.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Trap focus
    trapFocus(modal);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clear form
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

function switchToRegister() {
    closeModal('login-modal');
    setTimeout(() => showRegisterModal(), 300);
}

function switchToLogin() {
    closeModal('register-modal');
    setTimeout(() => showLoginModal(), 300);
}

// ===== Loading Functions =====
function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.remove('hidden');
        window.findMyMedApp.isLoading = true;
    }
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.add('hidden');
        window.findMyMedApp.isLoading = false;
    }
}

// ===== Toast Notification Functions =====
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="closeToast(this)" aria-label="Close notification">&times;</button>
        </div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            closeToast(toast.querySelector('.toast-close'));
        }
    }, duration);
    
    // Announce to screen readers
    announceToScreenReader(message);
}

function closeToast(button) {
    const toast = button.closest('.toast');
    if (toast) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// ===== Accessibility Functions =====
function loadUserSettings() {
    const settings = localStorage.getItem('userSettings');
    if (settings) {
        try {
            window.findMyMedApp.settings = { ...window.findMyMedApp.settings, ...JSON.parse(settings) };
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    }
}

function saveUserSettings() {
    localStorage.setItem('userSettings', JSON.stringify(window.findMyMedApp.settings));
}

function applyAccessibilitySettings() {
    const { fontSize, highContrast, voiceMode, reducedMotion } = window.findMyMedApp.settings;
    
    // Apply font size
    document.body.className = document.body.className.replace(/font-size-\w+/, '');
    document.body.classList.add(`font-size-${fontSize}`);
    
    // Apply high contrast
    if (highContrast) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (reducedMotion) {
        document.body.classList.add('reduced-motion');
    } else {
        document.body.classList.remove('reduced-motion');
    }
    
    // Apply accessibility enhancements
    if (fontSize === 'large' || highContrast) {
        document.body.classList.add('accessibility-enhanced');
    } else {
        document.body.classList.remove('accessibility-enhanced');
    }
}

function changeFontSize(size) {
    window.findMyMedApp.settings.fontSize = size;
    applyAccessibilitySettings();
    saveUserSettings();
    announceToScreenReader(`Font size changed to ${size}`);
}

function toggleHighContrast(enabled) {
    window.findMyMedApp.settings.highContrast = enabled;
    applyAccessibilitySettings();
    saveUserSettings();
    announceToScreenReader(`High contrast ${enabled ? 'enabled' : 'disabled'}`);
}

function toggleVoiceMode(enabled) {
    window.findMyMedApp.settings.voiceMode = enabled;
    saveUserSettings();
    
    if (enabled && typeof enableVoiceMode === 'function') {
        enableVoiceMode();
    } else if (typeof disableVoiceMode === 'function') {
        disableVoiceMode();
    }
    
    announceToScreenReader(`Voice mode ${enabled ? 'enabled' : 'disabled'}`);
}

// ===== Utility Functions =====
function announceToScreenReader(message) {
    // Create or update live region for screen readers
    let liveRegion = document.getElementById('live-region');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.className = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
}

function announcePageChange(page) {
    const pageNames = {
        '/': 'Home page',
        '/search': 'Search medicines page',
        '/pharmacies': 'Find pharmacies page',
        '/about': 'About us page',
        '/contact': 'Contact page',
        '/dashboard': 'Dashboard page',
        '/profile': 'Profile page'
    };
    
    announceToScreenReader(`Navigated to ${pageNames[page] || 'new page'}`);
}

function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    function handleTabKey(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }
    
    element.addEventListener('keydown', handleTabKey);
    
    // Remove listener when element is no longer visible
    const observer = new MutationObserver(() => {
        if (!element.classList.contains('show')) {
            element.removeEventListener('keydown', handleTabKey);
            observer.disconnect();
        }
    });
    
    observer.observe(element, { attributes: true, attributeFilter: ['class'] });
}

// ===== Event Handler Functions =====
function setupNavigationListeners() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            navigateTo(event.state.page);
        }
    });
}

function setupAccessibilityListeners() {
    // Check for system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.findMyMedApp.settings.reducedMotion = true;
        applyAccessibilitySettings();
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        window.findMyMedApp.settings.highContrast = true;
        applyAccessibilitySettings();
    }
}

function setupModalListeners() {
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function setupFormListeners() {
    // Add form validation
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });
    });
}

function handleKeyboardNavigation(e) {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'k':
                e.preventDefault();
                focusSearchInput();
                break;
            case 'h':
                e.preventDefault();
                navigateTo('/');
                break;
        }
    }
    
    // Handle escape key
    if (e.key === 'Escape') {
        closeAllDropdowns();
        closeMobileMenu();
    }
}

function handleOutsideClicks(e) {
    // Close dropdowns when clicking outside
    if (!e.target.closest('.accessibility-menu')) {
        const accessibilityDropdown = document.getElementById('accessibility-dropdown');
        if (accessibilityDropdown) {
            accessibilityDropdown.classList.remove('show');
        }
    }
    
    if (!e.target.closest('.user-profile')) {
        const userDropdown = document.getElementById('user-dropdown');
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
    }
}

function handleWindowResize() {
    // Close mobile menu on desktop
    if (window.innerWidth > 767) {
        closeMobileMenu();
    }
    
    // Close dropdowns on mobile
    if (window.innerWidth <= 767) {
        closeAllDropdowns();
    }
}

function handleOnlineStatus() {
    showToast('Connection restored', 'success');
    // Sync any pending data
    syncPendingData();
}

function handleOfflineStatus() {
    showToast('You are offline. Some features may be limited.', 'warning', 8000);
}

function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const search = params.get('search');
    
    if (page) {
        navigateTo(`/${page}`);
    }
    
    if (search) {
        const searchInput = document.getElementById('medicine-search');
        if (searchInput) {
            searchInput.value = search;
            // Trigger search if on search page
            if (window.findMyMedApp.currentPage === 'search') {
                performSearch({ preventDefault: () => {} });
            }
        }
    }
}

// ===== Page-specific Functions =====
function loadSearchPage() {
    // Initialize search page specific functionality
    console.log('Loading search page...');
}

function loadPharmaciesPage() {
    // Initialize pharmacies page specific functionality
    console.log('Loading pharmacies page...');
    // Load nearby pharmacies
    if (typeof loadNearbyPharmacies === 'function') {
        loadNearbyPharmacies();
    }
}

function loadDashboardPage() {
    // Initialize dashboard based on user role
    console.log('Loading dashboard page...');
    const user = window.findMyMedApp.currentUser;
    
    if (!user) {
        navigateTo('/');
        showLoginModal();
        return;
    }
    
    // Load role-specific dashboard
    if (typeof loadUserDashboard === 'function') {
        loadUserDashboard(user.role);
    }
}

function loadUserContent() {
    // Load user-specific content across the app
    const user = window.findMyMedApp.currentUser;
    if (!user) return;
    
    // Load favorites, history, etc.
    if (typeof loadUserFavorites === 'function') {
        loadUserFavorites();
    }
    
    if (typeof loadUserHistory === 'function') {
        loadUserHistory();
    }
}

// ===== Real-time Updates =====
function setupRealTimeUpdates() {
    // Set up WebSocket connection for real-time updates
    if (typeof io !== 'undefined') {
        const socket = io(API_BASE_URL);
        
        socket.on('connect', () => {
            console.log('Connected to real-time updates');
        });
        
        socket.on('inventoryUpdate', (data) => {
            handleInventoryUpdate(data);
        });
        
        socket.on('pharmacyStatusUpdate', (data) => {
            handlePharmacyStatusUpdate(data);
        });
        
        window.findMyMedApp.socket = socket;
    }
}

function handleInventoryUpdate(data) {
    // Update inventory in real-time
    console.log('Inventory update received:', data);
    // Update UI if on relevant page
    if (typeof updateInventoryDisplay === 'function') {
        updateInventoryDisplay(data);
    }
}

function handlePharmacyStatusUpdate(data) {
    // Update pharmacy status in real-time
    console.log('Pharmacy status update received:', data);
    // Update UI if on relevant page
    if (typeof updatePharmacyDisplay === 'function') {
        updatePharmacyDisplay(data);
    }
}

// ===== PWA Functions =====
function initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
}

function showInstallButton() {
    // Show install app button
    const installButton = document.createElement('button');
    installButton.textContent = 'Install App';
    installButton.className = 'btn btn-primary install-btn';
    installButton.onclick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                installButton.remove();
            });
        }
    };
    
    // Add to a suitable location
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.appendChild(installButton);
    }
}

// ===== Utility Functions =====
function focusSearchInput() {
    const searchInput = document.getElementById('medicine-search');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

function validateForm(form) {
    // Basic form validation
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    return isValid;
}

function showFieldError(field, message) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('field-error');
    
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    announceToScreenReader(`Error: ${message}`);
}

function clearFieldError(field) {
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('field-error');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function syncPendingData() {
    // Sync any data that was stored while offline
    console.log('Syncing pending data...');
    // Implementation would sync stored data with server
}

// ===== Export for other modules =====
window.findMyMedApp.navigate = navigateTo;
window.findMyMedApp.showToast = showToast;
window.findMyMedApp.showLoading = showLoading;
window.findMyMedApp.hideLoading = hideLoading;
window.findMyMedApp.announceToScreenReader = announceToScreenReader;