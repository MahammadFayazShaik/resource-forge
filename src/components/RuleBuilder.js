import React, { useState, useCallback } from 'react';
import { Plus, X, Settings, Wand2, Download } from 'lucide-react';

// Minimal Card component (replacing ui/card)
const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg shadow bg-white p-4 ${className}`}>{children}</div>
);

// Minimal Button component (replacing ui/button)
const Button = ({ children, variant, size, className = '', ...props }) => {
  let baseClass = 'rounded text-black focus:outline-none focus:ring ';

  if (variant === 'outline') {
    baseClass +=
      'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white ';
  } else if (variant === 'ghost') {
    baseClass += 'bg-transparent hover:bg-gray-200 text-gray-700 ';
  } else {
    baseClass += 'bg-blue-600 hover:bg-blue-700 ';
  }

  if (size === 'sm') {
    baseClass += 'px-3 py-1 text-sm ';
  } else {
    baseClass += 'px-4 py-2 ';
  }

  return (
    <button type="button" {...props} className={`${baseClass} ${className}`}>
      {children}
    </button>
  );
};

// Minimal Input component (replacing ui/input)
const Input = (props) => (
  <input
    {...props}
    className={`border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring focus:border-blue-500 ${props.className || ''}`}
  />
);

// Minimal Label component (replacing ui/label)
const Label = ({ children, className = '', ...props }) => (
  <label className={`block mb-1 font-medium text-gray-700 ${className}`} {...props}>
    {children}
  </label>
);

// Minimal Textarea component (replacing ui/textarea)
const Textarea = (props) => (
  <textarea
    {...props}
    className={`border border-gray-300 rounded p-2 w-full resize-y focus:outline-none focus:ring focus:border-blue-500 ${props.className || ''}`}
  />
);

// Minimal Select components (replacing ui/select)
// Basic select with label and option list, supporting multiple for coRun
const Select = ({ value, onChange, multiple = false, children, className = '' }) => (
  <select
    value={value}
    onChange={onChange}
    multiple={multiple}
    className={`border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring focus:border-blue-500 ${className}`}
  >
    {children}
  </select>
);

const Option = ({ value, children }) => (
  <option value={value}>
    {children}
  </option>
);

// Minimal Badge component (replacing ui/badge)
const Badge = ({ children, variant = 'default', className = '' }) => {
  const colors = {
    default: 'bg-gray-200 text-gray-900',
    destructive: 'bg-red-200 text-red-900',
    outline: 'border border-gray-500 text-gray-700 bg-transparent',
  };
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded ${colors[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Minimal Separator (replacing ui/separator)
const Separator = () => (
  <hr className="my-6 border-gray-300" />
);

export const RuleBuilder = ({ clients = [], workers = [], tasks = [], rules = [], onRulesChange }) => {
  const [selectedRuleType, setSelectedRuleType] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleParameters, setRuleParameters] = useState({});
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');

  const ruleTypes = [
    { value: 'coRun', label: 'Co-Run Tasks', description: 'Tasks that must run together' },
    { value: 'slotRestriction', label: 'Slot Restriction', description: 'Limit common time slots' },
    { value: 'loadLimit', label: 'Load Limit', description: 'Maximum workload per phase' },
    { value: 'phaseWindow', label: 'Phase Window', description: 'Restrict tasks to specific phases' },
    { value: 'patternMatch', label: 'Pattern Match', description: 'Rule based on patterns' },
    { value: 'precedenceOverride', label: 'Precedence Override', description: 'Override rule priorities' }
  ];

  // Simple toast simulation using alert (replace with your toast or notification logic)
  const toast = ({ title, description }) => {
    alert(`${title}\n${description}`);
  };

  const handleAddRule = useCallback(() => {
    if (!selectedRuleType || !ruleName) {
      toast({
        title: "Validation Error",
        description: "Please provide rule type and name"
      });
      return;
    }

    const newRule = {
      id: `rule-${Date.now()}`,
      type: selectedRuleType,
      name: ruleName,
      description: ruleDescription,
      parameters: ruleParameters,
      priority: rules.length + 1
    };

    if (typeof onRulesChange === 'function') {
      onRulesChange([...rules, newRule]);
    }

    setSelectedRuleType('');
    setRuleName('');
    setRuleDescription('');
    setRuleParameters({});

    toast({
      title: "Rule Added",
      description: `${ruleName} has been added`
    });
  }, [selectedRuleType, ruleName, ruleDescription, ruleParameters, rules, onRulesChange]);

  const handleRemoveRule = useCallback((ruleId) => {
    if (typeof onRulesChange === 'function') {
      onRulesChange(rules.filter(rule => rule.id !== ruleId));
    }
    toast({
      title: "Rule Removed",
      description: "Rule has been removed"
    });
  }, [rules, onRulesChange]);

  const handleNaturalLanguageRule = useCallback(() => {
    if (!naturalLanguageRule.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the rule you want to create"
      });
      return;
    }

    toast({
      title: "AI Rule Processing",
      description: `Analyzing: "${naturalLanguageRule.substring(0, 50)}..."`
    });

    setTimeout(() => {
      const suggestedRule = parseNaturalLanguageRule(naturalLanguageRule);
      if (suggestedRule) {
        setSelectedRuleType(suggestedRule.type);
        setRuleName(suggestedRule.name);
        setRuleDescription(suggestedRule.description);
        setRuleParameters(suggestedRule.parameters);

        toast({
          title: "AI Suggestion Ready",
          description: "Review the suggested rule configuration below"
        });
      }
    }, 1500);

    setNaturalLanguageRule('');
  }, [naturalLanguageRule]);

  const handleExportRules = useCallback(() => {
    const rulesConfig = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      rules: rules,
      metadata: {
        totalRules: rules.length,
        ruleTypes: Array.from(new Set(rules.map(r => r.type))),
        generatedBy: "Resource Forge AI"
      }
    };

    const blob = new Blob([JSON.stringify(rulesConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules-config.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Rules Exported",
      description: "rules-config.json has been downloaded"
    });
  }, [rules]);

  const renderRuleForm = () => {
    switch (selectedRuleType) {
      case 'coRun':
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Tasks to Co-Run</Label>
              <Select
                value={ruleParameters.tasks?.join(',') || ''}
                onChange={e =>
                  setRuleParameters({
                    ...ruleParameters,
                    tasks: e.target.value ? e.target.value.split(',') : []
                
                  })
                }
                multiple
                className="h-32 text-black"
              >
                {tasks.map(task => (
                  <Option key={task.TaskID} value={task.TaskID}>
                    {task.TaskName} ({task.TaskID})
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        );

      case 'loadLimit':
        return (
          <div className="space-y-4">
            <div>
              <Label>Worker Group</Label>
              <Select
                value={ruleParameters.workerGroup || ''}
                onChange={e =>
                  setRuleParameters({
                    ...ruleParameters,
                    workerGroup: e.target.value
                  })
                }
              >
                <option value="">Select worker group</option>
                {Array.from(new Set(workers.map(w => w.WorkerGroup))).map(group => (
                  <Option key={group} value={group}>
                    {group}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Max Slots Per Phase</Label>
              <Input
                type="number"
                value={ruleParameters.maxSlotsPerPhase || ''}
                onChange={e =>
                  setRuleParameters({
                    ...ruleParameters,
                    maxSlotsPerPhase: parseInt(e.target.value) || 0
                  })
                }
                placeholder="Maximum workload limit"
              />
            </div>
          </div>
        );

      case 'phaseWindow':
        return (
          <div className="space-y-4">
            <div>
              <Label>Task</Label>
              <Select
                value={ruleParameters.taskId || ''}
                onChange={e =>
                  setRuleParameters({
                    ...ruleParameters,
                    taskId: e.target.value
                  })
                }
              >
                <option value="">Select task</option>
                {tasks.map(task => (
                  <Option key={task.TaskID} value={task.TaskID}>
                    {task.TaskName} ({task.TaskID})
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Allowed Phases (comma-separated)</Label>
              <Input
                value={ruleParameters.allowedPhases?.join(',') || ''}
                onChange={e =>
                  setRuleParameters({
                    ...ruleParameters,
                    allowedPhases: e.target.value
                      .split(',')
                      .map(p => parseInt(p.trim()))
                      .filter(p => !isNaN(p))
                  })
                }
                placeholder="e.g., 1,2,3"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Select a rule type to configure parameters
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* AI Natural Language Rule Input */}
      <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-300">
        <div className="p-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-700">
            <Wand2 className="w-5 h-5" />
            AI Rule Creator
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Describe your rule in plain English and let AI suggest the configuration
          </p>
          <div className="space-y-4">
            <Label htmlFor="nlRule">Natural Language Rule</Label>
            <Textarea
              id="nlRule"
              value={naturalLanguageRule}
              onChange={e => setNaturalLanguageRule(e.target.value)}
              placeholder="e.g., 'Tasks T001 and T002 should always run together in the same phase'"
              className="min-h-[5rem] text-black"
            />
            <Button onClick={handleNaturalLanguageRule} className="w-full flex justify-center items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate Rule with AI
            </Button>
          </div>
        </div>
      </Card>

      {/* Manual Rule Builder */}
      <Card>
        <div className="p-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5" />
            Manual Rule Builder
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Create business rules using the structured form
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-black">
            <div>
              <Label htmlFor="ruleType">Rule Type</Label>
              <Select
                id="ruleType"
                value={selectedRuleType}
                onChange={e => setSelectedRuleType(e.target.value)}
              >
                <option value="">Select rule type</option>
                {ruleTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                placeholder="Enter rule name"
              />
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="ruleDescription">Description</Label>
            <Textarea
              id="ruleDescription"
              value={ruleDescription}
              onChange={e => setRuleDescription(e.target.value)}
              placeholder="Describe what this rule does"
              className="min-h-[4rem] text-black"
            />
          </div>

          <div>
            <h3 className="text-md font-medium mb-4">Rule Parameters</h3>
            {renderRuleForm()}
          </div>

          <Button onClick={handleAddRule} className="mt-6 w-full flex justify-center items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        </div>
      </Card>

      {/* Current Rules */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                Current Rules ({rules.length})
              </h2>
              <p className="text-sm text-gray-600">
                Active business rules in your configuration
              </p>
            </div>
            {rules.length > 0 && (
              <Button onClick={handleExportRules} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Rules
              </Button>
            )}
          </div>

          {rules.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              No rules configured yet. Create your first rule above.
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-auto">
              {rules.map(rule => (
                <div key={rule.id} className="border rounded-lg p-4 bg-gray-100 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{rule.type}</Badge>
                      <span className="font-semibold">{rule.name}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{rule.description}</p>
                    <div className="text-xs text-gray-500">
                      Priority: {rule.priority} | ID: {rule.id}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRule(rule.id)}
                    className="text-red-600"
                    aria-label={`Remove rule ${rule.name}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Dummy AI rule parser simulation function (no TS annotations)
const parseNaturalLanguageRule = (input) => {
  const lower = input.toLowerCase();

  if (lower.includes('together') || lower.includes('same time') || lower.includes('co-run')) {
    return {
      type: 'coRun',
      name: 'AI Generated Co-Run Rule',
      description: `Tasks should run together based on: ${input.substring(0, 100)}...`,
      parameters: { tasks: [] }
    };
  }

  if (lower.includes('not work more than') || lower.includes('limit') || lower.includes('maximum')) {
    return {
      type: 'loadLimit',
      name: 'AI Generated Load Limit',
      description: `Load limit based on: ${input.substring(0, 100)}...`,
      parameters: { maxSlotsPerPhase: 2 }
    };
  }

  if (lower.includes('only in phase') || lower.includes('restrict to')) {
    return {
      type: 'phaseWindow',
      name: 'AI Generated Phase Window',
      description: `Phase restriction based on: ${input.substring(0, 100)}...`,
      parameters: { allowedPhases: [1, 2, 3] }
    };
  }

  return null;
};
