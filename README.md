# ⛳ Golf Club Recommender

A lightweight web application that recommends the best golf club based on distance, handicap, and real-time weather conditions.

## Features

- **Smart Club Recommendations**: Get instant club suggestions based on your target distance
- **Handicap Adjustment**: Customized recommendations based on your skill level
- **Weather Integration**: Automatically factors in wind speed and temperature using your location
- **Real-time Calculations**: On-the-fly adjustments for weather conditions
- **Clean, Modern UI**: Simple and intuitive interface optimized for mobile and desktop
- **Lightweight**: No heavy frameworks, fast loading times

## How It Works

1. **Enter Distance**: Input the distance to the hole in yards
2. **Add Handicap** (optional): Enter your handicap for personalized club distances
3. **Weather Check**: App automatically gets your location to fetch current weather conditions
4. **Get Recommendation**: Receive your club recommendation with alternatives and detailed adjustments

### Algorithm

The app considers multiple factors:

- **Base Club Distances**: Standard distances for each club (scratch golfer baseline)
- **Handicap Adjustment**: Reduces club distances based on handicap (≈0.5% per stroke)
- **Wind Effect**: Adjusts for headwind/tailwind conditions
- **Temperature Effect**: Accounts for ball flight differences in hot/cold weather
- **Alternatives**: Provides longer and shorter club options

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks!)
- **Weather API**: OpenWeatherMap
- **Deployment**: Render

## Local Development

### Prerequisites

- Node.js 18 or higher
- OpenWeatherMap API key (free tier available)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd caddy_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Add your OpenWeatherMap API key to `.env`:
   ```
   PORT=3000
   OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

5. Run the application:
   ```bash
   npm start
   ```

6. Open your browser to `http://localhost:3000`

## Getting an OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key
5. Add it to your `.env` file

The free tier includes:
- 1,000 API calls per day
- Current weather data
- More than sufficient for personal use

## Deployment to Render

### Option 1: Using the Dashboard

1. Create a [Render account](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: golf-club-recommender
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add environment variable:
   - Key: `OPENWEATHER_API_KEY`
   - Value: Your OpenWeatherMap API key
6. Click "Create Web Service"

### Option 2: Using render.yaml (Infrastructure as Code)

This repository includes a `render.yaml` file for automated deployment:

1. Push your code to GitHub
2. In Render dashboard, click "New +" and select "Blueprint"
3. Connect your repository
4. Render will automatically detect `render.yaml` and configure everything
5. Add your `OPENWEATHER_API_KEY` in the Render dashboard

## Project Structure

```
caddy_app/
├── public/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   └── app.js          # Client-side JavaScript
├── server.js           # Express server & API
├── package.json        # Dependencies
├── .env.example        # Environment template
├── render.yaml         # Render deployment config
└── README.md           # This file
```

## API Endpoints

### POST `/api/recommend`

Request body:
```json
{
  "distance": 150,
  "handicap": 18,
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

Response:
```json
{
  "recommendation": {
    "club": "7-Iron",
    "distance": 152,
    "adjustedTargetDistance": 148
  },
  "alternatives": {
    "longer": { "club": "6-Iron", "distance": 162 },
    "shorter": { "club": "8-Iron", "distance": 142 }
  },
  "weather": {
    "temp": 22,
    "windSpeed": 3.5,
    "description": "clear sky",
    "humidity": 65
  },
  "adjustments": {
    "windEffect": -2,
    "tempEffect": 4,
    "totalAdjustment": -2
  }
}
```

### GET `/health`

Health check endpoint for monitoring.

## Future Enhancements

- Save favorite courses and holes
- Track historical recommendations
- Support for meters/kilometers
- Elevation change calculations
- Club distance customization
- Shot tracking and statistics

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
