import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    InputAdornment,
    Paper,
    CircularProgress,
    Alert,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { apiFetch } from '../src/utils/api';
import Swal from 'sweetalert2';

const categories = ['Staff', 'Officer', 'DTL', 'Sub', 'Cont', 'NAPS', 'TOA', 'APP', 'FOT'];

const columnHeaderMap: Record<string, string> = {
    ezone: "Employee Zone",
    empCode: "Employee Code",
    empName: "Employee Name",
    department: "Department",
    eType: "Employee Type",
    totalMeal: "Total Meal Qty",
    freeMeal: "Free Meal Qty",
    paidMeal: "Paid Meal Qty",
    tea: "Tea Qty",
    fs: "FS Qty",
    nb: "NB Qty",
    mealAmount: "Meal Amt (Rs)",
    tea_Rs: "Tea Amt (Rs)",
    fS_RS: "FS Amt (Rs)",
    nB_RS: "NB Amt (Rs)",
    totalQty: "Total Qty",
    totalAmount: "Total Amt (Rs)"
};

interface ReportRow {
    ezone: string;
    empCode: string;
    empName: string;
    department: string;
    eType: string;
    totalMeal: number;
    freeMeal: number;
    paidMeal: number;
    tea: number;
    fs: number;
    nb: number;
    mealAmount: number;
    tea_Rs: number;
    fS_RS: number;
    nB_RS: number;
    [key: string]: any;
}

const MonthlyReport: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [reportRows, setReportRows] = useState<ReportRow[]>([]);
    const [reportColumns, setReportColumns] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // SweetAlert2 Toast configuration
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const handleCategoryToggle = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const handleSelectAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories([...categories]);
        }
    };

    const fetchMonthlyReport = async (params: { fromDate: string; upToDate: string; category: string }) => {
        try {
            setApiError('');
            const queryString = new URLSearchParams({
                fromdate: params.fromDate,
                uptodate: params.upToDate,
                category: params.category,
            }).toString();

            const url = `Monthly-Meal/get-monthly-report?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') result = JSON.parse(result);

            const table = result?.dataFetch?.table || [];
            const columns = table.length > 0 ? Object.keys(table[0]) : [];

            return { rows: table, columns };
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load report';
            setApiError(msg);
            console.error(err);
            return { rows: [], columns: [] };
        }
    };

    const handleShow = async () => {
        if (!fromDate || !upToDate) {
            Toast.fire({
                icon: 'warning',
                title: 'Please select both From Date and Up To Date.'
            });
            return;
        }
        if (selectedCategories.length === 0) {
            Toast.fire({
                icon: 'warning',
                title: 'Please select at least one category.'
            });
            return;
        }

        setLoading(true);
        setShowReport(true);
        setApiError('');

        const params = {
            fromDate,
            upToDate,
            category: selectedCategories.join(','),
        };

        console.log('Fetching Monthly Report with params:', params);
        const { rows, columns } = await fetchMonthlyReport(params);

        setReportRows(rows);
        setReportColumns(columns);
        setLoading(false);
    };

    // Real-time search filter
    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();

        // Search in base columns
        const inBaseColumns = reportColumns.some((col) =>
            String(row[col] ?? '').toLowerCase().includes(term)
        );

        // Also search in calculated columns
        const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
        const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);
        const inCalculated = String(tQty).includes(term) || String(tAmt).includes(term);

        return inBaseColumns || inCalculated;
    });

    // Helper functions for vertical totals
    const getVerticalTotal = (colKey: string): number | string => {
        if (['ezone', 'empCode', 'empName', 'department', 'eType'].includes(colKey)) {
            if (colKey === 'ezone') return 'Total';
            return '';
        }

        return filteredRows.reduce((sum, row) => {
            let val = 0;
            if (colKey === 'totalQty') {
                val = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
            } else if (colKey === 'totalAmount') {
                val = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);
            } else {
                val = Number(row[colKey]) || 0;
            }
            return sum + val;
        }, 0);
    };

    const getFormattedVerticalTotal = (colKey: string): string => {
        const total = getVerticalTotal(colKey);
        if (typeof total === 'string') return total;
        if (['mealAmount', 'tea_Rs', 'fS_RS', 'nB_RS', 'totalAmount'].includes(colKey)) {
            return total.toFixed(2);
        }
        return String(total);
    };

    // Export utilities
    const getExportData = () => {
        const displayColumns = [...reportColumns, 'totalQty', 'totalAmount'];

        // Headers
        const headers = displayColumns.map(col => columnHeaderMap[col] || col);

        // Data Rows
        const dataRows = filteredRows.map(row => {
            const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
            const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);

            return displayColumns.map(col => {
                if (col === 'totalQty') return tQty;
                if (col === 'totalAmount') return tAmt;
                return row[col] !== null && row[col] !== undefined ? row[col] : '';
            });
        });

        // Total Row
        const totalRow = displayColumns.map(col => getFormattedVerticalTotal(col));

        return [headers, ...dataRows, totalRow];
    };

    const exportToCSV = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const csvContent = exportData.map(row =>
            row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `MonthlyMealReport_${fromDate || 'from'}_to_${upToDate || 'to'}.csv`);
    };

    const exportToExcel = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Meal Summary');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `MonthlyMealReport_${fromDate || 'from'}_to_${upToDate || 'to'}.xlsx`);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight={600} gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
                Monthly Meal Report
            </Typography>

            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                    {/* Row 1: Date Range Selection */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },

                            }}
                        />
                        <TextField
                            fullWidth
                            label="Up To Date"
                            type="date"
                            value={upToDate}
                            onChange={(e) => setUpToDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },

                            }}
                        />
                    </Stack>

                    {/* Row 2: Category List Box with Checkboxes */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: '#455a64' }}>
                        Categories Filter
                    </Typography>
                    <Box sx={{
                        border: '1px solid #cfd8dc',
                        borderRadius: 2,
                        p: 2.5,
                        maxHeight: '180px',
                        overflowY: 'auto',
                        bgcolor: '#fafafa',
                        mb: 3
                    }}>
                        <Box sx={{ mb: 1, borderBottom: '1px solid #eceff1', pb: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedCategories.length === categories.length}
                                        indeterminate={selectedCategories.length > 0 && selectedCategories.length < categories.length}
                                        onChange={handleSelectAllCategories}
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2" fontWeight="bold">Select All Categories</Typography>}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {categories.map((cat) => (
                                <Box key={cat} sx={{ minWidth: { xs: '100px', sm: '130px' } }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedCategories.includes(cat)}
                                                onChange={() => handleCategoryToggle(cat)}
                                                color="primary"
                                                size="small"
                                            />
                                        }
                                        label={<Typography variant="body2" sx={{ color: '#37474f' }}>{cat}</Typography>}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Row 3: Action Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleShow}
                            disabled={loading}
                            sx={{
                                px: 4,
                                py: 1.2,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Show Report'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {showReport && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '5px solid #1976d2' }}>
                            <Stack direction="row" spacing={4} flexWrap="wrap">
                                <div>
                                    <Typography variant="caption" color="text.secondary">From</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>{fromDate || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">To</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>{upToDate || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">Selected Categories</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>
                                        {selectedCategories.length === categories.length ? 'All' : selectedCategories.join(', ') || 'None'}
                                    </Typography>
                                </div>
                            </Stack>
                        </Box>

                        {apiError && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {apiError}
                            </Alert>
                        )}

                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search anywhere in report..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ maxWidth: { md: 350 } }}
                            />

                            <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToCSV}
                                    disabled={filteredRows.length === 0}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                                >
                                    Export CSV
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToExcel}
                                    disabled={filteredRows.length === 0}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(76, 175, 80, 0.2)' }}
                                >
                                    Export Excel
                                </Button>
                            </Stack>
                        </Stack>

                        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => (
                                            <TableCell
                                                key={col}
                                                align="center"
                                                sx={{
                                                    bgcolor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    py: 1.5,
                                                    fontSize: 14,
                                                    borderRight: '1px solid #1565c0',
                                                    minWidth: col === 'ezone' || col === 'department' ? 180 : 100
                                                }}
                                            >
                                                {columnHeaderMap[col] || col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length + 2 || 12}
                                                align="center"
                                                sx={{ py: 8 }}
                                            >
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length + 2 || 12}
                                                align="center"
                                                sx={{ py: 6, color: 'text.secondary' }}
                                            >
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {/* Data Rows */}
                                            {filteredRows.map((row, index) => {
                                                const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
                                                const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);

                                                return (
                                                    <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                        {reportColumns.map((col) => (
                                                            <TableCell
                                                                key={col}
                                                                align="center"
                                                                sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}
                                                            >
                                                                {row[col] !== null && row[col] !== undefined
                                                                    ? String(row[col])
                                                                    : '—'}
                                                            </TableCell>
                                                        ))}
                                                        {/* Horizontal computed Total Qty */}
                                                        <TableCell
                                                            align="center"
                                                            sx={{ fontSize: 13, py: 1, fontWeight: 'bold', bgcolor: '#f5f5f5', borderRight: '1px solid #e0e0e0' }}
                                                        >
                                                            {tQty}
                                                        </TableCell>
                                                        {/* Horizontal computed Total Amt */}
                                                        <TableCell
                                                            align="center"
                                                            sx={{ fontSize: 13, py: 1, fontWeight: 'bold', bgcolor: '#efebe9', color: '#5d4037' }}
                                                        >
                                                            {tAmt.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Vertical Total Row (Footer) */}
                                            <TableRow sx={{ bgcolor: '#eceff1', '& td': { fontWeight: 'bold', fontSize: 13, py: 1.5 } }}>
                                                {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => (
                                                    <TableCell
                                                        key={`total-${col}`}
                                                        align="center"
                                                        sx={{
                                                            borderTop: '2px solid #b0bec5',
                                                            borderRight: '1px solid #cfd8dc',
                                                            bgcolor: col === 'totalAmount' ? '#d7ccc8' : col === 'totalQty' ? '#cfd8dc' : 'inherit',
                                                            color: col === 'totalAmount' ? '#4e342e' : 'inherit'
                                                        }}
                                                    >
                                                        {getFormattedVerticalTotal(col)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default MonthlyReport;
