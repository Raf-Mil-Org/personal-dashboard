export function useUtils() {
    function formatToDDMMYYYY(date) {
        if (!/^\d{8}$/.test(date)) {
            throw new Error("Invalid date format. Expected 'YYYYMMDD'.");
        }
        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);
        return `${day}/${month}/${year}`;
    }

    function formatToYYYYMMDD(date) {
        const parts = date.split('/');
        if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
            throw new Error("Invalid date format. Expected 'dd/mm/yyyy'.");
        }
        const [day, month, year] = parts;
        return `${year}${month}${day}`;
    }

    return {
        formatToDDMMYYYY,
        formatToYYYYMMDD
    };
}
