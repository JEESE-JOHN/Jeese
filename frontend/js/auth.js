// ===== Authentication Functions =====

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;
    const rememberMe = form.querySelector('#remember-me').checked;
    
    // Validate form
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
        
        // Attempt login
        const response = await authAPI.login({
            email,
            password,
            rememberMe
        });
        
        // Close modal on success
        closeModal('login-modal');
        
        // Navigate to appropriate page based on user role
        const user = response.data.user;
        if (user.role === USER_ROLES.PHARMACIST || user.role === USER_ROLES.ADMIN) {
            navigateTo('/dashboard');
        } else {
            // Stay on current page or go to home
            if (window.findMyMedApp.currentPage === 'home') {
                // Reload current page content
                loadPageContent('/');
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        // Error message is shown by authAPI
        
    } finally {
        // Reset button state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Login';
        submitButton.disabled = false;
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.querySelector('#register-name').value.trim();
    const email = form.querySelector('#register-email').value.trim();
    const phone = form.querySelector('#register-phone').value.trim();
    const password = form.querySelector('#register-password').value;
    const role = form.querySelector('#register-role').value;
    const agreeTerms = form.querySelector('#agree-terms').checked;
    
    // Validate form
    if (!validateRegisterForm(name, email, phone, password, agreeTerms)) {
        return;
    }
    
    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;
        
        // Attempt registration
        await authAPI.register({
            name,
            email,
            phone,
            password,
            role
        });
        
        // Close register modal and show login modal
        closeModal('register-modal');
        
        // Pre-fill login form
        setTimeout(() => {
            showLoginModal();
            const loginForm = document.querySelector('#login-modal form');
            if (loginForm) {
                loginForm.querySelector('#login-email').value = email;
                loginForm.querySelector('#login-password').focus();
            }
        }, 500);
        
    } catch (error) {
        console.error('Registration error:', error);
        // Error message is shown by authAPI
        
    } finally {
        // Reset button state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = 'Register';
        submitButton.disabled = false;
    }
}

// Validate login form
function validateLoginForm(email, password) {
    let isValid = true;
    
    // Clear previous errors
    clearFormErrors('#login-modal form');
    
    // Validate email
    if (!email) {
        showFieldError(document.getElementById('login-email'), 'Email is required');
        isValid = false;
    } else if (!REGEX_PATTERNS.email.test(email)) {
        showFieldError(document.getElementById('login-email'), 'Please enter a valid email');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        showFieldError(document.getElementById('login-password'), 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError(document.getElementById('login-password'), 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

// Validate register form
function validateRegisterForm(name, email, phone, password, agreeTerms) {
    let isValid = true;
    
    // Clear previous errors
    clearFormErrors('#register-modal form');
    
    // Validate name
    if (!name) {
        showFieldError(document.getElementById('register-name'), 'Full name is required');
        isValid = false;
    } else if (name.length < 2) {
        showFieldError(document.getElementById('register-name'), 'Name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate email
    if (!email) {
        showFieldError(document.getElementById('register-email'), 'Email is required');
        isValid = false;
    } else if (!REGEX_PATTERNS.email.test(email)) {
        showFieldError(document.getElementById('register-email'), 'Please enter a valid email');
        isValid = false;
    }
    
    // Validate phone
    if (!phone) {
        showFieldError(document.getElementById('register-phone'), 'Phone number is required');
        isValid = false;
    } else if (!REGEX_PATTERNS.phone.test(phone)) {
        showFieldError(document.getElementById('register-phone'), 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        showFieldError(document.getElementById('register-password'), 'Password is required');
        isValid = false;
    } else if (!REGEX_PATTERNS.password.test(password)) {
        showFieldError(
            document.getElementById('register-password'), 
            'Password must be at least 8 characters with uppercase, lowercase, and number'
        );
        isValid = false;
    }
    
    // Validate terms agreement
    if (!agreeTerms) {
        showFieldError(document.getElementById('agree-terms'), 'You must agree to the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

// Clear form errors
function clearFormErrors(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return;
    
    // Clear error classes and messages
    form.querySelectorAll('.field-error').forEach(field => {
        field.classList.remove('field-error');
        field.setAttribute('aria-invalid', 'false');
    });
    
    form.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
}

// Show field error (defined in main.js but used here)
function showFieldError(field, message) {
    if (!field) return;
    
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('field-error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    
    // Insert after the field
    field.parentNode.appendChild(errorElement);
    
    // Focus on the field
    field.focus();
    
    // Announce error to screen readers
    if (window.findMyMedApp && window.findMyMedApp.announceToScreenReader) {
        window.findMyMedApp.announceToScreenReader(`Error: ${message}`);
    }
}

// Password strength indicator
function initializePasswordStrength() {
    const passwordField = document.getElementById('register-password');
    if (!passwordField) return;
    
    passwordField.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        showPasswordStrength(strength);
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return {
        score,
        level: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong',
        feedback: getPasswordFeedback(password, score)
    };
}

// Get password feedback
function getPasswordFeedback(password, score) {
    const feedback = [];
    
    if (password.length < 8) {
        feedback.push('At least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
        feedback.push('Add lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
        feedback.push('Add uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
        feedback.push('Add numbers');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        feedback.push('Add special characters');
    }
    
    if (feedback.length === 0) {
        return 'Strong password!';
    }
    
    return 'Suggestions: ' + feedback.join(', ');
}

// Show password strength
function showPasswordStrength(strength) {
    let strengthIndicator = document.querySelector('.password-strength');
    
    if (!strengthIndicator) {
        strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        
        const passwordField = document.getElementById('register-password');
        passwordField.parentNode.appendChild(strengthIndicator);
    }
    
    strengthIndicator.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill strength-${strength.level}" style="width: ${(strength.score / 6) * 100}%"></div>
        </div>
        <div class="strength-text ${strength.level}">
            ${strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}: ${strength.feedback}
        </div>
    `;
}

// Social login functions (placeholders for future implementation)
function loginWithGoogle() {
    window.findMyMedApp.showToast('Google login coming soon!', 'info');
}

function loginWithFacebook() {
    window.findMyMedApp.showToast('Facebook login coming soon!', 'info');
}

// Forgot password
function forgotPassword() {
    const email = document.getElementById('login-email').value.trim();
    
    if (!email) {
        window.findMyMedApp.showToast('Please enter your email first', 'warning');
        document.getElementById('login-email').focus();
        return;
    }
    
    if (!REGEX_PATTERNS.email.test(email)) {
        window.findMyMedApp.showToast('Please enter a valid email', 'error');
        document.getElementById('login-email').focus();
        return;
    }
    
    // TODO: Implement forgot password API call
    window.findMyMedApp.showToast('Password reset link sent to your email!', 'success');
    closeModal('login-modal');
}

// Auto-login check
function checkAutoLogin() {
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    const userData = localStorage.getItem(STORAGE_KEYS.userData);
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            
            // Check if token is still valid (basic check)
            const tokenData = parseJWT(token);
            if (tokenData && tokenData.exp > Date.now() / 1000) {
                setCurrentUser(user);
                return true;
            } else {
                // Token expired, clear data
                localStorage.removeItem(STORAGE_KEYS.authToken);
                localStorage.removeItem(STORAGE_KEYS.userData);
            }
        } catch (error) {
            console.error('Auto-login error:', error);
            localStorage.removeItem(STORAGE_KEYS.authToken);
            localStorage.removeItem(STORAGE_KEYS.userData);
        }
    }
    
    return false;
}

// Parse JWT token (basic parsing)
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('JWT parsing error:', error);
        return null;
    }
}

// Token refresh mechanism
function setupTokenRefresh() {
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    if (!token) return;
    
    const tokenData = parseJWT(token);
    if (!tokenData || !tokenData.exp) return;
    
    const expirationTime = tokenData.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Refresh token 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
        setTimeout(async () => {
            try {
                await authAPI.refreshToken();
                setupTokenRefresh(); // Set up next refresh
            } catch (error) {
                console.error('Token refresh failed:', error);
                // Logout user if refresh fails
                logout();
            }
        }, refreshTime);
    } else {
        // Token already expired or expires soon, try to refresh immediately
        authAPI.refreshToken().catch(() => {
            logout();
        });
    }
}

// Initialize authentication features
function initializeAuth() {
    // Check for auto-login
    checkAutoLogin();
    
    // Setup token refresh
    setupTokenRefresh();
    
    // Initialize password strength indicator
    initializePasswordStrength();
    
    // Add event listeners for form enhancements
    addAuthEventListeners();
}

// Add authentication event listeners
function addAuthEventListeners() {
    // Real-time email validation
    const emailFields = document.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value && !REGEX_PATTERNS.email.test(this.value)) {
                showFieldError(this, 'Please enter a valid email address');
            } else {
                clearFieldError(this);
            }
        });
    });
    
    // Real-time phone validation
    const phoneFields = document.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value && !REGEX_PATTERNS.phone.test(this.value)) {
                showFieldError(this, 'Please enter a valid phone number');
            } else {
                clearFieldError(this);
            }
        });
    });
    
    // Show/hide password functionality
    addPasswordToggle();
}

// Add password visibility toggle
function addPasswordToggle() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
        const container = field.parentNode;
        
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'password-toggle';
        toggle.innerHTML = '<span class="material-icons">visibility</span>';
        toggle.setAttribute('aria-label', 'Toggle password visibility');
        
        // Position toggle
        container.style.position = 'relative';
        toggle.style.position = 'absolute';
        toggle.style.right = '10px';
        toggle.style.top = '50%';
        toggle.style.transform = 'translateY(-50%)';
        toggle.style.background = 'none';
        toggle.style.border = 'none';
        toggle.style.cursor = 'pointer';
        toggle.style.color = 'var(--gray-500)';
        
        // Add toggle functionality
        toggle.addEventListener('click', function() {
            const isPassword = field.type === 'password';
            field.type = isPassword ? 'text' : 'password';
            this.innerHTML = isPassword ? 
                '<span class="material-icons">visibility_off</span>' : 
                '<span class="material-icons">visibility</span>';
            
            this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
        
        container.appendChild(toggle);
    });
}

// Clear field error (utility function)
function clearFieldError(field) {
    if (!field) return;
    
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('field-error');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// Initialize authentication when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

// Export functions for global use
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.forgotPassword = forgotPassword;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;