// ===== Accessibility Features =====

let speechSynthesis;
let voicesList = [];
let isVoiceModeEnabled = false;
let currentVoice = null;

// Initialize accessibility features
function initializeAccessibility() {
    setupVoiceFeatures();
    setupKeyboardNavigation();
    setupFocusManagement();
    setupScreenReaderSupport();
    loadAccessibilityPreferences();
    
    console.log('Accessibility features initialized');
}

// ===== Voice Features =====
function setupVoiceFeatures() {
    if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
        
        // Wait for voices to load
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        // Load voices immediately if already available
        loadVoices();
    } else {
        console.log('Speech synthesis not supported');
    }
}

// Load available voices
function loadVoices() {
    voicesList = speechSynthesis.getVoices();
    
    // Prefer English voices
    currentVoice = voicesList.find(voice => 
        voice.lang.includes('en') && voice.default
    ) || voicesList.find(voice => 
        voice.lang.includes('en')
    ) || voicesList[0];
    
    console.log('Available voices loaded:', voicesList.length);
}

// Enable voice mode
function enableVoiceMode() {
    isVoiceModeEnabled = true;
    document.body.classList.add('voice-mode-active');
    
    // Announce activation
    speak('Voice mode activated. I will guide you through the application.');
    
    // Add voice guidance to navigation
    setupVoiceGuidance();
    
    // Save preference
    localStorage.setItem('voiceModeEnabled', 'true');
}

// Disable voice mode
function disableVoiceMode() {
    isVoiceModeEnabled = false;
    document.body.classList.remove('voice-mode-active');
    
    // Announce deactivation
    speak('Voice mode deactivated.');
    
    // Remove voice guidance
    removeVoiceGuidance();
    
    // Save preference
    localStorage.setItem('voiceModeEnabled', 'false');
}

// Speak text using speech synthesis
function speak(text, options = {}) {
    if (!speechSynthesis || !isVoiceModeEnabled) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice and options
    if (currentVoice) {
        utterance.voice = currentVoice;
    }
    
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    // Handle events
    utterance.onstart = () => {
        console.log('Speech started:', text);
    };
    
    utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
    };
    
    speechSynthesis.speak(utterance);
}

// Setup voice guidance for common elements
function setupVoiceGuidance() {
    // Voice guidance for buttons
    document.querySelectorAll('button, .btn').forEach(button => {
        button.addEventListener('mouseenter', handleElementHover);
        button.addEventListener('focus', handleElementFocus);
        button.addEventListener('click', handleElementClick);
    });
    
    // Voice guidance for links
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', handleElementHover);
        link.addEventListener('focus', handleElementFocus);
        link.addEventListener('click', handleElementClick);
    });
    
    // Voice guidance for form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('blur', handleInputBlur);
    });
    
    // Voice guidance for navigation
    document.querySelectorAll('.nav-link').forEach(navLink => {
        navLink.addEventListener('mouseenter', handleNavHover);
        navLink.addEventListener('focus', handleNavFocus);
    });
}

// Remove voice guidance
function removeVoiceGuidance() {
    document.querySelectorAll('button, .btn, a, input, select, textarea, .nav-link').forEach(element => {
        element.removeEventListener('mouseenter', handleElementHover);
        element.removeEventListener('focus', handleElementFocus);
        element.removeEventListener('click', handleElementClick);
        element.removeEventListener('mouseenter', handleNavHover);
        element.removeEventListener('focus', handleNavFocus);
        element.removeEventListener('focus', handleInputFocus);
        element.removeEventListener('blur', handleInputBlur);
    });
}

// Handle element hover
function handleElementHover(event) {
    if (!isVoiceModeEnabled) return;
    
    const element = event.target;
    const text = getElementDescription(element);
    
    if (text) {
        speak(text);
    }
}

// Handle element focus
function handleElementFocus(event) {
    if (!isVoiceModeEnabled) return;
    
    const element = event.target;
    const text = getElementDescription(element);
    
    if (text) {
        speak(`Focused on: ${text}`);
    }
}

// Handle element click
function handleElementClick(event) {
    if (!isVoiceModeEnabled) return;
    
    const element = event.target;
    const text = getElementDescription(element);
    
    if (text) {
        speak(`Clicked: ${text}`);
    }
}

// Handle navigation hover
function handleNavHover(event) {
    if (!isVoiceModeEnabled) return;
    
    const navLink = event.target.closest('.nav-link');
    const text = navLink.textContent.trim();
    
    speak(`Navigate to ${text}`);
}

// Handle navigation focus
function handleNavFocus(event) {
    if (!isVoiceModeEnabled) return;
    
    const navLink = event.target.closest('.nav-link');
    const text = navLink.textContent.trim();
    
    speak(`Navigation link: ${text}`);
}

// Handle input focus
function handleInputFocus(event) {
    if (!isVoiceModeEnabled) return;
    
    const input = event.target;
    const label = getInputLabel(input);
    const type = input.type || 'text';
    
    speak(`${label || 'Input field'}, ${type} input`);
}

// Handle input blur
function handleInputBlur(event) {
    if (!isVoiceModeEnabled) return;
    
    const input = event.target;
    const value = input.value.trim();
    
    if (value) {
        speak(`Entered: ${value}`);
    } else {
        speak('Field is empty');
    }
}

// Get element description for voice guidance
function getElementDescription(element) {
    // Check for aria-label
    if (element.getAttribute('aria-label')) {
        return element.getAttribute('aria-label');
    }
    
    // Check for title
    if (element.title) {
        return element.title;
    }
    
    // Check for text content
    if (element.textContent && element.textContent.trim()) {
        return element.textContent.trim();
    }
    
    // Check for alt text (images)
    if (element.alt) {
        return element.alt;
    }
    
    // Check for placeholder
    if (element.placeholder) {
        return element.placeholder;
    }
    
    // Check for input type
    if (element.tagName === 'INPUT') {
        return `${element.type} input`;
    }
    
    // Default description
    return element.tagName.toLowerCase() + ' element';
}

// Get input label
function getInputLabel(input) {
    // Check for aria-label
    if (input.getAttribute('aria-label')) {
        return input.getAttribute('aria-label');
    }
    
    // Find associated label
    const label = document.querySelector(`label[for="${input.id}"]`) || 
                  input.closest('label') ||
                  input.previousElementSibling?.tagName === 'LABEL' ? input.previousElementSibling : null;
    
    if (label) {
        return label.textContent.trim();
    }
    
    // Check for placeholder
    if (input.placeholder) {
        return input.placeholder;
    }
    
    return null;
}

// ===== Keyboard Navigation =====
function setupKeyboardNavigation() {
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Setup roving tabindex for custom components
    setupRovingTabindex();
    
    // Setup modal trap focus
    setupModalFocusTrap();
}

// Handle global keyboard shortcuts
function handleGlobalKeydown(event) {
    // Alt + 1-9: Quick navigation
    if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 9) {
            event.preventDefault();
            handleQuickNavigation(num);
        }
    }
    
    // Escape: Close modals, dropdowns, clear focus
    if (event.key === 'Escape') {
        handleEscapeKey();
    }
    
    // F6: Move focus to next landmark
    if (event.key === 'F6') {
        event.preventDefault();
        moveFocusToNextLandmark(event.shiftKey);
    }
    
    // Ctrl + /: Show keyboard shortcuts help
    if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        showKeyboardShortcuts();
    }
}

// Handle quick navigation shortcuts
function handleQuickNavigation(num) {
    const shortcuts = {
        1: () => focusElement('#medicine-search'),
        2: () => navigateTo('/search'),
        3: () => navigateTo('/pharmacies'),
        4: () => navigateTo('/'),
        5: () => toggleAccessibilityMenu(),
        6: () => focusElement('.user-profile, .auth-buttons'),
        7: () => focusElement('main'),
        8: () => focusElement('.footer'),
        9: () => focusElement('.skip-link')
    };
    
    if (shortcuts[num]) {
        shortcuts[num]();
        
        if (isVoiceModeEnabled) {
            const actions = [
                'Search field', 'Search page', 'Pharmacies page', 'Home page',
                'Accessibility menu', 'User menu', 'Main content', 'Footer', 'Skip links'
            ];
            speak(`Quick navigation: ${actions[num - 1]}`);
        }
    }
}

// Handle escape key
function handleEscapeKey() {
    // Close modals
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
        closeModal(openModal.id);
        return;
    }
    
    // Close dropdowns
    closeAllDropdowns();
    
    // Close mobile menu
    closeMobileMenu();
    
    // Clear focus from non-essential elements
    if (document.activeElement && !isEssentialElement(document.activeElement)) {
        document.activeElement.blur();
    }
}

// Check if element is essential for keyboard navigation
function isEssentialElement(element) {
    const essentialSelectors = [
        'input', 'textarea', 'select', 'button', 'a[href]',
        '[tabindex]:not([tabindex="-1"])', '[contenteditable]'
    ];
    
    return essentialSelectors.some(selector => element.matches(selector));
}

// Move focus to next landmark
function moveFocusToNextLandmark(reverse = false) {
    const landmarks = Array.from(document.querySelectorAll(
        'main, nav, header, footer, aside, section[aria-label], [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]'
    ));
    
    const currentIndex = landmarks.findIndex(landmark => 
        landmark.contains(document.activeElement)
    );
    
    let nextIndex;
    if (reverse) {
        nextIndex = currentIndex <= 0 ? landmarks.length - 1 : currentIndex - 1;
    } else {
        nextIndex = currentIndex >= landmarks.length - 1 ? 0 : currentIndex + 1;
    }
    
    if (landmarks[nextIndex]) {
        focusElement(landmarks[nextIndex]);
        
        if (isVoiceModeEnabled) {
            const landmarkName = getLandmarkName(landmarks[nextIndex]);
            speak(`Moved to ${landmarkName}`);
        }
    }
}

// Get landmark name for voice guidance
function getLandmarkName(element) {
    if (element.getAttribute('aria-label')) {
        return element.getAttribute('aria-label');
    }
    
    const tagName = element.tagName.toLowerCase();
    const roleMap = {
        'main': 'main content',
        'nav': 'navigation',
        'header': 'header',
        'footer': 'footer',
        'aside': 'sidebar',
        'section': 'section'
    };
    
    return roleMap[tagName] || tagName;
}

// Focus element safely
function focusElement(selector) {
    let element;
    
    if (typeof selector === 'string') {
        element = document.querySelector(selector);
    } else {
        element = selector;
    }
    
    if (element) {
        // Make element focusable if needed
        if (!element.hasAttribute('tabindex') && !isEssentialElement(element)) {
            element.setAttribute('tabindex', '-1');
        }
        
        element.focus();
        
        // Scroll into view
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// Setup roving tabindex for custom components
function setupRovingTabindex() {
    // Example: Medicine cards in search results
    setupRovingTabindexForGroup('.medicine-card');
    
    // Example: Suggestion items
    setupRovingTabindexForGroup('.suggestion-item');
}

// Setup roving tabindex for a group of elements
function setupRovingTabindexForGroup(selector) {
    const groups = document.querySelectorAll(selector);
    if (groups.length === 0) return;
    
    // Set first item as focusable
    groups[0].setAttribute('tabindex', '0');
    
    // Set others as non-focusable
    for (let i = 1; i < groups.length; i++) {
        groups[i].setAttribute('tabindex', '-1');
    }
    
    // Add keyboard navigation
    groups.forEach((item, index) => {
        item.addEventListener('keydown', (event) => {
            let nextIndex = index;
            
            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    event.preventDefault();
                    nextIndex = (index + 1) % groups.length;
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    event.preventDefault();
                    nextIndex = index === 0 ? groups.length - 1 : index - 1;
                    break;
                case 'Home':
                    event.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    event.preventDefault();
                    nextIndex = groups.length - 1;
                    break;
                default:
                    return;
            }
            
            // Update tabindex and focus
            groups[index].setAttribute('tabindex', '-1');
            groups[nextIndex].setAttribute('tabindex', '0');
            groups[nextIndex].focus();
        });
    });
}

// ===== Focus Management =====
function setupFocusManagement() {
    // Track focus for debugging
    if (window.location.hostname === 'localhost') {
        document.addEventListener('focus', (event) => {
            console.log('Focus on:', event.target);
        }, true);
    }
    
    // Add focus indicators
    enhanceFocusIndicators();
    
    // Setup skip links
    setupSkipLinks();
}

// Enhance focus indicators
function enhanceFocusIndicators() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Setup skip links
function setupSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-link');
    
    skipLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            
            if (target) {
                focusElement(target);
                
                if (isVoiceModeEnabled) {
                    speak(`Skipped to ${target.getAttribute('aria-label') || 'main content'}`);
                }
            }
        });
    });
}

// ===== Screen Reader Support =====
function setupScreenReaderSupport() {
    // Create live regions for announcements
    createLiveRegions();
    
    // Add ARIA labels to dynamic content
    enhanceAriaLabels();
    
    // Setup status announcements
    setupStatusAnnouncements();
}

// Create live regions for screen reader announcements
function createLiveRegions() {
    // Polite announcements
    if (!document.getElementById('polite-announcements')) {
        const politeRegion = document.createElement('div');
        politeRegion.id = 'polite-announcements';
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        politeRegion.className = 'sr-only';
        document.body.appendChild(politeRegion);
    }
    
    // Assertive announcements
    if (!document.getElementById('assertive-announcements')) {
        const assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'assertive-announcements';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.className = 'sr-only';
        document.body.appendChild(assertiveRegion);
    }
}

// Announce to screen readers
function announceToScreenReader(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements';
    const region = document.getElementById(regionId);
    
    if (region) {
        region.textContent = message;
        
        // Also speak if voice mode is enabled
        if (isVoiceModeEnabled) {
            speak(message);
        }
        
        // Clear after announcement
        setTimeout(() => {
            region.textContent = '';
        }, 1000);
    }
}

// Enhance ARIA labels for dynamic content
function enhanceAriaLabels() {
    // Update search results count
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.target.id === 'search-results') {
                updateSearchResultsAria();
            }
        });
    });
    
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        observer.observe(searchResults, { childList: true, subtree: true });
    }
}

// Update search results ARIA information
function updateSearchResultsAria() {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    const medicineCards = resultsContainer.querySelectorAll('.medicine-card');
    const count = medicineCards.length;
    
    if (count > 0) {
        resultsContainer.setAttribute('aria-label', `Search results: ${count} medicines found`);
        
        // Add position information to each card
        medicineCards.forEach((card, index) => {
            const medicineName = card.querySelector('.medicine-name')?.textContent;
            card.setAttribute('aria-label', `Medicine ${index + 1} of ${count}: ${medicineName}`);
        });
    } else {
        resultsContainer.setAttribute('aria-label', 'No search results found');
    }
}

// Setup status announcements
function setupStatusAnnouncements() {
    // Announce page navigation
    window.addEventListener('popstate', () => {
        const pageName = getPageName(window.location.pathname);
        announceToScreenReader(`Navigated to ${pageName} page`);
    });
    
    // Announce form errors
    document.addEventListener('invalid', (event) => {
        const field = event.target;
        const label = getInputLabel(field);
        const message = field.validationMessage;
        
        announceToScreenReader(`Error in ${label || 'form field'}: ${message}`, 'assertive');
    }, true);
}

// Get page name from pathname
function getPageName(pathname) {
    const pageNames = {
        '/': 'home',
        '/search': 'search',
        '/pharmacies': 'pharmacies',
        '/about': 'about',
        '/contact': 'contact',
        '/dashboard': 'dashboard',
        '/profile': 'profile'
    };
    
    return pageNames[pathname] || 'unknown';
}

// ===== Accessibility Preferences =====
function loadAccessibilityPreferences() {
    // Load voice mode preference
    const voiceModeEnabled = localStorage.getItem('voiceModeEnabled') === 'true';
    if (voiceModeEnabled) {
        enableVoiceMode();
    }
    
    // Load other accessibility preferences
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    const highContrast = localStorage.getItem('highContrast') === 'true';
    const reducedMotion = localStorage.getItem('reducedMotion') === 'true';
    
    // Apply preferences
    applyAccessibilitySettings({
        fontSize,
        highContrast,
        voiceMode: voiceModeEnabled,
        reducedMotion
    });
}

// Apply accessibility settings
function applyAccessibilitySettings(settings) {
    const { fontSize, highContrast, voiceMode, reducedMotion } = settings;
    
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
    
    // Apply voice mode
    if (voiceMode && !isVoiceModeEnabled) {
        enableVoiceMode();
    } else if (!voiceMode && isVoiceModeEnabled) {
        disableVoiceMode();
    }
}

// Show keyboard shortcuts help
function showKeyboardShortcuts() {
    const shortcuts = [
        { key: 'Alt + 1', action: 'Focus search field' },
        { key: 'Alt + 2', action: 'Go to search page' },
        { key: 'Alt + 3', action: 'Go to pharmacies page' },
        { key: 'Alt + 4', action: 'Go to home page' },
        { key: 'Alt + 5', action: 'Open accessibility menu' },
        { key: 'F6', action: 'Move to next landmark' },
        { key: 'Shift + F6', action: 'Move to previous landmark' },
        { key: 'Escape', action: 'Close modals and menus' },
        { key: 'Ctrl + K', action: 'Focus search field' },
        { key: 'Ctrl + /', action: 'Show this help' }
    ];
    
    const helpText = shortcuts.map(shortcut => 
        `${shortcut.key}: ${shortcut.action}`
    ).join('\n');
    
    alert(`Keyboard Shortcuts:\n\n${helpText}`);
    
    if (isVoiceModeEnabled) {
        speak('Keyboard shortcuts help displayed');
    }
}

// ===== Modal Focus Trap =====
function setupModalFocusTrap() {
    // This is handled in main.js trapFocus function
    // but we can enhance it here for accessibility
}

// Initialize accessibility when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAccessibility);

// Export functions for global use
window.initializeAccessibility = initializeAccessibility;
window.enableVoiceMode = enableVoiceMode;
window.disableVoiceMode = disableVoiceMode;
window.speak = speak;
window.announceToScreenReader = announceToScreenReader;
window.focusElement = focusElement;
window.showKeyboardShortcuts = showKeyboardShortcuts;