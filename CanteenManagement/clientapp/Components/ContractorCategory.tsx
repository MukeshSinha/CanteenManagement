import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";



import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { apiFetch } from '../src/utils/api'

interface ContractorCategoryRow {
    id: number;
    ezone: string;
    staff: number;
    officer: number;
    worker: number;
    dtl: number;
    sub: number;
    cont: number;
    toa: number;
    naps: number;
    total: number;
}

const ContractorCategory = () => {

    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [rows, setRows] = useState<ContractorCategoryRow[]>([])
    const [search, setSearch] = useState("")
    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)

    const columns: GridColDef[] = [

        { field: "ezone", headerName: "EZone", flex: 2 },

        { field: "staff", headerName: "Staff", flex: 1 },
        { field: "officer", headerName: "Officer", flex: 1 },
        { field: "worker", headerName: "Worker", flex: 1 },
        { field: "dtl", headerName: "DTL", flex: 1 },
        { field: "sub", headerName: "Sub", flex: 1 },
        { field: "cont", headerName: "Cont", flex: 1 },
        { field: "toa", headerName: "TOA", flex: 1 },
        { field: "naps", headerName: "NAPS", flex: 1 },
        { field: "total", headerName: "Total", flex: 1 }

    ]

    const getContractorCategory = async () => {
        setSearched(true)
        setLoading(true)
        try {
            let result = await apiFetch(`ShitWise/Contractor-Category?fromdate=${fromDate}&uptodate=${toDate}`);
            
            result = typeof result === 'string' ? JSON.parse(result) : result;
            const data = result.dataFetch.table

            const formatted = data.map((item: any, index: number) => ({

                id: index + 1,
                ...item

            }))

            setRows(formatted)
        }
        catch (Ex) {

        }
        finally {
            setLoading(false)
        }
        

    }

    const filteredRows = rows.filter((row) =>
        row.ezone.toLowerCase().includes(search.toLowerCase())
    )



    const exportCSV = () => {

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()

        XLSX.utils.book_append_sheet(wb, ws, "Report")

        const csv = XLSX.write(wb, { bookType: "csv", type: "array" })

        saveAs(new Blob([csv]), "ContractorCategory.csv")

    }



    const exportExcel = () => {

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()

        XLSX.utils.book_append_sheet(wb, ws, "Report")

        const excel = XLSX.write(wb, { bookType: "xlsx", type: "array" })

        saveAs(new Blob([excel]), "ContractorCategory.xlsx")

    }

    return (

        <Box p={3}>

            <Card>

                <CardContent>

                    <Typography variant="h6" mb={3}>
                        Contractor Category Report
                    </Typography>



                    {/* DATE FIELDS */}

                    <Box display="flex" gap={2} mb={2}>

                        <TextField
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 220 }}
                        />


                        <TextField
                            label="To Date"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 220 }}
                        />

                    </Box>



                    <Button
                        variant="contained"
                        onClick={getContractorCategory}
                        sx={{ mb: 3 }}
                    >
                        Show
                    </Button>



                    {/* SEARCH + EXPORT */}

                    {!loading && searched && rows.length > 0 && (

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >

                            <TextField
                                placeholder="Search EZone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                size="small"
                                sx={{ width: 300 }}
                            />

                            <Box display="flex" gap={1}>

                                <Button
                                    variant="outlined"
                                    onClick={exportCSV}
                                >
                                    Export CSV
                                </Button>

                                <Button
                                    variant="contained"
                                    onClick={exportExcel}
                                >
                                    Export Excel
                                </Button>

                            </Box>

                        </Box>

                    )}



                    {/* DATATABLE */}

                    {loading && (

                        <Typography sx={{ mt: 2 }}>
                            Loading data...
                        </Typography>

                    )}

                    {!loading && searched && rows.length > 0 && (

                        <Box height={500}>

                            <DataGrid
                                rows={filteredRows}
                                columns={columns}
                                pageSizeOptions={[10, 25, 50]}
                                pagination
                            />

                        </Box>

                    )}

                    {!loading && searched && rows.length === 0 && (

                        <Typography color="error" sx={{ mt: 2 }}>

                            No Data Found For Selected Date Range

                        </Typography>

                    )}
                </CardContent>

            </Card>

        </Box>

    )

}

export default ContractorCategory