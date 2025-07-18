// ===== Search Functionality =====

let searchTimeout;
let voiceRecognition;
let isVoiceSearchActive = false;

// Initialize search functionality
function initializeSearch() {
    setupSearchEventListeners();
    initializeVoiceSearch();
    loadRecentSearches();
    
    console.log('Search functionality initialized');
}

// Setup search event listeners
function setupSearchEventListeners() {
    const searchInput = document.getElementById('medicine-search');
    if (searchInput) {
        // Search input events
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchFocus);
        searchInput.addEventListener('blur', handleSearchBlur);
        searchInput.addEventListener('keydown', handleSearchKeydown);
    }
    
    // Search form submission
    const searchForms = document.querySelectorAll('.search-form');
    searchForms.forEach(form => {
        form.addEventListener('submit', performSearch);
    });
    
    // Popular search tags
    const popularTags = document.querySelectorAll('.tag');
    popularTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const medicine = this.textContent.trim();
            searchMedicine(medicine);
        });
    });
}

// Handle search input changes
function handleSearchInput(event) {
    const query = event.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Debounce search suggestions
    if (query.length >= APP_CONFIG.search.minQueryLength) {
        searchTimeout = setTimeout(() => {
            loadSearchSuggestions(query);
        }, APP_CONFIG.search.debounceDelay);
    } else {
        hideSuggestions();
    }
}

// Handle search input focus
function handleSearchFocus(event) {
    const query = event.target.value.trim();
    if (query.length >= APP_CONFIG.search.minQueryLength) {
        loadSearchSuggestions(query);
    } else {
        showRecentSearches();
    }
}

// Handle search input blur
function handleSearchBlur(event) {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
        hideSuggestions();
    }, 200);
}

// Handle search input keydown
function handleSearchKeydown(event) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer || !suggestionsContainer.style.display !== 'none') return;
    
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    const activeSuggestion = suggestionsContainer.querySelector('.suggestion-item.active');
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            navigateSuggestions(suggestions, 'down');
            break;
        case 'ArrowUp':
            event.preventDefault();
            navigateSuggestions(suggestions, 'up');
            break;
        case 'Enter':
            if (activeSuggestion) {
                event.preventDefault();
                selectSuggestion(activeSuggestion);
            }
            break;
        case 'Escape':
            hideSuggestions();
            event.target.blur();
            break;
    }
}

// Navigate through suggestions with keyboard
function navigateSuggestions(suggestions, direction) {
    const activeSuggestion = document.querySelector('.suggestion-item.active');
    
    if (!activeSuggestion) {
        // No active suggestion, select first or last
        const target = direction === 'down' ? suggestions[0] : suggestions[suggestions.length - 1];
        if (target) {
            target.classList.add('active');
        }
        return;
    }
    
    // Remove current active class
    activeSuggestion.classList.remove('active');
    
    // Find next suggestion
    let nextIndex;
    const currentIndex = Array.from(suggestions).indexOf(activeSuggestion);
    
    if (direction === 'down') {
        nextIndex = currentIndex + 1 >= suggestions.length ? 0 : currentIndex + 1;
    } else {
        nextIndex = currentIndex - 1 < 0 ? suggestions.length - 1 : currentIndex - 1;
    }
    
    suggestions[nextIndex].classList.add('active');
    suggestions[nextIndex].scrollIntoView({ block: 'nearest' });
}

// Load search suggestions
async function loadSearchSuggestions(query) {
    try {
        // Check cache first
        const cacheKey = `suggestions_${query}`;
        let suggestions = cacheAPI.get(cacheKey);
        
        if (!suggestions) {
            // Fetch from API
            suggestions = await searchAPI.getSuggestions(query);
            
            // Cache suggestions
            cacheAPI.set(cacheKey, suggestions, APP_CONFIG.cache.expiry.searchResults);
        }
        
        displaySuggestions(suggestions, query);
        
    } catch (error) {
        console.error('Error loading suggestions:', error);
        hideSuggestions();
    }
}

// Display search suggestions
function displaySuggestions(suggestions, query) {
    const container = document.getElementById('search-suggestions');
    if (!container) return;
    
    if (!suggestions || suggestions.length === 0) {
        hideSuggestions();
        return;
    }
    
    const html = suggestions.slice(0, APP_CONFIG.search.maxSuggestions).map(suggestion => {
        const highlightedText = highlightSearchTerms(suggestion.name, query);
        return `
            <div class="suggestion-item" 
                 data-medicine-id="${suggestion._id}" 
                 data-medicine-name="${suggestion.name}"
                 onclick="selectSuggestion(this)"
                 role="option">
                <div class="suggestion-main">
                    <span class="suggestion-name">${highlightedText}</span>
                    ${suggestion.brand ? `<span class="suggestion-brand">${suggestion.brand}</span>` : ''}
                </div>
                ${suggestion.category ? `<div class="suggestion-category">${suggestion.category}</div>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    container.style.display = 'block';
    container.setAttribute('role', 'listbox');
    
    // Announce to screen readers
    window.findMyMedApp.announceToScreenReader(`${suggestions.length} suggestions available`);
}

// Highlight search terms in suggestions
function highlightSearchTerms(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

// Select a suggestion
function selectSuggestion(suggestionElement) {
    const medicineName = suggestionElement.getAttribute('data-medicine-name');
    const medicineId = suggestionElement.getAttribute('data-medicine-id');
    
    // Update search input
    const searchInput = document.getElementById('medicine-search');
    if (searchInput) {
        searchInput.value = medicineName;
    }
    
    // Hide suggestions
    hideSuggestions();
    
    // Perform search
    searchMedicine(medicineName, medicineId);
    
    // Add to recent searches
    addToRecentSearches(medicineName, medicineId);
}

// Hide suggestions
function hideSuggestions() {
    const container = document.getElementById('search-suggestions');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// Show recent searches
function showRecentSearches() {
    const recentSearches = getRecentSearches();
    if (recentSearches.length === 0) return;
    
    const container = document.getElementById('search-suggestions');
    if (!container) return;
    
    const html = `
        <div class="suggestions-header">Recent Searches</div>
        ${recentSearches.map(search => `
            <div class="suggestion-item recent-search" 
                 data-medicine-name="${search.name}"
                 onclick="selectSuggestion(this)"
                 role="option">
                <span class="material-icons">history</span>
                <span class="suggestion-name">${search.name}</span>
                <button class="remove-recent" onclick="removeRecentSearch('${search.id}', event)" aria-label="Remove from recent searches">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `).join('')}
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
}

// Perform search
async function performSearch(event) {
    event.preventDefault();
    
    const form = event.target;
    const searchInput = form.querySelector('input[type="text"]');
    const query = searchInput.value.trim();
    
    if (!query) {
        window.findMyMedApp.showToast('Please enter a medicine name to search', 'warning');
        searchInput.focus();
        return;
    }
    
    // Hide suggestions
    hideSuggestions();
    
    // Navigate to search page if not already there
    if (window.findMyMedApp.currentPage !== 'search') {
        navigateTo('/search');
    }
    
    // Perform the search
    await searchMedicine(query);
    
    // Add to recent searches
    addToRecentSearches(query);
}

// Search for medicine
async function searchMedicine(query, medicineId = null) {
    try {
        // Show loading
        window.findMyMedApp.showLoading();
        
        // Get user location for nearby results
        const location = await getCurrentLocation();
        
        // Prepare search filters
        const filters = {
            category: '',
            brand: '',
            minPrice: '',
            maxPrice: '',
            inStockOnly: false,
            ...getSearchFilters()
        };
        
        // Add location if available
        if (location) {
            filters.lat = location.latitude;
            filters.lng = location.longitude;
            filters.radius = APP_CONFIG.geolocation.defaultRadius;
        }
        
        // Perform search
        const results = await searchAPI.searchMedicines(query, filters);
        
        // Display results
        displaySearchResults(results, query);
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('search', query);
        window.history.replaceState({}, '', url);
        
        // Announce results to screen readers
        window.findMyMedApp.announceToScreenReader(
            `Found ${results.length} results for ${query}`
        );
        
    } catch (error) {
        console.error('Search error:', error);
        window.findMyMedApp.showToast('Search failed. Please try again.', 'error');
        displaySearchError(error.message);
    } finally {
        window.findMyMedApp.hideLoading();
    }
}

// Get search filters from form
function getSearchFilters() {
    const filters = {};
    
    // Get filter values from search page form
    const filterForm = document.querySelector('.filters-form');
    if (filterForm) {
        const medicineName = filterForm.querySelector('#medicine-name')?.value;
        const category = filterForm.querySelector('#category')?.value;
        const brand = filterForm.querySelector('#brand')?.value;
        const minPrice = filterForm.querySelector('#min-price')?.value;
        const maxPrice = filterForm.querySelector('#max-price')?.value;
        const inStockOnly = filterForm.querySelector('#in-stock-only')?.checked;
        
        if (medicineName) filters.q = medicineName;
        if (category) filters.category = category;
        if (brand) filters.brand = brand;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (inStockOnly) filters.inStockOnly = true;
    }
    
    return filters;
}

// Display search results
function displaySearchResults(results, query) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">
                    <span class="material-icons">search_off</span>
                </div>
                <h3>No medicines found</h3>
                <p>We couldn't find any medicines matching "${query}". Try:</p>
                <ul>
                    <li>Checking your spelling</li>
                    <li>Using different keywords</li>
                    <li>Searching for the generic name</li>
                    <li>Removing filters to see more results</li>
                </ul>
                <button class="btn btn-primary" onclick="clearSearchFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="search-results-header">
            <h2>Search Results for "${query}"</h2>
            <p>Found ${results.length} medicines</p>
        </div>
        <div class="results-grid">
            ${results.map(medicine => createMedicineCard(medicine)).join('')}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Store results in app state
    window.findMyMedApp.searchResults = results;
}

// Create medicine card HTML
function createMedicineCard(medicine) {
    const availability = medicine.availability || {};
    const statusClass = getStatusClass(availability.status);
    const statusText = getStatusText(availability.status);
    
    return `
        <div class="medicine-card" data-medicine-id="${medicine._id}">
            <div class="medicine-header">
                <h3 class="medicine-name">${medicine.name}</h3>
                ${medicine.brand ? `<span class="medicine-brand">${medicine.brand}</span>` : ''}
            </div>
            
            <div class="medicine-details">
                ${medicine.dosage ? `<p class="medicine-dosage">${medicine.dosage}</p>` : ''}
                ${medicine.category ? `<span class="medicine-category">${medicine.category}</span>` : ''}
            </div>
            
            <div class="medicine-availability">
                <div class="availability-status ${statusClass}">
                    <span class="status-indicator"></span>
                    ${statusText}
                </div>
                ${availability.price ? `<div class="medicine-price">₹${availability.price}</div>` : ''}
            </div>
            
            ${availability.pharmacies && availability.pharmacies.length > 0 ? `
                <div class="available-pharmacies">
                    <h4>Available at ${availability.pharmacies.length} pharmacies</h4>
                    <div class="pharmacy-list">
                        ${availability.pharmacies.slice(0, 3).map(pharmacy => `
                            <div class="pharmacy-item">
                                <span class="pharmacy-name">${pharmacy.name}</span>
                                <span class="pharmacy-distance">${pharmacy.distance}km away</span>
                            </div>
                        `).join('')}
                    </div>
                    ${availability.pharmacies.length > 3 ? `
                        <button class="btn btn-outline btn-sm" onclick="viewAllPharmacies('${medicine._id}')">
                            View all ${availability.pharmacies.length} pharmacies
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="medicine-actions">
                <button class="btn btn-primary" onclick="viewMedicineDetails('${medicine._id}')" aria-label="View details for ${medicine.name}">
                    View Details
                </button>
                ${availability.status === 'IN_STOCK' ? `
                    <button class="btn btn-outline" onclick="reserveMedicine('${medicine._id}')" aria-label="Reserve ${medicine.name}">
                        Reserve
                    </button>
                ` : ''}
                <button class="btn btn-icon" onclick="toggleFavorite('${medicine._id}')" aria-label="Add ${medicine.name} to favorites">
                    <span class="material-icons">favorite_border</span>
                </button>
            </div>
        </div>
    `;
}

// Get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'IN_STOCK': 'in-stock',
        'LOW_STOCK': 'low-stock', 
        'OUT_OF_STOCK': 'out-of-stock',
        'DISCONTINUED': 'discontinued'
    };
    return statusMap[status] || 'unknown';
}

// Get status text
function getStatusText(status) {
    return STATUS_TYPES.medicine[status] || 'Unknown';
}

// Display search error
function displaySearchError(message) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    container.innerHTML = `
        <div class="search-error">
            <div class="error-icon">
                <span class="material-icons">error</span>
            </div>
            <h3>Search Error</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="retrySearch()">Try Again</button>
        </div>
    `;
}

// Retry search
function retrySearch() {
    const searchInput = document.getElementById('medicine-search');
    if (searchInput && searchInput.value.trim()) {
        searchMedicine(searchInput.value.trim());
    }
}

// Clear search filters
function clearSearchFilters() {
    const filterForm = document.querySelector('.filters-form');
    if (filterForm) {
        filterForm.reset();
        
        // Trigger search again with cleared filters
        const searchInput = document.getElementById('medicine-search');
        if (searchInput && searchInput.value.trim()) {
            searchMedicine(searchInput.value.trim());
        }
    }
}

// Recent searches management
function getRecentSearches() {
    try {
        const recent = localStorage.getItem(STORAGE_KEYS.recentSearches);
        return recent ? JSON.parse(recent) : [];
    } catch (error) {
        console.error('Error getting recent searches:', error);
        return [];
    }
}

function addToRecentSearches(query, medicineId = null) {
    try {
        let recentSearches = getRecentSearches();
        
        // Remove if already exists
        recentSearches = recentSearches.filter(search => search.name !== query);
        
        // Add to beginning
        recentSearches.unshift({
            id: Date.now().toString(),
            name: query,
            medicineId,
            timestamp: Date.now()
        });
        
        // Keep only last 10 searches
        recentSearches = recentSearches.slice(0, 10);
        
        localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(recentSearches));
    } catch (error) {
        console.error('Error adding to recent searches:', error);
    }
}

function removeRecentSearch(searchId, event) {
    event.stopPropagation();
    
    try {
        let recentSearches = getRecentSearches();
        recentSearches = recentSearches.filter(search => search.id !== searchId);
        localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(recentSearches));
        
        // Refresh recent searches display
        showRecentSearches();
    } catch (error) {
        console.error('Error removing recent search:', error);
    }
}

function loadRecentSearches() {
    // This function can be called to preload recent searches
    // Currently handled in showRecentSearches()
}

// Voice search functionality
function initializeVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Voice recognition not supported');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognition();
    
    voiceRecognition.continuous = APP_CONFIG.voiceRecognition.continuous;
    voiceRecognition.interimResults = APP_CONFIG.voiceRecognition.interimResults;
    voiceRecognition.lang = APP_CONFIG.voiceRecognition.lang;
    voiceRecognition.maxAlternatives = APP_CONFIG.voiceRecognition.maxAlternatives;
    
    voiceRecognition.onstart = function() {
        isVoiceSearchActive = true;
        updateVoiceSearchUI(true);
        window.findMyMedApp.announceToScreenReader('Voice search started. Speak now.');
    };
    
    voiceRecognition.onresult = function(event) {
        const result = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('Voice recognition result:', result, 'Confidence:', confidence);
        
        // Update search input
        const searchInput = document.getElementById('medicine-search');
        if (searchInput) {
            searchInput.value = result;
            searchInput.focus();
        }
        
        // Perform search if confidence is high enough
        if (confidence > 0.7) {
            searchMedicine(result);
        } else {
            window.findMyMedApp.showToast('Voice recognition uncertain. Please verify the search term.', 'warning');
        }
    };
    
    voiceRecognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        isVoiceSearchActive = false;
        updateVoiceSearchUI(false);
        
        let errorMessage = 'Voice search failed. ';
        switch (event.error) {
            case 'no-speech':
                errorMessage += 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage += 'Microphone not accessible.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone permission denied.';
                break;
            default:
                errorMessage += 'Please try again.';
        }
        
        window.findMyMedApp.showToast(errorMessage, 'error');
    };
    
    voiceRecognition.onend = function() {
        isVoiceSearchActive = false;
        updateVoiceSearchUI(false);
        window.findMyMedApp.announceToScreenReader('Voice search ended.');
    };
}

// Start voice search
function startVoiceSearch() {
    if (!voiceRecognition) {
        window.findMyMedApp.showToast(ERROR_MESSAGES.voiceNotSupported, 'error');
        return;
    }
    
    if (isVoiceSearchActive) {
        stopVoiceSearch();
        return;
    }
    
    try {
        voiceRecognition.start();
    } catch (error) {
        console.error('Error starting voice recognition:', error);
        window.findMyMedApp.showToast('Could not start voice search. Please try again.', 'error');
    }
}

// Stop voice search
function stopVoiceSearch() {
    if (voiceRecognition && isVoiceSearchActive) {
        voiceRecognition.stop();
    }
}

// Update voice search UI
function updateVoiceSearchUI(isActive) {
    const voiceButton = document.querySelector('.voice-search-btn');
    if (!voiceButton) return;
    
    if (isActive) {
        voiceButton.classList.add('voice-listening');
        voiceButton.innerHTML = '<span class="material-icons">mic_off</span>';
        voiceButton.setAttribute('aria-label', 'Stop voice search');
    } else {
        voiceButton.classList.remove('voice-listening');
        voiceButton.innerHTML = '<span class="material-icons">mic</span>';
        voiceButton.setAttribute('aria-label', 'Start voice search');
    }
}

// Get current location
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            resolve(null);
            return;
        }
        
        // Check cached location first
        const cachedLocation = localStorage.getItem(STORAGE_KEYS.locationData);
        if (cachedLocation) {
            try {
                const location = JSON.parse(cachedLocation);
                const age = Date.now() - location.timestamp;
                
                // Use cached location if less than 5 minutes old
                if (age < APP_CONFIG.geolocation.maximumAge) {
                    resolve(location.coords);
                    return;
                }
            } catch (error) {
                console.error('Error parsing cached location:', error);
            }
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    },
                    timestamp: Date.now()
                };
                
                // Cache location
                try {
                    localStorage.setItem(STORAGE_KEYS.locationData, JSON.stringify(location));
                } catch (error) {
                    console.error('Error caching location:', error);
                }
                
                resolve(location.coords);
            },
            (error) => {
                console.error('Geolocation error:', error);
                resolve(null);
            },
            {
                enableHighAccuracy: APP_CONFIG.geolocation.enableHighAccuracy,
                timeout: APP_CONFIG.geolocation.timeout,
                maximumAge: APP_CONFIG.geolocation.maximumAge
            }
        );
    });
}

// Advanced search form handler
function performAdvancedSearch(event) {
    event.preventDefault();
    
    const form = event.target;
    const medicineName = form.querySelector('#medicine-name').value.trim();
    
    if (!medicineName) {
        window.findMyMedApp.showToast('Please enter a medicine name', 'warning');
        form.querySelector('#medicine-name').focus();
        return;
    }
    
    // Perform search with current filters
    searchMedicine(medicineName);
}

// Medicine detail actions
function viewMedicineDetails(medicineId) {
    // TODO: Navigate to medicine detail page
    window.findMyMedApp.showToast('Medicine details coming soon!', 'info');
}

function viewAllPharmacies(medicineId) {
    // TODO: Show all pharmacies for this medicine
    window.findMyMedApp.showToast('Pharmacy list coming soon!', 'info');
}

function reserveMedicine(medicineId) {
    // TODO: Show reservation modal
    window.findMyMedApp.showToast('Medicine reservation coming soon!', 'info');
}

function toggleFavorite(medicineId) {
    // TODO: Add/remove from favorites
    window.findMyMedApp.showToast('Favorites feature coming soon!', 'info');
}

// Export functions for global use
window.initializeSearch = initializeSearch;
window.performSearch = performSearch;
window.performAdvancedSearch = performAdvancedSearch;
window.searchMedicine = searchMedicine;
window.startVoiceSearch = startVoiceSearch;
window.stopVoiceSearch = stopVoiceSearch;
window.selectSuggestion = selectSuggestion;
window.removeRecentSearch = removeRecentSearch;
window.clearSearchFilters = clearSearchFilters;
window.retrySearch = retrySearch;
window.viewMedicineDetails = viewMedicineDetails;
window.viewAllPharmacies = viewAllPharmacies;
window.reserveMedicine = reserveMedicine;
window.toggleFavorite = toggleFavorite;