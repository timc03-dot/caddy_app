// DOM Elements
const form = document.getElementById('recommendForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const error = document.getElementById('error');
const tryAgainBtn = document.getElementById('tryAgain');

// Mode toggle elements
const manualModeBtn = document.getElementById('manualModeBtn');
const gpsModeBtn = document.getElementById('gpsModeBtn');
const gpsMode = document.getElementById('gpsMode');

// GPS elements
const gpsSetup = document.getElementById('gpsSetup');
const gpsTracking = document.getElementById('gpsTracking');
const markPositionBtn = document.getElementById('markPositionBtn');
const setCoordinatesBtn = document.getElementById('setCoordinatesBtn');
const newHoleBtn = document.getElementById('newHoleBtn');
const stopTrackingBtn = document.getElementById('stopTrackingBtn');
const gpsDistanceDisplay = document.getElementById('gpsDistance');
const knownDistanceInput = document.getElementById('knownDistance');
const pinLatInput = document.getElementById('pinLat');
const pinLonInput = document.getElementById('pinLon');

// GPS tracking state
let holeLocation = null;
let startPosition = null;
let watchId = null;
let currentRecommendation = null;
let updateInterval = null;
let calibrationMode = false;
let calibrationPositions = [];

// Hide result and error on page load
result.classList.add('hidden');
error.classList.add('hidden');

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const distance = parseInt(document.getElementById('distance').value);
    const handicapInput = document.getElementById('handicap').value;
    const handicap = handicapInput ? parseInt(handicapInput) : null;
    const useWeather = document.getElementById('useWeather').checked;

    // Hide previous results/errors
    result.classList.add('hidden');
    error.classList.add('hidden');
    form.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        let latitude = null;
        let longitude = null;

        // Get location if weather is enabled
        if (useWeather) {
            try {
                const position = await getCurrentPosition();
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (geoError) {
                console.error('Geolocation error:', geoError);
                showError('Could not access your location. Continuing without weather data.');
                // Continue without weather data
            }
        }

        // Call API
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                distance,
                handicap,
                latitude,
                longitude
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get recommendation');
        }

        const data = await response.json();

        // Display results
        displayResults(data);

    } catch (err) {
        console.error('Error:', err);
        showError('An error occurred. Please try again.');
        form.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
});

// Try again button handler
tryAgainBtn.addEventListener('click', () => {
    result.classList.add('hidden');
    error.classList.add('hidden');
    form.classList.remove('hidden');
    form.reset();
    document.getElementById('useWeather').checked = true;
});

// Mode toggle handlers
manualModeBtn.addEventListener('click', () => {
    manualModeBtn.classList.add('active');
    gpsModeBtn.classList.remove('active');
    form.classList.remove('hidden');
    gpsMode.classList.add('hidden');
    result.classList.add('hidden');
    stopGPSTracking();
    holeLocation = null;
    startPosition = null;
    calibrationMode = false;
    calibrationPositions = [];
});

gpsModeBtn.addEventListener('click', () => {
    gpsModeBtn.classList.add('active');
    manualModeBtn.classList.remove('active');
    gpsMode.classList.remove('hidden');
    form.classList.add('hidden');
    result.classList.add('hidden');
});

// GPS: Mark position and calculate pin location
markPositionBtn.addEventListener('click', async () => {
    const knownDistance = parseFloat(knownDistanceInput.value);

    if (!knownDistance || knownDistance <= 0) {
        showError('Please enter the distance to the hole');
        return;
    }

    try {
        markPositionBtn.disabled = true;
        markPositionBtn.textContent = 'Getting location...';

        const position = await getCurrentPosition();
        startPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            knownDistance: knownDistance
        };

        // Start calibration mode: user takes a few steps toward hole
        calibrationMode = true;
        calibrationPositions = [position.coords];

        gpsSetup.classList.add('hidden');
        gpsTracking.classList.remove('hidden');

        // Show calibration message
        showError('Walk a few steps toward the hole to calibrate direction...', 'success');

        startGPSTracking();

    } catch (err) {
        console.error('Error marking position:', err);
        showError('Could not get your location. Please enable GPS.');
    } finally {
        markPositionBtn.disabled = false;
        markPositionBtn.textContent = 'Mark Position & Start Tracking';
    }
});

// GPS: Set pin coordinates directly
setCoordinatesBtn.addEventListener('click', async () => {
    const pinLat = parseFloat(pinLatInput.value);
    const pinLon = parseFloat(pinLonInput.value);

    if (!pinLat || !pinLon) {
        showError('Please enter both latitude and longitude');
        return;
    }

    try {
        setCoordinatesBtn.disabled = true;
        setCoordinatesBtn.textContent = 'Starting...';

        holeLocation = {
            latitude: pinLat,
            longitude: pinLon
        };

        gpsSetup.classList.add('hidden');
        gpsTracking.classList.remove('hidden');

        startGPSTracking();

        showError('Tracking started with pin coordinates!', 'success');

    } catch (err) {
        console.error('Error setting coordinates:', err);
        showError('An error occurred. Please try again.');
    } finally {
        setCoordinatesBtn.disabled = false;
        setCoordinatesBtn.textContent = 'Start Tracking with Coordinates';
    }
});

// GPS: Mark new hole
newHoleBtn.addEventListener('click', () => {
    stopGPSTracking();
    gpsTracking.classList.add('hidden');
    gpsSetup.classList.remove('hidden');
    result.classList.add('hidden');
    holeLocation = null;
    startPosition = null;
    calibrationMode = false;
    calibrationPositions = [];
    gpsDistanceDisplay.textContent = '---';
    knownDistanceInput.value = '';
});

// GPS: Stop tracking
stopTrackingBtn.addEventListener('click', () => {
    stopGPSTracking();
    gpsTracking.classList.add('hidden');
    gpsSetup.classList.remove('hidden');
    result.classList.add('hidden');
    holeLocation = null;
    startPosition = null;
    calibrationMode = false;
    calibrationPositions = [];
    gpsDistanceDisplay.textContent = '---';
});

// Start GPS tracking
function startGPSTracking() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Stop GPS tracking
function stopGPSTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// Handle position update
async function handlePositionUpdate(position) {
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    // Calibration mode: calculate pin location from movement
    if (calibrationMode && startPosition) {
        calibrationPositions.push(position.coords);

        // Need at least 2 positions to calculate bearing
        if (calibrationPositions.length >= 2) {
            const firstPos = calibrationPositions[0];
            const lastPos = calibrationPositions[calibrationPositions.length - 1];

            // Calculate distance moved
            const movedDistance = calculateDistance(
                firstPos.latitude,
                firstPos.longitude,
                lastPos.latitude,
                lastPos.longitude
            );

            // If moved at least 5 yards, calculate bearing and pin location
            if (movedDistance >= 5) {
                const bearing = calculateBearing(
                    firstPos.latitude,
                    firstPos.longitude,
                    lastPos.latitude,
                    lastPos.longitude
                );

                // Calculate pin location based on bearing and known distance
                holeLocation = calculateDestination(
                    startPosition.latitude,
                    startPosition.longitude,
                    bearing,
                    startPosition.knownDistance
                );

                calibrationMode = false;
                calibrationPositions = [];
                showError('Pin location calculated! Tracking active.', 'success');
            }
        }

        // During calibration, show estimated distance
        if (startPosition) {
            gpsDistanceDisplay.textContent = Math.round(startPosition.knownDistance);
        }
        return;
    }

    // Normal tracking mode
    if (!holeLocation) return;

    // Calculate distance to hole
    const distanceYards = calculateDistance(
        currentLat,
        currentLon,
        holeLocation.latitude,
        holeLocation.longitude
    );

    // Update display
    gpsDistanceDisplay.textContent = Math.round(distanceYards);

    // Get recommendation if distance is reasonable (> 10 yards)
    if (distanceYards >= 10) {
        await updateRecommendation(distanceYards, currentLat, currentLon);
    }
}

// Handle position error
function handlePositionError(error) {
    console.error('GPS error:', error);
    let message = 'GPS error: ';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message += 'Location permission denied';
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location unavailable';
            break;
        case error.TIMEOUT:
            message += 'Location request timeout';
            break;
        default:
            message += 'Unknown error';
    }
    showError(message);
}

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMiles = R * c;
    const distanceYards = distanceMiles * 1760; // Convert miles to yards

    return distanceYards;
}

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = toRadians(lon2 - lon1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = toDegrees(bearingRad);

    // Normalize to 0-360
    return (bearingDeg + 360) % 360;
}

// Calculate destination point given start point, bearing, and distance
function calculateDestination(lat, lon, bearing, distanceYards) {
    const R = 3958.8; // Earth's radius in miles
    const distanceMiles = distanceYards / 1760;
    const bearingRad = toRadians(bearing);
    const latRad = toRadians(lat);
    const lonRad = toRadians(lon);

    const newLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(distanceMiles / R) +
        Math.cos(latRad) * Math.sin(distanceMiles / R) * Math.cos(bearingRad)
    );

    const newLonRad = lonRad + Math.atan2(
        Math.sin(bearingRad) * Math.sin(distanceMiles / R) * Math.cos(latRad),
        Math.cos(distanceMiles / R) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    return {
        latitude: toDegrees(newLatRad),
        longitude: toDegrees(newLonRad)
    };
}

// Update recommendation based on GPS distance
async function updateRecommendation(distance, latitude, longitude) {
    try {
        const handicapInput = document.getElementById('gpsHandicap').value;
        const handicap = handicapInput ? parseInt(handicapInput) : null;

        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                distance: Math.round(distance),
                handicap,
                latitude,
                longitude
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get recommendation');
        }

        const data = await response.json();
        currentRecommendation = data;

        // Display results
        displayResults(data);

    } catch (err) {
        console.error('Error updating recommendation:', err);
    }
}

// Get current position using Geolocation API
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

// Display results
function displayResults(data) {
    // Main recommendation
    document.getElementById('clubName').textContent = data.recommendation.club;
    document.getElementById('clubDistance').textContent =
        `${Math.round(data.recommendation.distance)} yards`;

    // Alternatives
    const alternativesDiv = document.getElementById('alternatives');
    alternativesDiv.innerHTML = '';

    if (data.alternatives.longer) {
        alternativesDiv.innerHTML += `
            <div class="alternative-club">
                <h3>Longer Option</h3>
                <div class="club">${data.alternatives.longer.club}</div>
                <div class="distance">${Math.round(data.alternatives.longer.distance)} yards</div>
            </div>
        `;
    }

    if (data.alternatives.shorter) {
        alternativesDiv.innerHTML += `
            <div class="alternative-club">
                <h3>Shorter Option</h3>
                <div class="club">${data.alternatives.shorter.club}</div>
                <div class="distance">${Math.round(data.alternatives.shorter.distance)} yards</div>
            </div>
        `;
    }

    // Weather conditions
    const conditionsDiv = document.getElementById('conditions');
    if (data.weather) {
        conditionsDiv.classList.remove('hidden');
        const tempF = Math.round((data.weather.temp * 9/5) + 32);
        const windMph = Math.round(data.weather.windSpeed * 2.237);

        conditionsDiv.innerHTML = `
            <h3>Current Conditions</h3>
            <div class="condition-item">
                <span class="condition-label">Temperature</span>
                <span class="condition-value">${tempF}°F (${Math.round(data.weather.temp)}°C)</span>
            </div>
            <div class="condition-item">
                <span class="condition-label">Wind Speed</span>
                <span class="condition-value">${windMph} mph</span>
            </div>
            <div class="condition-item">
                <span class="condition-label">Conditions</span>
                <span class="condition-value">${capitalizeFirst(data.weather.description)}</span>
            </div>
            <div class="condition-item">
                <span class="condition-label">Humidity</span>
                <span class="condition-value">${data.weather.humidity}%</span>
            </div>
        `;
    } else {
        conditionsDiv.classList.add('hidden');
    }

    // Adjustments
    const adjustmentsDiv = document.getElementById('adjustments');
    if (data.weather) {
        adjustmentsDiv.classList.remove('hidden');
        adjustmentsDiv.innerHTML = `
            <h3>Distance Adjustments</h3>
            <div class="adjustment-item">
                <span class="adjustment-label">Original Distance</span>
                <span class="adjustment-value">${data.originalDistance} yards</span>
            </div>
            <div class="adjustment-item">
                <span class="adjustment-label">Wind Effect</span>
                <span class="adjustment-value">${formatAdjustment(data.adjustments.windEffect)} yards</span>
            </div>
            <div class="adjustment-item">
                <span class="adjustment-label">Temperature Effect</span>
                <span class="adjustment-value">${formatAdjustment(data.adjustments.tempEffect)} yards</span>
            </div>
            <div class="adjustment-item">
                <span class="adjustment-label">Adjusted Target</span>
                <span class="adjustment-value">${data.recommendation.adjustedTargetDistance} yards</span>
            </div>
        `;
    } else {
        adjustmentsDiv.classList.add('hidden');
    }

    result.classList.remove('hidden');
}

// Show error/success message
function showError(message, type = 'error') {
    error.textContent = message;
    error.classList.remove('hidden');

    if (type === 'success') {
        error.style.background = '#28a745';
    } else {
        error.style.background = '';
    }

    setTimeout(() => {
        error.classList.add('hidden');
        error.style.background = '';
    }, 5000);
}

// Helper: Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper: Format adjustment with + or -
function formatAdjustment(value) {
    if (value > 0) return `+${value}`;
    return `${value}`;
}
