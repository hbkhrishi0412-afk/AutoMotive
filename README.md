<div align="center">
  <img width="1200" height="475" alt="AutoVerse Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  <h1 align="center">🚗 AutoVerse AI</h1>
  <p align="center">
    <strong>A Modern Vehicle Marketplace Platform with AI-Powered Features</strong>
  </p>
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#screenshots">Screenshots</a> •
    <a href="#api-keys">API Keys</a> •
    <a href="#deployment">Deployment</a>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/React-19.1.1-blue?logo=react" alt="React Version" />
    <img src="https://img.shields.io/badge/TypeScript-5.4.5-blue?logo=typescript" alt="TypeScript Version" />
    <img src="https://img.shields.io/badge/Vite-5.3.1-purple?logo=vite" alt="Vite Version" />
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  </p>
</div>

---

## 🌟 Features

### 🎯 **Core Marketplace Features**
- **Vehicle Listings**: Browse, search, and filter vehicles by category, price, year, and more
- **Advanced Search**: AI-powered search with intelligent recommendations
- **Vehicle Comparison**: Compare up to 4 vehicles side-by-side
- **Wishlist Management**: Save favorite vehicles for later
- **Real-time Chat**: Direct messaging between buyers and sellers
- **Seller Profiles**: Comprehensive dealer and private seller profiles

### 🤖 **AI-Powered Features**
- **Smart Recommendations**: AI suggests vehicles based on user behavior
- **Gemini Integration**: Advanced AI assistance for vehicle queries
- **Intelligent Search**: Natural language search capabilities
- **Price Analysis**: AI-powered pricing guidance and market analysis

### 👥 **User Management**
- **Multi-Role System**: Customers, Sellers, and Admin roles
- **Authentication**: Secure login and registration
- **Profile Management**: Comprehensive user profiles
- **Subscription Plans**: Tiered pricing for sellers

### 🛠️ **Admin Features**
- **Dashboard**: Complete platform management
- **User Management**: User activation, verification, and management
- **Content Moderation**: Flag and resolve inappropriate content
- **Analytics**: Export data and generate reports
- **Platform Settings**: Customize site-wide settings

### 🎨 **UI/UX Features**
- **Responsive Design**: Works on all devices
- **Dark/Light Themes**: Multiple theme options
- **Modern UI**: Clean, intuitive interface
- **Real-time Notifications**: Toast notifications and alerts
- **Command Palette**: Quick navigation with keyboard shortcuts

## 🛠️ Tech Stack

### **Frontend**
- **React 19.1.1** - Modern UI library
- **TypeScript 5.4.5** - Type-safe development
- **Vite 5.3.1** - Fast build tool
- **Tailwind CSS** - Utility-first styling

### **AI & Data**
- **Google Gemini AI** - AI-powered features
- **Chart.js** - Data visualization
- **Local Storage** - Client-side data persistence

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Google Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/automotive-marketplace.git
   cd automotive-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### Database Management

The application uses SQLite for local development with the following commands:

- **Initialize database**: `npm run init-db` - Creates tables and seeds with sample data
- **Seed database**: `npm run seed-db` - Adds sample data to existing database
- **Database manager**: `npm run db-manager <command>` - Manage database operations
  - `npm run db-manager list-users` - List all users
  - `npm run db-manager list-vehicles` - List all vehicles
  - `npm run db-manager db-stats` - Show database statistics
  - `npm run db-manager clear-db` - Clear all data
  - `npm run db-manager help` - Show available commands

## 📸 Screenshots

<div align="center">
  <h3>🏠 Homepage</h3>
  <img src="https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Homepage+with+Featured+Vehicles" alt="Homepage" width="800" />
  
  <h3>🚗 Vehicle Listings</h3>
  <img src="https://via.placeholder.com/800x400/059669/FFFFFF?text=Vehicle+Search+and+Filter" alt="Vehicle Listings" width="800" />
  
  <h3>💬 Chat Interface</h3>
  <img src="https://via.placeholder.com/800x400/DC2626/FFFFFF?text=Real-time+Chat+System" alt="Chat Interface" width="800" />
  
  <h3>👨‍💼 Admin Dashboard</h3>
  <img src="https://via.placeholder.com/800x400/7C3AED/FFFFFF?text=Admin+Management+Panel" alt="Admin Dashboard" width="800" />
</div>

## 🔑 API Keys

### Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing
3. Generate an API key
4. Add it to your `.env.local` file:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Connect GitHub repo and deploy
- **Heroku**: Use buildpacks for React apps
- **AWS S3 + CloudFront**: Static site hosting

## 📁 Project Structure

```
automotive-marketplace/
├── components/          # React components
│   ├── AdminPanel.tsx   # Admin management
│   ├── Dashboard.tsx    # Seller dashboard
│   ├── VehicleList.tsx  # Vehicle listings
│   └── ...
├── services/           # Business logic
│   ├── geminiService.ts # AI integration
│   ├── vehicleService.ts # Vehicle management
│   └── ...
├── types.ts           # TypeScript definitions
├── constants.ts       # App constants
└── App.tsx           # Main application
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for AI capabilities
- **React Team** for the amazing framework
- **Vite Team** for the fast build tool
- **Tailwind CSS** for the utility-first styling

## 📞 Support

- **Documentation**: [View Documentation](https://your-docs-url.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/automotive-marketplace/issues)
- **Email**: support@autoverse.com

---

<div align="center">
  <p>Made with ❤️ by the AutoVerse Team</p>
  <p>
    <a href="#top">⬆️ Back to Top</a>
  </p>
</div>
