"use client";

import React, { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { cn } from "../lib/utils"; // Replace or keep based on your setup

// Minimal Card wrapper
const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg shadow-md bg-white p-6 ${className}`}>{children}</div>
);

export const DataGrid = ({
  entityType,
  data,
  validationErrors = [],
  onDataChange,
  onNaturalLanguageSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [filteredData, setFilteredData] = useState(data);

  const entitySingularMap = {
    clients: "client",
    workers: "worker",
    tasks: "task",
  };

  const entitySingular = entitySingularMap[entityType];
  const columnsByEntity = {
    clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
    workers: ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup", "QualificationLevel"],
    tasks: ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"],
  };

  const columns = columnsByEntity[entityType] || [];
  const idField = columns[0];

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const performSearch = (query) => {
    if (!query) {
      setFilteredData(data);
      return;
    }
    const loweredQuery = query.toLowerCase();
    const result = data.filter((row) =>
      columns.some(
        (col) =>
          row[col] !== undefined &&
          row[col] !== null &&
          row[col].toString().toLowerCase().includes(loweredQuery)
      )
    );
    setFilteredData(result);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
    if (onNaturalLanguageSearch) onNaturalLanguageSearch(searchQuery, entityType);
  };

  const getRowErrors = (entityId) => {
    if (!entityId) return [];
    return validationErrors.filter((e) => e.entity === entitySingular && e.entityId === entityId);
  };

  const getCellErrors = (entityId, field) => {
    if (!entityId) return [];
    return validationErrors.filter(
      (e) => e.entity === entitySingular && e.entityId === entityId && e.field === field
    );
  };

  const handleCellEdit = (rowIndex, column, value) => {
    const updatedData = [...filteredData];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [column]: value };
    onDataChange(updatedData, entityType);
    setEditingCell(null);
  };

  const renderCellContent = (val) => {
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object" && val !== null) {
      try {
        return JSON.stringify(val);
      } catch {
        return "";
      }
    }
    return val ?? "";
  };

  return (
    <Card className="bg-gradient-to-br from-black-50/50 to-gray-100/50 border border-gray-300">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h3 className="text-xl font-semibold capitalize text-black">{entityType}</h3>
        <div className="flex items-center space-x-3">
          <span className="text-gray-500">{filteredData.length} records</span>
          {validationErrors.length > 0 && (
            <div className="flex items-center text-red-600 space-x-1">
              <AlertTriangle size={20} />
              <span>{validationErrors.length} errors</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-grow">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search..."
            className="w-full pl-10 pr-3 py-2 text-black rounded border border-gray-300 focus:outline-none focus:ring focus:ring-purple-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-purple-600 text-black rounded hover:bg-purple-700"
        >
          Search
        </button>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
          <FileText size={48} />
          <p>No data available to display</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[600px]">
          <table className="min-w-full border border-gray-300 table-fixed text-black">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border border-gray-300 px-4 py-2 text-left font-semibold text-sm"
                  >
                    {col}
                  </th>
                ))}
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-sm w-24">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => {
                const rowErrors = getRowErrors(row[idField]);
                return (
                  <tr key={rowIndex} className="hover:bg-gray-50 cursor-default">
                    {columns.map((col) => {
                      const cellErrors = getCellErrors(row[idField], col);
                      const isEditing =
                        editingCell?.row === rowIndex && editingCell?.col === col;

                      return (
                        <td
                          key={col}
                          className={cn(
                            "border border-gray-300 p-2 align-top min-w-[100px] relative",
                            cellErrors.length > 0 ? "bg-red-100 border-red-500" : ""
                          )}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (!isEditing && (e.key === "Enter" || e.key === " ")) {
                              setEditingCell({ row: rowIndex, col });
                            }
                            if (isEditing && e.key === "Escape") {
                              setEditingCell(null);
                            }
                          }}
                          onClick={() => {
                            if (!isEditing) setEditingCell({ row: rowIndex, col });
                          }}
                          aria-label={`${col} cell, ${cellErrors.length > 0 ? "has error" : "no errors"}`}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={renderCellContent(row[col])}
                              autoFocus
                              onBlur={(e) =>
                                handleCellEdit(rowIndex, col, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCellEdit(rowIndex, col, e.target.value);
                                }
                                if (e.key === "Escape") {
                                  setEditingCell(null);
                                }
                              }}
                              className="w-full border border-purple-500 rounded p-1"
                            />
                          ) : (
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "block w-full",
                                  cellErrors.length > 0 ? "text-red-700 font-medium" : ""
                                )}
                              >
                                {renderCellContent(row[col])}
                              </span>

                              {cellErrors.length > 0 && (
                                <div className="mt-1 text-xs text-red-600 space-y-1">
                                  {cellErrors.map((error, idx) => (
                                    <div key={idx}>
                                      <AlertTriangle className="inline-block mr-1" size={12} />
                                      {error.message}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-4 py-2 align-middle text-center font-semibold">
                      {rowErrors.length > 0 ? (
                        <div className="flex items-center justify-center space-x-1 text-red-600">
                          <AlertTriangle size={18} />
                          <span>{rowErrors.length} error(s)</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-1 text-green-600">
                          <CheckCircle size={18} />
                          <span>Valid</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
