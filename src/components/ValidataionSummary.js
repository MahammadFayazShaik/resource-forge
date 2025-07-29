import React from "react";
import "./ValidationSummary.css";

const ValidationSummary = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return (
      <div className="validation-summary no-errors">
        ✅ No validation issues found!
      </div>
    );
  }

  return (
    <div className="validation-summary">
      <h4>⚠ Validation Issues</h4>
      <ul>
        {errors.map((error, index) => (
          <li key={index}>
            <strong>{error.type}</strong>{" "}
            {error.column && <>in <code>{error.column}</code></>}
            {error.row !== undefined && <> (Row {error.row + 1})</>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary;
