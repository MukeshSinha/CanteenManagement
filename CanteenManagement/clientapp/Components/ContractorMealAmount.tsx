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
    Autocomplete,
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

interface ContractorMealAmountRow {
    empCode: string;
    empName: string;
    ezone: string;
    dept: string;
    empType: string;
    punchCount: number;
    amount: number;
}

const ContractorMealAmount: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [uptoDate, setUptoDate] = useState<string>('');
    
    // Contractor list and selection
    const [contractors, setContractors] = useState<string[]>([]);
    const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
    const [contractorLoading, setContractorLoading] = useState<boolean>(false);

    // Report states
    const [reportRows, setReportRows] = useState<ContractorMealAmountRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Pagination states
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);

    // Check if all required form fields are filled
    const isShowEnabled = Boolean(fromDate && uptoDate && selectedContractor);

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

                // Remove duplicates and sort
                const uniqueContractors = Array.from(new Set(fetchedList)) as string[];
                setContractors(uniqueContractors.sort((a, b) => a.localeCompare(b)));
            } catch (err) {
                console.error("Failed to load contractors list:", err);
            } finally {
                setContractorLoading(false);
            }
        };

        loadContractors();
    }, []);

    // Clear previous report results whenever filter criteria change
    useEffect(() => {
        setShowReport(false);
        setReportRows([]);
    }, [fromDate, uptoDate, selectedContractor]);

    const handleShowReport = async () => {
        if (!fromDate || !uptoDate || !selectedContractor) return;

        setLoading(true);
        setShowReport(true);
        setPage(0);

        try {
            const queryString = new URLSearchParams({
                fromdate: fromDate,
                uptodate: uptoDate,
                contractor: selectedContractor,
            }).toString();

            const url = `Canteen-Punch/ContractorMeal-Amount?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') {
                result = JSON.parse(result);
            }

            const tableData: ContractorMealAmountRow[] = result?.dataFetch?.table || result?.table || [];
            setReportRows(tableData);
        } catch (err) {
            console.error('Error fetching contractor meal amount report:', err);
            setReportRows([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter table rows in real-time by search term
    const filteredRows = reportRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();

        return (
            String(row.empCode ?? '').toLowerCase().includes(term) ||
            String(row.empName ?? '').toLowerCase().includes(term) ||
            String(row.ezone ?? '').toLowerCase().includes(term) ||
            String(row.dept ?? '').toLowerCase().includes(term) ||
            String(row.empType ?? '').toLowerCase().includes(term) ||
            String(row.punchCount ?? '').toLowerCase().includes(term) ||
            String(row.amount ?? '').toLowerCase().includes(term)
        );
    });

    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Grand Totals
    const totalPunches = filteredRows.reduce((sum, r) => sum + (Number(r.punchCount) || 0), 0);
    const totalAmount = filteredRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Export Data formatting
    const getExportData = () => {
        const headers = ["Emp Code", "Emp Name", "Contractor", "Department", "Emp Type", "Punch Count", "Amount (₹)"];
        const data = filteredRows.map(row => [
            row.empCode || '',
            row.empName || '',
            row.ezone || '',
            row.dept || '',
            row.empType || '',
            row.punchCount ?? 0,
            row.amount ?? 0,
        ]);

        // Add summary row
        data.push([
            'Total',
            '',
            '',
            '',
            '',
            totalPunches,
            totalAmount
        ]);

        return [headers, ...data];
    };

    const exportToCSV = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const csvContent = exportData
            .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `ContractorMealAmount_${selectedContractor}_${fromDate}_to_${uptoDate}.csv`);
    };

    const exportToExcel = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contractor Meal Amount');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `ContractorMealAmount_${selectedContractor}_${fromDate}_to_${uptoDate}.xlsx`);
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
                    fontWeight={500}
                    sx={{
                        letterSpacing: '-0.5px',
                        m: 0,
                        textAlign: 'center',
                    }}
                >
                    Contractor Meal Amount Report
                </Typography>
            </Box>

            {/* Filter Inputs Card */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                    {/* Row: From Date, Up To Date, Contractor Dropdown */}
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2.5}
                        alignItems="center"
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
                            value={uptoDate}
                            onChange={(e) => setUptoDate(e.target.value)}
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

                        <Autocomplete
                            fullWidth
                            size="small"
                            options={contractors}
                            value={selectedContractor}
                            loading={contractorLoading}
                            onChange={(_, newValue) => setSelectedContractor(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Contractor"
                                    placeholder="Select Contractor..."
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

                    {/* Centered Show Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="contained"
                            size="medium"
                            onClick={handleShowReport}
                            disabled={!isShowEnabled || loading}
                            sx={{
                                px: 5,
                                height: 42,
                                minWidth: 140,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                background: isShowEnabled
                                    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                                    : undefined,
                                boxShadow: isShowEnabled ? '0 4px 14px rgba(30, 60, 114, 0.3)' : 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #152e5b 0%, #1e3c72 100%)',
                                },
                            }}
                        >
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Show'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Results Section */}
            {showReport && (
                <>
                    {loading ? (
                        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center', my: 3 }}>
                            <CircularProgress size={32} sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Fetching contractor meal amount data...
                            </Typography>
                        </Card>
                    ) : filteredRows.length === 0 ? (
                        <DataNotFound />
                    ) : (
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                {/* Info Banner */}
                                <Box sx={{ mb: 2.5, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                                    <Stack direction="row" spacing={4} flexWrap="wrap">
                                        <div>
                                            <Typography variant="caption" color="text.secondary">From Date</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{fromDate || '—'}</Typography>
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary">Up To Date</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{uptoDate || '—'}</Typography>
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary">Contractor</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{selectedContractor || '—'}</Typography>
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary">Total Employees</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{filteredRows.length}</Typography>
                                        </div>
                                        <div>
                                            <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#2e7d32' }}>₹ {totalAmount.toLocaleString('en-IN')}</Typography>
                                        </div>
                                    </Stack>
                                </Box>

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
                                        placeholder="Search by code, name, department..."
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
                                        sx={{ maxWidth: { md: 340 } }}
                                    />

                                    <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            startIcon={<DownloadIcon fontSize="small" />}
                                            onClick={exportToCSV}
                                            disabled={filteredRows.length === 0}
                                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 'bold' }}
                                        >
                                            Export CSV
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            startIcon={<DownloadIcon fontSize="small" />}
                                            onClick={exportToExcel}
                                            disabled={filteredRows.length === 0}
                                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 'bold', boxShadow: '0 3px 8px rgba(76, 175, 80, 0.2)' }}
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
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
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
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        borderRight: '1px solid #1565c0',
                                                        minWidth: 100,
                                                    }}
                                                >
                                                    Emp Code
                                                </TableCell>
                                                <TableCell
                                                    align="left"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        borderRight: '1px solid #1565c0',
                                                        minWidth: 200,
                                                    }}
                                                >
                                                    Emp Name
                                                </TableCell>
                                                <TableCell
                                                    align="left"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        borderRight: '1px solid #1565c0',
                                                        minWidth: 180,
                                                    }}
                                                >
                                                    Contractor
                                                </TableCell>
                                                <TableCell
                                                    align="left"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        borderRight: '1px solid #1565c0',
                                                        minWidth: 180,
                                                    }}
                                                >
                                                    Department
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        borderRight: '1px solid #1565c0',
                                                        minWidth: 100,
                                                    }}
                                                >
                                                    Emp Type
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        borderRight: '1px solid #1565c0',
                                                        minWidth: 110,
                                                    }}
                                                >
                                                    Punch Count
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        bgcolor: '#1976d2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        py: 1.2,
                                                        fontSize: '0.8rem',
                                                        pr: 2,
                                                        minWidth: 120,
                                                    }}
                                                >
                                                    Amount (₹)
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pagedRows.map((row, index) => {
                                                const globalIndex = page * rowsPerPage + index + 1;
                                                return (
                                                    <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                        <TableCell align="center" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0', fontWeight: '500', color: 'text.secondary' }}>
                                                            {globalIndex}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                                                            {row.empCode}
                                                        </TableCell>
                                                        <TableCell align="left" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0' }}>
                                                            {row.empName || '—'}
                                                        </TableCell>
                                                        <TableCell align="left" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0' }}>
                                                            {row.ezone || '—'}
                                                        </TableCell>
                                                        <TableCell align="left" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0' }}>
                                                            {row.dept || '—'}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0' }}>
                                                            {row.empType || '—'}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: '0.78rem', py: 0.8, borderRight: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                                                            {row.punchCount}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontSize: '0.78rem', py: 0.8, pr: 2, fontWeight: 'bold', color: '#1565c0' }}>
                                                            ₹ {Number(row.amount || 0).toLocaleString('en-IN')}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Summary Grand Total Row */}
                                            <TableRow sx={{ bgcolor: '#eceff1', '& td': { fontWeight: 'bold', fontSize: '0.8rem', py: 1.2 } }}>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                    ∑
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                    Total
                                                </TableCell>
                                                <TableCell colSpan={4} align="left" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc', pl: 2, color: 'text.secondary' }}>
                                                    Total {filteredRows.length} employee record(s)
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc', color: '#0d47a1' }}>
                                                    {totalPunches}
                                                </TableCell>
                                                <TableCell align="right" sx={{ borderTop: '2px solid #b0bec5', pr: 2, color: '#2e7d32' }}>
                                                    ₹ {totalAmount.toLocaleString('en-IN')}
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

export default ContractorMealAmount;
