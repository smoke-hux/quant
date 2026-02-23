"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

interface SpreadsheetEditorProps {
  projectId: string;
  projectName: string;
  fileDataBase64: string;
  fileName: string;
  readOnly?: boolean;
}

type CellValue = string | number | boolean | null;
type Row = CellValue[];

export function SpreadsheetEditor({
  projectId,
  projectName,
  fileDataBase64,
  fileName,
  readOnly = false,
}: SpreadsheetEditorProps) {
  const [data, setData] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseWorkbook = useCallback(
    (wb: XLSX.WorkBook, sheetIndex: number) => {
      const sheetName = wb.SheetNames[sheetIndex];
      const sheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
        header: 1,
        defval: "",
      });

      if (jsonData.length === 0) {
        setHeaders(["A"]);
        setData([[""]]);
        return;
      }

      // Find max column count
      const maxCols = Math.max(...jsonData.map((row) => row.length), 1);
      const colHeaders = Array.from({ length: maxCols }, (_, i) =>
        getColumnLabel(i)
      );

      // Pad rows to same length
      const paddedData = jsonData.map((row) => {
        const padded = [...row];
        while (padded.length < maxCols) padded.push("");
        return padded;
      });

      setHeaders(colHeaders);
      setData(paddedData);
    },
    []
  );

  useEffect(() => {
    const binaryStr = atob(fileDataBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const wb = XLSX.read(bytes, { type: "array" });
    workbookRef.current = wb;
    setSheetNames(wb.SheetNames);
    parseWorkbook(wb, 0);
  }, [fileDataBase64, parseWorkbook]);

  function switchSheet(index: number) {
    setActiveSheet(index);
    if (workbookRef.current) {
      parseWorkbook(workbookRef.current, index);
    }
  }

  function getColumnLabel(index: number): string {
    let label = "";
    let n = index;
    while (n >= 0) {
      label = String.fromCharCode((n % 26) + 65) + label;
      n = Math.floor(n / 26) - 1;
    }
    return label;
  }

  function handleCellClick(rowIndex: number, colIndex: number) {
    if (readOnly) return;
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(String(data[rowIndex][colIndex] ?? ""));
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    if (editingCell) {
      const newData = data.map((row) => [...row]);
      const value = editValue;
      // Try to convert to number
      const numVal = Number(value);
      newData[editingCell.row][editingCell.col] =
        value !== "" && !isNaN(numVal) ? numVal : value;
      setData(newData);
      setEditingCell(null);
      setSaved(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      if (editingCell) {
        const nextCol = editingCell.col + 1;
        if (nextCol < headers.length) {
          handleCellClick(editingCell.row, nextCol);
        }
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Build worksheet from data
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = workbookRef.current || XLSX.utils.book_new();
      const sheetName = sheetNames[activeSheet] || "Sheet1";
      wb.Sheets[sheetName] = ws;

      // Write to buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: wbout,
          status: "IN_PROGRESS",
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    // Log download
    await fetch(`/api/projects/${projectId}`, { method: "PATCH" });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetNames[activeSheet] || "Sheet1");
    XLSX.writeFile(wb, fileName);
  }

  function addRow() {
    const newRow = Array(headers.length).fill("");
    setData([...data, newRow]);
    setSaved(false);
  }

  function addColumn() {
    const newHeaders = [...headers, getColumnLabel(headers.length)];
    const newData = data.map((row) => [...row, ""]);
    setHeaders(newHeaders);
    setData(newData);
    setSaved(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{projectName}</h2>
          <span className="text-sm text-gray-500">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <button
                onClick={addRow}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                + Row
              </button>
              <button
                onClick={addColumn}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                + Column
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save"}
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Download .xlsx
          </button>
        </div>
      </div>

      {/* Sheet tabs */}
      {sheetNames.length > 1 && (
        <div className="flex gap-0 bg-gray-100 border-b border-gray-200 px-4">
          {sheetNames.map((name, i) => (
            <button
              key={name}
              onClick={() => switchSheet(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                i === activeSheet
                  ? "border-blue-600 text-blue-600 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-gray-100 border border-gray-300 px-2 py-1 text-xs text-gray-500 font-medium w-12 min-w-[3rem]">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="bg-gray-100 border border-gray-300 px-2 py-1 text-xs text-gray-500 font-medium min-w-[100px]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="bg-gray-50 border border-gray-300 px-2 py-1 text-xs text-gray-500 text-center font-medium">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`border border-gray-300 px-1 py-0 text-sm cursor-cell ${
                      editingCell?.row === rowIndex &&
                      editingCell?.col === colIndex
                        ? "bg-blue-50 ring-2 ring-blue-500 ring-inset"
                        : "hover:bg-blue-50/50"
                    }`}
                  >
                    {editingCell?.row === rowIndex &&
                    editingCell?.col === colIndex ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full px-1 py-1 outline-none bg-transparent text-sm"
                      />
                    ) : (
                      <div className="px-1 py-1 min-h-[1.75rem] truncate">
                        {cell !== null && cell !== undefined
                          ? String(cell)
                          : ""}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
