const officeService = require('./offices.service');
const logger = require('../../utils/logger');

const getOffices = async (req, res, next) => {
    try {
        const offices = await officeService.getOffices(req.organization_id);
        res.status(200).json({ data: offices });
    } catch (error) {
        next(error);
    }
};

const getOfficeById = async (req, res, next) => {
    try {
        const office = await officeService.getOfficeById(req.params.id, req.organization_id);
        if (!office) {
            return res.status(404).json({ error: 'Office not found' });
        }
        res.status(200).json({ data: office });
    } catch (error) {
        next(error);
    }
};

const createOffice = async (req, res, next) => {
    try {
        const office = await officeService.createOffice(req.organization_id, req.body);
        res.status(201).json({
            message: 'Office created successfully',
            data: office
        });
    } catch (error) {
        next(error);
    }
};

const updateOffice = async (req, res, next) => {
    try {
        const office = await officeService.updateOffice(req.params.id, req.organization_id, req.body);
        if (!office) {
            return res.status(404).json({ error: 'Office not found or no changes made' });
        }
        res.status(200).json({
            message: 'Office updated successfully',
            data: office
        });
    } catch (error) {
        next(error);
    }
};

const deleteOffice = async (req, res, next) => {
    try {
        const success = await officeService.deleteOffice(req.params.id, req.organization_id);
        if (!success) {
            return res.status(404).json({ error: 'Office not found' });
        }
        res.status(200).json({ message: 'Office deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOffices,
    getOfficeById,
    createOffice,
    updateOffice,
    deleteOffice
};
