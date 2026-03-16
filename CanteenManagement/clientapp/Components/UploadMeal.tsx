import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Autocomplete,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Divider,
} from '@mui/material';
import { DataGrid} from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';  
import { apiFetch } from '../src/utils/api';
import type { GridColDef } from '@mui/x-data-grid';




const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

interface EmployeeRow {
    id: number;
    empcode: string;
    empName?: string;
    department?: string;
    etype?: string;
    nos: number;
    ezone?: string;
    column1?: number;
}

interface SummaryRow {
    id: number;
    ezone: string;
    column1: number;
}

const UploadMeal = () => {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [year, setYear] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sheetNo, setSheetNo] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [mainTableData, setMainTableData] = useState<EmployeeRow[]>([]);
    const [summaryTableData, setSummaryTableData] = useState<SummaryRow[]>([]);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel =
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel' ||
            file.name.toLowerCase().endsWith('.xlsx') ||
            file.name.toLowerCase().endsWith('.xls');

        if (!isExcel) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File!',
                text: 'Only Excel files (.xlsx or .xls) are allowed!',
            });
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    const parseExcelFile = (file: File, sheetIndex: number): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result as string;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    };

    const handlePreviewUpload = async () => {
        if (!selectedFile || !selectedMonth || !year || !sheetNo || isNaN(Number(sheetNo))) {
            Swal.fire({ icon: 'warning', title: 'Please fill all fields' });
            return;
        }

        setLoading(true);

        try {
            const sheetIndex = Number(sheetNo) - 1;
            const rawData = await parseExcelFile(selectedFile, sheetIndex);

            const headers = (rawData[0] || []) as string[];
            const dataRows = rawData.slice(1);

            const employees = dataRows
                .filter((row: any) => Array.isArray(row) && row.some((cell) => cell))
                .map((row: any, index: number) => {
                    const getValue = (keys: string[]) => {
                        const idx = headers.findIndex((h) => h && keys.some((k) => h.toLowerCase().includes(k.toLowerCase())));
                        return idx >= 0 ? String(row[idx] ?? '').trim() : '';
                    };
                    return {
                        id: index + 1,
                        empcode: getValue(['empcode', 'emp code']),
                        nos: Number(getValue(['nos', 'No. of. Meal'])) || 0,
                        empName: getValue(['name', 'empname']),
                        department: getValue(['department', 'dept']),
                    };
                })
                .filter((emp) => emp.empcode);

            const payload = {
                mm: months.indexOf(selectedMonth) + 1,
                yy: Number(year),
                listofEmployee: employees.map((e) => ({ empcode: e.empcode, nos: e.nos })),
            };
            console.log('Payload for API:', payload);

            let result = await apiFetch('UploadMeal/UploadMealData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (typeof result === 'string') result = JSON.parse(result);
            console.log('API Response:', result);

            const table = result?.dataFetch?.table || [];
            const table1 = result?.dataFetch?.table1 || [];

            setMainTableData(
                table.map((item: any, idx: number) => ({
                    id: idx + 1,
                    empcode: item.empcode || '',
                    empName: item.empName || '',
                    department: item.department || '',
                    etype: item.etype || '',
                    ezone: item.ezone || '',
                    nos: Number(item.nos) || 0,
                    column1: item.column1 || 0,
                }))
            );

            setSummaryTableData(
                table1.map((item: any, idx: number) => ({
                    id: idx + 1,
                    ezone: item.ezone || '',
                    column1: Number(item.column1) || 0,
                }))
            );

            setIsPreviewMode(true);
            Swal.fire({ icon: 'success', title: 'Preview Loaded' });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error occurred' });
        } finally {
            setLoading(false);
        }
    };


    // Excel export
    const exportToExcel = (data: any[], columns: GridColDef[], filename: string) => {
        const header = columns.map(col => col.headerName || col.field);
        const rows = data.map(row =>
            columns.map(col => row[col.field as keyof typeof row] ?? '')
        );

        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    // CSV export
    const exportToCSV = (data: any[], columns: GridColDef[], filename: string) => {
        const header = columns.map(col => `"${col.headerName || col.field}"`).join(',');
        const csvRows = data.map(row =>
            columns.map(col => `"${(row[col.field as keyof typeof row] ?? '').toString().replace(/"/g, '""')}"`).join(',')
        );

        const csvContent = [header, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };



    const handleProcessRowUpdate = (newRow: EmployeeRow) => {
        // nos update state में apply करो
        setMainTableData((prev) =>
            prev.map((row) => (row.id === newRow.id ? { ...row, nos: newRow.nos } : row))
        );

        // updated row return करना जरूरी है
        return newRow;
    };

    const handleFinalSubmit = async () => {
        if (mainTableData.length === 0) return;

        setLoading(true);

        try {
            const payload = {
                mm: months.indexOf(selectedMonth!) + 1,
                yy: Number(year),
                listofEmployee: mainTableData.map((row) => ({
                    empcode: row.empcode,
                    nos: row.nos,
                })),
            };

            const res = await fetch('/api/Upload/SubmitFreeMeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Submit failed');

            Swal.fire({ icon: 'success', title: 'Submitted Successfully' });

            // reset form
            setIsPreviewMode(false);
            setMainTableData([]);
            setSummaryTableData([]);
            setSelectedFile(null);
            setSheetNo('');
            setYear('');
            setSelectedMonth(null);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Submission Failed' });
        } finally {
            setLoading(false);
        }
    };

    const mainColumns: GridColDef[] = [
        { field: 'empcode', headerName: 'Emp Code', width: 130, editable: false },
        { field: 'empName', headerName: 'Name', width: 180, editable: false },
        { field: 'department', headerName: 'Department', width: 160, editable: false },
        {
            field: 'nos',
            headerName: 'Nos (Meals)',
            width: 120,
            type: 'number',
            editable: true,
            renderCell: (params) => (
                <div style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                    {params.value}
                </div>
            ),
        },
        { field: 'ezone', headerName: 'Zone', width: 160, editable: false },
        { field: 'column1', headerName: 'Column1', width: 110, editable: false },
    ];

    const summaryColumns: GridColDef[] = [
        { field: 'ezone', headerName: 'Zone', width: 250 },
        { field: 'column1', headerName: 'Total', width: 150, type: 'number' },
    ];

    return (
        <Card sx={{ maxWidth: 1200, mx: 'auto', mt: 5, boxShadow: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Upload Meal Data
                </Typography>

                {!isPreviewMode ? (
                    <>
                        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                            <Autocomplete
                                options={months}
                                value={selectedMonth}
                                onChange={(_, val) => setSelectedMonth(val)}
                                fullWidth
                                renderInput={(params) => <TextField {...params} label="Month" />}
                            />
                            <TextField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} fullWidth />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, mb: 5, alignItems: 'flex-start' }}>
                            {/* Excel File Upload */}
                            <Box sx={{ flex: 1 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    sx={{
                                        height: '56px',
                                        justifyContent: 'flex-start',
                                        textAlign: 'left',
                                        borderStyle: 'dashed',
                                        borderWidth: 2,
                                    }}
                                >
                                    📤 Upload Excel File (only .xlsx / .xls)
                                    <input
                                        type="file"
                                        hidden
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                                {selectedFile && (
                                    <Typography
                                        variant="body2"
                                        sx={{ mt: 1.5, color: 'success.main', fontWeight: 500 }}
                                    >
                                        ✅ Selected: {selectedFile.name}
                                    </Typography>
                                )}
                            </Box>
                            {/* Sheet Number */}
                            <TextField
                                label="Sheet No"
                                type="number"
                                value={sheetNo}
                                onChange={(e) => setSheetNo(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{ flex: 1 }}
                                placeholder="e.g. 1"
                            />
                        </Box>

                        <Button variant="contained" fullWidth size="large" disabled={loading} onClick={handlePreviewUpload}>
                            {loading ? <CircularProgress size={24} /> : 'Upload Meal Data'}
                        </Button>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" gutterBottom>Preview & Edit Nos</Typography>

                        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Main Table</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => exportToExcel(mainTableData, mainColumns, 'Meal_Main_Data')}
                                >
                                    Export Excel
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => exportToCSV(mainTableData, mainColumns, 'Meal_Main_Data')}
                                >
                                    Export CSV
                                </Button>
                            </Box>
                        <Box sx={{ height: 400, width: '100%', mb: 4 }}>
                            <DataGrid
                                rows={mainTableData}
                                columns={mainColumns}
                                pageSizeOptions={[10, 25]}
                                editMode="cell"
                                processRowUpdate={handleProcessRowUpdate}
                                disableRowSelectionOnClick
                                    slotProps={{
                                        toolbar: {
                                            showQuickFilter: true,         
                                            quickFilterProps: { debounceMs: 300 },
                                        },
                                    }}
                            />
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="h6" sx={{ mb: 1 }}>Summary</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => exportToExcel(summaryTableData, summaryColumns, 'Meal_Summary')}
                                >
                                    Export Excel
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => exportToCSV(summaryTableData, summaryColumns, 'Meal_Summary')}
                                >
                                    Export CSV
                                </Button>
                            </Box>
                        <Box sx={{ height: 300, width: '100%', mb: 4 }}>
                            <DataGrid
                                rows={summaryTableData}
                                columns={summaryColumns}
                                pageSizeOptions={[5, 10]}
                                    slotProps={{
                                        toolbar: {
                                            showQuickFilter: true,
                                            quickFilterProps: { debounceMs: 300 },
                                        },
                                    }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                            <Button variant="outlined" onClick={() => setIsPreviewMode(false)} disabled={loading}>
                                Back
                            </Button>
                            <Button variant="contained" color="success" onClick={handleFinalSubmit} disabled={loading}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Final Submit'}
                            </Button>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default UploadMeal;