// composables/useTransactionLearning.js
import { ref, computed } from 'vue';

// Storage keys for learning system
const LEARNING_STORAGE_KEYS = {
    LEARNED_RULES: 'transaction_learning_rules',
    MANUAL_ASSIGNMENTS: 'transaction_manual_assignments',
    RULE_STATISTICS: 'transaction_rule_statistics'
};

export function useTransactionLearning() {
    // State
    const learnedRules = ref([]);
    const manualAssignments = ref([]);
    const ruleStatistics = ref({});

    // Load learned rules from localStorage
    const loadLearnedRules = () => {
        try {
            const saved = localStorage.getItem(LEARNING_STORAGE_KEYS.LEARNED_RULES);
            learnedRules.value = saved ? JSON.parse(saved) : [];
            console.log('📚 Loaded learned rules:', learnedRules.value.length);
        } catch (error) {
            console.error('Error loading learned rules:', error);
            learnedRules.value = [];
        }
    };

    // Save learned rules to localStorage
    const saveLearnedRules = () => {
        try {
            localStorage.setItem(LEARNING_STORAGE_KEYS.LEARNED_RULES, JSON.stringify(learnedRules.value));
            console.log('💾 Saved learned rules:', learnedRules.value.length);
        } catch (error) {
            console.error('Error saving learned rules:', error);
        }
    };

    // Load manual assignments from localStorage
    const loadManualAssignments = () => {
        try {
            const saved = localStorage.getItem(LEARNING_STORAGE_KEYS.MANUAL_ASSIGNMENTS);
            manualAssignments.value = saved ? JSON.parse(saved) : [];
            console.log('📝 Loaded manual assignments:', manualAssignments.value.length);
        } catch (error) {
            console.error('Error loading manual assignments:', error);
            manualAssignments.value = [];
        }
        return manualAssignments.value;
    };

    // Save manual assignments to localStorage
    const saveManualAssignments = () => {
        try {
            localStorage.setItem(LEARNING_STORAGE_KEYS.MANUAL_ASSIGNMENTS, JSON.stringify(manualAssignments.value));
            console.log('💾 Saved manual assignments:', manualAssignments.value.length);
        } catch (error) {
            console.error('Error saving manual assignments:', error);
        }
    };

    // Load rule statistics from localStorage
    const loadRuleStatistics = () => {
        try {
            const saved = localStorage.getItem(LEARNING_STORAGE_KEYS.RULE_STATISTICS);
            ruleStatistics.value = saved ? JSON.parse(saved) : {};
            console.log('📊 Loaded rule statistics:', Object.keys(ruleStatistics.value).length);
        } catch (error) {
            console.error('Error loading rule statistics:', error);
            ruleStatistics.value = {};
        }
    };

    // Save rule statistics to localStorage
    const saveRuleStatistics = () => {
        try {
            localStorage.setItem(LEARNING_STORAGE_KEYS.RULE_STATISTICS, JSON.stringify(ruleStatistics.value));
            console.log('💾 Saved rule statistics');
        } catch (error) {
            console.error('Error saving rule statistics:', error);
        }
    };

    // Initialize learning system
    const initializeLearning = () => {
        loadLearnedRules();
        loadManualAssignments();
        loadRuleStatistics();
    };

    // Extract patterns from transaction description
    const extractPatterns = (description) => {
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

        // Multi-word patterns (2-3 words)
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

        // Special patterns (like Revolut**7355*)
        const specialPatterns = [/revolut\*\*\d+\*/i, /bunq/i, /degiro/i, /trading212/i, /etoro/i, /coinbase/i, /binance/i, /kraken/i];

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
    };

    // Learn from manual tag assignment
    const learnFromAssignment = (transaction, assignedTag) => {
        console.log(`🧠 Learning from manual assignment: "${transaction.description}" → "${assignedTag}"`);

        // Create manual assignment record
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
            patterns: extractPatterns(transaction.description)
        };

        // Add to manual assignments
        manualAssignments.value.push(assignment);
        saveManualAssignments();

        // Analyze patterns and create/update rules
        analyzeAndCreateRules();

        return assignment;
    };

    // Analyze manual assignments and create rules
    const analyzeAndCreateRules = () => {
        console.log('🔍 Analyzing manual assignments to create rules...');

        // Group assignments by tag
        const assignmentsByTag = {};
        manualAssignments.value.forEach((assignment) => {
            if (!assignmentsByTag[assignment.assignedTag]) {
                assignmentsByTag[assignment.assignedTag] = [];
            }
            assignmentsByTag[assignment.assignedTag].push(assignment);
        });

        // Create rules for each tag
        Object.entries(assignmentsByTag).forEach(([tag, assignments]) => {
            if (assignments.length >= 2) {
                // Need at least 2 assignments to create a rule
                createRuleFromAssignments(tag, assignments);
            }
        });

        saveLearnedRules();
        updateRuleStatistics();
    };

    // Create a rule from multiple assignments
    const createRuleFromAssignments = (tag, assignments) => {
        console.log(`📋 Creating rule for tag "${tag}" from ${assignments.length} assignments`);

        // Analyze patterns across assignments
        const patternFrequency = {};
        const categoryFrequency = {};
        const subcategoryFrequency = {};
        const counterpartyFrequency = {};

        assignments.forEach((assignment) => {
            // Count pattern frequencies
            assignment.patterns.forEach((pattern) => {
                const key = `${pattern.type}:${pattern.pattern}`;
                if (!patternFrequency[key]) {
                    patternFrequency[key] = { count: 0, confidence: pattern.confidence };
                }
                patternFrequency[key].count++;
            });

            // Count category frequencies
            if (assignment.category) {
                if (!categoryFrequency[assignment.category]) {
                    categoryFrequency[assignment.category] = 0;
                }
                categoryFrequency[assignment.category]++;
            }

            // Count subcategory frequencies
            if (assignment.subcategory) {
                if (!subcategoryFrequency[assignment.subcategory]) {
                    subcategoryFrequency[assignment.subcategory] = 0;
                }
                subcategoryFrequency[assignment.subcategory]++;
            }

            // Count counterparty frequencies
            if (assignment.counterparty) {
                if (!counterpartyFrequency[assignment.counterparty]) {
                    counterpartyFrequency[assignment.counterparty] = 0;
                }
                counterpartyFrequency[assignment.counterparty]++;
            }
        });

        // Create rule conditions
        const conditions = [];

        // Add high-frequency patterns (appearing in >50% of assignments)
        Object.entries(patternFrequency).forEach(([key, data]) => {
            const frequency = data.count / assignments.length;
            if (frequency > 0.5) {
                const [type, pattern] = key.split(':');
                conditions.push({
                    type: 'pattern',
                    patternType: type,
                    pattern: pattern,
                    confidence: data.confidence * frequency,
                    frequency
                });
            }
        });

        // Add high-frequency categories
        Object.entries(categoryFrequency).forEach(([category, count]) => {
            const frequency = count / assignments.length;
            if (frequency > 0.5) {
                conditions.push({
                    type: 'category',
                    value: category,
                    confidence: frequency,
                    frequency
                });
            }
        });

        // Add high-frequency subcategories
        Object.entries(subcategoryFrequency).forEach(([subcategory, count]) => {
            const frequency = count / assignments.length;
            if (frequency > 0.5) {
                conditions.push({
                    type: 'subcategory',
                    value: subcategory,
                    confidence: frequency,
                    frequency
                });
            }
        });

        // Add high-frequency counterparties
        Object.entries(counterpartyFrequency).forEach(([counterparty, count]) => {
            const frequency = count / assignments.length;
            if (frequency > 0.5) {
                conditions.push({
                    type: 'counterparty',
                    value: counterparty,
                    confidence: frequency,
                    frequency
                });
            }
        });

        // Create the rule
        if (conditions.length > 0) {
            const rule = {
                id: `rule_${tag}_${Date.now()}`,
                tag,
                conditions,
                confidence: conditions.reduce((sum, c) => sum + c.confidence, 0) / conditions.length,
                assignmentsCount: assignments.length,
                createdAt: new Date().toISOString(),
                lastUsed: null,
                usageCount: 0
            };

            // Check if similar rule already exists
            const existingRuleIndex = learnedRules.value.findIndex((r) => r.tag === tag);
            if (existingRuleIndex !== -1) {
                // Update existing rule
                learnedRules.value[existingRuleIndex] = rule;
                console.log(`🔄 Updated existing rule for tag "${tag}"`);
            } else {
                // Add new rule
                learnedRules.value.push(rule);
                console.log(`✅ Created new rule for tag "${tag}"`);
            }
        }
    };

    // Apply learned rules to a transaction
    const applyLearnedRules = (transaction) => {
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const counterparty = (transaction.counterparty || '').toLowerCase();

        let bestMatch = null;
        let bestConfidence = 0;

        learnedRules.value.forEach((rule) => {
            let ruleConfidence = 0;
            let matchingConditions = 0;

            rule.conditions.forEach((condition) => {
                let conditionMet = false;

                switch (condition.type) {
                    case 'pattern':
                        if (condition.patternType === 'exact_word') {
                            conditionMet = description.includes(condition.pattern);
                        } else if (condition.patternType === 'exact_phrase') {
                            conditionMet = description.includes(condition.pattern);
                        } else if (condition.patternType === 'special_pattern') {
                            const regex = new RegExp(condition.pattern, 'i');
                            conditionMet = regex.test(description);
                        }
                        break;

                    case 'category':
                        conditionMet = category === condition.value.toLowerCase();
                        break;

                    case 'subcategory':
                        conditionMet = subcategory === condition.value.toLowerCase();
                        break;

                    case 'counterparty':
                        conditionMet = counterparty.includes(condition.value.toLowerCase());
                        break;
                }

                if (conditionMet) {
                    ruleConfidence += condition.confidence;
                    matchingConditions++;
                }
            });

            // Calculate overall rule confidence
            if (matchingConditions > 0) {
                ruleConfidence = ruleConfidence / rule.conditions.length;

                if (ruleConfidence > bestConfidence) {
                    bestConfidence = ruleConfidence;
                    bestMatch = rule;
                }
            }
        });

        if (bestMatch && bestConfidence > 0.6) {
            // Minimum confidence threshold
            // Update rule usage statistics
            bestMatch.lastUsed = new Date().toISOString();
            bestMatch.usageCount++;
            saveLearnedRules();

            console.log(`🎯 Applied learned rule: "${transaction.description}" → "${bestMatch.tag}" (confidence: ${bestConfidence.toFixed(2)})`);
            return {
                tag: bestMatch.tag,
                confidence: bestConfidence,
                ruleId: bestMatch.id
            };
        }

        return null;
    };

    // Update rule statistics
    const updateRuleStatistics = () => {
        const stats = {
            totalRules: learnedRules.value.length,
            totalAssignments: manualAssignments.value.length,
            rulesByTag: {},
            mostUsedRules: [],
            recentRules: []
        };

        // Count rules by tag
        learnedRules.value.forEach((rule) => {
            if (!stats.rulesByTag[rule.tag]) {
                stats.rulesByTag[rule.tag] = 0;
            }
            stats.rulesByTag[rule.tag]++;
        });

        // Get most used rules
        stats.mostUsedRules = [...learnedRules.value].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

        // Get recent rules
        stats.recentRules = [...learnedRules.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

        ruleStatistics.value = stats;
        saveRuleStatistics();

        return stats;
    };

    // Clear all learned data
    const clearLearnedData = () => {
        learnedRules.value = [];
        manualAssignments.value = [];
        ruleStatistics.value = {};

        localStorage.removeItem(LEARNING_STORAGE_KEYS.LEARNED_RULES);
        localStorage.removeItem(LEARNING_STORAGE_KEYS.MANUAL_ASSIGNMENTS);
        localStorage.removeItem(LEARNING_STORAGE_KEYS.RULE_STATISTICS);

        console.log('🗑️ Cleared all learned data');
    };

    // Export learned rules
    const exportLearnedRules = () => {
        return {
            rules: learnedRules.value,
            assignments: manualAssignments.value,
            statistics: ruleStatistics.value,
            exportedAt: new Date().toISOString()
        };
    };

    // Import learned rules
    const importLearnedRules = (data) => {
        try {
            if (data.rules) {
                learnedRules.value = data.rules;
                saveLearnedRules();
            }
            if (data.assignments) {
                manualAssignments.value = data.assignments;
                saveManualAssignments();
            }
            if (data.statistics) {
                ruleStatistics.value = data.statistics;
                saveRuleStatistics();
            }
            console.log('📥 Imported learned rules successfully');
            return true;
        } catch (error) {
            console.error('Error importing learned rules:', error);
            return false;
        }
    };

    // Computed properties
    const rulesByTag = computed(() => {
        const grouped = {};
        learnedRules.value.forEach((rule) => {
            if (!grouped[rule.tag]) {
                grouped[rule.tag] = [];
            }
            grouped[rule.tag].push(rule);
        });
        return grouped;
    });

    const totalRules = computed(() => learnedRules.value.length);
    const totalAssignments = computed(() => manualAssignments.value.length);

    return {
        // State
        learnedRules,
        manualAssignments,
        ruleStatistics,

        // Core functions
        initializeLearning,
        learnFromAssignment,
        applyLearnedRules,
        analyzeAndCreateRules,

        // Statistics and management
        updateRuleStatistics,
        clearLearnedData,
        exportLearnedRules,
        importLearnedRules,

        // Computed properties
        rulesByTag,
        totalRules,
        totalAssignments
    };
}
