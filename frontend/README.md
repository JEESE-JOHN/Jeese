# Find my Med - Frontend (HTML/CSS/JavaScript)

A comprehensive web-based platform for real-time medicine availability search in nearby pharmacies/medical stores, built with pure HTML, CSS, and JavaScript.

## 🌟 Features

### Core Functionality
- **Medicine Search**: Intelligent search with auto-suggestions and real-time results
- **Voice Search**: Voice-enabled search for hands-free operation
- **Pharmacy Locator**: GPS-based pharmacy finder with distance calculations
- **Real-time Availability**: Live inventory status (In Stock/Low Stock/Out of Stock)
- **Advanced Filters**: Search by category, brand, price range, and availability
- **Reservation System**: Reserve medicines for pickup

### Accessibility Features
- **Voice Mode**: Complete voice guidance for visually impaired users
- **Screen Reader Support**: ARIA labels, live regions, and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility with shortcuts
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Font Size Control**: Adjustable text sizes for better readability
- **Focus Management**: Clear focus indicators and logical tab order

### User Experience
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Progressive Web App**: Can be installed on devices
- **Offline Support**: Basic functionality works offline
- **Real-time Updates**: Live inventory and pharmacy status updates

## 📁 Project Structure

```
frontend/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── responsive.css      # Responsive design rules
│   └── accessibility.css   # Accessibility-specific styles
├── js/
│   ├── main.js            # Main application logic
│   ├── config.js          # Configuration and constants
│   ├── api.js             # API communication layer
│   ├── auth.js            # Authentication functions
│   ├── search.js          # Search functionality
│   ├── accessibility.js   # Accessibility features
│   └── utils.js           # Utility functions
└── README.md              # This file
```

## 🚀 Getting Started

### Option 1: Direct File Opening

1. **Download/Clone the files** to your local machine
2. **Open `index.html`** in a web browser:
   - Double-click the `index.html` file, OR
   - Right-click → "Open with" → Choose your browser

### Option 2: Local Server (Recommended)

For full functionality including PWA features:

1. **Using Python** (if installed):
   ```bash
   cd frontend
   python -m http.server 8000
   ```
   Then open: http://localhost:8000

2. **Using Node.js** (if installed):
   ```bash
   cd frontend
   npx serve .
   ```

3. **Using Live Server** (VS Code extension):
   - Install the "Live Server" extension
   - Right-click on `index.html` → "Open with Live Server"

## 🎯 How to Use

### Basic Medicine Search
1. Enter medicine name in the search bar
2. Use voice search by clicking the microphone icon
3. Select from auto-suggestions or press Enter
4. View results with availability and pricing

### Advanced Search
1. Navigate to the Search page
2. Use filters for category, brand, price range
3. Enable "In Stock Only" for available medicines
4. Apply filters to refine results

### Accessibility Features
1. **Voice Mode**: Click accessibility icon → Enable Voice Mode
2. **Font Size**: Accessibility menu → Select size (Small/Medium/Large)
3. **High Contrast**: Toggle in accessibility menu
4. **Keyboard Shortcuts**: Press Ctrl+/ to see all shortcuts

### Authentication
1. Click "Login" or "Register" in the top navigation
2. Choose user type: Customer or Pharmacist
3. Complete the form with required information

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + 1` | Focus search field |
| `Alt + 2` | Go to search page |
| `Alt + 3` | Go to pharmacies page |
| `Alt + 4` | Go to home page |
| `Alt + 5` | Open accessibility menu |
| `F6` | Move to next landmark |
| `Shift + F6` | Move to previous landmark |
| `Escape` | Close modals and menus |
| `Ctrl + K` | Focus search field |
| `Ctrl + /` | Show keyboard shortcuts help |

## 🎨 Customization

### Colors and Themes
Edit `css/styles.css` and modify the CSS variables:
```css
:root {
  --primary-color: #2E7D32;    /* Main green color */
  --primary-light: #4CAF50;    /* Lighter green */
  --primary-dark: #1B5E20;     /* Darker green */
  /* ... other variables */
}
```

### Backend Configuration
Edit `js/config.js` to point to your backend:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Adding New Features
1. Add HTML structure in `index.html`
2. Style with CSS in appropriate files
3. Add JavaScript functionality in relevant JS files
4. Update navigation and accessibility features

## 🌐 Browser Support

### Recommended Browsers
- Chrome 80+ (Full support)
- Firefox 70+ (Full support)  
- Safari 13+ (Full support)
- Edge 80+ (Full support)

### Feature Support
- **Voice Search**: Chrome, Edge (WebKit-based browsers)
- **Voice Mode**: All modern browsers with Speech Synthesis API
- **Geolocation**: All modern browsers
- **PWA Features**: Chrome, Firefox, Safari, Edge

## 📱 Mobile Features

### Touch Gestures
- Swipe navigation on mobile
- Touch-friendly button sizes (44px minimum)
- Optimized form controls

### Mobile-Specific Features
- GPS-based location detection
- Voice search optimized for mobile
- Responsive design with mobile-first approach
- Touch accessibility improvements

## ♿ Accessibility Compliance

### Standards Compliance
- **WCAG 2.1 AA** compliant
- **Section 508** compliant
- **ADA** compliant design patterns

### Accessibility Features
- Semantic HTML structure
- ARIA labels and landmarks
- Screen reader announcements
- High contrast mode
- Keyboard navigation
- Voice guidance
- Focus management
- Alternative text for images

## 🔧 API Integration

The frontend is designed to work with a backend API. Key endpoints expected:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Search
- `GET /api/search` - Medicine search
- `GET /api/search/suggestions` - Search suggestions

### Pharmacies
- `GET /api/pharmacies/nearby` - Find nearby pharmacies
- `GET /api/pharmacies/:id` - Get pharmacy details

### Inventory
- `GET /api/inventory/check` - Check medicine availability

See `js/config.js` for complete API endpoint configuration.

## 🎮 Testing

### Manual Testing
1. **Search Functionality**: Try various medicine names
2. **Voice Search**: Test microphone permissions and recognition
3. **Accessibility**: Test with keyboard-only navigation
4. **Responsive Design**: Test on different screen sizes
5. **Forms**: Test login/registration forms

### Browser Testing
1. Open developer tools (F12)
2. Check console for errors
3. Test responsive design in device emulation
4. Verify accessibility features

## 🔒 Security Features

### Client-Side Security
- Input sanitization
- XSS prevention
- CSRF token handling (when backend is connected)
- Secure local storage usage

### Authentication
- JWT token management
- Automatic token refresh
- Secure logout procedures

## 📈 Performance Optimization

### Loading Performance
- Optimized CSS and JavaScript
- Image lazy loading
- Progressive enhancement
- Caching strategies

### Runtime Performance
- Debounced search inputs
- Efficient DOM manipulation
- Memory leak prevention
- Optimized animations

## 🎨 Design System

### Color Palette
- **Primary**: Healthcare green (#2E7D32)
- **Secondary**: Trust blue (#1976D2)
- **Success**: #4CAF50
- **Warning**: #FF9800
- **Error**: #F44336

### Typography
- **Font Family**: Inter (fallback to system fonts)
- **Font Sizes**: Responsive scale from 0.75rem to 2.25rem
- **Line Heights**: Optimized for readability

### Components
- Buttons with hover states
- Form inputs with validation
- Cards with consistent shadows
- Modals with focus management

## 🛠️ Development Tips

### Code Organization
- Modular JavaScript architecture
- CSS custom properties for theming
- Semantic HTML structure
- Progressive enhancement approach

### Best Practices
- Mobile-first responsive design
- Accessibility-first development
- Performance optimization
- Clean, readable code

### Adding New Pages
1. Add HTML structure in `index.html`
2. Update navigation in `main.js`
3. Add page-specific CSS
4. Implement page logic in appropriate JS files

## 📞 Support

### Common Issues
1. **Voice search not working**: Check microphone permissions
2. **Location not detected**: Enable location services
3. **Slow loading**: Check internet connection
4. **JavaScript errors**: Check browser console

### Browser Compatibility
- Enable JavaScript
- Allow microphone access for voice search
- Enable location services for nearby pharmacies
- Use modern browser for best experience

## 🚀 Future Enhancements

### Planned Features
- Real-time notifications
- Medicine reminder system
- Prescription upload
- Pharmacy ratings and reviews
- Advanced analytics dashboard
- Multi-language support

### Technical Improvements
- Service worker implementation
- Enhanced offline capabilities
- Push notification support
- Advanced caching strategies

---

## 📄 License

This project is part of the Find my Med platform. See the main project repository for license information.

## 🤝 Contributing

1. Follow accessibility guidelines
2. Test on multiple browsers
3. Ensure responsive design
4. Add appropriate documentation
5. Test keyboard navigation

---

**Find my Med** - Making healthcare accessible to everyone! 🏥💊