export class DataValidator {
  constructor(clients, workers, tasks) {
    this.clients = clients || [];
    this.workers = workers || [];
    this.tasks = tasks || [];
  }

  validate() {
    const allErrors = [
      ...this.validateRequiredFields(),
      ...this.validateDataTypes(),
      ...this.validateDuplicateIDs(),
      ...this.validateReferenceIntegrity(),
      ...this.validateValueRanges(),
      ...this.validateSkillCoverage(),
      ...this.validateWorkerCapacity(),
      ...this.validateWithAI(),
    ];

    return {
      results: allErrors,
      summary: this.calculateDataQuality(allErrors),
    };
  }

  calculateDataQuality(errors) {
    const totalRecords = this.clients.length + this.workers.length + this.tasks.length;
    const issueCount = errors.length;
    const quality = totalRecords === 0 ? 100 : Math.max(0, 100 - (issueCount / totalRecords) * 100);
    return {
      totalRecords,
      issues: issueCount,
      dataQuality: `${Math.round(quality)}%`,
    };
  }

  validateRequiredFields() {
    const errors = [];

    this.clients.forEach((client) => {
      if (!client.ClientID) {
        errors.push({
          id: `client-${Math.random()}`,
          type: 'error',
          entity: 'client',
          entityId: client.ClientID || 'unknown',
          field: 'ClientID',
          message: 'Missing ClientID',
        });
      }
    });

    this.workers.forEach((worker) => {
      if (!worker.WorkerID) {
        errors.push({
          id: `worker-${Math.random()}`,
          type: 'error',
          entity: 'worker',
          entityId: worker.WorkerID || 'unknown',
          field: 'WorkerID',
          message: 'Missing WorkerID',
        });
      }
    });

    this.tasks.forEach((task) => {
      if (!task.TaskID) {
        errors.push({
          id: `task-${Math.random()}`,
          type: 'error',
          entity: 'task',
          entityId: task.TaskID || 'unknown',
          field: 'TaskID',
          message: 'Missing TaskID',
        });
      }
    });

    return errors;
  }

 validateDataTypes() {
  const errors = [];

  this.tasks.forEach((task) => {
    const val = task.Duration;

    // Try converting to Number and validate
    if (val === undefined || val === null || val === '') {
      errors.push({
        id: `task-${task.TaskID}-duration`,
        type: 'error',
        entity: 'task',
        entityId: task.TaskID || 'unknown',
        field: 'Duration',
        message: 'Duration is required and must be a number',
      });
    } else if (isNaN(Number(val))) {
      errors.push({
        id: `task-${task.TaskID}-duration`,
        type: 'error',
        entity: 'task',
        entityId: task.TaskID || 'unknown',
        field: 'Duration',
        message: 'Duration must be a number',
      });
    }
  });

  return errors;
}


  validateDuplicateIDs() {
    const errors = [];

    const checkDuplicates = (items, key, entity) => {
      const map = new Map();
      items.forEach((item) => {
        const id = item[key];
        if (!id) return;
        map.set(id, (map.get(id) || 0) + 1);
      });
      map.forEach((count, id) => {
        if (count > 1) {
          errors.push({
            id: `${entity}-dup-${id}`,
            type: 'error',
            entity,
            entityId: id,
            field: key,
            message: `Duplicate ${key}: ${id}`,
            suggestion: 'Each ID must be unique',
          });
        }
      });
    };

    checkDuplicates(this.clients, 'ClientID', 'client');
    checkDuplicates(this.workers, 'WorkerID', 'worker');
    checkDuplicates(this.tasks, 'TaskID', 'task');

    return errors;
  }

  validateReferenceIntegrity() {
    const errors = [];
    const taskIds = new Set(this.tasks.map((task) => task.TaskID));

    this.clients.forEach((client) => {
      const taskId = client.RequestedTaskID;
      if (taskId && !taskIds.has(taskId)) {
        errors.push({
          id: `client-${client.ClientID}-ref`,
          type: 'error',
          entity: 'client',
          entityId: client.ClientID || 'unknown',
          field: 'RequestedTaskID',
          message: `Invalid Task reference: ${taskId}`,
          suggestion: 'Reference a valid TaskID',
        });
      }
    });

    return errors;
  }

  validateValueRanges() {
    const errors = [];

    this.tasks.forEach((task) => {
      if (task.Duration < 1 || task.Duration > 24) {
        errors.push({
          id: `task-${task.TaskID}-range`,
          type: 'warning',
          entity: 'task',
          entityId: task.TaskID || 'unknown',
          field: 'Duration',
          message: 'Duration out of expected range (1–24)',
          suggestion: 'Adjust duration to a valid range',
        });
      }
    });

    return errors;
  }

  validateSkillCoverage() {
    const errors = [];
    const allWorkerSkills = new Set();
    this.workers.forEach((w) => this.ensureArray(w.Skills).forEach((s) => allWorkerSkills.add(s)));

    this.tasks.forEach((task) => {
      const missingSkills = this.ensureArray(task.RequiredSkills).filter((s) => !allWorkerSkills.has(s));
      if (missingSkills.length) {
        errors.push({
          id: `task-${task.TaskID}-skills`,
          type: 'warning',
          entity: 'task',
          entityId: task.TaskID || 'unknown',
          field: 'RequiredSkills',
          message: `Missing skill coverage: ${missingSkills.join(', ')}`,
          suggestion: 'Ensure workers have all required skills',
        });
      }
    });

    return errors;
  }

  validateWorkerCapacity() {
    const errors = [];
    const assignments = new Map();

    this.tasks.forEach((task) => {
      this.ensureArray(task.AssignedWorkers).forEach((workerId) => {
        assignments.set(workerId, (assignments.get(workerId) || 0) + task.Duration);
      });
    });

    this.workers.forEach((worker) => {
      const load = assignments.get(worker.WorkerID) || 0;
      if (load > worker.MaxHours) {
        errors.push({
          id: `worker-${worker.WorkerID}-load`,
          type: 'warning',
          entity: 'worker',
          entityId: worker.WorkerID || 'unknown',
          field: 'MaxHours',
          message: `Overload: assigned ${load}h vs. max ${worker.MaxHours}h`,
          suggestion: 'Reassign tasks or increase MaxHours',
        });
      }
    });

    return errors;
  }

  validateWithAI() {
    const errors = [];
    // Placeholder for AI-enhanced validations
    return errors;
  }

  ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(',').map((s) => s.trim());
    }
    return [];
  }
}
