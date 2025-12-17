const form = document.getElementById('recommendForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const error = document.getElementById('error');
const tryAgainBtn = document.getElementById('tryAgain');

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

// Show error message
function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    setTimeout(() => {
        error.classList.add('hidden');
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
