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
    Autocomplete,
    Chip,
    TablePagination,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { apiFetch } from '../src/utils/api';
import Swal from 'sweetalert2';

interface RawPunchRow {
    empCode: string;
    empName: string;
    empType: string;
    dept: string;
    att_Date: string;
    punchTime: string;
    sft: string;
}

const columnHeaderMap: Record<string, string> = {
    empCode: "Employee Code",
    empName: "Employee Name",
    empType: "Employee Type",
    dept: "Department",
    att_Date: "Date",
    punchTime: "Punch Time",
    sft: "Shift"
};

const EmployeeContractorCategory: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    
    // Category options & state
    const categoriesList = ['Staff', 'Officer', 'Worker', 'DTL', 'Sub', 'Cont', 'NAPS', 'TOA', 'APP', 'FOT'];
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Contractor options & state
    const [contractors, setContractors] = useState<string[]>([]);
    const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
    const [contractorLoading, setContractorLoading] = useState<boolean>(false);

    // Report states
    const [reportRows, setReportRows] = useState<RawPunchRow[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Pagination states
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(100);

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

    // Fetch contractors on component mount
    useEffect(() => {
        const loadContractors = async () => {
            setContractorLoading(true);
            try {
                const response = await apiFetch('ShitWise/Contractor-Report');
                let parsedResult = typeof response === 'string' ? JSON.parse(response) : response;
                const fetchedList = parsedResult?.dataFetch?.table
                    ?.map((item: any) => String(item.compName ?? '').trim())
                    ?.filter((name: string) => name) ?? [];

                setContractors(fetchedList);
            } catch (err) {
                console.error("Failed to load contractor master list:", err);
            } finally {
                setContractorLoading(false);
            }
        };

        loadContractors();
    }, []);

    const handleShowReport = async () => {
        if (!fromDate || !upToDate) {
            Toast.fire({
                icon: 'warning',
                title: 'Please select both From Date and Up To Date.'
            });
            return;
        }

        setLoading(true);
        setShowReport(true);
        setApiError('');
        setReportRows([]);
        setPage(0);

        try {
            const params: Record<string, string> = {
                fromdate: fromDate,
                uptodate: upToDate,
            };

            if (selectedCategory) {
                params.category = selectedCategory;
            }

            if (selectedContractor) {
                params.contractor = selectedContractor;
            }

            const queryString = new URLSearchParams(params).toString();
            const url = `Employee-RawPunch/employee-punch-category-contractor?${queryString}`;
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
        } finally {
            setLoading(false);
        }
    };

    // Filter table rows in real-time
    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();

        return (
            String(row.empCode ?? '').toLowerCase().includes(term) ||
            String(row.empName ?? '').toLowerCase().includes(term) ||
            String(row.empType ?? '').toLowerCase().includes(term) ||
            String(row.dept ?? '').toLowerCase().includes(term) ||
            String(row.att_Date ?? '').toLowerCase().includes(term) ||
            String(row.punchTime ?? '').toLowerCase().includes(term) ||
            String(row.sft ?? '').toLowerCase().includes(term)
        );
    });

    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Formatting helpers
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '—';
        return timeStr.split('.')[0];
    };

    // CSV & Excel exports
    const getExportData = () => {
        const headers = ["Employee Code", "Employee Name", "Employee Type", "Department", "Date", "Punch Time", "Shift"];
        const dataRows = filteredRows.map(row => [
            row.empCode,
            row.empName,
            row.empType,
            row.dept,
            formatDate(row.att_Date),
            formatTime(row.punchTime),
            row.sft || ''
        ]);

        return [headers, ...dataRows];
    };

    const exportToCSV = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const csvContent = exportData.map(row =>
            row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `EmployeeContractorCategory_${fromDate}_to_${upToDate}.csv`);
    };

    const exportToExcel = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Raw Punches');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `EmployeeContractorCategory_${fromDate}_to_${upToDate}.xlsx`);
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
                    Employee Raw Punch By Contractor Wise or Category Wise Report
                </Typography>
            </Box>

            <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                    {/* Row 1: From Date & Upto Date */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
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

                    {/* Row 2: Category Dropdown & Contractor Dropdown */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
                        <Autocomplete
                            fullWidth
                            options={categoriesList}
                            value={selectedCategory}
                            onChange={(_, newValue) => setSelectedCategory(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Category"
                                    placeholder="Select Category..."
                                />
                            )}
                        />

                        <Autocomplete
                            fullWidth
                            options={contractors}
                            value={selectedContractor}
                            loading={contractorLoading}
                            onChange={(_, newValue) => setSelectedContractor(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Contractor"
                                    placeholder="Search contractor..."
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {contractorLoading ? <CircularProgress size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Stack>

                    {/* Row 3: Show Report Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleShowReport}
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
                        {/* Info Summary Banner */}
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
                                    <Typography variant="caption" color="text.secondary">Category</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>{selectedCategory || '—'}</Typography>
                                </div>
                                <div>
                                    <Typography variant="caption" color="text.secondary">Contractor</Typography>
                                    <Typography fontWeight="bold" sx={{ color: '#0d47a1' }}>{selectedContractor || '—'}</Typography>
                                </div>
                            </Stack>
                        </Box>

                        {apiError && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {apiError}
                            </Alert>
                        )}

                        {/* Search and Action Buttons */}
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
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(0);
                                }}
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

                        {/* Report Table */}
                        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {Object.keys(columnHeaderMap).map((col) => (
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
                                                    minWidth: col === 'empName' || col === 'dept' ? 180 : 100
                                                }}
                                            >
                                                {columnHeaderMap[col]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={Object.keys(columnHeaderMap).length}
                                                align="center"
                                                sx={{ py: 8 }}
                                            >
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={Object.keys(columnHeaderMap).length}
                                                align="center"
                                                sx={{ py: 6, color: 'text.secondary' }}
                                            >
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {/* Data Rows */}
                                            {pagedRows.map((row, index) => (
                                                <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                                                        {row.empCode}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}>
                                                        {row.empName || '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}>
                                                        {row.empType || '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}>
                                                        {row.dept || '—'}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}>
                                                        {formatDate(row.att_Date)}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0', fontFamily: 'monospace' }}>
                                                        {formatTime(row.punchTime)}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}>
                                                        <Chip
                                                            label={row.sft || '—'}
                                                            size="small"
                                                            sx={{
                                                                fontSize: 11,
                                                                height: 22,
                                                                fontWeight: 'bold',
                                                                bgcolor: row.sft === 'A' ? '#e8f5e9' : row.sft === 'G' ? '#fff8e1' : '#f3e5f5',
                                                                color: row.sft === 'A' ? '#2e7d32' : row.sft === 'G' ? '#f57f17' : '#6a1b9a',
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* vertical Total Row / Footer */}
                                            <TableRow sx={{ bgcolor: '#eceff1', '& td': { fontWeight: 'bold', fontSize: 13, py: 1.5 } }}>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                    Total Punches
                                                </TableCell>
                                                <TableCell colSpan={5} align="left" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc', pl: 3 }}>
                                                    {filteredRows.length} Punch record(s) found
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                    —
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[50, 100, 200, 500]}
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
        </Box>
    );
};

export default EmployeeContractorCategory;
