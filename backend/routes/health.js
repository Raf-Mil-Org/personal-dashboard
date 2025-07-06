const express = require('express');
const router = express.Router();
const HealthEntry = require('../models/HealthEntry');

// Get health entry for a specific date
router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;

        let healthEntry = await HealthEntry.findOne({ date: date });

        if (!healthEntry) {
            // Create default entry for the date
            healthEntry = new HealthEntry({
                date: date,
                water_intake: {
                    glasses: 0,
                    ml: 0,
                    goal_ml: 2500
                },
                toilet_logs: [],
                supplements_taken: [],
                supplements_list: ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina'],
                medications_taken: [],
                medications_list: [],
                sleep: {
                    hours: 0,
                    bedtime: '',
                    wake_time: '',
                    quality: null,
                    notes: ''
                },
                workouts: [],
                mood: {
                    current: null,
                    energy_level: 5,
                    notes: ''
                }
            });
            await healthEntry.save();
        }

        res.json(healthEntry);
    } catch (error) {
        console.error('Error fetching health entry:', error);
        res.status(500).json({ error: 'Failed to fetch health entry' });
    }
});

// Create or update health entry
router.post('/', async (req, res) => {
    try {
        const healthData = req.body;

        // Ensure the date is set
        if (!healthData.date) {
            healthData.date = new Date().toISOString().slice(0, 10);
        }

        // Find existing entry or create new one
        let healthEntry = await HealthEntry.findOne({ date: healthData.date });

        if (healthEntry) {
            // Update existing entry
            Object.assign(healthEntry, healthData);
        } else {
            // Create new entry
            healthEntry = new HealthEntry(healthData);
        }

        await healthEntry.save();
        res.json(healthEntry);
    } catch (error) {
        console.error('Error saving health entry:', error);
        res.status(500).json({ error: 'Failed to save health entry' });
    }
});

// Get health entries for a date range
router.get('/range/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;

        const entries = await HealthEntry.find({
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        res.json(entries);
    } catch (error) {
        console.error('Error fetching health entries range:', error);
        res.status(500).json({ error: 'Failed to fetch health entries' });
    }
});

// Get summary statistics
router.get('/stats/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;

        const entries = await HealthEntry.find({
            date: { $gte: startDate, $lte: endDate }
        });

        const stats = {
            totalDays: entries.length,
            averageWaterIntake: 0,
            totalWorkouts: 0,
            averageSleepHours: 0,
            averageMoodEnergy: 0,
            totalToiletLogs: 0
        };

        if (entries.length > 0) {
            stats.averageWaterIntake = entries.reduce((sum, entry) => sum + entry.water_intake.ml, 0) / entries.length;
            stats.totalWorkouts = entries.reduce((sum, entry) => sum + entry.workouts.length, 0);
            stats.averageSleepHours = entries.reduce((sum, entry) => sum + (entry.sleep.hours || 0), 0) / entries.length;
            stats.averageMoodEnergy = entries.reduce((sum, entry) => sum + (entry.mood.energy_level || 5), 0) / entries.length;
            stats.totalToiletLogs = entries.reduce((sum, entry) => sum + entry.toilet_logs.length, 0);
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching health stats:', error);
        res.status(500).json({ error: 'Failed to fetch health statistics' });
    }
});

// Delete health entry for a specific date
router.delete('/:date', async (req, res) => {
    try {
        const { date } = req.params;

        const result = await HealthEntry.deleteOne({ date: date });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Health entry not found' });
        }

        res.json({ message: 'Health entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting health entry:', error);
        res.status(500).json({ error: 'Failed to delete health entry' });
    }
});

module.exports = router;
