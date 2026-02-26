/**
 * Location Management Module for SecureX
 * Handles Browser Geolocation, Geocoding via Nominatim, and Backend Sync
 */

const LocationManager = {
    currentCoords: null,
    currentAddress: null,

    /**
     * Get user's current coordinates using Browser Geolocation API
     */
    getCurrentLocation: async function () {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                showToast('Geolocation is not supported by your browser', 'error');
                return reject('Not supported');
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.currentCoords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    // Try to get address from reverse geocoding
                    await this.reverseGeocode(this.currentCoords.latitude, this.currentCoords.longitude);
                    this.updateUI();
                    resolve(this.currentCoords);
                },
                (error) => {
                    let msg = 'Error getting location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED: msg = 'User denied location access'; break;
                        case error.POSITION_UNAVAILABLE: msg = 'Location info unavailable'; break;
                        case error.TIMEOUT: msg = 'Location request timed out'; break;
                    }
                    showToast(msg, 'warning');
                    reject(error);
                }
            );
        });
    },

    /**
     * Forward geocoding using OpenStreetMap (Nominatim)
     */
    searchLocation: async function (address) {
        if (!address) return;

        try {
            const data = await API.get(`/locations/search?q=${encodeURIComponent(address)}`);

            if (data && data.length > 0) {
                const result = data[0];
                this.currentCoords = {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon)
                };
                this.currentAddress = result.display_name;
                this.updateUI();
                return this.currentCoords;
            } else {
                showToast('Location not found', 'warning');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            showToast('Error searching for location', 'error');
        }
    },

    /**
     * Reverse geocoding (Coords to Address)
     */
    reverseGeocode: async function (lat, lon) {
        try {
            const data = await API.get(`/locations/reverse?lat=${lat}&lon=${lon}`);
            if (data && data.display_name) {
                this.currentAddress = data.display_name;
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    },

    /**
     * Save current location to backend
     */
    saveLocation: async function () {
        // Read values from inputs in case user edited them
        const latInput = document.getElementById('loc-latitude');
        const lngInput = document.getElementById('loc-longitude');
        const addrInput = document.getElementById('loc-address');

        const payload = {
            latitude: latInput ? parseFloat(latInput.value) : this.currentCoords?.latitude,
            longitude: lngInput ? parseFloat(lngInput.value) : this.currentCoords?.longitude,
            address: addrInput ? addrInput.value : this.currentAddress
        };

        if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
            showToast('Please provide valid coordinates', 'warning');
            return;
        }

        try {
            const response = await API.post('/locations', payload);
            if (response.data) {
                showToast('Location saved successfully', 'success');
                this.updateDashboardCard(payload);
            }
        } catch (error) {
            console.error('Save location error:', error);
            showToast(error.message || 'Error saving location', 'error');
        }
    },

    /**
     * Update manual input fields
     */
    updateUI: function () {
        const latInput = document.getElementById('loc-latitude');
        const lngInput = document.getElementById('loc-longitude');
        const addrInput = document.getElementById('loc-address');

        if (latInput && this.currentCoords) latInput.value = this.currentCoords.latitude.toFixed(6);
        if (lngInput && this.currentCoords) lngInput.value = this.currentCoords.longitude.toFixed(6);
        if (addrInput && this.currentAddress) addrInput.value = this.currentAddress;
    },

    /**
     * Update the display card on the dashboard
     */
    updateDashboardCard: function (data) {
        const cardDisplay = document.querySelector('.location-display-text');
        if (cardDisplay) {
            cardDisplay.innerHTML = `
                <div class="mt-2">
                    <span class="text-white d-block small">${data.address || 'Address captured'}</span>
                    <span class="text-secondary x-small">${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}</span>
                </div>
            `;
        }

        const statusEl = document.querySelector('.location-status-text');
        if (statusEl) {
            statusEl.textContent = 'Active Monitoring';
            statusEl.className = 'mb-0 small text-success fw-bold location-status-text';
        }
    }
};

// Global handlers for HTML attributes
window.getLocation = () => LocationManager.getCurrentLocation();
window.searchLocation = () => {
    const input = document.getElementById('loc-address-search');
    if (input) LocationManager.searchLocation(input.value);
};
window.saveLocation = () => LocationManager.saveLocation();

// Auto-trigger geolocation on sidebar button if it exists
document.addEventListener('DOMContentLoaded', () => {
    const myLocBtn = document.querySelector('.my-location-btn');
    if (myLocBtn) {
        myLocBtn.addEventListener('click', () => {
            // Show the UI section if hidden, though current layout suggests modal or inline
            LocationManager.getCurrentLocation();
        });
    }
});
