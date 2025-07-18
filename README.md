# Find my Med

A comprehensive real-time medicine availability search platform that helps users find medicines in nearby pharmacies with live stock updates, reservation capabilities, and accessibility features.

## 🚀 Features

### 🧑‍💻 Customer Features
- **Advanced Medicine Search**: Search by name, brand, salt composition with auto-suggestions
- **Voice-Enabled Search**: Voice input for elderly and accessibility users
- **Smart Filters**: Filter by brand, price range, salt composition, nearby pharmacy, stock status
- **Alternative Suggestions**: Find alternatives when medicines are unavailable
- **GPS-Based Pharmacy Locator**: Find nearby pharmacies with distance and availability info
- **Real-Time Stock Updates**: Live inventory updates with stock levels
- **Medicine Reservation**: Reserve medicines for pickup with time limits
- **Contact Options**: Direct calling, WhatsApp integration
- **Favorites & History**: Save favorite medicines and pharmacies
- **Accessibility Features**: Large fonts, voice instructions, simple UI

### 🏪 Pharmacy Management
- **Store Dashboard**: Comprehensive inventory and sales management
- **Real-Time Stock Management**: Update inventory with live sync
- **Reservation Management**: Handle customer reservations and pickups
- **Analytics**: Stock trends, sales metrics, customer insights
- **Multi-Store Support**: Manage multiple pharmacy locations
- **Low Stock Alerts**: Automated notifications for inventory management

### 🛠️ Technical Features
- **Real-Time Updates**: WebSocket-based live inventory updates
- **Geospatial Search**: MongoDB geospatial queries for location-based results
- **Scalable Architecture**: Microservices-ready with Redis caching
- **Mobile Responsive**: Progressive Web App capabilities
- **Secure Authentication**: JWT-based auth with role-based access
- **API Documentation**: Comprehensive REST API

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt encryption
- **Real-time**: Socket.IO for live updates
- **Caching**: Redis for performance optimization
- **Security**: Helmet, CORS, rate limiting
- **File Upload**: Multer for document handling

### Frontend (React)
- **UI Framework**: Material-UI for modern design
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Maps Integration**: React Leaflet for pharmacy locations
- **Voice Features**: React Speech Kit
- **Accessibility**: ARIA compliance, screen reader support

### Database Schema
- **Users**: Customer and pharmacist profiles with preferences
- **Medicines**: Comprehensive medicine database with alternatives
- **Pharmacies**: Store information with geospatial coordinates
- **Inventory**: Real-time stock management with reservations

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd find-my-med
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Set up environment variables**
```bash
# Copy and configure environment files
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

4. **Start MongoDB and Redis** (if using)
```bash
# MongoDB
mongod

# Redis (optional)
redis-server
```

5. **Seed the database**
```bash
cd server
npm run seed
```

6. **Start the application**
```bash
# From root directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

### Test Accounts
- **Admin**: admin@findmymed.com / admin123
- **Pharmacist**: rajesh@pharmacy.com / pharmacy123
- **Customer**: john@customer.com / customer123

## 📱 Usage

### For Customers
1. **Search Medicines**: Use the search bar with auto-suggestions
2. **Find Nearby Pharmacies**: Enable location to see nearby stores
3. **Check Availability**: View real-time stock levels
4. **Reserve Medicine**: Book medicines for pickup
5. **Track Favorites**: Save frequently needed medicines

### For Pharmacists
1. **Register Pharmacy**: Complete verification process
2. **Manage Inventory**: Add/update medicine stock levels
3. **Handle Reservations**: Process customer pickup requests
4. **Monitor Analytics**: Track sales and inventory trends
5. **Update Store Info**: Manage operating hours and services

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Search
- `GET /api/search/medicines` - Search medicines with filters
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/pharmacies` - Find nearby pharmacies
- `GET /api/search/alternatives/:id` - Find medicine alternatives

### Inventory
- `GET /api/inventory/pharmacy/:id` - Get pharmacy inventory
- `POST /api/inventory/reserve` - Reserve medicine
- `PUT /api/inventory/reservation/:id/cancel` - Cancel reservation

## 🏥 Healthcare Compliance

### Data Security
- HIPAA-compliant data handling
- Encrypted user information
- Secure prescription management
- Audit trails for all transactions

### Regulatory Compliance
- Medicine database verification
- Licensed pharmacy validation
- Prescription requirement enforcement
- Age verification for controlled substances

## 🌐 Accessibility

### Features for Elderly Users
- Large font options (small/medium/large)
- High contrast mode
- Voice-enabled search and navigation
- Simple, intuitive interface
- Audio feedback for actions

### Screen Reader Support
- ARIA labels and descriptions
- Keyboard navigation
- Focus management
- Semantic HTML structure

## 🚀 Deployment

### Environment Setup
- **Development**: Local MongoDB + Redis
- **Production**: MongoDB Atlas + Redis Cloud
- **Container**: Docker support included
- **Cloud**: AWS/GCP/Azure deployment ready

### Performance Optimization
- Redis caching for frequent queries
- MongoDB indexing for geospatial queries
- Image optimization and CDN
- Progressive Web App features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@findmymed.com
- Documentation: [API Docs](http://localhost:5000/api/docs)
- Issues: GitHub Issues

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core search and reservation features
- ✅ Pharmacy management dashboard
- ✅ Real-time inventory updates
- ✅ Mobile responsive design

### Phase 2 (Next)
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics and reporting
- 🔄 Integration with pharmacy POS systems
- 🔄 Telemedicine consultation features

### Phase 3 (Future)
- ⏳ AI-powered medicine recommendations
- ⏳ Blockchain for supply chain transparency
- ⏳ IoT integration for automatic inventory
- ⏳ Multi-language support expansion