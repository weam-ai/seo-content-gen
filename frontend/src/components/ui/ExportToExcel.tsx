import React, { useImperativeHandle, forwardRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportToExcelColumn {
  header: string;
  accessor: string;
}

export interface ExportToExcelHandle {
  exportNow: () => void;
}

interface ExportToExcelProps {
  columns: ExportToExcelColumn[];
  data: Record<string, any>[];
  filename?: string;
  children: React.ReactNode;
}

export const ExportToExcel = forwardRef<ExportToExcelHandle, ExportToExcelProps>(
  ({ columns, data, filename = 'export.xlsx', children }, ref) => {
    const handleExport = useCallback(() => {
      const worksheetData = [
        columns.map((col) => col.header),
        ...data.map((row) => columns.map((col) => row[col.accessor])),
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, filename);
    }, [columns, data, filename]);

    useImperativeHandle(ref, () => ({
      exportNow: handleExport,
    }));

    return <span style={{ cursor: 'pointer' }}>{children}</span>;
  }
);
