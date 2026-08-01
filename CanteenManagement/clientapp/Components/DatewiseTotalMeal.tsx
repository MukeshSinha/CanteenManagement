import { useState } from 'react';
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
    type TablePaginationProps
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { apiFetch } from '../src/utils/api';

interface MealRow {
    date?: string;
    logdt?: string;
    entryDt?: string;
    empcode?: string;
    empCode?: string;
    lunch?: number;
    dinner?: number;
    tea?: number;
    snk?: number;
    bs?: number;
    total?: number;
    [key: string]: any;
}

function DatewiseTotalMeal() {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [reportRows, setReportRows] = useState<MealRow[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchMealReport = async () => {
        if (!fromDate || !upToDate) {
            alert('Please select both From Date and Up To Date.');
            return;
        }

        setLoading(true);
        setShowReport(true);
        setApiError('');
        setPage(0);

        try {
            const queryString = new URLSearchParams({
                fromdate: fromDate,
                uptodate: upToDate,
            }).toString();

            const url = `Canteen-Punch/dateWise-totalMeal?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') {
                result = JSON.parse(result);
            }

            const table = result?.dataFetch?.table || [];
            setReportRows(table);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load report';
            setApiError(msg);
            console.error(err);
            setReportRows([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
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

    // Dynamic column check
    const hasEmpCode = reportRows.some(r => r.empcode !== undefined || r.empCode !== undefined);
    const hasDateCol = reportRows.some(r => r.date !== undefined);
    const hasLogDt = reportRows.some(r => r.logdt !== undefined);
    const hasEntryDt = reportRows.some(r => r.entryDt !== undefined);
    const hasLunch = reportRows.some(r => r.lunch !== undefined);
    const hasDinner = reportRows.some(r => r.dinner !== undefined);
    const hasTea = reportRows.some(r => r.tea !== undefined);
    const hasSnk = reportRows.some(r => r.snk !== undefined);
    const hasBs = reportRows.some(r => r.bs !== undefined);

    const showDate = hasDateCol || hasLogDt || hasEntryDt || reportRows.length === 0;
    const showLunch = hasLunch || reportRows.length === 0;
    const showDinner = hasDinner || reportRows.length === 0;

    const columns: string[] = ["Sr.No"];
    if (hasEmpCode) columns.push("Employee Code");
    if (showDate) columns.push("Date");
    if (showLunch) columns.push("Lunch");
    if (showDinner) columns.push("Dinner");
    if (hasTea) columns.push("Tea");
    if (hasSnk) columns.push("Snacks");
    if (hasBs) columns.push("Beverage & Snacks");
    columns.push("Total");

    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            String(row.date ?? '').toLowerCase().includes(term) ||
            String(row.logdt ?? '').toLowerCase().includes(term) ||
            String(row.entryDt ?? '').toLowerCase().includes(term) ||
            String(row.empcode ?? '').toLowerCase().includes(term) ||
            String(row.empCode ?? '').toLowerCase().includes(term) ||
            String(row.lunch ?? '').toLowerCase().includes(term) ||
            String(row.dinner ?? '').toLowerCase().includes(term) ||
            String(row.tea ?? '').toLowerCase().includes(term) ||
            String(row.snk ?? '').toLowerCase().includes(term) ||
            String(row.bs ?? '').toLowerCase().includes(term) ||
            String(row.total ?? '').toLowerCase().includes(term)
        );
    });

    const getActiveHeadersAndData = () => {
        const headers = ["Sr.No"];
        if (hasEmpCode) headers.push("Employee Code");
        if (showDate) headers.push("Date");
        if (showLunch) headers.push("Lunch");
        if (showDinner) headers.push("Dinner");
        if (hasTea) headers.push("Tea");
        if (hasSnk) headers.push("Snacks");
        if (hasBs) headers.push("Beverage & Snacks");
        headers.push("Total");

        const data = filteredRows.map((row, idx) => {
            const rData: any[] = [idx + 1];
            if (hasEmpCode) rData.push(row.empcode || row.empCode || '');
            if (showDate) rData.push(formatDate(row.date || row.logdt || row.entryDt));
            if (showLunch) rData.push(row.lunch !== undefined ? row.lunch : 0);
            if (showDinner) rData.push(row.dinner !== undefined ? row.dinner : 0);
            if (hasTea) rData.push(row.tea !== undefined ? row.tea : 0);
            if (hasSnk) rData.push(row.snk !== undefined ? row.snk : 0);
            if (hasBs) rData.push(row.bs !== undefined ? row.bs : 0);
            
            const totalVal = row.total !== undefined ? row.total : 
                ((row.lunch || 0) + (row.dinner || 0) + (row.tea || 0) + (row.snk || 0) + (row.bs || 0));
            rData.push(totalVal);
            
            return rData;
        });

        return { headers, data };
    };

    const exportToExcel = () => {
        if (filteredRows.length === 0) return;
        const { headers, data } = getActiveHeadersAndData();
        const aoa = [headers, ...data];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Datewise Total Meal');
        XLSX.writeFile(wb, `Datewise_Total_Meal_${fromDate}_to_${upToDate}.xlsx`);
    };

    const exportToCSV = () => {
        if (filteredRows.length === 0) return;
        const { headers, data } = getActiveHeadersAndData();
        const csvContent = [
            headers.join(","),
            ...data.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `Datewise_Total_Meal_${fromDate}_to_${upToDate}.csv`);
    };

    const handleChangePage: TablePaginationProps['onPageChange'] = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Page Header */}
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
                    fontWeight={600} 
                    sx={{ 
                        letterSpacing: '-0.5px',
                        m: 0,
                        textAlign: 'center'
                    }}
                >
                    DateWise Total Meal
                </Typography>
            </Box>

            {/* Filter Card */}
            <Card sx={{ mb: 4, borderRadius: 2 }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarIcon />
                                        </InputAdornment>
                                    ),
                                },
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
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarIcon />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Stack>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={fetchMealReport}
                        disabled={loading}
                        sx={{
                            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                            fontWeight: 600,
                            px: 4,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #152e5b 0%, #1e3c72 100%)',
                            }
                        }}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </CardContent>
            </Card>

            {showReport && (
                <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                        {/* Info Header */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                            <Stack direction="row" spacing={4} flexWrap="wrap">
                                <div>
                                    <Typography variant="caption" color="text.secondary">From Date</Typography>
                                    <Typography fontWeight={600}>{fromDate || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">Up To Date</Typography>
                                    <Typography fontWeight={600}>{upToDate || '—'}</Typography>
                                </div>
                            </Stack>
                        </Box>

                        {apiError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {apiError}
                            </Alert>
                        )}

                        {/* Search and Exports */}
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            spacing={2}
                            sx={{ mb: 3 }}
                        >
                            <TextField
                                size="small"
                                placeholder="Search table..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ maxWidth: { xs: '100%', md: 350 } }}
                            />
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToExcel}
                                    disabled={filteredRows.length === 0}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Export Excel
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToCSV}
                                    disabled={filteredRows.length === 0}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Export CSV
                                </Button>
                            </Stack>
                        </Stack>

                        {/* Table */}
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, overflow: 'auto' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col}
                                                align="center"
                                                sx={{
                                                    bgcolor: '#1976d2',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: 13,
                                                }}
                                            >
                                                {col}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRows
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row, index) => {
                                                const globalIdx = page * rowsPerPage + index;
                                                const totalVal = row.total !== undefined ? row.total : 
                                                    ((row.lunch || 0) + (row.dinner || 0) + (row.tea || 0) + (row.snk || 0) + (row.bs || 0));
                                                return (
                                                    <TableRow 
                                                        key={globalIdx} 
                                                        hover
                                                        sx={{
                                                            bgcolor: globalIdx % 2 === 0 ? '#fff' : '#f5f8ff',
                                                            '&:hover': { bgcolor: '#e3f2fd' },
                                                        }}
                                                    >
                                                        <TableCell align="center" sx={{ fontSize: 13 }}>{globalIdx + 1}</TableCell>
                                                        {hasEmpCode && (
                                                            <TableCell align="center" sx={{ fontSize: 13 }}>{row.empcode || row.empCode || '—'}</TableCell>
                                                        )}
                                                        {showDate && (
                                                            <TableCell align="center" sx={{ fontSize: 13, fontWeight: 500 }}>
                                                                {formatDate(row.date || row.logdt || row.entryDt)}
                                                            </TableCell>
                                                        )}
                                                        {showLunch && (
                                                            <TableCell align="center" sx={{ fontSize: 13 }}>{row.lunch !== undefined ? row.lunch : 0}</TableCell>
                                                        )}
                                                        {showDinner && (
                                                            <TableCell align="center" sx={{ fontSize: 13 }}>{row.dinner !== undefined ? row.dinner : 0}</TableCell>
                                                        )}
                                                        {hasTea && (
                                                            <TableCell align="center" sx={{ fontSize: 13 }}>{row.tea !== undefined ? row.tea : 0}</TableCell>
                                                        )}
                                                        {hasSnk && (
                                                            <TableCell align="center" sx={{ fontSize: 13 }}>{row.snk !== undefined ? row.snk : 0}</TableCell>
                                                        )}
                                                        {hasBs && (
                                                            <TableCell align="center" sx={{ fontSize: 13 }}>{row.bs !== undefined ? row.bs : 0}</TableCell>
                                                        )}
                                                        <TableCell align="center" sx={{ fontSize: 13, fontWeight: 'bold', color: '#1976d2' }}>
                                                            {totalVal}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination */}
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredRows.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default DatewiseTotalMeal;
