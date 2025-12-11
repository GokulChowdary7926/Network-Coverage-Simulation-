# Mobile Network Coverage Visualization

A full-stack web application for simulating and visualizing mobile network coverage using signal propagation models. The application allows users to manage cell towers, run coverage simulations, and analyze network performance in real-time.

## 🚀 Quick Start

```bash
# Start the application (handles everything automatically)
./start-application.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Start MongoDB if needed
- ✅ Create .env files
- ✅ Install dependencies
- ✅ Seed database
- ✅ Start both servers
- ✅ Open browser automatically

## Features

- **Dashboard**: Overview of network statistics with interactive maps and charts
- **Tower Management**: Complete CRUD operations for cell towers with filtering and search
- **Coverage Simulation**: Interactive coverage visualization with real-time progress updates
- **Coverage Analysis**: Detailed analytics and reporting with charts and visualizations
- **Real-time Updates**: WebSocket support for live simulation progress

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- Socket.io for real-time updates
- RESTful API architecture

### Frontend
- React 18 with functional components and hooks
- Leaflet for interactive maps
- Recharts for data visualization
- Socket.io client for real-time features
- CSS3 with modern responsive design

## Project Structure

```
mobile-network-coverage/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── Tower.js
│   │   │   └── Simulation.js
│   │   ├── routes/
│   │   │   ├── towers.js
│   │   │   ├── simulations.js
│   │   │   └── coverage.js
│   │   ├── utils/
│   │   │   └── coverageCalculator.js
│   │   └── config/
│   │       └── database.js
│   ├── server.js
│   ├── package.json
│   ├── seedData.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── Dashboard.css
│   │   │   ├── Simulation.js
│   │   │   ├── Simulation.css
│   │   │   ├── TowerManagement.js
│   │   │   ├── TowerManagement.css
│   │   │   ├── CoverageAnalysis.js
│   │   │   ├── CoverageAnalysis.css
│   │   │   ├── Navigation.js
│   │   │   └── Navigation.css
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/mobile_network_coverage
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start MongoDB (if not already running):
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

5. Seed the database with sample data:
```bash
npm run seed
```

6. Start the backend server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The frontend application will run on `http://localhost:3000`

## API Endpoints

### Towers
- `GET /api/towers` - Get all towers (with filtering)
- `GET /api/towers/:id` - Get tower by ID
- `POST /api/towers` - Create new tower
- `PUT /api/towers/:id` - Update tower
- `DELETE /api/towers/:id` - Delete tower
- `GET /api/towers/nearby/:lat/:lng` - Get nearby towers

### Simulations
- `GET /api/simulations` - Get all simulations
- `GET /api/simulations/:id` - Get simulation by ID
- `POST /api/simulations` - Create and run simulation
- `POST /api/simulations/:id/rerun` - Rerun simulation

### Coverage
- `GET /api/coverage/statistics` - Get coverage statistics
- `GET /api/coverage/point?lat=:lat&lng=:lng` - Calculate coverage at specific point

## Signal Propagation Algorithm

The application uses the log-distance path loss model:

```
P(d) = P₀ - 10n log₁₀(d + 1)
```

Where:
- P(d) = Received signal strength at distance d (dBm)
- P₀ = Reference power at 1m (dBm)
- n = Path-loss exponent (urban: 3.5, suburban: 3.0, rural: 2.5)
- d = Distance from tower to receiver (m)

## Environment Types

- **Urban**: Path loss exponent = 3.5
- **Suburban**: Path loss exponent = 3.0
- **Rural**: Path loss exponent = 2.5

## Sample Data

The seed script creates 7 sample towers in the New York area with different networks (Telco A, B, C, Multi) and technologies (2G, 3G, 4G, 5G).

## Development

### Backend Development
- Uses nodemon for auto-restart during development
- MongoDB connection with Mongoose
- Socket.io for real-time communication
- Express middleware for security and rate limiting

### Frontend Development
- React Router for navigation
- Leaflet maps with OpenStreetMap tiles
- Recharts for data visualization
- Responsive design with CSS Grid and Flexbox

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Update `MONGODB_URI` to production database
3. Update `FRONTEND_URL` to production frontend URL
4. Run `npm start`

### Frontend
1. Update `.env` with production API URL
2. Build the application: `npm run build`
3. Serve the `build` directory using a static file server (nginx, Apache, etc.)

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify MongoDB is accessible on the specified port

### CORS Issues
- Ensure `FRONTEND_URL` in backend `.env` matches the frontend URL
- Check that CORS middleware is properly configured

### Socket.io Connection Issues
- Verify both backend and frontend Socket.io URLs match
- Check firewall settings for WebSocket connections

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

