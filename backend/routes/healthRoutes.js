const express = require('express');
const router = express.Router();
const HealthData = require('../models/HealthData');

// Get health data for a specific date
router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        let healthData = await HealthData.findOne({ date });

        if (!healthData) {
            // Create default data for the date if it doesn't exist
            healthData = new HealthData({ date });
            await healthData.save();
        }

        res.json(healthData);
    } catch (error) {
        console.error('Error fetching health data:', error);
        res.status(500).json({ error: 'Failed to fetch health data' });
    }
});

// Update health data for a specific date
router.put('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const updateData = req.body;

        const healthData = await HealthData.findOneAndUpdate({ date }, updateData, { new: true, upsert: true, runValidators: true });

        res.json(healthData);
    } catch (error) {
        console.error('Error updating health data:', error);
        res.status(500).json({ error: 'Failed to update health data' });
    }
});

// Get all health data (for analytics)
router.get('/', async (req, res) => {
    try {
        const { limit = 30, offset = 0 } = req.query;

        const healthData = await HealthData.find().sort({ date: -1 }).limit(parseInt(limit)).skip(parseInt(offset));

        res.json(healthData);
    } catch (error) {
        console.error('Error fetching all health data:', error);
        res.status(500).json({ error: 'Failed to fetch health data' });
    }
});

// Delete health data for a specific date
router.delete('/:date', async (req, res) => {
    try {
        const { date } = req.params;

        const result = await HealthData.findOneAndDelete({ date });

        if (!result) {
            return res.status(404).json({ error: 'Health data not found for this date' });
        }

        res.json({ message: 'Health data deleted successfully' });
    } catch (error) {
        console.error('Error deleting health data:', error);
        res.status(500).json({ error: 'Failed to delete health data' });
    }
});

// Get date range of health data
router.get('/stats/date-range', async (req, res) => {
    try {
        const stats = await HealthData.aggregate([
            {
                $group: {
                    _id: null,
                    earliestDate: { $min: '$date' },
                    latestDate: { $max: '$date' },
                    totalEntries: { $sum: 1 }
                }
            }
        ]);

        res.json(stats[0] || { earliestDate: null, latestDate: null, totalEntries: 0 });
    } catch (error) {
        console.error('Error fetching date range stats:', error);
        res.status(500).json({ error: 'Failed to fetch date range stats' });
    }
});

module.exports = router;
