import React, { useRef, useState } from "react";
import "./FileUploader.css";
import { UploadCloud, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const FileUploader = ({
  label,
  description,
  entityType,
  onFileSelect,
  validationStatus, // 'success' | 'error' | 'warning'
}) => {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFile = (file) => {
    if (!file) return;

    const fileExt = file.name.split(".").pop().toLowerCase();
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!["csv", "xlsx"].includes(fileExt)) {
      setErrorMessage("Only CSV or XLSX files are supported.");
      return;
    }

    if (file.size > maxSize) {
      setErrorMessage("File too large. Limit is 5MB.");
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file, entityType); // Pass entityType for identification
    setErrorMessage("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const getValidationMessage = () => {
    if (validationStatus === "success") {
      return (
        <p className="upload-validation-success">✅ File validated successfully.</p>
      );
    }
    if (validationStatus === "error") {
      return (
        <p className="upload-validation-error">
          ❌ Errors found in {entityType} file. Please review.
        </p>
      );
    }
    if (validationStatus === "warning") {
      return (
        <p className="upload-validation-warning">
          ⚠️ Some warnings in {entityType} file. Check suggestions.
        </p>
      );
    }
    return null;
  };

  return (
    <div className="upload-container">
      <h3>{label}</h3>
      <p className="upload-description">{description}</p>

      <div
        className="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <UploadCloud className="upload-icon" size={40} />
        <p className="upload-text">Drag & drop your file here</p>
        <p className="upload-subtext">or click to browse (CSV, XLSX)</p>
        <button className="upload-btn" type="button">
          Choose File
        </button>
        <input
          type="file"
          accept=".csv, .xlsx"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {selectedFile && (
        <div className="upload-file-details">
          <p className="upload-filename">
            📄 Uploaded: {selectedFile.name}{" "}
            <span className="file-type-badge">
              {selectedFile.name.endsWith(".csv") ? "CSV" : "XLSX"}
            </span>
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="upload-error">
          <XCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {getValidationMessage()}

      <p className="upload-info">
        Ensure your file contains the required columns for <strong>{entityType}</strong>.
        Our AI helps map misnamed headers automatically.
      </p>

      {showToast && (
        <div className="upload-toast">
          <CheckCircle size={20} className="toast-icon" />
          <span>
            {entityType} file "{selectedFile?.name}" uploaded successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
