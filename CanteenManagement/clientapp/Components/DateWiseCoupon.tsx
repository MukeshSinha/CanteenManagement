import React, { useState, useEffect } from 'react';
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
    TablePagination,
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { apiFetch } from '../src/utils/api';
import DataNotFound from './Common/DataNotFound';

interface DateWiseCouponRow {
    logdt?: string;
    logDate?: string;
    date?: string;
    tea?: number;
    snacks?: number;
    snk?: number;
    'bS/NS'?: number;
    bs?: number;
    bS?: number;
    total?: number;
    [key: string]: any;
}

const DateWiseCoupon: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [reportRows, setReportRows] = useState<DateWiseCouponRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);

    const isShowEnabled = Boolean(fromDate && upToDate);

    // Clear report data when dates change
    useEffect(() => {
        setShowReport(false);
        setReportRows([]);
        setApiError('');
    }, [fromDate, upToDate]);

    const formatDate = (dateStr?: string): string => {
        if (!dateStr) return '—';
        if (dateStr.includes('T')) {
            const parts = dateStr.split('T');
            const dateParts = parts[0].split('-');
            if (dateParts.length === 3) {
                const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                const timeParts = parts[1].split(':');
                if (timeParts.length >= 2 && parts[1] !== '00:00:00') {
                    return `${formattedDate} ${timeParts[0]}:${timeParts[1]}`;
                }
                return formattedDate;
            }
        }
        return dateStr;
    };

    const handleShowReport = async () => {
        if (!fromDate || !upToDate) return;

        setLoading(true);
        setShowReport(true);
        setApiError('');
        setPage(0);

        try {
            const queryString = new URLSearchParams({
                fromdate: fromDate,
                uptodate: upToDate,
            }).toString();

            const url = `Canteen-Punch/DateWise-Coupon?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') {
                result = JSON.parse(result);
            }

            const tableData: DateWiseCouponRow[] = result?.dataFetch?.table || result?.table || [];
            setReportRows(tableData);
            if (result?.message && !result?.status && tableData.length === 0) {
                setApiError(result.message);
            }
        } catch (err: any) {
            console.error('Error fetching DateWise-Coupon report:', err);
            setApiError(err?.message || 'Failed to fetch Date Wise Coupon report.');
            setReportRows([]);
        } finally {
            setLoading(false);
        }
    };

    const getRowValue = (row: DateWiseCouponRow, keys: string[]): any => {
        for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null) return row[k];
        }
        const lowerKeys = keys.map(k => k.toLowerCase());
        for (const key of Object.keys(row)) {
            if (lowerKeys.includes(key.toLowerCase())) {
                return row[key];
            }
        }
        return 0;
    };

    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const dateStr = formatDate(getRowValue(row, ['logdt', 'logDate', 'date']));
        const teaVal = String(getRowValue(row, ['tea']));
        const snacksVal = String(getRowValue(row, ['snacks', 'snk']));
        const bsVal = String(getRowValue(row, ['bS/NS', 'bs', 'bS']));

        return (
            dateStr.toLowerCase().includes(term) ||
            teaVal.includes(term) ||
            snacksVal.includes(term) ||
            bsVal.includes(term)
        );
    });

    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Compute totals
    const grandTea = filteredRows.reduce((sum, r) => sum + (Number(getRowValue(r, ['tea'])) || 0), 0);
    const grandSnacks = filteredRows.reduce((sum, r) => sum + (Number(getRowValue(r, ['snacks', 'snk'])) || 0), 0);
    const grandBS = filteredRows.reduce((sum, r) => sum + (Number(getRowValue(r, ['bS/NS', 'bs', 'bS'])) || 0), 0);
    const grandTotal = grandTea + grandSnacks + grandBS;

    const getExportData = () => {
        const headers = ["Sr.No", "Log Date", "Tea", "Snacks", "Beverage & Snacks (BS/NS)", "Total"];
        const data = filteredRows.map((row, idx) => {
            const dateStr = formatDate(getRowValue(row, ['logdt', 'logDate', 'date']));
            const tea = Number(getRowValue(row, ['tea'])) || 0;
            const snacks = Number(getRowValue(row, ['snacks', 'snk'])) || 0;
            const bs = Number(getRowValue(row, ['bS/NS', 'bs', 'bS'])) || 0;
            const total = tea + snacks + bs;
            return [idx + 1, dateStr, tea, snacks, bs, total];
        });

        // Summary Row
        data.push(["Total", "—", grandTea, grandSnacks, grandBS, grandTotal]);

        return [headers, ...data];
    };

    const exportToCSV = () => {
        if (reportRows.length === 0) return;
        const exportData = getExportData();
        const csvContent = exportData
            .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `DateWise_Coupon_${fromDate}_to_${upToDate}.csv`);
    };

    const exportToExcel = () => {
        if (reportRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DateWise Coupon');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `DateWise_Coupon_${fromDate}_to_${upToDate}.xlsx`);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Header Banner */}
            <Box
                sx={{
                    background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    p: 2.5,
                    borderRadius: 3,
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(30, 60, 114, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h5"
                    fontWeight={600}
                    sx={{
                        letterSpacing: '-0.5px',
                        m: 0,
                        textAlign: 'center',
                    }}
                >
                    Date Wise Coupon Report
                </Typography>
            </Box>

            {/* Filter Card */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={2.5}>
                        {/* Row 1: Date Fields */}
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={2.5}
                        >
                            <TextField
                                fullWidth
                                size="small"
                                label="From Date"
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                slotProps={{
                                    inputLabel: { shrink: true },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />

                            <TextField
                                fullWidth
                                size="small"
                                label="Up To Date"
                                type="date"
                                value={upToDate}
                                onChange={(e) => setUpToDate(e.target.value)}
                                slotProps={{
                                    inputLabel: { shrink: true },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Stack>

                        {/* Row 2: Show Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={handleShowReport}
                                disabled={!isShowEnabled || loading}
                                sx={{
                                    px: 4,
                                    height: 40,
                                    minWidth: 120,
                                    borderRadius: 1.5,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    background: isShowEnabled
                                        ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                                        : undefined,
                                    boxShadow: isShowEnabled ? '0 4px 12px rgba(30, 60, 114, 0.25)' : 'none',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #152e5b 0%, #1e3c72 100%)',
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : 'Show'}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* Results Section */}
            {showReport && (
                <>
                    {loading ? (
                        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center', my: 3 }}>
                            <CircularProgress size={32} sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Fetching Date Wise Coupon data...
                            </Typography>
                        </Card>
                    ) : filteredRows.length === 0 ? (
                        <DataNotFound />
                    ) : (
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                {/* Info Banner */}
                                <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                                    <Stack direction="row" spacing={3} flexWrap="wrap">
                                        <div>
                                            <Typography variant="caption" color="text.secondary">From Date</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{fromDate || '—'}</Typography>
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary">Up To Date</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{upToDate || '—'}</Typography>
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary">Total Records</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{filteredRows.length}</Typography>
                                        </div>
                                    </Stack>
                                </Box>

                                {apiError && (
                                    <Alert severity="warning" sx={{ mb: 2.5 }}>
                                        {apiError}
                                    </Alert>
                                )}

                                {/* Search Bar & Export Buttons */}
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing={2}
                                    sx={{ mb: 2 }}
                                >
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Search date or coupon count..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setPage(0);
                                        }}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon fontSize="small" color="action" />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        sx={{ maxWidth: { md: 320 } }}
                                    />

                                    <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            startIcon={<DownloadIcon fontSize="small" />}
                                            onClick={exportToCSV}
                                            disabled={reportRows.length === 0}
                                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 'bold', fontSize: '0.78rem' }}
                                        >
                                            Export CSV
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            startIcon={<DownloadIcon fontSize="small" />}
                                            onClick={exportToExcel}
                                            disabled={reportRows.length === 0}
                                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 'bold', fontSize: '0.78rem', boxShadow: '0 3px 8px rgba(76, 175, 80, 0.2)' }}
                                        >
                                            Export Excel
                                        </Button>
                                    </Stack>
                                </Stack>

                                {/* Data Table */}
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 1.5 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1,
                                                        px: 1,
                                                        fontSize: '0.75rem',
                                                        borderRight: '1px solid #1565c0',
                                                        width: 50,
                                                    }}
                                                >
                                                    #
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1,
                                                        px: 1,
                                                        fontSize: '0.75rem',
                                                        borderRight: '1px solid #1565c0',
                                                    }}
                                                >
                                                    Log Date
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1,
                                                        px: 1,
                                                        fontSize: '0.75rem',
                                                        borderRight: '1px solid #1565c0',
                                                    }}
                                                >
                                                    Tea
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1,
                                                        px: 1,
                                                        fontSize: '0.75rem',
                                                        borderRight: '1px solid #1565c0',
                                                    }}
                                                >
                                                    Snacks
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1,
                                                        px: 1,
                                                        fontSize: '0.75rem',
                                                        borderRight: '1px solid #1565c0',
                                                    }}
                                                >
                                                    BS/NS
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1,
                                                        px: 1,
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    Total
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pagedRows.map((row, index) => {
                                                const globalIndex = page * rowsPerPage + index + 1;
                                                const dateStr = formatDate(getRowValue(row, ['logdt', 'logDate', 'date']));
                                                const tea = Number(getRowValue(row, ['tea'])) || 0;
                                                const snacks = Number(getRowValue(row, ['snacks', 'snk'])) || 0;
                                                const bs = Number(getRowValue(row, ['bS/NS', 'bs', 'bS'])) || 0;
                                                const rowTotal = tea + snacks + bs;

                                                return (
                                                    <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.8, px: 1, borderRight: '1px solid #f0f0f0', color: 'text.secondary' }}>
                                                            {globalIndex}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.8, px: 1, borderRight: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                                                            {dateStr}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.8, px: 1, borderRight: '1px solid #f0f0f0' }}>
                                                            {tea}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.8, px: 1, borderRight: '1px solid #f0f0f0' }}>
                                                            {snacks}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.8, px: 1, borderRight: '1px solid #f0f0f0' }}>
                                                            {bs}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.8, px: 1, fontWeight: 'bold', color: '#1976d2' }}>
                                                            {rowTotal}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Summary Row */}
                                            <TableRow sx={{ bgcolor: '#eceff1', '& td': { fontWeight: 'bold', fontSize: '0.75rem', py: 1, px: 1 } }}>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                    ∑
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                    Grand Total
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc', color: '#0d47a1' }}>
                                                    {grandTea}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc', color: '#0d47a1' }}>
                                                    {grandSnacks}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc', color: '#0d47a1' }}>
                                                    {grandBS}
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', color: '#1565c0' }}>
                                                    {grandTotal}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Pagination */}
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                    component="div"
                                    count={filteredRows.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    sx={{ borderTop: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </Box>
    );
};

export default DateWiseCoupon;
