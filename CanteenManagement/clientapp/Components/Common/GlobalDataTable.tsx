import {useState } from "react";
import { Box, TextField, Button } from "@mui/material";
import { DataGrid} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface GlobalDataTableProps {
  rows: any[];
  columns: GridColDef[];
  searchFields?: string[];   // 👈 multiple fields
}

const GlobalDataTable: React.FC<GlobalDataTableProps> = ({
  rows,
  columns,
  searchFields = []
}) => {

  const [search, setSearch] = useState("");

  const filteredRows = rows.filter((row) => {

    if (!search) return true;

    return searchFields.some((field) =>
      row[field]
        ?.toString()
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  });

  const exportCSV = () => {

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const csv = XLSX.write(wb, { bookType: "csv", type: "array" });

    saveAs(new Blob([csv]), "Report.csv");

  };

  const exportExcel = () => {

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");

    const excel = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(new Blob([excel]), "Report.xlsx");

  };

  return (

    <Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >

        <TextField
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />

        <Box display="flex" gap={1}>

          <Button variant="outlined" onClick={exportCSV}>
            Export CSV
          </Button>

          <Button variant="contained" onClick={exportExcel}>
            Export Excel
          </Button>

        </Box>

      </Box>

      <Box height={800}>

        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          pagination
          disableRowSelectionOnClick
        />

      </Box>

    </Box>
  );
};

export default GlobalDataTable;