// fileParser.js
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Define constant mappings for headers
const HEADER_MAPPINGS = {
  clients: {
    client_id: 'ClientID',
    clientid: 'ClientID',
    id: 'ClientID',
    client_name: 'ClientName',
    clientname: 'ClientName',
    name: 'ClientName',
    priority_level: 'PriorityLevel',
    prioritylevel: 'PriorityLevel',
    priority: 'PriorityLevel',
    requested_task_ids: 'RequestedTaskIDs',
    requestedtaskids: 'RequestedTaskIDs',
    tasks: 'RequestedTaskIDs',
    task_ids: 'RequestedTaskIDs',
    group_tag: 'GroupTag',
    grouptag: 'GroupTag',
    group: 'GroupTag',
    attributes_json: 'AttributesJSON',
    attributesjson: 'AttributesJSON',
    attributes: 'AttributesJSON',
    metadata: 'AttributesJSON'
  },
  workers: {
    worker_id: 'WorkerID',
    workerid: 'WorkerID',
    id: 'WorkerID',
    worker_name: 'WorkerName',
    workername: 'WorkerName',
    name: 'WorkerName',
    skills: 'Skills',
    skill: 'Skills',
    available_slots: 'AvailableSlots',
    availableslots: 'AvailableSlots',
    slots: 'AvailableSlots',
    availability: 'AvailableSlots',
    max_load_per_phase: 'MaxLoadPerPhase',
    maxloadperphase: 'MaxLoadPerPhase',
    max_load: 'MaxLoadPerPhase',
    capacity: 'MaxLoadPerPhase',
    worker_group: 'WorkerGroup',
    workergroup: 'WorkerGroup',
    group: 'WorkerGroup',
    qualification_level: 'QualificationLevel',
    qualificationlevel: 'QualificationLevel',
    qualification: 'QualificationLevel',
    level: 'QualificationLevel'
  },
  tasks: {
    task_id: 'TaskID',
    taskid: 'TaskID',
    id: 'TaskID',
    task_name: 'TaskName',
    taskname: 'TaskName',
    name: 'TaskName',
    category: 'Category',
    type: 'Category',
    duration: 'Duration',
    length: 'Duration',
    time: 'Duration',
    required_skills: 'RequiredSkills',
    requiredskills: 'RequiredSkills',
    skills: 'RequiredSkills',
    skill_requirements: 'RequiredSkills',
    preferred_phases: 'PreferredPhases',
    preferredphases: 'PreferredPhases',
    phases: 'PreferredPhases',
    preferred_slots: 'PreferredPhases',
    max_concurrent: 'MaxConcurrent',
    maxconcurrent: 'MaxConcurrent',
    concurrency: 'MaxConcurrent',
    parallel: 'MaxConcurrent'
  }
};

export const parseFile = async (file, entityType) => {
  const result = {
    data: [],
    errors: [],
    warnings: []
  };

  try {
    let rawData = [];

    if (file.name.endsWith('.csv')) {
      rawData = await parseCSV(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      rawData = await parseXLSX(file);
    } else {
      result.errors.push('Unsupported file format. Please use CSV or XLSX files.');
      return result;
    }

    if (rawData.length === 0) {
      result.errors.push('No data found in the file.');
      return result;
    }

    const mappedData = mapHeaders(rawData, entityType);
    result.warnings.push(...mappedData.warnings);

    const processedData = processEntityData(mappedData.data, entityType);
    result.data = processedData.data;
    result.errors.push(...processedData.errors);
    result.warnings.push(...processedData.warnings);

  } catch (error) {
    result.errors.push(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};

const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => reject(error)
    });
  });
};

const parseXLSX = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

const mapHeaders = (data, entityType) => {
  const warnings = [];
  const mappings = HEADER_MAPPINGS[entityType] || {};

  if (data.length === 0) return { data, warnings };

  const headers = Object.keys(data[0]);
  const mappedHeaders = {};

  headers.forEach(header => {
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mapped = mappings[normalized];
    if (mapped) {
      mappedHeaders[header] = mapped;
      if (header !== mapped) {
        warnings.push(`Mapped column "${header}" to "${mapped}"`);
      }
    } else {
      mappedHeaders[header] = header;
      warnings.push(`Unknown column "${header}" - keeping as-is`);
    }
  });

  const mappedData = data.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      newRow[mappedHeaders[key]] = row[key];
    });
    return newRow;
  });

  return { data: mappedData, warnings };
};

const processEntityData = (data, entityType) => {
  const errors = [];
  const warnings = [];
  const processedData = [];

  data.forEach((row, index) => {
    try {
      let processedRow;

      if (entityType === 'clients') {
        processedRow = processClient(row, index, errors, warnings);
      } else if (entityType === 'workers') {
        processedRow = processWorker(row, index, errors, warnings);
      } else if (entityType === 'tasks') {
        processedRow = processTask(row, index, errors, warnings);
      }

      if (processedRow) {
        processedData.push(processedRow);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Processing error'}`);
    }
  });

  return { data: processedData, errors, warnings };
};

const processClient = (row, index, errors, warnings) => {
  const client = {
    ClientID: String(row.ClientID || ''),
    ClientName: String(row.ClientName || ''),
    PriorityLevel: parseInt(row.PriorityLevel) || 1,
    RequestedTaskIDs: parseArrayField(row.RequestedTaskIDs),
    GroupTag: String(row.GroupTag || ''),
    AttributesJSON: parseJSONField(row.AttributesJSON)
  };

  if (!client.ClientID) errors.push(`Row ${index + 1}: Missing ClientID`);
  if (!client.ClientName) errors.push(`Row ${index + 1}: Missing ClientName`);
  if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
    errors.push(`Row ${index + 1}: PriorityLevel must be between 1-5`);
  }

  return client;
};

const processWorker = (row, index, errors, warnings) => {
  const worker = {
    WorkerID: String(row.WorkerID || ''),
    WorkerName: String(row.WorkerName || ''),
    Skills: parseArrayField(row.Skills),
    AvailableSlots: parseNumberArrayField(row.AvailableSlots),
    MaxLoadPerPhase: parseInt(row.MaxLoadPerPhase) || 0,
    WorkerGroup: String(row.WorkerGroup || ''),
    QualificationLevel: parseInt(row.QualificationLevel) || 1
  };

  if (!worker.WorkerID) errors.push(`Row ${index + 1}: Missing WorkerID`);
  if (!worker.WorkerName) errors.push(`Row ${index + 1}: Missing WorkerName`);
  if (worker.MaxLoadPerPhase < 0) {
    errors.push(`Row ${index + 1}: MaxLoadPerPhase must be non-negative`);
  }

  return worker;
};

const processTask = (row, index, errors, warnings) => {
  const task = {
    TaskID: String(row.TaskID || ''),
    TaskName: String(row.TaskName || ''),
    Category: String(row.Category || ''),
    Duration: parseInt(row.Duration) || 1,
    RequiredSkills: parseArrayField(row.RequiredSkills),
    PreferredPhases: parseNumberArrayField(row.PreferredPhases),
    MaxConcurrent: parseInt(row.MaxConcurrent) || 1
  };

  if (!task.TaskID) errors.push(`Row ${index + 1}: Missing TaskID`);
  if (!task.TaskName) errors.push(`Row ${index + 1}: Missing TaskName`);
  if (task.Duration < 1) {
    errors.push(`Row ${index + 1}: Duration must be at least 1`);
  }

  return task;
};

const parseArrayField = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  if (Array.isArray(value)) return value.map(v => String(v));
  return [String(value)];
};

const parseNumberArrayField = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    if (value.includes('-')) {
      const [start, end] = value.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(n => parseInt(n)).filter(n => !isNaN(n));
    } catch {
      return value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    }
  }
  if (Array.isArray(value)) return value.map(v => parseInt(v)).filter(n => !isNaN(n));
  if (typeof value === 'number') return [value];
  return [];
};

const parseJSONField = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }
  return { value };
};
