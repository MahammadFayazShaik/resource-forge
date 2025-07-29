"use client";

import React, { useState, useEffect } from "react";
import { DownloadIcon } from "lucide-react";

// Convert JSON array to CSV format string
const jsonToCSV = (jsonArray) => {
  if (!jsonArray.length) return "";

  const keys = Object.keys(jsonArray[0]);
  const header = keys.join(",");
  const rows = jsonArray.map((obj) =>
    keys
      .map((k) => {
        const val = obj[k];
        if (val === null || val === undefined) return "";
        // Escape quotes by doubling them
        const escaped = val.toString().replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\r\n");
};

// Trigger file download in browser
const triggerDownload = (filename, content, mimeType = "text/plain") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const ExportManager = ({
  validationStats,
  clients = [],
  workers = [],
  tasks = [],
  rules = [],
}) => {
  const [selected, setSelected] = useState({
    clients: true,
    workers: true,
    tasks: true,
    rules: true,
  });

  const [validateBeforeExport, setValidateBeforeExport] = useState(true);
  const [clean, setClean] = useState(true);
  const [errors, setErrors] = useState(validationStats.errors || 0);

  useEffect(() => {
    setErrors(validationStats.errors || 0);
  }, [validationStats.errors]);

  // Toggle selection for export categories
  const toggle = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Remove UI-only or unwanted properties before export
  const cleanDataArray = (arr) =>
    arr.map(({ _internalId, ...rest }) => rest);

  const prepareCSV = (arr) => {
    if (clean) {
      return jsonToCSV(cleanDataArray(arr));
    }
    return jsonToCSV(arr);
  };

  // Map keys to arrays for easy count display
  const recordsCountMap = { clients, workers, tasks };

  // Individual file download handler
  const downloadFile = (key) => {
    if (key === "clients") {
      if (!clients.length) {
        alert("No client data to export.");
        return;
      }
      const csv = prepareCSV(clients);
      triggerDownload("clients.csv", csv, "text/csv");
    } else if (key === "workers") {
      if (!workers.length) {
        alert("No worker data to export.");
        return;
      }
      const csv = prepareCSV(workers);
      triggerDownload("workers.csv", csv, "text/csv");
    } else if (key === "tasks") {
      if (!tasks.length) {
        alert("No task data to export.");
        return;
      }
      const csv = prepareCSV(tasks);
      triggerDownload("tasks.csv", csv, "text/csv");
    } else if (key === "rules") {
      if (!rules.length) {
        alert("No rules configured.");
        return;
      }
      const json = JSON.stringify({ rules }, null, 2);
      triggerDownload("rules.json", json, "application/json");
    }
  };

  // Export all selected files sequentially
  const exportAll = () => {
    if (errors > 0) {
      alert("Cannot export while validation errors exist. Please fix them first.");
      return;
    }

    if (selected.clients && clients.length) downloadFile("clients");
    if (selected.workers && workers.length) downloadFile("workers");
    if (selected.tasks && tasks.length) downloadFile("tasks");
    if (selected.rules && rules.length) downloadFile("rules");
  };

  return (
    <div className="bg-[#0c0c0c] text-white p-6 rounded-xl max-w-5xl mx-auto">
      {errors > 0 && (
        <div className="bg-red-950 border border-red-600 text-red-300 px-4 py-3 rounded mb-6">
          <p className="flex items-center gap-2">
            <span className="text-red-400 font-semibold">Export Blocked</span>
            <span className="text-sm">{errors} errors must be fixed before export</span>
          </p>
        </div>
      )}

      <h2 className="text-xl font-bold mb-1">Export Configuration</h2>
      <p className="text-sm mb-6 text-gray-400">Choose what to include in the export package</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="mb-2 font-semibold text-gray-300">Data Files</h3>
          {["clients", "workers", "tasks"].map((key) => (
            <label key={key} className="flex items-center space-x-3 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected[key]}
                onChange={() => toggle(key)}
                className="accent-purple-500"
              />
              <span>
                {key.charAt(0).toUpperCase() + key.slice(1)} ({recordsCountMap[key]?.length || 0}{" "}records)
              </span>
            </label>
          ))}
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-gray-300">Configuration Files</h3>
          <label className="flex items-center space-x-3 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.rules}
              onChange={() => toggle("rules")}
              className="accent-purple-500"
            />
            <span>Rules Configuration ({rules.length})</span>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 font-semibold text-gray-300">Export Settings</h3>
        <label className="flex items-center space-x-3 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={validateBeforeExport}
            onChange={() => setValidateBeforeExport(!validateBeforeExport)}
            className="accent-purple-500"
          />
          <span>Validate before export (recommended)</span>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={clean}
            onChange={() => setClean(!clean)}
            className="accent-purple-500"
          />
          <span>Clean data (remove UI-only properties)</span>
        </label>
      </div>

      <div className="mt-6 flex gap-4 flex-wrap">
        <button
          disabled={errors > 0}
          onClick={exportAll}
          className="flex-1 py-2 px-4 rounded bg-purple-700 hover:bg-purple-600 font-semibold disabled:opacity-50 text-white"
        >
          <DownloadIcon className="inline w-4 h-4 mr-2" />
          Export All Selected
        </button>

        {["clients", "workers", "tasks", "rules"].map((key) => (
          <button
            key={key}
            onClick={() => downloadFile(key)}
            className="border border-gray-600 px-3 py-2 rounded text-gray-300 flex gap-2 items-center hover:bg-gray-800"
          >
            <DownloadIcon className="w-4 h-4" />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExportManager;
