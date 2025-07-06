const mongoose = require('mongoose');

const healthEntrySchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true,
            index: true
        },
        water_intake: {
            glasses: { type: Number, default: 0 },
            ml: { type: Number, default: 0 },
            goal_ml: { type: Number, default: 2500 }
        },
        toilet_logs: [
            {
                id: { type: Number, required: true },
                type: { type: String, enum: ['pee', 'poop'], required: true },
                time: { type: String, required: true },
                date: { type: String, required: true },
                consistency: { type: Number, min: 1, max: 7 },
                color: { type: String },
                notes: { type: String }
            }
        ],
        supplements_taken: [
            {
                type: String
            }
        ],
        supplements_list: [
            {
                type: String,
                default: ['D3', 'Magnesium', 'Multivitamin', 'Omega-3', 'Zinc', 'Spirulina']
            }
        ],
        medications_taken: [
            {
                id: { type: Number, required: true },
                name: { type: String, required: true },
                time: { type: String },
                taken: { type: Boolean, default: true }
            }
        ],
        medications_list: [
            {
                type: String
            }
        ],
        sleep: {
            hours: { type: Number, min: 0, max: 24 },
            bedtime: { type: String },
            wake_time: { type: String },
            quality: { type: Number, min: 1, max: 5 },
            notes: { type: String }
        },
        workouts: [
            {
                id: { type: Number, required: true },
                type: { type: String, required: true },
                duration: { type: Number, min: 1 },
                intensity: { type: String, enum: ['Low', 'Medium', 'High'] },
                notes: { type: String },
                time: { type: String, required: true },
                date: { type: String, required: true }
            }
        ],
        mood: {
            current: { type: String },
            energy_level: { type: Number, min: 1, max: 10, default: 5 },
            notes: { type: String }
        }
    },
    {
        timestamps: true
    }
);

// Index for date
healthEntrySchema.index({ date: 1 });

module.exports = mongoose.model('HealthEntry', healthEntrySchema);
