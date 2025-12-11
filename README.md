# Mobile Network Coverage Visualization

A full-stack web application that helps you visualize and simulate mobile network coverage in real-time. Whether you're planning tower placements, analyzing coverage gaps, or just curious about how signal propagation works, this tool makes it easy to see what's happening with your network infrastructure.

## What This Does

Imagine you're a network engineer and you need to figure out where to place cell towers for the best coverage. Or maybe you want to see how well your current towers are covering an area. This application lets you:

- **Place towers on a map** - Click anywhere to place a tower at that exact location
- **See signal coverage** - Visualize coverage areas with color-coded circles showing signal strength
- **Run simulations** - Test different scenarios and see how coverage changes
- **Manage towers** - Add, edit, or remove towers with a simple interface
- **Analyze performance** - Get statistics and insights about your network

## Quick Start

The easiest way to get started is using our automated script:

```bash
./start-application.sh
```

This script does everything for you:
- Checks if you have Node.js and MongoDB installed
- Starts MongoDB if it's not running
- Creates the necessary configuration files
- Installs all dependencies
- Seeds the database with sample data
- Starts both the backend and frontend servers
- Opens your browser automatically

Once it's running, you'll see the application at `http://localhost:2222`.

## What You'll Need

Before you start, make sure you have:

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (version 4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **npm** - Comes with Node.js

That's it! Everything else is handled automatically.

## Manual Setup (If You Prefer)

If you'd rather set things up manually, here's how:

### Backend Setup

1. Navigate to the backend folder:
```bash
cd Backend
```

2. Install the dependencies:
```bash
npm install
```

3. Create a `.env` file with these settings:
```env
MONGODB_URI=mongodb://localhost:27017/mobile_network_coverage
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:2222
```

4. Make sure MongoDB is running. On macOS with Homebrew:
```bash
brew services start mongodb-community
```

5. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5001`.

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd Frontend
```

2. Install the dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

4. Start the frontend:
```bash
npm start
```

The frontend will automatically open at `http://localhost:2222`.

## Features

### Dashboard
The main dashboard gives you an overview of your entire network. You'll see:
- Total number of towers and their status
- Network coverage statistics
- An interactive map showing all your towers
- Charts showing network distribution and technology usage
- Your current location (if you allow it)

### Tower Management
This is where you manage your cell towers. You can:
- Add new towers by filling out a form or clicking on the map
- Edit existing towers
- Delete towers you no longer need
- Search for towers by location
- Filter towers by network, status, or technology

### Coverage Simulation
Want to see how well your towers cover a specific area? Run a simulation:
- Select which towers to include
- Choose the area you want to analyze
- Watch as the simulation runs in real-time
- See coverage heatmaps and signal strength data

### Signal Visualization
Every tower shows its coverage with colored circles:
- **Green circles** = 5G towers
- **Blue circles** = 4G towers
- **Orange circles** = 3G towers
- **Yellow circles** = 2G towers

The circles show different signal strengths - the inner circle is strong signal, the outer circle is weaker signal.

## How It Works

The application uses a signal propagation model called "log-distance path loss" to calculate how strong a signal is at any given point. In simple terms, it figures out how much the signal weakens as you move away from a tower.

The formula we use is:
```
Signal Strength = Reference Power - (10 × Path Loss Exponent × log(distance))
```

Where:
- **Reference Power** is how strong the signal is right next to the tower
- **Path Loss Exponent** depends on the environment (urban areas have more obstacles, so signals weaken faster)
- **Distance** is how far you are from the tower

Different environments have different path loss exponents:
- **Urban areas**: 3.5 (signals weaken quickly due to buildings)
- **Suburban areas**: 3.0 (moderate signal loss)
- **Rural areas**: 2.5 (signals travel further with fewer obstacles)

## API Endpoints

If you want to integrate this with other applications, here are the available API endpoints:

### Towers
- `GET /api/towers` - Get all towers (supports filtering)
- `GET /api/towers/:id` - Get a specific tower
- `POST /api/towers` - Create a new tower
- `PUT /api/towers/:id` - Update a tower
- `DELETE /api/towers/:id` - Delete a tower
- `GET /api/towers/nearby/:lat/:lng` - Find towers near a location
- `POST /api/towers/seed-location` - Place demo towers around a location

### Simulations
- `GET /api/simulations` - Get all simulations
- `GET /api/simulations/:id` - Get a specific simulation
- `POST /api/simulations` - Create and run a new simulation
- `POST /api/simulations/:id/rerun` - Rerun an existing simulation

### Coverage
- `GET /api/coverage/statistics` - Get overall coverage statistics
- `GET /api/coverage/point?lat=:lat&lng=:lng` - Calculate coverage at a specific point

## Project Structure

Here's how the code is organized:

```
mobile-network-coverage/
├── Backend/                    # Server-side code
│   ├── app/
│   │   ├── models/            # Database models (Tower, Simulation)
│   │   ├── routes/            # API endpoints
│   │   ├── utils/             # Helper functions (coverage calculations)
│   │   └── config/             # Configuration (database connection)
│   ├── server.js              # Main server file
│   └── package.json           # Backend dependencies
│
├── Frontend/                   # Client-side code
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   ├── TowerManagement.js
│   │   │   ├── Simulation.js
│   │   │   └── ...
│   │   ├── App.js             # Main app component
│   │   └── index.js           # Entry point
│   ├── public/                # Static files
│   └── package.json           # Frontend dependencies
│
├── README.md                   # This file
└── start-application.sh       # Automated startup script
```

## Troubleshooting

### MongoDB Won't Start
- Make sure MongoDB is installed correctly
- Check if another process is using port 27017
- Try restarting MongoDB: `brew services restart mongodb-community` (macOS)

### Can't Connect to Backend
- Make sure the backend is running on port 5001
- Check that your `.env` file has the correct settings
- Look at the backend console for error messages

### Frontend Shows Errors
- Make sure the backend is running first
- Check that the API URL in your frontend `.env` matches your backend port
- Clear your browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### CORS Errors
- Make sure `FRONTEND_URL` in your backend `.env` matches where your frontend is running
- The default is `http://localhost:2222`

## Tips for Using the Application

1. **Start with demo towers**: Click "Place 120 Towers" to see how the visualization works
2. **Use your location**: Click "Use My Location" to center the map on where you are
3. **Click to place**: Enable "Place Tower" mode, then click anywhere on the map to place a tower there
4. **Zoom in**: Use the map controls to zoom in and see coverage details better
5. **Check tower details**: Click on any tower marker to see its information

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - Database modeling
- **Socket.io** - Real-time communication

### Frontend
- **React** - UI framework
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time updates

## Contributing

Found a bug? Have an idea for a new feature? Feel free to open an issue or submit a pull request. I'm always happy to see improvements!

## License

This project is open source and available under the MIT License. Feel free to use it, modify it, and share it.

## Questions?

If you run into any problems or have questions, check the troubleshooting section above or open an issue on GitHub.

---

**Enjoy visualizing your network coverage!** 📡🗺️
