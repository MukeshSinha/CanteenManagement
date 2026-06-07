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

const columnHeaderMap: Record<string, string> = {
    ezone: "Contractor Name",
    eType: "Category",
    department: "Department",
    totalMeal: "Total Meal Qty",
    freeMeal: "Free Meal Qty",
    paidMeal: "Paid Meal Qty",
    tea: "Tea Qty",
    freeTea: "Free Tea Qty",
    paidTea: "Paid Tea Qty",
    fs: "FS Qty",
    freeFS: "Free FS Qty",
    paidFS: "Paid FS Qty",
    nb: "NB Qty",
    freeNB: "Free NB Qty",
    paidNB: "Paid NB Qty",
    mealAmount: "Meal Amt (Rs)",
    tea_Rs: "Tea Amt (Rs)",
    fS_RS: "FS Amt (Rs)",
    nB_RS: "NB Amt (Rs)",
    totalQty: "Total Qty",
    totalAmount: "Total Amt (Rs)"
};

interface ReportRow {
    ezone: string;
    eType: string;
    department: string;
    totalMeal: number;
    freeMeal: number;
    paidMeal: number;
    tea: number;
    freeTea: number;
    paidTea: number;
    fs: number;
    freeFS: number;
    paidFS: number;
    nb: number;
    freeNB: number;
    paidNB: number;
    mealAmount: number;
    tea_Rs: number;
    fS_RS: number;
    nB_RS: number;
    [key: string]: any;
}

const ContractorCategoryDeptWiseSummary: React.FC = () => {
    const [fromDate, setFromDate] = useState<string>('');
    const [upToDate, setUpToDate] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [reportRows, setReportRows] = useState<ReportRow[]>([]);
    const [reportColumns, setReportColumns] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showReport, setShowReport] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [categorySearch, setCategorySearch] = useState<string>('');

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
        const visibleCats = categories.filter(cat =>
            cat.toLowerCase().includes(categorySearch.toLowerCase())
        );
        const allVisibleSelected = visibleCats.length > 0 && visibleCats.every(cat => selectedCategories.includes(cat));

        if (allVisibleSelected) {
            setSelectedCategories(selectedCategories.filter(cat => !visibleCats.includes(cat)));
        } else {
            const union = Array.from(new Set([...selectedCategories, ...visibleCats]));
            setSelectedCategories(union);
        }
    };

    useEffect(() => {
        const loadCategories = async () => {
            setCategoriesLoading(true);
            try {
                const response = await apiFetch('Category/get-category');
                let parsedResult = typeof response === 'string' ? JSON.parse(response) : response;
                const fetchedList = parsedResult?.dataFetch?.table
                    ?.map((item: any) => String(item.etype ?? '').trim())
                    ?.filter((name: string) => name) ?? [];
                setCategories(fetchedList);
            } catch (err) {
                console.error("Failed to load categories:", err);
            } finally {
                setCategoriesLoading(false);
            }
        };
        loadCategories();
    }, []);

    const fetchContractorCategoryDeptWiseReport = async (params: { fromDate: string; upToDate: string; category: string }) => {
        try {
            setApiError('');
            const queryString = new URLSearchParams({
                fromdate: params.fromDate,
                uptodate: params.upToDate,
                category: params.category,
            }).toString();

            const url = `Monthly-Meal/report-cont-category-deptWise?${queryString}`;
            let result = await apiFetch(url);

            if (typeof result === 'string') result = JSON.parse(result);

            const table = result?.dataFetch?.table || [];
            
            // Filter out pre-calculated totals from the API response so we can group dynamically
            const filteredDetailRows = table.filter((row: any) => {
                const ezoneUpper = (row.ezone || '').trim().toUpperCase();
                const deptUpper = (row.department || '').trim().toUpperCase();
                const eTypeUpper = (row.eType || '').trim().toUpperCase();
                
                if (ezoneUpper === 'GRAND TOTAL') return false;
                if (eTypeUpper === '' && deptUpper === '') return false;
                if (deptUpper === 'ETYPE TOTAL') return false;
                
                return true;
            });

            // Derive report columns and force correct order: ezone, eType, department
            let columns: string[] = [];
            if (table.length > 0) {
                const rawColumns = Object.keys(table[0]).filter(
                    col => col !== 'totalQty' && col !== 'totalAmount'
                );
                const sortedCols = ['ezone', 'eType', 'department'];
                rawColumns.forEach(col => {
                    if (!sortedCols.includes(col)) {
                        sortedCols.push(col);
                    }
                });
                columns = sortedCols;
            }

            return { rows: filteredDetailRows, columns };
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

        console.log('Fetching Contractor Category Dept Wise Report with params:', params);
        const { rows, columns } = await fetchContractorCategoryDeptWiseReport(params);

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
        if (['ezone', 'eType', 'department'].includes(colKey)) {
            if (colKey === 'ezone') return 'Grand Total';
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

    // Helper functions for contractor totals (Level 1)
    const getContractorTotal = (contractorRows: ReportRow[], colKey: string): number | string => {
        if (['ezone', 'eType', 'department'].includes(colKey)) {
            if (colKey === 'ezone') return contractorRows[0]?.ezone || '';
            if (colKey === 'eType') return '';
            return 'Contractor Total';
        }

        return contractorRows.reduce((sum, row) => {
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

    const getFormattedContractorTotal = (contractorRows: ReportRow[], colKey: string): string => {
        const total = getContractorTotal(contractorRows, colKey);
        if (typeof total === 'string') return total;
        if (['mealAmount', 'tea_Rs', 'fS_RS', 'nB_RS', 'totalAmount'].includes(colKey)) {
            return total.toFixed(2);
        }
        return String(total);
    };

    // Helper functions for category/etype totals (Level 2)
    const getETypeTotal = (eTypeRows: ReportRow[], colKey: string): number | string => {
        if (['ezone', 'eType', 'department'].includes(colKey)) {
            if (colKey === 'ezone') return '';
            if (colKey === 'eType') return eTypeRows[0]?.eType || '';
            return 'Category Total';
        }

        return eTypeRows.reduce((sum, row) => {
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

    const getFormattedETypeTotal = (eTypeRows: ReportRow[], colKey: string): string => {
        const total = getETypeTotal(eTypeRows, colKey);
        if (typeof total === 'string') return total;
        if (['mealAmount', 'tea_Rs', 'fS_RS', 'nB_RS', 'totalAmount'].includes(colKey)) {
            return total.toFixed(2);
        }
        return String(total);
    };

    // Two-level grouping by ezone and then eType
    const getGroupedRows = (rows: ReportRow[]) => {
        const grouped: Record<string, Record<string, ReportRow[]>> = {};
        rows.forEach(row => {
            const ezoneKey = (row.ezone || 'Unknown').trim();
            const matchedEzoneKey = Object.keys(grouped).find(
                k => k.toLowerCase() === ezoneKey.toLowerCase()
            ) || ezoneKey;

            if (!grouped[matchedEzoneKey]) {
                grouped[matchedEzoneKey] = {};
            }

            const eTypeKey = (row.eType || 'Unknown').trim();
            const matchedETypeKey = Object.keys(grouped[matchedEzoneKey]).find(
                k => k.toLowerCase() === eTypeKey.toLowerCase()
            ) || eTypeKey;

            if (!grouped[matchedEzoneKey][matchedETypeKey]) {
                grouped[matchedEzoneKey][matchedETypeKey] = [];
            }

            grouped[matchedEzoneKey][matchedETypeKey].push(row);
        });
        return grouped;
    };

    // Export utilities
    const getExportData = () => {
        const displayColumns = [...reportColumns, 'totalQty', 'totalAmount'];

        // Headers
        const headers = displayColumns.map(col => columnHeaderMap[col] || col);

        const grouped = getGroupedRows(filteredRows);
        const dataRows: any[][] = [];

        Object.keys(grouped).forEach(ezoneKey => {
            const eTypeGroups = grouped[ezoneKey];
            const contractorRows = Object.values(eTypeGroups).flat();

            // 1. Contractor Subtotal Row
            const contractorHeaderRow = displayColumns.map(col => getFormattedContractorTotal(contractorRows, col));
            dataRows.push(contractorHeaderRow);

            // 2. Category Subsections
            Object.keys(eTypeGroups).forEach(eTypeKey => {
                const eTypeRows = eTypeGroups[eTypeKey];

                // 2a. Category Subtotal Row
                const categoryHeaderRow = displayColumns.map(col => getFormattedETypeTotal(eTypeRows, col));
                dataRows.push(categoryHeaderRow);

                // 2b. Detail Rows
                eTypeRows.forEach(row => {
                    const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
                    const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);

                    const detailRow = displayColumns.map(col => {
                        if (col === 'totalQty') return tQty;
                        if (col === 'totalAmount') return tAmt;
                        if (col === 'ezone' || col === 'eType') return ''; // blank out contractor and category names to match tree view
                        return row[col] !== null && row[col] !== undefined ? row[col] : '';
                    });
                    dataRows.push(detailRow);
                });
            });
        });

        // Grand Total Row
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
        saveAs(blob, `ContractorCategoryDeptWiseReport_${fromDate || 'from'}_to_${upToDate || 'to'}.csv`);
    };

    const exportToExcel = () => {
        if (filteredRows.length === 0) return;
        const exportData = getExportData();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contractor Category Dept Wise');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `ContractorCategoryDeptWiseReport_${fromDate || 'from'}_to_${upToDate || 'to'}.xlsx`);
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box 
                sx={{
                    background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    p: 3,
                    borderRadius: 3,
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Contractor Category & Dept. wise summary
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        {/* Filters Row */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                            <TextField
                                label="From Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Up To Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={upToDate}
                                onChange={(e) => setUpToDate(e.target.value)}
                                fullWidth
                                size="small"
                            />

                            <Button
                                variant="contained"
                                onClick={handleShow}
                                sx={{
                                    bgcolor: '#1976d2',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    px: 4,
                                    py: 1,
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: '#115293' },
                                    minWidth: 150
                                }}
                            >
                                Show Report
                            </Button>
                        </Stack>

                        {/* Category List Box with Checkboxes */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#455a64' }}>
                                Categories Filter
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Search category..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                sx={{ width: 200, bgcolor: 'white' }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Stack>
                        <Box sx={{
                            border: '1px solid #cfd8dc',
                            borderRadius: 2,
                            p: 2.5,
                            maxHeight: '180px',
                            overflowY: 'auto',
                            bgcolor: '#fafafa',
                            mb: 3
                        }}>
                            {categoriesLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <>
                                    <Box sx={{ mb: 1, borderBottom: '1px solid #eceff1', pb: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={
                                                        (() => {
                                                            const visible = categories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()));
                                                            return visible.length > 0 && visible.every(cat => selectedCategories.includes(cat));
                                                        })()
                                                    }
                                                    indeterminate={
                                                        (() => {
                                                            const visible = categories.filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()));
                                                            const selectedCount = visible.filter(cat => selectedCategories.includes(cat)).length;
                                                            return selectedCount > 0 && selectedCount < visible.length;
                                                        })()
                                                    }
                                                    onChange={handleSelectAllCategories}
                                                    color="primary"
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="body2" fontWeight="bold">Select All Categories</Typography>}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                        {categories
                                            .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                                            .map((cat) => (
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
                                </>
                            )}
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {apiError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {apiError}
                </Alert>
            )}

            {showReport && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                            <TextField
                                placeholder="Search..."
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 300 } }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />

                            <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    color="success"
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

                        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', borderRadius: 0 }}>
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
                                                    minWidth: col === 'ezone' || col === 'department' ? 180 : col === 'eType' ? 120 : 100
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
                                                colSpan={reportColumns.length + 2 || 13}
                                                align="center"
                                                sx={{ py: 8 }}
                                            >
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={reportColumns.length + 2 || 13}
                                                align="center"
                                                sx={{ py: 6, color: 'text.secondary' }}
                                            >
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {/* Grouped Rows */}
                                            {(() => {
                                                const grouped = getGroupedRows(filteredRows);
                                                return Object.keys(grouped).map((ezoneKey) => {
                                                    const eTypeGroups = grouped[ezoneKey];
                                                    const contractorRows = Object.values(eTypeGroups).flat();

                                                    return (
                                                        <React.Fragment key={ezoneKey}>
                                                            {/* Contractor Header Row (Level 1 Total) */}
                                                            <TableRow sx={{ bgcolor: '#bbdefb', '& td': { fontWeight: 'bold', fontSize: 13, py: 1 } }}>
                                                                {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => {
                                                                    const formattedVal = getFormattedContractorTotal(contractorRows, col);
                                                                    return (
                                                                        <TableCell
                                                                            key={`contractor-total-${col}`}
                                                                            align="center"
                                                                            sx={{
                                                                                borderRight: '1px solid #dcdcdc',
                                                                                bgcolor: col === 'totalAmount' ? '#efebe9' : col === 'totalQty' ? '#f5f5f5' : 'inherit',
                                                                                color: col === 'totalAmount' ? '#5d4037' : 'inherit',
                                                                                fontWeight: 'bold',
                                                                                fontSize: 13,
                                                                                py: 1
                                                                            }}
                                                                        >
                                                                            {formattedVal}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                            </TableRow>

                                                            {/* Category Subsection (Level 2 Total) */}
                                                            {Object.keys(eTypeGroups).map((eTypeKey) => {
                                                                const eTypeRows = eTypeGroups[eTypeKey];
                                                                return (
                                                                    <React.Fragment key={`${ezoneKey}-${eTypeKey}`}>
                                                                        {/* Category Header Row */}
                                                                        <TableRow sx={{ bgcolor: '#e3f2fd', '& td': { fontWeight: 'bold', fontSize: 13, py: 1 } }}>
                                                                            {[...reportColumns, 'totalQty', 'totalAmount'].map((col) => {
                                                                                const formattedVal = getFormattedETypeTotal(eTypeRows, col);
                                                                                return (
                                                                                    <TableCell
                                                                                        key={`etype-total-${col}`}
                                                                                        align="center"
                                                                                        sx={{
                                                                                            borderRight: '1px solid #e2e8f0',
                                                                                            bgcolor: col === 'totalAmount' ? '#efebe9' : col === 'totalQty' ? '#f5f5f5' : 'inherit',
                                                                                            color: col === 'totalAmount' ? '#5d4037' : 'inherit',
                                                                                            fontWeight: 'bold',
                                                                                            fontSize: 13,
                                                                                            py: 1
                                                                                        }}
                                                                                    >
                                                                                        {formattedVal}
                                                                                    </TableCell>
                                                                                );
                                                                            })}
                                                                        </TableRow>

                                                                        {/* Detail Rows under Contractor + Category */}
                                                                        {eTypeRows.map((row, index) => {
                                                                            const tQty = (Number(row.totalMeal) || 0) + (Number(row.tea) || 0) + (Number(row.fs) || 0) + (Number(row.nb) || 0);
                                                                            const tAmt = (Number(row.mealAmount) || 0) + (Number(row.tea_Rs) || 0) + (Number(row.fS_RS) || 0) + (Number(row.nB_RS) || 0);

                                                                            return (
                                                                                <TableRow key={`${ezoneKey}-${eTypeKey}-${index}`} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfcfc' } }}>
                                                                                    {reportColumns.map((col) => {
                                                                                        let displayVal = row[col] !== null && row[col] !== undefined ? String(row[col]) : '—';
                                                                                        if (col === 'ezone' || col === 'eType') {
                                                                                            displayVal = ''; // blank out contractor and category names to match tree view
                                                                                        }
                                                                                        return (
                                                                                            <TableCell
                                                                                                key={col}
                                                                                                align="center"
                                                                                                sx={{ fontSize: 13, py: 1, borderRight: '1px solid #f0f0f0' }}
                                                                                            >
                                                                                                {displayVal}
                                                                                            </TableCell>
                                                                                        );
                                                                                    })}
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
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()}

                                            {/* Grand Total Row */}
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

export default ContractorCategoryDeptWiseSummary;
