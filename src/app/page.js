"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import "../globals.css";
import FileUploader from "@/components/FileUploader";
import ExportManager from "@/components/ExportManager";
import { DataGrid } from "@/components/DataGrid";
import { DataValidator } from "@/utils/validateData";
import { RuleBuilder } from "@/components/RuleBuilder";
import Footer from "@/components/Footer";

export default function Home() {
  const [view, setView] = useState("upload");

  const [uploadedFiles, setUploadedFiles] = useState({
    clients: [],
    workers: [],
    tasks: [],
  });

  const [validationErrors, setValidationErrors] = useState({
    clients: [],
    workers: [],
    tasks: [],
  });

  const [validationStats, setValidationStats] = useState({
    totalRecords: 0,
    errors: 0,
    warnings: 0,
    dataQuality: 100,
  });

  const [rules, setRules] = useState([]);

  const performCrossValidation = (clients, workers, tasks) => {
    const taskIds = new Set(tasks.map((t) => t.TaskID || t.id));
    const workerIds = new Set(workers.map((w) => w.WorkerID || w.id));
    const crossErrors = [];

    clients.forEach((client) => {
      if (!client.RequestedTaskIDs) return;
      const taskIdList = client.RequestedTaskIDs.split(/[,;]/).map((id) => id.trim());
      taskIdList.forEach((taskId) => {
        if (taskId && !taskIds.has(taskId)) {
          crossErrors.push({
            entity: "client",
            entityId: client.ClientID || client.id,
            field: "RequestedTaskIDs",
            message: `Task ID ${taskId} not found in uploaded Tasks`,
            type: "error",
          });
        }
      });
    });

    tasks.forEach((task) => {
      if (task.AssignedWorkerID && !workerIds.has(task.AssignedWorkerID)) {
        crossErrors.push({
          entity: "task",
          entityId: task.TaskID || task.id,
          field: "AssignedWorkerID",
          message: `Assigned Worker ID ${task.AssignedWorkerID} not found in uploaded Workers`,
          type: "error",
        });
      }
    });

    return crossErrors;
  };

  const handleFileUpload = (file, type) => {
    const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        updateFilesAndValidate(parsedData, type);
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          updateFilesAndValidate(results.data, type);
        },
        error: (error) => {
          console.error("CSV parse error:", error);
          alert(`Error parsing ${file.name}: ${error.message}`);
        },
      });
    }
  };

  const updateFilesAndValidate = (parsedData, type) => {
    setUploadedFiles((prev) => {
      const updatedFiles = { ...prev, [type]: parsedData };

      if (updatedFiles.clients.length && updatedFiles.workers.length && updatedFiles.tasks.length) {
        const validator = new DataValidator(
          updatedFiles.clients,
          updatedFiles.workers,
          updatedFiles.tasks
        );
        const { results, summary } = validator.validate();

        const crossErrors = performCrossValidation(
          updatedFiles.clients,
          updatedFiles.workers,
          updatedFiles.tasks
        );

        const groupedErrors = {
          clients: [
            ...results.filter((e) => e.entity === "client"),
            ...crossErrors.filter((e) => e.entity === "client"),
          ],
          workers: [
            ...results.filter((e) => e.entity === "worker"),
            ...crossErrors.filter((e) => e.entity === "worker"),
          ],
          tasks: [
            ...results.filter((e) => e.entity === "task"),
            ...crossErrors.filter((e) => e.entity === "task"),
          ],
        };

        setValidationErrors(groupedErrors);

        setValidationStats({
          totalRecords:
            updatedFiles.clients.length + updatedFiles.workers.length + updatedFiles.tasks.length,
          errors:
            results.filter((e) => e.type === "error").length + crossErrors.length,
          warnings: results.filter((e) => e.type === "warning").length,
          dataQuality: summary.dataQuality || 100,
        });
      }

      return updatedFiles;
    });
  };

  const uploadTypes = [
    {
      type: "clients",
      label: "Upload Client Data",
      description: "Upload your client spreadsheet for validation and AI enhancements.",
    },
    {
      type: "workers",
      label: "Upload Worker Data",
      description: "Upload your worker spreadsheet to detect overload and optimize assignments.",
    },
    {
      type: "tasks",
      label: "Upload Task Data",
      description: "Upload your task spreadsheet for rule generation and scheduling insights.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#121212] text-white px-6 py-10 font-sans">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-purple-500 mb-4">
        Resource Forge AI
      </h1>
      <p className="text-center text-gray-300 max-w-3xl mx-auto mb-10">
        Transform chaotic spreadsheets into intelligent resource allocation with AI-powered data processing,
        validation, and rule generation.
      </p>

      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        {["Smart Data Processing", "AI Validation", "Rule Generation"].map((label) => (
          <span
            key={label}
            className="bg-[#1f1f1f] text-white px-5 py-2 rounded-full border border-purple-500 hover:bg-purple-600 transition"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1f1f1f] rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-400">Total Records</p>
          <p className="text-xl text-purple-400 font-semibold">{validationStats.totalRecords}</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-400">Data Quality</p>
          <p className="text-xl text-green-400 font-semibold">{validationStats.dataQuality}</p>
        </div>
        <div className="bg-[#1f1f1f] rounded-xl p-4 shadow-md">
          <p className="text-sm text-gray-400">Errors / Warnings</p>
          <p className="text-xl">
            <span className="text-red-400 font-semibold">{validationStats.errors}</span>
            <span className="mx-2">/</span>
            <span className="text-orange-400 font-semibold">{validationStats.warnings}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {["upload", "validation", "rules", "export"].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-6 py-2 rounded-full border transition text-sm md:text-base ${
              view === tab
                ? "bg-purple-500 text-white"
                : "border-gray-600 text-gray-400 hover:bg-[#1f1f1f]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {view === "upload" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {uploadTypes.map(({ type, label, description }) => (
            <FileUploader
              key={type}
              label={label}
              description={description}
              entityType={type}
              onFileSelect={(file) => handleFileUpload(file, type)}
            />
          ))}
        </div>
      )}

      {view === "validation" && (
        <>
          {["clients", "workers", "tasks"].map((type) => (
            <DataGrid
              key={type}
              entityType={type}
              data={uploadedFiles[type]}
              validationErrors={validationErrors[type]}
              onDataChange={(newData, entityType) =>
                setUploadedFiles((prev) => ({
                  ...prev,
                  [entityType]: newData,
                }))
              }
              onNaturalLanguageSearch={(query, type) => {
                console.log("Search Query:", query, "on", type);
              }}
            />
          ))}
        </>
      )}

      {view === "rules" && (
        <RuleBuilder
          clients={uploadedFiles.clients}
          workers={uploadedFiles.workers}
          tasks={uploadedFiles.tasks}
          rules={rules}
          onRulesChange={setRules}
        />
      )}

      {view === "export" && (
        <ExportManager
          validationStats={validationStats}
          clients={uploadedFiles.clients}
          workers={uploadedFiles.workers}
          tasks={uploadedFiles.tasks}
          rules={rules}
        />
      )}

      <Footer />
    </main>
  );
}
