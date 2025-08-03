import { ref } from 'vue';

export function useCSVParser() {
    const parseError = ref(null);

    /**
     * Parse CSV content using vanilla JavaScript
     * Handles quoted fields, semicolons/commas within quotes, and newlines
     */
    function parseCSV(csvText) {
        try {
            parseError.value = null;

            // Normalize line endings and trim whitespace
            const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

            if (!normalizedText) {
                throw new Error('Empty CSV content');
            }

            const lines = normalizedText.split('\n');
            if (lines.length < 2) {
                throw new Error('CSV must have at least a header row and one data row');
            }

            // Detect delimiter (semicolon or comma)
            const firstLine = lines[0];
            const semicolonCount = (firstLine.match(/;/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;
            const delimiter = semicolonCount >= commaCount ? ';' : ',';

            console.log(`Detected delimiter: "${delimiter}" (semicolons: ${semicolonCount}, commas: ${commaCount})`);

            // Parse headers
            const headers = parseCSVRow(lines[0], delimiter);
            if (headers.length === 0) {
                throw new Error('No valid headers found in CSV');
            }

            // Parse data rows
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    // Skip empty lines
                    const row = parseCSVRow(line, delimiter);
                    if (row.length > 0) {
                        const rowData = {};
                        headers.forEach((header, index) => {
                            rowData[header] = row[index] || '';
                        });
                        data.push(rowData);
                    }
                }
            }

            console.log(`Parsed ${data.length} rows with ${headers.length} columns`);
            return data;
        } catch (error) {
            parseError.value = error.message;
            console.error('CSV parsing error:', error);
            throw error;
        }
    }

    /**
     * Parse a single CSV row, handling quoted fields
     */
    function parseCSVRow(row, delimiter = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < row.length) {
            const char = row[i];

            if (char === '"') {
                if (inQuotes) {
                    // Check for escaped quote
                    if (i + 1 < row.length && row[i + 1] === '"') {
                        current += '"';
                        i += 2; // Skip both quotes
                        continue;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    inQuotes = true;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(cleanField(current));
                current = '';
            } else {
                current += char;
            }

            i++;
        }

        // Add the last field
        result.push(cleanField(current));

        return result;
    }

    /**
     * Clean and sanitize a field value
     */
    function cleanField(field) {
        return field
            .trim()
            .replace(/^["']|["']$/g, '') // Remove outer quotes
            .replace(/""/g, '"') // Unescape double quotes
            .replace(/\s+/g, ' '); // Normalize whitespace
    }

    /**
     * Generate a unique, consistent ID for a transaction
     * Uses Date + Amount + Description to create a hash
     */
    function generateTransactionId(transaction) {
        const date = transaction.Date || transaction.date || '';
        const amount = transaction.Amount || transaction.amount || '';
        const description = transaction.Description || transaction.description || transaction.Memo || transaction.memo || '';

        // Create a consistent string for hashing
        const hashString = `${date}-${amount}-${description}`;

        // Generate a simple hash (base64 encoding of the string)
        const hash = btoa(hashString)
            .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
            .slice(0, 12); // Limit to 12 characters

        return hash || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate CSV structure and provide helpful error messages
     */
    function validateCSVStructure(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { isValid: false, error: 'No data found in CSV' };
        }

        const firstRow = data[0];
        const requiredFields = ['Date', 'Amount', 'Description'];
        const missingFields = requiredFields.filter((field) => !Object.keys(firstRow).some((key) => key.toLowerCase() === field.toLowerCase()));

        if (missingFields.length > 0) {
            return {
                isValid: false,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                availableFields: Object.keys(firstRow)
            };
        }

        return { isValid: true };
    }

    /**
     * Detect common CSV formats and suggest field mappings
     */
    function detectCSVFormat(headers) {
        const headerMap = {
            date: ['date', 'transaction_date', 'posted_date', 'value_date'],
            amount: ['amount', 'transaction_amount', 'debit', 'credit'],
            description: ['description', 'memo', 'details', 'transaction_description', 'payee'],
            category: ['category', 'transaction_category', 'type'],
            account: ['account', 'account_number', 'account_name'],
            balance: ['balance', 'running_balance', 'account_balance']
        };

        const mapping = {};

        headers.forEach((header) => {
            const lowerHeader = header.toLowerCase();

            for (const [field, variations] of Object.entries(headerMap)) {
                if (variations.some((v) => lowerHeader.includes(v))) {
                    mapping[field] = header;
                    break;
                }
            }
        });

        return mapping;
    }

    return {
        parseCSV,
        generateTransactionId,
        validateCSVStructure,
        detectCSVFormat,
        parseError
    };
}
