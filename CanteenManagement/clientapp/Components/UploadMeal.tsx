import { useState } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
} from '@mui/material';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { apiFetch } from '../src/utils/api'; // adjust path if needed

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
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [searchTextSummary, setSearchTextSummary] = useState('');
    const [summaryPage, setSummaryPage] = useState(0);
    const [summaryRowsPerPage, setSummaryRowsPerPage] = useState(10);
    const [hasDataLoaded, setHasDataLoaded] = useState(false);

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

    const filteredData = mainTableData.filter((row) =>
        Object.values(row)
            .join(' ')
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleNosChange = (id: number, value: number) => {
        setMainTableData((prev) =>
            prev.map((row) => (row.id === id ? { ...row, nos: value } : row))
        );
    };

    // Filtered summary
    const filteredSummaryData = summaryTableData.filter((row) =>
        row.ezone.toLowerCase().includes(searchTextSummary.toLowerCase())
    );

    // Handlers
    const handleChangeSummaryPage = (_: unknown, newPage: number) => {
        setSummaryPage(newPage);
    };

    const handleChangeSummaryRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSummaryRowsPerPage(parseInt(event.target.value, 10));
        setSummaryPage(0);
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
        setHasDataLoaded(false);
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

            let result = await apiFetch('UploadMeal/UploadMealData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (typeof result === 'string') result = JSON.parse(result);

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
                    column1: Number(item.column1) || 0,
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
            setHasDataLoaded(true);
            Swal.fire({ icon: 'success', title: 'Preview Loaded' });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error occurred' });
            setHasDataLoaded(false);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = (data: any[], filename: string) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const header = Object.keys(data[0]);
        const rows = data.map((row) =>
            header.map((field) => `"${String(row[field] ?? '')}"`).join(',')
        );
        const csv = [header.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
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

            // Reset
            setIsPreviewMode(false);
            setHasDataLoaded(false);
            setMainTableData([]);
            setSummaryTableData([]);
            setSelectedFile(null);
            setSheetNo('');
            setYear('');
            setSelectedMonth(null);
            setSearchText('');
            setSearchTextSummary('');
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Submission Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box 
                sx={{
                    background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    p: 3,
                    borderRadius: 3,
                    mb: 4,
                    boxShadow: '0 4px 20px rgba(30, 60, 114, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography 
                    variant="h4" 
                    fontWeight={400} 
                    sx={{ 
                        letterSpacing: '-0.5px',
                        m: 0,
                        textAlign: 'center'
                    }}
                >
                    Upload Meal Data
                </Typography>
            </Box>

            <Card sx={{ maxWidth: 1400, mx: 'auto', boxShadow: 4, borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>

                {/* Form - hamesha dikhega (upload screen aur preview dono mein) */}
                <Box sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                        <Autocomplete
                            options={months}
                            value={selectedMonth}
                            onChange={(_, val) => setSelectedMonth(val)}
                            fullWidth
                            renderInput={(params) => <TextField {...params} label="Month" />}
                        />
                        <TextField
                            label="Year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            fullWidth
                        />
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

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        onClick={handlePreviewUpload}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Upload Meal Data'}
                    </Button>
                </Box>

                {/* Preview section - sirf jab isPreviewMode true ho */}
                {isPreviewMode && (
                    <>
                        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                            Preview & Edit Nos
                        </Typography>

                        {hasDataLoaded ? (
                            <>
                                {/* Main Table Section */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 3,
                                    }}
                                >
                                    <TextField
                                        key="employee-search"
                                        size="small"
                                        label="Search employees..."
                                        value={searchText}
                                        onChange={(e) => {
                                            setSearchText(e.target.value);
                                            setPage(0);
                                        }}
                                        sx={{ width: 300 }}
                                    />

                                    <Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => exportToExcel(filteredData, 'Meal_Main_Data')}
                                            sx={{ mr: 1 }}
                                        >
                                            Export Excel
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => exportToCSV(filteredData, 'Meal_Main_Data')}
                                        >
                                            Export CSV
                                        </Button>
                                    </Box>
                                </Box>

                                <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 500 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Emp Code</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Department</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Nos (Meals)</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Zone</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Column1</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                        No Data Found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredData
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((row) => (
                                                        <TableRow key={row.id} hover>
                                                            <TableCell>{row.empcode}</TableCell>
                                                            <TableCell>{row.empName || '-'}</TableCell>
                                                            <TableCell>{row.department || '-'}</TableCell>
                                                            <TableCell>
                                                                <TextField
                                                                    size="small"
                                                                    value={row.nos}
                                                                    onChange={(e) => handleNosChange(row.id, Number(e.target.value))}
                                                                    sx={{ width: 90 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{row.ezone || '-'}</TableCell>
                                                            <TableCell>{row.column1 ?? 0}</TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                    component="div"
                                    count={filteredData.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />

                                <Divider sx={{ my: 5 }} />

                                {/* Summary Section */}
                                <Typography variant="h6" gutterBottom>
                                    Summary by Zone
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 3,
                                    }}
                                >
                                    <TextField
                                        key="summary-search"
                                        size="small"
                                        label="Search zone..."
                                        value={searchTextSummary}
                                        onChange={(e) => {
                                            setSearchTextSummary(e.target.value);
                                            setSummaryPage(0);
                                        }}
                                        sx={{ width: 300 }}
                                    />

                                    <Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => exportToExcel(filteredSummaryData, 'Meal_Summary')}
                                            sx={{ mr: 1 }}
                                        >
                                            Export Excel
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => exportToCSV(filteredSummaryData, 'Meal_Summary')}
                                        >
                                            Export CSV
                                        </Button>
                                    </Box>
                                </Box>

                                <TableContainer component={Paper} sx={{ mb: 3 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Zone</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }} align="right">
                                                    Total Meals
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredSummaryData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                                                        No matching zones
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredSummaryData
                                                    .slice(
                                                        summaryPage * summaryRowsPerPage,
                                                        summaryPage * summaryRowsPerPage + summaryRowsPerPage
                                                    )
                                                    .map((row) => (
                                                        <TableRow key={row.id} hover>
                                                            <TableCell>{row.ezone}</TableCell>
                                                            <TableCell align="right">{row.column1.toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 20]}
                                    component="div"
                                    count={filteredSummaryData.length}
                                    rowsPerPage={summaryRowsPerPage}
                                    page={summaryPage}
                                    onPageChange={handleChangeSummaryPage}
                                    onRowsPerPageChange={handleChangeSummaryRowsPerPage}
                                />

                                {/* Final Submit button */}
                                <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 5 }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleFinalSubmit}
                                        disabled={loading}
                                        sx={{ minWidth: 200 }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Final Submit'}
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <CircularProgress size={60} />
                                <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
                                    Loading preview data from server...
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                    Please wait a moment
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
        </Box>
    );
};

export default UploadMeal;