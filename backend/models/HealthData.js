const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true,
            index: true
        },
        waterIntake: {
            type: Number,
            default: 0
        },
        vitamins: {
            type: [String],
            default: []
        },
        medications: {
            type: [String],
            default: []
        },
        toiletLogs: {
            type: [
                {
                    type: {
                        type: String,
                        enum: ['pee', 'poop'],
                        required: true
                    },
                    time: {
                        type: String,
                        required: true
                    },
                    details: {
                        consistency: {
                            type: String,
                            enum: ['1', '2', '3', '4', '5', '6', '7']
                        },
                        color: {
                            type: String,
                            enum: ['brown', 'black', 'green', 'yellow', 'red', 'white']
                        },
                        notes: String
                    }
                }
            ],
            default: []
        },
        sleep: {
            hours: {
                type: Number,
                default: 0
            },
            quality: {
                type: String,
                enum: ['poor', 'fair', 'good', 'excellent'],
                default: 'good'
            },
            notes: String
        },
        workouts: {
            type: [
                {
                    type: {
                        type: String,
                        required: true
                    },
                    duration: Number,
                    intensity: {
                        type: String,
                        enum: ['low', 'medium', 'high'],
                        default: 'medium'
                    },
                    notes: String
                }
            ],
            default: []
        },
        mood: {
            type: String,
            enum: ['terrible', 'bad', 'okay', 'good', 'excellent'],
            default: 'okay'
        },
        notes: {
            type: String,
            default: ''
        },
        supplements: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Compound index for date and efficient queries
healthDataSchema.index({ date: 1 });

module.exports = mongoose.model('HealthData', healthDataSchema);
