import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, FileSpreadsheet, Download,
  CheckCircle, XCircle, AlertCircle,
  ChevronRight, RotateCcw, FileText,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const STEPS = { UPLOAD: 0, PREVIEW: 1, RESULT: 2 };
const STEP_LABELS = ['Upload File', 'Preview & Validate', 'Import Result'];
const MAX_ROWS = 500;

const BulkImportModal = ({ isOpen, onClose, onImport }) => {
  const [step, setStep]               = useState(STEPS.UPLOAD);
  const [isDragging, setIsDragging]   = useState(false);
  const [fileName, setFileName]       = useState('');
  const [parsedRows, setParsedRows]   = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [parseError, setParseError]   = useState('');
  const fileInputRef = useRef(null);

  const validRows   = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  // ── Parse uploaded file ────────────────────────────────────────────────
  const parseFile = (file) => {
    setParseError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook  = XLSX.read(e.target.result, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows   = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          setParseError('The file is empty or has no data rows.');
          return;
        }
        if (rawRows.length > MAX_ROWS) {
          setParseError(`Too many rows. Maximum allowed is ${MAX_ROWS}.`);
          return;
        }

        const rows = rawRows.map((raw, index) => {
          // Normalize keys: "Name", "NAME", " name " → "name"
          const normalized = {};
          Object.keys(raw).forEach((k) => {
            normalized[k.toLowerCase().trim()] = String(raw[k]).trim();
          });

          const name  = normalized.name  || '';
          const email = normalized.email || '';
          const errors = [];

          if (!name)                      errors.push('Name is required');
          if (!email)                     errors.push('Email is required');
          else if (!validateEmail(email)) errors.push('Invalid email format');

          return {
            row: index + 1,
            name,
            email,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(rows);
        setStep(STEPS.PREVIEW);
      } catch {
        setParseError('Failed to read file. Please check the format and try again.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // ── File selection & validation ────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setParseError('Invalid file type. Please upload .csv, .xlsx, or .xls');
      return;
    }
    setFileName(file.name);
    parseFile(file);
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  // ── Download template ──────────────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: 'John Doe',   email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' },
      { name: 'Bob Wilson', email: 'bob@example.com'  },
    ]);

    // Column widths
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users_import_template.xlsx');
  };

  // ── Import ─────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (validRows.length === 0) return;
    setLoading(true);
    try {
      const result = await onImport(validRows.map((r) => ({ name: r.name, email: r.email })));
      setImportResult(result);
      setStep(STEPS.RESULT);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset & Close ──────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(STEPS.UPLOAD);
    setFileName('');
    setParsedRows([]);
    setImportResult(null);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => { handleReset(); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bulk Import Users</h2>
              <p className="text-sm text-gray-500">Upload CSV or Excel — up to {MAX_ROWS} rows</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center gap-1 px-6 py-3 bg-gray-50 border-b">
          {STEP_LABELS.map((label, i) => {
            const isActive = i === step;
            const isDone   = i < step;
            return (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isActive ? 'border-blue-600 bg-blue-600 text-white' :
                    isDone   ? 'border-green-600 bg-green-600 text-white' :
                               'border-gray-300 text-gray-400'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ════ STEP 1: Upload ════ */}
          {step === STEPS.UPLOAD && (
            <div className="space-y-5">

              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                  isDragging ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-1">
                  {isDragging ? 'Release to upload' : 'Drag & drop your file here'}
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                <div className="flex justify-center gap-2">
                  {['.CSV', '.XLSX', '.XLS'].map((ext) => (
                    <span key={ext} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-mono font-medium rounded-full">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parse error */}
              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Required columns */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">📋 Required Columns</p>
                <div className="flex gap-2 mb-2">
                  <code className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-sm font-mono text-amber-800">name</code>
                  <code className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-sm font-mono text-amber-800">email</code>
                </div>
                <p className="text-xs text-amber-600">Headers are case-insensitive. Rows with errors will be skipped during import.</p>
              </div>

              {/* Download Template */}
              <button
                onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 text-green-700 rounded-xl hover:bg-green-50 font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Sample Template (.xlsx)
              </button>
            </div>
          )}

          {/* ════ STEP 2: Preview ════ */}
          {step === STEPS.PREVIEW && (
            <div className="space-y-4">
              {/* File name */}
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-medium truncate">{fileName}</span>
                <span className="ml-auto text-gray-400 shrink-0">{parsedRows.length} rows</span>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{parsedRows.length}</p>
                  <p className="text-xs font-semibold text-blue-700 mt-0.5 uppercase tracking-wide">Total</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
                  <p className="text-xs font-semibold text-green-700 mt-0.5 uppercase tracking-wide">Valid</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{invalidRows.length}</p>
                  <p className="text-xs font-semibold text-red-700 mt-0.5 uppercase tracking-wide">Invalid</p>
                </div>
              </div>

              {/* Preview table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Row</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.row}
                          className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}
                        >
                          <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{row.row}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {row.name || <span className="text-red-400 italic text-xs">empty</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.email || <span className="text-red-400 italic text-xs">empty</span>}
                          </td>
                          <td className="px-4 py-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> Valid
                              </span>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold">
                                  <XCircle className="w-3.5 h-3.5" /> Invalid
                                </span>
                                <p className="text-red-500 text-xs mt-0.5 leading-snug">
                                  {row.errors.join(', ')}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warning if some rows invalid */}
              {invalidRows.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>
                    <strong>{invalidRows.length} row(s)</strong> will be skipped.
                    Only <strong>{validRows.length} valid row(s)</strong> will be sent to the server.
                  </span>
                </div>
              )}

              {/* No valid rows */}
              {validRows.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>No valid rows found. Please fix the errors and re-upload the file.</span>
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 3: Result ════ */}
          {step === STEPS.RESULT && importResult && (
            <div className="py-4 space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Import Complete!</h3>
                <p className="text-gray-500 text-sm mt-1">Here's a summary of what happened</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm font-semibold text-green-700 mt-1">Imported</p>
                  <p className="text-xs text-green-600 mt-0.5">Successfully added</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                  <p className="text-3xl font-bold text-amber-600">{importResult.skipped}</p>
                  <p className="text-sm font-semibold text-amber-700 mt-1">Skipped</p>
                  <p className="text-xs text-amber-600 mt-0.5">Duplicate email</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                  <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm font-semibold text-red-700 mt-1">Failed</p>
                  <p className="text-xs text-red-600 mt-0.5">Validation errors</p>
                </div>
              </div>

              {/* Failed rows detail */}
              {importResult.failedRows?.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2.5 border-b border-red-200">
                    <p className="text-sm font-semibold text-red-700">Failed Rows Detail</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-red-100">
                    {importResult.failedRows.map((r) => (
                      <div key={r.row} className="px-4 py-2.5 text-sm flex items-start gap-3">
                        <span className="text-gray-400 font-mono text-xs shrink-0 mt-0.5">Row {r.row}</span>
                        <span className="text-red-600">{r.errors.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={step === STEPS.UPLOAD ? handleClose : handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            {step === STEPS.UPLOAD
              ? 'Cancel'
              : <><RotateCcw className="w-4 h-4" /> Start Over</>
            }
          </button>

          <div className="flex gap-3">
            {step === STEPS.PREVIEW && (
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                           font-medium transition-colors text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {validRows.length} User{validRows.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
            {step === STEPS.RESULT && (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;