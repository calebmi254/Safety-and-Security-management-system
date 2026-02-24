const riskService = require('./risk.service');

const createRisk = async (req, res, next) => {
    try {
        const { title, description, riskLevel } = req.body;
        const result = await riskService.createRisk({
            organizationId: req.organization_id,
            title,
            description,
            riskLevel,
        });
        res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const getRisks = async (req, res, next) => {
    try {
        const risks = await riskService.getRisks(req.organization_id);
        res.status(200).json({ data: risks });
    } catch (error) {
        next(error);
    }
};

const updateRisk = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await riskService.updateRiskStatus(id, req.organization_id, status);
        if (!result) return res.status(404).json({ error: 'Risk not found' });
        res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRisk,
    getRisks,
    updateRisk,
};
