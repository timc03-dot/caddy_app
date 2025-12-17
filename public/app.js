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
const markHoleBtn = document.getElementById('markHoleBtn');
const newHoleBtn = document.getElementById('newHoleBtn');
const stopTrackingBtn = document.getElementById('stopTrackingBtn');
const gpsDistanceDisplay = document.getElementById('gpsDistance');

// GPS tracking state
let holeLocation = null;
let watchId = null;
let currentRecommendation = null;
let updateInterval = null;

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
});

gpsModeBtn.addEventListener('click', () => {
    gpsModeBtn.classList.add('active');
    manualModeBtn.classList.remove('active');
    gpsMode.classList.remove('hidden');
    form.classList.add('hidden');
    result.classList.add('hidden');
});

// GPS: Mark hole location
markHoleBtn.addEventListener('click', async () => {
    try {
        markHoleBtn.disabled = true;
        markHoleBtn.textContent = 'Getting location...';

        const position = await getCurrentPosition();
        holeLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        gpsSetup.classList.add('hidden');
        gpsTracking.classList.remove('hidden');

        startGPSTracking();

        showError('Hole location marked! Move away to track distance.', 'success');
    } catch (err) {
        console.error('Error marking hole:', err);
        showError('Could not get your location. Please enable GPS.');
    } finally {
        markHoleBtn.disabled = false;
        markHoleBtn.textContent = 'Mark Hole Location';
    }
});

// GPS: Mark new hole
newHoleBtn.addEventListener('click', () => {
    stopGPSTracking();
    gpsTracking.classList.add('hidden');
    gpsSetup.classList.remove('hidden');
    result.classList.add('hidden');
    holeLocation = null;
    gpsDistanceDisplay.textContent = '---';
});

// GPS: Stop tracking
stopTrackingBtn.addEventListener('click', () => {
    stopGPSTracking();
    gpsTracking.classList.add('hidden');
    gpsSetup.classList.remove('hidden');
    result.classList.add('hidden');
    holeLocation = null;
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
    if (!holeLocation) return;

    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

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
