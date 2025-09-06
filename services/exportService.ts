/**
 * Escapes a value for CSV format. If the value contains a comma, double quote, or newline,
 * it will be enclosed in double quotes, and existing double quotes will be doubled.
 * @param value The value to escape.
 * @returns The escaped string.
 */
const escapeCsvValue = (value: any): string => {
    const stringValue = String(value ?? ''); // Handle null/undefined
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

/**
 * Converts an array of objects into a CSV string and triggers a browser download.
 * @param filename The desired name for the downloaded file (e.g., "users.csv").
 * @param data An array of objects to be converted to CSV.
 */
export const exportToCsv = (filename: string, data: any[]) => {
    if (!data || data.length === 0) {
        // The calling function should handle user feedback for no data.
        console.warn("No data provided to export.");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(fieldName => escapeCsvValue(row[fieldName])).join(',')
        )
    ];

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) { // Check for download attribute support
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
