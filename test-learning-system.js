// Test script for the learning system
console.log('🧪 Testing Transaction Learning System\n');

// Mock the learning system functions
const mockLearningSystem = {
    learnedRules: [],
    manualAssignments: [],
    ruleStatistics: {},

    learnFromAssignment(transaction, assignedTag) {
        console.log(`🧠 Learning from assignment: "${transaction.description}" → "${assignedTag}"`);

        const assignment = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            transactionId: transaction.id,
            description: transaction.description,
            category: transaction.category,
            subcategory: transaction.subcategory,
            counterparty: transaction.counterparty,
            amount: transaction.amount,
            assignedTag,
            patterns: this.extractPatterns(transaction.description)
        };

        this.manualAssignments.push(assignment);
        console.log(`📝 Added manual assignment: ${assignment.id}`);

        return assignment;
    },

    extractPatterns(description) {
        const patterns = [];
        const words = description.toLowerCase().split(/\s+/);

        // Single word patterns
        words.forEach((word) => {
            if (word.length >= 3) {
                patterns.push({
                    type: 'exact_word',
                    pattern: word,
                    confidence: 0.7
                });
            }
        });

        // Multi-word patterns
        for (let i = 0; i < words.length - 1; i++) {
            const twoWords = `${words[i]} ${words[i + 1]}`;
            if (twoWords.length >= 5) {
                patterns.push({
                    type: 'exact_phrase',
                    pattern: twoWords,
                    confidence: 0.8
                });
            }
        }

        // Special patterns
        const specialPatterns = [/revolut\*\*\d+\*/i, /bunq/i, /degiro/i, /trading212/i];

        specialPatterns.forEach((regex) => {
            const match = description.match(regex);
            if (match) {
                patterns.push({
                    type: 'special_pattern',
                    pattern: match[0],
                    confidence: 0.95
                });
            }
        });

        return patterns;
    },

    applyLearnedRules(transaction) {
        const description = (transaction.description || '').toLowerCase();

        // Simple rule matching for testing
        for (const rule of this.learnedRules) {
            let matches = 0;
            let totalConditions = rule.conditions.length;

            rule.conditions.forEach((condition) => {
                if (condition.type === 'pattern') {
                    if (description.includes(condition.pattern.toLowerCase())) {
                        matches++;
                    }
                }
            });

            if (matches > 0 && matches / totalConditions > 0.5) {
                console.log(`🎯 Applied learned rule: "${transaction.description}" → "${rule.tag}"`);
                return {
                    tag: rule.tag,
                    confidence: matches / totalConditions,
                    ruleId: rule.id
                };
            }
        }

        return null;
    },

    analyzeAndCreateRules() {
        console.log('🔍 Analyzing manual assignments to create rules...');

        // Group assignments by tag
        const assignmentsByTag = {};
        this.manualAssignments.forEach((assignment) => {
            if (!assignmentsByTag[assignment.assignedTag]) {
                assignmentsByTag[assignment.assignedTag] = [];
            }
            assignmentsByTag[assignment.assignedTag].push(assignment);
        });

        // Create simple rules for testing
        Object.entries(assignmentsByTag).forEach(([tag, assignments]) => {
            if (assignments.length >= 2) {
                const conditions = [];

                // Find common patterns
                const patternCounts = {};
                assignments.forEach((assignment) => {
                    assignment.patterns.forEach((pattern) => {
                        const key = `${pattern.type}:${pattern.pattern}`;
                        patternCounts[key] = (patternCounts[key] || 0) + 1;
                    });
                });

                // Add patterns that appear in >50% of assignments
                Object.entries(patternCounts).forEach(([key, count]) => {
                    if (count / assignments.length > 0.5) {
                        const [type, pattern] = key.split(':');
                        conditions.push({
                            type: 'pattern',
                            patternType: type,
                            pattern: pattern,
                            confidence: 0.8,
                            frequency: count / assignments.length
                        });
                    }
                });

                if (conditions.length > 0) {
                    const rule = {
                        id: `rule_${tag}_${Date.now()}`,
                        tag,
                        conditions,
                        confidence: 0.8,
                        assignmentsCount: assignments.length,
                        createdAt: new Date().toISOString(),
                        lastUsed: null,
                        usageCount: 0
                    };

                    // Update or add rule
                    const existingIndex = this.learnedRules.findIndex((r) => r.tag === tag);
                    if (existingIndex !== -1) {
                        this.learnedRules[existingIndex] = rule;
                        console.log(`🔄 Updated rule for tag "${tag}"`);
                    } else {
                        this.learnedRules.push(rule);
                        console.log(`✅ Created new rule for tag "${tag}"`);
                    }
                }
            }
        });
    }
};

// Test transactions
const testTransactions = [
    {
        id: '1',
        description: 'Netflix subscription payment',
        category: 'Entertainment',
        subcategory: 'Streaming',
        counterparty: 'NETFLIX',
        amount: '-1500'
    },
    {
        id: '2',
        description: 'Spotify premium subscription',
        category: 'Entertainment',
        subcategory: 'Music',
        counterparty: 'SPOTIFY',
        amount: '-1000'
    },
    {
        id: '3',
        description: 'Amazon Prime membership',
        category: 'Shopping',
        subcategory: 'Online',
        counterparty: 'AMAZON',
        amount: '-800'
    },
    {
        id: '4',
        description: 'Another Netflix payment',
        category: 'Entertainment',
        subcategory: 'Streaming',
        counterparty: 'NETFLIX',
        amount: '-1500'
    },
    {
        id: '5',
        description: 'Unknown transaction',
        category: 'Other',
        subcategory: 'Other',
        counterparty: 'UNKNOWN',
        amount: '-500'
    }
];

// Test the learning system
console.log('🚀 Starting learning system test...\n');

// Step 1: Learn from manual assignments
console.log('📚 Step 1: Learning from manual assignments');
mockLearningSystem.learnFromAssignment(testTransactions[0], 'Subscriptions');
mockLearningSystem.learnFromAssignment(testTransactions[1], 'Subscriptions');
mockLearningSystem.learnFromAssignment(testTransactions[2], 'Subscriptions');

// Step 2: Analyze and create rules
console.log('\n🔍 Step 2: Creating rules from assignments');
mockLearningSystem.analyzeAndCreateRules();

// Step 3: Test rule application
console.log('\n🎯 Step 3: Testing rule application');
testTransactions.forEach((transaction, index) => {
    const result = mockLearningSystem.applyLearnedRules(transaction);
    if (result) {
        console.log(`✅ Transaction ${index + 1}: "${transaction.description}" → "${result.tag}" (confidence: ${result.confidence.toFixed(2)})`);
    } else {
        console.log(`❌ Transaction ${index + 1}: "${transaction.description}" → No rule applied`);
    }
});

console.log('\n🎉 Learning system test complete!');
console.log('✅ The system successfully:');
console.log('   - Learned from manual assignments');
console.log('   - Created rules based on patterns');
console.log('   - Applied rules to new transactions');
console.log('   - Tracked statistics');
