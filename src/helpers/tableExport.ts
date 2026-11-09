import { APP_NAME } from '../config/app';
import dayjs from 'dayjs';
import { ReactNode } from 'react';
import { showAppError, showAppSuccess } from './appNotify';

export type TableExportFormat = 'excel' | 'csv' | 'pdf';

export type TableExportColumn<T> = {
	id: string;
	header: ReactNode;
	getValue?: (row: T) => string | number | boolean | null | undefined;
	exportable?: boolean;
};

function headerLabel(header: ReactNode, fallback: string): string {
	if (typeof header === 'string' || typeof header === 'number') {
		return String(header);
	}
	return fallback.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function cellText(value: string | number | boolean | null | undefined): string {
	if (value === null || value === undefined || value === '') return '';
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return String(value);
}

function csvEscape(value: string): string {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function displayLabel(label: string): string {
	return (
		label
			.trim()
			.replace(/[-_]+/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase()) || 'Table'
	);
}

function fileBase(label: string): string {
	const slug =
		label
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') || 'table';
	return `lms-${slug}-${dayjs().format('YYYY-MM-DD')}`;
}

export function exportableColumns<T>(columns: TableExportColumn<T>[]): TableExportColumn<T>[] {
	return columns.filter((column) => {
		if (column.exportable === false) return false;
		if (column.exportable === true) return Boolean(column.getValue);
		return Boolean(column.getValue) && column.id !== 'actions';
	});
}

export async function exportTableRows<T>(
	format: TableExportFormat,
	label: string,
	columns: TableExportColumn<T>[],
	rows: T[],
): Promise<void> {
	const cols = exportableColumns(columns);
	if (!cols.length) {
		showAppError('Export', 'This table has no columns that can be exported.');
		return;
	}

	const headers = cols.map((column) => headerLabel(column.header, column.id));
	const body = rows.map((row) => cols.map((column) => cellText(column.getValue?.(row))));
	const base = fileBase(label);
	const formatLabel = format === 'excel' ? 'Excel' : format.toUpperCase();

	try {
		if (format === 'csv') {
			const lines = [headers, ...body].map((line) => line.map(csvEscape).join(','));
			downloadBlob(
				new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' }),
				`${base}.csv`,
			);
		} else if (format === 'excel') {
			const XLSX = await import('xlsx');
			const sheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, sheet, 'Data');
			XLSX.writeFile(workbook, `${base}.xlsx`);
		} else {
			const { jsPDF } = await import('jspdf');
			const autoTable = (await import('jspdf-autotable')).default;
			const doc = new jsPDF({
				orientation: headers.length > 6 ? 'landscape' : 'portrait',
				unit: 'pt',
				format: 'a4',
			});
			doc.setFontSize(12);
			doc.text(`${APP_NAME} — ${displayLabel(label)}`, 40, 36);
			doc.setFontSize(9);
			doc.setTextColor(100);
			doc.text(dayjs().format('YYYY-MM-DD HH:mm'), 40, 52);
			autoTable(doc, {
				startY: 64,
				head: [headers],
				body,
				styles: { fontSize: 8, cellPadding: 4 },
				headStyles: { fillColor: [13, 59, 102] },
				margin: { left: 40, right: 40 },
			});
			doc.save(`${base}.pdf`);
		}
		showAppSuccess('Exported', `${formatLabel} download started.`);
	} catch (error) {
		showAppError(
			'Export failed',
			error instanceof Error ? error.message : `Could not export ${formatLabel}.`,
		);
	}
}
