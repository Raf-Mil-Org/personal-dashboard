<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useTransactionEngine } from '../composables/useTransactionEngine';

export default {
    name: 'TagMappingManager',
    setup() {
        const { getTagMapping, addMapping, removeMapping, getUserRules, addUserRule, deleteUserRule, getDefaultSystemRules } = useTransactionEngine();

        // State
        const activeTab = ref('mappings');
        const mappings = ref({});
        const userRules = ref([]);
        const systemRules = ref([]);

        // Form data
        const newMapping = reactive({
            category: '',
            subcategory: '',
            tag: ''
        });

        const newRule = reactive({
            type: '',
            tier: 3,
            description: '',
            confidence: 0.8,
            category: '',
            subcategory: '',
            keywords: '',
            exclusions: '',
            minAmount: null,
            mustBeNegative: false,
            resultTag: '',
            resultCategory: '',
            resultSubcategory: ''
        });

        // Computed
        const isRuleFormValid = computed(() => {
            if (!newRule.type || !newRule.description) return false;

            switch (newRule.type) {
                case 'category_mapping':
                    return newRule.category && newRule.subcategory && newRule.resultTag;
                case 'keyword_mapping':
                    return newRule.keywords && newRule.resultTag;
                case 'category_keyword_mapping':
                    return newRule.category && newRule.keywords && newRule.resultTag;
                case 'category_assignment':
                    return newRule.keywords && newRule.resultCategory && newRule.resultSubcategory;
                default:
                    return false;
            }
        });

        // Methods
        const loadMappings = () => {
            mappings.value = getTagMapping();
        };

        const addMappingHandler = () => {
            if (newMapping.category && newMapping.subcategory && newMapping.tag) {
                addMapping(newMapping.category, newMapping.subcategory, newMapping.tag);
                loadMappings();
                // Reset form
                newMapping.category = '';
                newMapping.subcategory = '';
                newMapping.tag = '';
            }
        };

        const removeMappingHandler = (category, subcategory) => {
            removeMapping(category, subcategory);
            loadMappings();
        };

        const loadRules = () => {
            userRules.value = getUserRules();
            systemRules.value = getDefaultSystemRules();
        };

        const createRule = () => {
            if (!isRuleFormValid.value) return;

            const rule = {
                type: newRule.type,
                tier: newRule.tier,
                description: newRule.description,
                confidence: newRule.confidence,
                category: newRule.category || null,
                subcategory: newRule.subcategory || null,
                keywords: newRule.keywords ? newRule.keywords.split(',').map((k) => k.trim()) : null,
                exclusions: newRule.exclusions
                    ? {
                          keywords: newRule.exclusions.split(',').map((k) => k.trim()),
                          amount_conditions: {
                              min_amount: newRule.minAmount || null,
                              must_be_negative: newRule.mustBeNegative
                          }
                      }
                    : null,
                tag: newRule.resultTag || null,
                category_result: newRule.resultCategory || null,
                subcategory_result: newRule.resultSubcategory || null,
                source: 'user_defined'
            };

            if (addUserRule(rule)) {
                loadRules();
                resetRuleForm();
            }
        };

        const editRule = (rule) => {
            // Populate form with rule data
            newRule.type = rule.type;
            newRule.tier = rule.tier;
            newRule.description = rule.description;
            newRule.confidence = rule.confidence;
            newRule.category = rule.category || '';
            newRule.subcategory = rule.subcategory || '';
            newRule.keywords = rule.keywords ? rule.keywords.join(', ') : '';
            newRule.exclusions = rule.exclusions?.keywords ? rule.exclusions.keywords.join(', ') : '';
            newRule.minAmount = rule.exclusions?.amount_conditions?.min_amount || null;
            newRule.mustBeNegative = rule.exclusions?.amount_conditions?.must_be_negative || false;
            newRule.resultTag = rule.tag || '';
            newRule.resultCategory = rule.category_result || '';
            newRule.resultSubcategory = rule.subcategory_result || '';
        };

        const deleteRule = (ruleId) => {
            if (confirm('Are you sure you want to delete this rule?')) {
                if (deleteUserRule(ruleId)) {
                    loadRules();
                }
            }
        };

        const resetRuleForm = () => {
            Object.assign(newRule, {
                type: '',
                tier: 3,
                description: '',
                confidence: 0.8,
                category: '',
                subcategory: '',
                keywords: '',
                exclusions: '',
                minAmount: null,
                mustBeNegative: false,
                resultTag: '',
                resultCategory: '',
                resultSubcategory: ''
            });
        };

        const getRuleTypeLabel = (type) => {
            const labels = {
                category_mapping: 'Category Mapping',
                keyword_mapping: 'Keyword Mapping',
                category_keyword_mapping: 'Category + Keyword',
                category_assignment: 'Category Assignment'
            };
            return labels[type] || type;
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        // Lifecycle
        onMounted(() => {
            loadMappings();
            loadRules();
        });

        return {
            activeTab,
            mappings,
            userRules,
            systemRules,
            newMapping,
            newRule,
            isRuleFormValid,
            addMapping: addMappingHandler,
            removeMapping: removeMappingHandler,
            createRule,
            editRule,
            deleteRule,
            resetRuleForm,
            getRuleTypeLabel,
            formatDate
        };
    }
};
</script>

<template>
    <div class="tag-mapping-manager">
        <h2>Tag & Rule Management</h2>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
            <button @click="activeTab = 'mappings'" :class="{ active: activeTab === 'mappings' }" class="tab-button">Category Mappings</button>
            <button @click="activeTab = 'rules'" :class="{ active: activeTab === 'rules' }" class="tab-button">Classification Rules</button>
        </div>

        <!-- Category Mappings Tab -->
        <div v-if="activeTab === 'mappings'" class="tab-content">
            <div class="mapping-section">
                <h3>Category to Tag Mappings</h3>
                <p class="description">Define which tags should be assigned based on category and subcategory combinations.</p>

                <div class="mapping-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="category">Category:</label>
                            <input id="category" v-model="newMapping.category" type="text" placeholder="e.g., Other" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label for="subcategory">Subcategory:</label>
                            <input id="subcategory" v-model="newMapping.subcategory" type="text" placeholder="e.g., Charity" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label for="tag">Tag:</label>
                            <select id="tag" v-model="newMapping.tag" class="form-select">
                                <option value="">Select a tag</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Health & Wellness">Health & Wellness</option>
                                <option value="Restaurants/Food">Restaurants/Food</option>
                                <option value="Bars">Bars</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Transport & Travel">Transport & Travel</option>
                                <option value="Free Time">Free Time</option>
                                <option value="Medical">Medical</option>
                                <option value="Fixed Expenses">Fixed Expenses</option>
                                <option value="Gift">Gift</option>
                                <option value="Savings">Savings</option>
                                <option value="Transfers">Transfers</option>
                                <option value="Investments">Investments</option>
                                <option value="Income">Income</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <button @click="addMapping" class="btn btn-primary">Add Mapping</button>
                    </div>
                </div>

                <div class="mappings-list">
                    <h4>Current Mappings</h4>
                    <div v-if="Object.keys(mappings).length === 0" class="empty-state">
                        <p>No category mappings defined yet.</p>
                    </div>
                    <div v-else class="mapping-items">
                        <div v-for="(subcategories, category) in mappings" :key="category" class="mapping-category">
                            <h5>{{ category }}</h5>
                            <div class="subcategory-mappings">
                                <div v-for="(tag, subcategory) in subcategories" :key="`${category}-${subcategory}`" class="mapping-item">
                                    <span class="subcategory">{{ subcategory }}</span>
                                    <span class="arrow">→</span>
                                    <span class="tag">{{ tag }}</span>
                                    <button @click="removeMapping(category, subcategory)" class="btn btn-danger btn-sm">Remove</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Classification Rules Tab -->
        <div v-if="activeTab === 'rules'" class="tab-content">
            <div class="rules-section">
                <h3>Classification Rules</h3>
                <p class="description">Manage custom classification rules that determine how transactions are tagged and categorized.</p>

                <!-- Rule Creation Form -->
                <div class="rule-form">
                    <h4>Create New Rule</h4>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="ruleType">Rule Type:</label>
                            <select id="ruleType" v-model="newRule.type" class="form-select">
                                <option value="">Select rule type</option>
                                <option value="category_mapping">Category Mapping</option>
                                <option value="keyword_mapping">Keyword Mapping</option>
                                <option value="category_keyword_mapping">Category + Keyword Mapping</option>
                                <option value="category_assignment">Category Assignment</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="ruleTier">Priority Tier:</label>
                            <select id="ruleTier" v-model="newRule.tier" class="form-select">
                                <option value="1">Tier 1 - Highest Priority</option>
                                <option value="2">Tier 2 - High Priority</option>
                                <option value="3">Tier 3 - Medium Priority</option>
                                <option value="4">Tier 4 - Low Priority</option>
                                <option value="5">Tier 5 - Lowest Priority</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="ruleDescription">Description:</label>
                            <input id="ruleDescription" v-model="newRule.description" type="text" placeholder="Brief description of what this rule does" class="form-input" />
                        </div>

                        <div class="form-group">
                            <label for="ruleConfidence">Confidence:</label>
                            <input id="ruleConfidence" v-model.number="newRule.confidence" type="number" min="0" max="1" step="0.1" class="form-input" />
                        </div>
                    </div>

                    <!-- Conditional Fields Based on Rule Type -->
                    <div class="conditional-fields">
                        <!-- Category/Subcategory Conditions -->
                        <div v-if="newRule.type === 'category_mapping' || newRule.type === 'category_keyword_mapping'" class="form-row">
                            <div class="form-group">
                                <label for="ruleCategory">Category:</label>
                                <input id="ruleCategory" v-model="newRule.category" type="text" placeholder="e.g., Other" class="form-input" />
                            </div>
                            <div class="form-group">
                                <label for="ruleSubcategory">Subcategory:</label>
                                <input id="ruleSubcategory" v-model="newRule.subcategory" type="text" placeholder="e.g., Charity" class="form-input" />
                            </div>
                        </div>

                        <!-- Keywords -->
                        <div v-if="newRule.type === 'keyword_mapping' || newRule.type === 'category_keyword_mapping' || newRule.type === 'category_assignment'" class="form-group">
                            <label for="ruleKeywords">Keywords (comma-separated):</label>
                            <input id="ruleKeywords" v-model="newRule.keywords" type="text" placeholder="e.g., bunq, savings, emergency fund" class="form-input" />
                        </div>

                        <!-- Exclusions -->
                        <div v-if="newRule.type === 'category_keyword_mapping'" class="form-group">
                            <label for="ruleExclusions">Exclusion Keywords (comma-separated):</label>
                            <input id="ruleExclusions" v-model="newRule.exclusions" type="text" placeholder="e.g., fee, commission, withdrawal" class="form-input" />
                        </div>

                        <!-- Amount Conditions -->
                        <div v-if="newRule.type === 'category_keyword_mapping'" class="form-row">
                            <div class="form-group">
                                <label for="minAmount">Minimum Amount (€):</label>
                                <input id="minAmount" v-model.number="newRule.minAmount" type="number" min="0" class="form-input" />
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" v-model="newRule.mustBeNegative" class="checkbox" />
                                    Must be negative amount
                                </label>
                            </div>
                        </div>

                        <!-- Result Fields -->
                        <div class="form-row">
                            <div v-if="newRule.type === 'category_assignment'" class="form-group">
                                <label for="resultCategory">Result Category:</label>
                                <input id="resultCategory" v-model="newRule.resultCategory" type="text" placeholder="e.g., Groceries & Household" class="form-input" />
                            </div>
                            <div v-if="newRule.type === 'category_assignment'" class="form-group">
                                <label for="resultSubcategory">Result Subcategory:</label>
                                <input id="resultSubcategory" v-model="newRule.resultSubcategory" type="text" placeholder="e.g., Supermarket" class="form-input" />
                            </div>
                            <div v-if="newRule.type !== 'category_assignment'" class="form-group">
                                <label for="resultTag">Result Tag:</label>
                                <select id="resultTag" v-model="newRule.resultTag" class="form-select">
                                    <option value="">Select a tag</option>
                                    <option value="Groceries">Groceries</option>
                                    <option value="Health & Wellness">Health & Wellness</option>
                                    <option value="Restaurants/Food">Restaurants/Food</option>
                                    <option value="Bars">Bars</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Transport & Travel">Transport & Travel</option>
                                    <option value="Free Time">Free Time</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Fixed Expenses">Fixed Expenses</option>
                                    <option value="Gift">Gift</option>
                                    <option value="Savings">Savings</option>
                                    <option value="Transfers">Transfers</option>
                                    <option value="Investments">Investments</option>
                                    <option value="Income">Income</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button @click="createRule" class="btn btn-primary">Create Rule</button>
                        <button @click="resetRuleForm" class="btn btn-secondary">Reset</button>
                    </div>
                </div>

                <!-- Rules List -->
                <div class="rules-list">
                    <h4>User-Defined Rules</h4>
                    <div v-if="userRules.length === 0" class="empty-state">
                        <p>No custom rules defined yet.</p>
                    </div>
                    <div v-else class="rule-items">
                        <div v-for="rule in userRules" :key="rule.id" class="rule-item">
                            <div class="rule-header">
                                <div class="rule-info">
                                    <span class="rule-type">{{ getRuleTypeLabel(rule.type) }}</span>
                                    <span class="rule-tier">Tier {{ rule.tier }}</span>
                                    <span class="rule-confidence">{{ (rule.confidence * 100).toFixed(0) }}%</span>
                                </div>
                                <div class="rule-actions">
                                    <button @click="editRule(rule)" class="btn btn-sm btn-secondary">Edit</button>
                                    <button @click="deleteRule(rule.id)" class="btn btn-sm btn-danger">Delete</button>
                                </div>
                            </div>
                            <div class="rule-description">{{ rule.description }}</div>
                            <div class="rule-details">
                                <div class="rule-conditions">
                                    <strong>Conditions:</strong>
                                    <span v-if="rule.category">Category: {{ rule.category }}</span>
                                    <span v-if="rule.subcategory">Subcategory: {{ rule.subcategory }}</span>
                                    <span v-if="rule.keywords">Keywords: {{ rule.keywords.join(', ') }}</span>
                                    <span v-if="rule.exclusions">Exclusions: {{ rule.exclusions.keywords?.join(', ') }}</span>
                                </div>
                                <div class="rule-result">
                                    <strong>Result:</strong>
                                    <span v-if="rule.tag">Tag: {{ rule.tag }}</span>
                                    <span v-if="rule.category_result">Category: {{ rule.category_result }}</span>
                                    <span v-if="rule.subcategory_result">Subcategory: {{ rule.subcategory_result }}</span>
                                </div>
                            </div>
                            <div class="rule-stats">
                                <span>Used {{ rule.usage_count || 0 }} times</span>
                                <span v-if="rule.last_used">Last used: {{ formatDate(rule.last_used) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Rules Preview -->
                <div class="system-rules">
                    <h4>System Rules (Read-only)</h4>
                    <p class="description">These are the default rules that come with the system.</p>
                    <div class="rule-items">
                        <div v-for="rule in systemRules" :key="rule.id" class="rule-item system-rule">
                            <div class="rule-header">
                                <div class="rule-info">
                                    <span class="rule-type">{{ getRuleTypeLabel(rule.type) }}</span>
                                    <span class="rule-tier">Tier {{ rule.tier }}</span>
                                    <span class="rule-confidence">{{ (rule.confidence * 100).toFixed(0) }}%</span>
                                    <span class="rule-source">System</span>
                                </div>
                            </div>
                            <div class="rule-description">{{ rule.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tag-mapping-manager {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.tab-navigation {
    display: flex;
    border-bottom: 2px solid #e0e0e0;
    margin-bottom: 20px;
}

.tab-button {
    padding: 12px 24px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
}

.tab-button.active {
    border-bottom-color: #007bff;
    color: #007bff;
    font-weight: 600;
}

.tab-button:hover {
    background-color: #f8f9fa;
}

.tab-content {
    min-height: 400px;
}

.description {
    color: #666;
    margin-bottom: 20px;
    font-style: italic;
}

/* Form Styles */
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.form-row {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.form-group {
    flex: 1;
    min-width: 200px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.form-input,
.form-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.checkbox {
    margin: 0;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

/* Button Styles */
.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #545b62;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}

.btn-danger:hover {
    background-color: #c82333;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

/* Mapping Styles */
.mapping-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mapping-items {
    margin-top: 20px;
}

.mapping-category {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
}

.mapping-category h5 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 16px;
}

.subcategory-mappings {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mapping-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.subcategory {
    font-weight: 500;
    color: #495057;
}

.arrow {
    color: #6c757d;
    font-weight: bold;
}

.tag {
    background-color: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

/* Rule Styles */
.rules-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rule-form {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin-bottom: 30px;
}

.rule-form h4 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
}

.conditional-fields {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #dee2e6;
}

.rule-items {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.rule-item {
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    background-color: white;
}

.rule-item.system-rule {
    background-color: #f8f9fa;
    border-color: #dee2e6;
}

.rule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.rule-info {
    display: flex;
    gap: 10px;
    align-items: center;
}

.rule-type {
    background-color: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.rule-tier {
    background-color: #6c757d;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.rule-confidence {
    background-color: #28a745;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.rule-source {
    background-color: #ffc107;
    color: #212529;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.rule-actions {
    display: flex;
    gap: 5px;
}

.rule-description {
    font-weight: 500;
    color: #333;
    margin-bottom: 10px;
}

.rule-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 14px;
}

.rule-conditions,
.rule-result {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.rule-conditions span,
.rule-result span {
    background-color: #e9ecef;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
}

.rule-stats {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: #6c757d;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #6c757d;
    font-style: italic;
}

.system-rules {
    margin-top: 40px;
    padding-top: 30px;
    border-top: 2px solid #e0e0e0;
}
</style>
