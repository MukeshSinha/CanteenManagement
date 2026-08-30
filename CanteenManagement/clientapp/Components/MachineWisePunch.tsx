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

interface MachinePunchRow {
    date?: string;
    total?: number;
    [key: string]: any;
}

const MachineWisePunch: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [reportRows, setReportRows] = useState<MachinePunchRow[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);

    const isShowEnabled = Boolean(fromDate && upToDate);

    const handleShowReport = async () => {
        if (!fromDate || !upToDate) return;

        setLoading(true);
        setShowReport(true);
        setPage(0);

        try {
            const queryString = new URLSearchParams({
                fromdate: fromDate,
                uptodate: upToDate,
            }).toString();

            const url = `Canteen-Punch/MachineWise-Punch?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') {
                result = JSON.parse(result);
            }

            const tableData: MachinePunchRow[] = result?.dataFetch?.table || result?.table || [];
            setReportRows(tableData);

            if (tableData.length > 0) {
                const allKeys = Object.keys(tableData[0]);
                const orderedCols: string[] = [];

                if (allKeys.includes('date')) orderedCols.push('date');

                const machineKeys = allKeys
                    .filter(k => k !== 'date' && k.toLowerCase() !== 'total')
                    .sort((a, b) => {
                        const numA = parseInt(a, 10);
                        const numB = parseInt(b, 10);
                        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                        return a.localeCompare(b);
                    });

                orderedCols.push(...machineKeys);

                if (allKeys.some(k => k.toLowerCase() === 'total')) {
                    const totalKey = allKeys.find(k => k.toLowerCase() === 'total') || 'total';
                    orderedCols.push(totalKey);
                }

                setColumns(orderedCols);
            } else {
                setColumns([]);
            }
        } catch (err) {
            console.error('Error fetching machine wise punch report:', err);
            setReportRows([]);
            setColumns([]);
        } finally {
            setLoading(false);
        }
    };

    const getColumnHeaderLabel = (col: string): string => {
        if (col === 'date') return 'Date';
        if (col.toLowerCase() === 'total') return 'Total';
        if (!isNaN(Number(col))) {
            return `Machine ${col}`;
        }
        return col;
    };

    const dataRows = reportRows.filter(r => String(r.date).toLowerCase() !== 'total');
    const totalRow = reportRows.find(r => String(r.date).toLowerCase() === 'total');

    const filteredRows = dataRows.filter((row) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return columns.some((col) =>
            String(row[col] ?? '').toLowerCase().includes(term)
        );
    });

    const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const getExportData = () => {
        const headers = columns.map(getColumnHeaderLabel);
        const rowsToExport = [...filteredRows];
        if (totalRow) rowsToExport.push(totalRow);

        const data = rowsToExport.map((row) =>
            columns.map((col) => row[col] ?? 0)
        );

        return [headers, ...data];
    };

    const exportToCSV = () => {
        if (reportRows.length === 0) return;
        const exportData = getExportData();
        const csvContent = exportData
            .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `MachineWise_Punch_${fromDate}_to_${upToDate}.csv`);
    };

    const exportToExcel = () => {
        if (reportRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'MachineWise Punch');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `MachineWise_Punch_${fromDate}_to_${upToDate}.xlsx`);
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
                    Machine Wise Punch Report
                </Typography>
            </Box>

            {/* Filter Section Card */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 2.5 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2.5}
                        alignItems={{ xs: 'stretch', md: 'center' }}
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
                                Fetching machine wise punch data...
                            </Typography>
                        </Card>
                    ) : filteredRows.length === 0 && !totalRow ? (
                        <DataNotFound />
                    ) : (
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                {/* Information Banner */}
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
                                            <Typography variant="caption" color="text.secondary">Total Days</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0d47a1' }}>{dataRows.length}</Typography>
                                        </div>
                                    </Stack>
                                </Box>

                                {/* Search Bar & Export Action Buttons */}
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
                                        placeholder="Search date or punch count..."
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

                                {/* Compact Data Table with reduced font size and tight padding for high column density */}
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
                                                        width: 45,
                                                    }}
                                                >
                                                    #
                                                </TableCell>
                                                {columns.map((col) => (
                                                    <TableCell
                                                        key={col}
                                                        align="center"
                                                        sx={{
                                                            bgcolor: '#1976d2',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            py: 1,
                                                            px: 1,
                                                            fontSize: '0.75rem',
                                                            borderRight: '1px solid #1565c0',
                                                            minWidth: col === 'date' ? 80 : col.toLowerCase() === 'total' ? 65 : 60,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {getColumnHeaderLabel(col)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pagedRows.map((row, index) => {
                                                const globalIndex = page * rowsPerPage + index + 1;
                                                return (
                                                    <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                        <TableCell align="center" sx={{ fontSize: '0.73rem', py: 0.6, px: 1, borderRight: '1px solid #f0f0f0', fontWeight: '500', color: 'text.secondary' }}>
                                                            {globalIndex}
                                                        </TableCell>
                                                        {columns.map((col) => {
                                                            const isDateCol = col === 'date';
                                                            const isTotalCol = col.toLowerCase() === 'total';
                                                            const val = row[col];

                                                            return (
                                                                <TableCell
                                                                    key={col}
                                                                    align="center"
                                                                    sx={{
                                                                        fontSize: '0.73rem',
                                                                        py: 0.6,
                                                                        px: 1,
                                                                        borderRight: '1px solid #f0f0f0',
                                                                        fontWeight: isDateCol || isTotalCol ? 'bold' : 'normal',
                                                                        color: isTotalCol ? '#1976d2' : 'inherit',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {val !== undefined && val !== null ? String(val) : '0'}
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                );
                                            })}

                                            {/* Summary / Grand Total Row */}
                                            {totalRow && (
                                                <TableRow sx={{ bgcolor: '#eceff1', '& td': { fontWeight: 'bold', fontSize: '0.75rem', py: 0.8, px: 1 } }}>
                                                    <TableCell align="center" sx={{ borderTop: '2px solid #b0bec5', borderRight: '1px solid #cfd8dc' }}>
                                                        ∑
                                                    </TableCell>
                                                    {columns.map((col) => {
                                                        const val = totalRow[col];
                                                        const isTotalCol = col.toLowerCase() === 'total';
                                                        return (
                                                            <TableCell
                                                                key={col}
                                                                align="center"
                                                                sx={{
                                                                    borderTop: '2px solid #b0bec5',
                                                                    borderRight: '1px solid #cfd8dc',
                                                                    color: isTotalCol ? '#0d47a1' : '#263238',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {val !== undefined && val !== null ? String(val) : '—'}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            )}
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

export default MachineWisePunch;
