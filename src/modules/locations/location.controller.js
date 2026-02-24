const locationService = require('./location.service');

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

module.exports = {
    logLocation,
    getLocations,
};
