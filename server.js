require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Standard club distances (in yards) for a scratch golfer (0 handicap)
const CLUB_DISTANCES = {
  'Driver': 250,
  '3-Wood': 235,
  '5-Wood': 220,
  '3-Hybrid': 210,
  '4-Hybrid': 200,
  '3-Iron': 200,
  '4-Iron': 190,
  '5-Iron': 180,
  '6-Iron': 170,
  '7-Iron': 160,
  '8-Iron': 150,
  '9-Iron': 140,
  'Pitching Wedge': 130,
  'Gap Wedge': 115,
  'Sand Wedge': 100,
  'Lob Wedge': 85
};

// Adjust club distances based on handicap
function adjustDistanceForHandicap(baseDistance, handicap) {
  if (handicap === null || handicap === 0) return baseDistance;

  // Higher handicap = shorter distances
  // Rough approximation: lose about 0.5% per handicap stroke
  const adjustmentFactor = 1 - (handicap * 0.005);
  return baseDistance * adjustmentFactor;
}

// Calculate wind effect on distance (simplified)
function calculateWindEffect(windSpeed, windDirection, targetDistance) {
  // Wind direction: 0° = North (headwind if playing north)
  // For simplicity, we'll assume windDirection relative to shot direction
  // Positive = tailwind, Negative = headwind

  // Convert wind speed (m/s) to mph for easier calculation
  const windMph = windSpeed * 2.237;

  // Headwind reduces distance, tailwind increases it
  // Rule of thumb: 1 mph wind = ~1 yard for every 10 yards of shot
  const windEffect = (windMph / 10) * (targetDistance / 10);

  return windEffect;
}

// Calculate temperature effect on distance
function calculateTemperatureEffect(tempCelsius, baseDistance) {
  // Standard temp is 70°F (21°C)
  // Ball travels ~2 yards farther per 10°F increase
  const tempF = (tempCelsius * 9/5) + 32;
  const tempDiff = tempF - 70;
  const tempEffect = (tempDiff / 10) * 2;

  return tempEffect;
}

// Find the best club for the adjusted distance
function recommendClub(adjustedDistance) {
  let bestClub = null;
  let smallestDiff = Infinity;

  for (const [club, distance] of Object.entries(CLUB_DISTANCES)) {
    const diff = Math.abs(distance - adjustedDistance);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestClub = club;
    }
  }

  return {
    club: bestClub,
    clubDistance: CLUB_DISTANCES[bestClub],
    difference: smallestDiff
  };
}

// API endpoint for searching golf courses
app.get('/api/courses/search', async (req, res) => {
    try {
        const { query, lat, lon } = req.query;

        if (!query && (!lat || !lon)) {
            return res.status(400).json({ error: 'Query or location required' });
        }

        const golfApiKey = process.env.GOLF_COURSE_API_KEY;

        // If no API key configured, return mock data for demo
        if (!golfApiKey || golfApiKey === 'your_api_key_here') {
            return res.json({
                courses: [],
                message: 'Golf Course API not configured. Please add GOLF_COURSE_API_KEY to environment variables.'
            });
        }

        // Search by query string
        let apiUrl;
        if (query) {
            apiUrl = `https://api.golfcourseapi.com/courses/search?q=${encodeURIComponent(query)}`;
        } else {
            // Search by location
            apiUrl = `https://api.golfcourseapi.com/courses/nearby?lat=${lat}&lon=${lon}`;
        }

        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${golfApiKey}`,
                'Accept': 'application/json'
            }
        });

        res.json({
            courses: response.data.courses || response.data || []
        });

    } catch (error) {
        console.error('Golf Course API error:', error.message);
        res.status(500).json({
            error: 'Failed to search courses',
            message: error.message
        });
    }
});

// API endpoint for getting course details (with holes)
app.get('/api/courses/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;

        const golfApiKey = process.env.GOLF_COURSE_API_KEY;

        if (!golfApiKey || golfApiKey === 'your_api_key_here') {
            return res.status(400).json({
                error: 'Golf Course API not configured'
            });
        }

        const response = await axios.get(
            `https://api.golfcourseapi.com/courses/${courseId}`,
            {
                headers: {
                    'Authorization': `Bearer ${golfApiKey}`,
                    'Accept': 'application/json'
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        console.error('Golf Course API error:', error.message);
        res.status(500).json({
            error: 'Failed to get course details',
            message: error.message
        });
    }
});

// API endpoint for club recommendation
app.post('/api/recommend', async (req, res) => {
  try {
    const { distance, handicap, latitude, longitude } = req.body;

    if (!distance || distance <= 0) {
      return res.status(400).json({ error: 'Valid distance is required' });
    }

    let weatherData = null;
    let adjustedDistance = distance;
    let windEffect = 0;
    let tempEffect = 0;

    // Fetch weather data if coordinates are provided
    if (latitude && longitude) {
      const apiKey = process.env.OPENWEATHER_API_KEY;

      if (apiKey && apiKey !== 'your_api_key_here') {
        try {
          const weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
          );

          weatherData = {
            temp: weatherResponse.data.main.temp,
            windSpeed: weatherResponse.data.wind.speed,
            windDeg: weatherResponse.data.wind.deg,
            description: weatherResponse.data.weather[0].description,
            humidity: weatherResponse.data.main.humidity
          };

          // Calculate weather effects
          windEffect = calculateWindEffect(weatherData.windSpeed, weatherData.windDeg, distance);
          tempEffect = calculateTemperatureEffect(weatherData.temp, distance);

          // Adjust distance for weather
          adjustedDistance = distance - windEffect + tempEffect;
        } catch (weatherError) {
          console.error('Weather API error:', weatherError.message);
          // Continue without weather data
        }
      }
    }

    // Adjust for handicap
    const playerHandicap = handicap || 0;
    const handicapAdjustedDistances = {};

    for (const [club, dist] of Object.entries(CLUB_DISTANCES)) {
      handicapAdjustedDistances[club] = adjustDistanceForHandicap(dist, playerHandicap);
    }

    // Find best club based on adjusted distance
    let bestClub = null;
    let smallestDiff = Infinity;

    for (const [club, clubDist] of Object.entries(handicapAdjustedDistances)) {
      const diff = Math.abs(clubDist - adjustedDistance);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestClub = club;
      }
    }

    // Provide alternative clubs (one shorter, one longer)
    const clubList = Object.keys(CLUB_DISTANCES);
    const currentIndex = clubList.indexOf(bestClub);
    const alternatives = {
      longer: currentIndex > 0 ? {
        club: clubList[currentIndex - 1],
        distance: handicapAdjustedDistances[clubList[currentIndex - 1]]
      } : null,
      shorter: currentIndex < clubList.length - 1 ? {
        club: clubList[currentIndex + 1],
        distance: handicapAdjustedDistances[clubList[currentIndex + 1]]
      } : null
    };

    res.json({
      recommendation: {
        club: bestClub,
        distance: handicapAdjustedDistances[bestClub],
        adjustedTargetDistance: Math.round(adjustedDistance)
      },
      alternatives,
      weather: weatherData,
      adjustments: {
        windEffect: Math.round(windEffect),
        tempEffect: Math.round(tempEffect),
        totalAdjustment: Math.round(windEffect - tempEffect)
      },
      originalDistance: distance,
      handicap: playerHandicap
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred processing your request' });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Golf Club Recommender running on port ${PORT}`);
  console.log(`Weather API: ${process.env.OPENWEATHER_API_KEY ? 'Configured' : 'Not configured'}`);
});
