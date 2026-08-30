import React, { useState } from "react";
import { Box, TextField, Button, Paper, InputAdornment, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface GlobalDataTableProps {
  rows: any[];
  columns: GridColDef[];
  searchFields?: string[];
  title?: string;
}

const GlobalDataTable: React.FC<GlobalDataTableProps> = ({
  rows,
  columns,
  searchFields = [],
  title
}) => {
  const [search, setSearch] = useState("");

  const filteredRows = rows.filter((row) => {
    if (!search) return true;

    if (searchFields.length === 0) {
      return Object.values(row).some(
        (val) => val && val.toString().toLowerCase().includes(search.toLowerCase())
      );
    }

    return searchFields.some((field) =>
      row[field]?.toString().toLowerCase().includes(search.toLowerCase())
    );
  });

  const exportCSV = () => {
    if (!rows || rows.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    try {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      const csv = XLSX.write(wb, { bookType: "csv", type: "array" });
      saveAs(new Blob([csv]), `${title || "Report"}.csv`);
      toast.success("CSV report exported successfully!");
    } catch (err) {
      toast.error("Failed to export CSV report.");
    }
  };

  const exportExcel = () => {
    if (!rows || rows.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    try {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      const excel = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excel]), `${title || "Report"}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch (err) {
      toast.error("Failed to export Excel report.");
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={2}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
              {title}
            </Typography>
          )}
          <TextField
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 320 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#f8fafc",
                "&:hover": { backgroundColor: "#f1f5f9" },
                "&.Mui-focused": { backgroundColor: "#ffffff" },
              },
            }}
          />
        </Box>

        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            onClick={exportCSV}
            startIcon={<DownloadIcon />}
            sx={{
              borderRadius: "10px",
              borderColor: "#cbd5e1",
              color: "#475569",
              fontWeight: 600,
              textTransform: "none",
              px: 2,
              "&:hover": {
                borderColor: "#6366f1",
                color: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.04)",
              },
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            onClick={exportExcel}
            startIcon={<TableChartIcon />}
            className="btn-gradient-primary"
            sx={{
              textTransform: "none",
              px: 2,
            }}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: "#ffffff !important",
              fontWeight: "700 !important",
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: "#f8fafc",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#eef2ff",
            },
            "& .MuiDataGrid-cell": {
              fontSize: "0.875rem",
              borderColor: "#f1f5f9",
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default GlobalDataTable;