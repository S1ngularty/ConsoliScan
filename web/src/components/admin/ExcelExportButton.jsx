import React from "react";
import * as XLSX from "xlsx";
import { Button } from "@mui/material";
import { Download } from "lucide-react";

function ExcelExportButton({ data, fileName = "export", sheetName = "Sheet1" }) {

  const handleExport = () => {
    if (!Array.isArray(data) || data.length === 0) return;

    const keys = Array.from(
      new Set(data.flatMap(obj =>{
        Object.keys(obj)}))
    );

    const formattedData = data.map(row =>
      keys.reduce((acc, key) => {
        acc[key] = row[key] ?? "";
        return acc;
      }, {})
    );

    // 3. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: keys,
    });

    // 4. Human-readable headers
    const headers = keys.map(key =>
      key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, str => str.toUpperCase())
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    // 5. Auto column widths
    worksheet["!cols"] = keys.map(key => ({
      wch: Math.max(
        key.length + 5,
        ...formattedData.map(row => String(row[key]).length)
      ),
    }));

    // 6. Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Button
      onClick={handleExport}
      variant="contained"
      startIcon={<Download size={18} />}
      disabled={!data || data.length === 0}
    >
      Export
    </Button>
  );
}

export default ExcelExportButton;
