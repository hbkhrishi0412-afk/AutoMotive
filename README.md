# ReRide - Vehicle Marketplace Platform

A modern, full-stack vehicle marketplace platform built with React, TypeScript, MongoDB, and Vercel.

## Features

- 🚗 Vehicle listing and management
- 👥 User authentication and role management
- 💬 Real-time chat system
- 🔍 Advanced search and filtering
- 📊 Analytics and reporting
- 🏆 Badge system for sellers
- 📱 Responsive design
- 🤖 AI-powered vehicle recommendations

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Vercel Functions
- **Database**: MongoDB with Mongoose
- **Deployment**: Vercel
- **Styling**: CSS3 with modern design patterns

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or Atlas)
- Vercel account (for deployment)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your MongoDB connection string and other required variables.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/reride-app

# For production, use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/reride-app?retryWrites=true&w=majority

# Google AI Configuration (optional)
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the following environment variables in Vercel:
   - `MONGO_URI`: Your MongoDB connection string
   - `GOOGLE_AI_API_KEY`: (Optional) Your Google AI API key

4. Deploy!

### Environment Variables for Production

In your Vercel dashboard, add these environment variables:

- `MONGO_URI`: Your MongoDB Atlas connection string
- `GOOGLE_AI_API_KEY`: (Optional) For AI features

## Project Structure

```
├── api/                 # Vercel API functions
│   ├── auth.ts         # Authentication endpoints
│   ├── users.ts        # User management
│   ├── vehicles.ts     # Vehicle management
│   └── db-health.ts    # Database health check
├── components/         # React components
├── lib/               # Utility functions
│   └── db.ts          # Database connection
├── models/            # Mongoose models
├── services/          # Business logic services
├── types.ts           # TypeScript type definitions
└── vercel.json        # Vercel configuration
```

## API Endpoints

- `POST /api/auth` - User authentication and registration
- `GET /api/users` - Get all users
- `PUT /api/users` - Update user
- `DELETE /api/users` - Delete user
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles` - Update vehicle
- `DELETE /api/vehicles` - Delete vehicle
- `GET /api/db-health` - Database health check

## Database Schema

### Users
- Email, name, password, mobile
- Role (customer, seller, admin)
- Subscription plan and credits
- Profile information

### Vehicles
- Basic info (make, model, year, price)
- Technical specifications
- Images and documents
- Seller information
- Status and flags

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@reride.com or create an issue in the repository.