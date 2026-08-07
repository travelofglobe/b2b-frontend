/**
 * Helper module to safely download client-side generated files (PDF, XLSX, CSV)
 * using Data URIs. This avoids browser warnings/blocks related to insecure blob:http:// URLs
 * when running over HTTP.
 */

export const downloadPdfDoc = (doc, filename) => {
    try {
        const dataUri = doc.output('datauristring');
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 300);
    } catch (e) {
        console.warn('Data URI PDF download fallback to doc.save:', e);
        doc.save(filename);
    }
};

export const downloadXlsxWorkbook = (XLSX, workbook, filename) => {
    try {
        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 300);
    } catch (e) {
        console.warn('Data URI XLSX download fallback to XLSX.writeFile:', e);
        XLSX.writeFile(workbook, filename);
    }
};

export const downloadCsvContent = (csvString, filename) => {
    try {
        const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvString);
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 300);
    } catch (e) {
        console.warn('Data URI CSV download fallback to Blob:', e);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
