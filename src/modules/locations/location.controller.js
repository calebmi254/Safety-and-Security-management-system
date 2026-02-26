const axios = require('axios');
const locationService = require('./location.service');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const AXIOS_CONFIG = {
    headers: { 'User-Agent': 'SecureX-App/1.0' }
};

const logLocation = async (req, res, next) => {
    try {
        const { latitude, longitude, address } = req.body;
        const result = await locationService.logLocation({
            userId: req.user.id,
            organizationId: req.organization_id,
            latitude,
            longitude,
            address,
        });

        res.status(201).json({
            message: 'Location logged successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getLocations = async (req, res, next) => {
    try {
        const locations = await locationService.getRecentLocations(req.organization_id);
        res.status(200).json({ data: locations });
    } catch (error) {
        next(error);
    }
};

const searchLocation = async (req, res, next) => {
    try {
        const { q } = req.query;
        const response = await axios.get(`${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(q)}&limit=1`, AXIOS_CONFIG);
        res.json(response.data);
    } catch (error) {
        next(error);
    }
};

const reverseGeocode = async (req, res, next) => {
    try {
        const { lat, lon } = req.query;
        const response = await axios.get(`${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}`, AXIOS_CONFIG);
        res.json(response.data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    logLocation,
    getLocations,
    searchLocation,
    reverseGeocode
};
