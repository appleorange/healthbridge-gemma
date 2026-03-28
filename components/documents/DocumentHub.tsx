'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp, GitCompare } from 'lucide-react'
import type { UserProfile, ParsedDocument } from '@/types'

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance_card:  'Insurance Card',
  eob:             'Explanation of Benefits (EOB)',
  prior_auth:      'Prior Authorization',
  appeal_letter:   'Appeal Letter',
  tax_form:        'Tax Form',
  plan_summary:    'Plan Summary',
  employer_guide:  'Employer Benefits Guide',
  unknown:         'Health Insurance Document',
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 10

interface DenialSignal {
  planName: string
  denialReason: string
  denialDate: string
  serviceDescription: string
}

interface Props {
  userProfile: UserProfile
  documents: ParsedDocument[]
  onDocumentsChange: (docs: ParsedDocument[]) => void
  onDenialDetected?: (denial: DenialSignal) => void
}

type DocTab = 'upload' | 'compare'

export default function DocumentHub({ userProfile, documents, onDocumentsChange, onDenialDetected }: Props) {
  const [docTab, setDocTab] = useState<DocTab>('upload')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareNarrative, setCompareNarrative] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`${file.name}: unsupported format. Please upload a PDF or image (JPG, PNG, WebP).`)
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`${file.name} is too large (max ${MAX_MB}MB).`)
        continue
      }

      setUploading(true)
      try {
        const base64 = await fileToBase64(file)
        const res = await fetch('/api/documents/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64,
            mimeType: file.type,
            fileName: file.name,
            userProfile,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }

        const parsed: ParsedDocument = await res.json()
        onDocumentsChange([...documents, parsed])
        setExpandedDoc(parsed.id)

        // Detect denials and surface the appeal assistant
        const isDenialDoc = parsed.documentType === 'appeal_letter' ||
          parsed.documentType === 'eob' ||
          parsed.summary.toLowerCase().includes('denied') ||
          parsed.summary.toLowerCase().includes('denial') ||
          parsed.extractedFields.some(f => f.flagged && (f.label.toLowerCase().includes('denial') || f.label.toLowerCase().includes('denied')))
        if (isDenialDoc && onDenialDetected) {
          const denialField = parsed.extractedFields.find(f => f.label.toLowerCase().includes('denial reason') || f.label.toLowerCase().includes('reason for denial'))
          const dateField = parsed.extractedFields.find(f => f.label.toLowerCase().includes('denial date') || f.label.toLowerCase().includes('date of denial'))
          const planField = parsed.extractedFields.find(f => f.label.toLowerCase().includes('plan') || f.label.toLowerCase().includes('insurer'))
          const serviceField = parsed.extractedFields.find(f => f.label.toLowerCase().includes('service') || f.label.toLowerCase().includes('procedure'))
          onDenialDetected({
            planName: planField?.value ?? '',
            denialReason: denialField?.value ?? parsed.summary,
            denialDate: dateField?.value ?? '',
            serviceDescription: serviceField?.value ?? '',
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    }
  }

  function removeDocument(id: string) {
    onDocumentsChange(documents.filter(d => d.id !== id))
    setCompareNarrative(null)
    if (expandedDoc === id) setExpandedDoc(null)
  }

  async function generateComparison() {
    const planDocs = documents.filter(d => d.planDetails && Object.values(d.planDetails).some(v => v))
    if (planDocs.length < 2) return

    setCompareLoading(true)
    setCompareNarrative(null)

    try {
      const planSummaries = planDocs.map((d, i) =>
        `Plan ${i + 1} (${d.fileName}):\n` +
        `- Deductible: ${d.planDetails?.deductible || 'N/A'}\n` +
        `- Out-of-pocket max: ${d.planDetails?.outOfPocketMax || 'N/A'}\n` +
        `- Network type: ${d.planDetails?.networkType || 'N/A'}\n` +
        `- Monthly premium: ${d.planDetails?.premium || 'N/A'}\n` +
        `- Coinsurance: ${d.planDetails?.coinsurance || 'N/A'}\n` +
        `- Copays: ${JSON.stringify(d.planDetails?.copays || {})}`
      ).join('\n\n')

      const userContext = `User profile: ${userProfile.immigrationStatus}, ${userProfile.state}, income ~$${userProfile.annualIncome.toLocaleString()}, expected usage: ${userProfile.expectedHealthcareUsage || 'unknown'}, takes medications: ${userProfile.takesRegularMedications ? 'yes' : 'no'}.`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Compare these ${planDocs.length} health insurance plans for me in plain language. Tell me which is the better fit for my situation and why, covering cost, coverage, and network considerations.\n\n${userContext}\n\n${planSummaries}`,
          }],
          userProfile,
        }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setCompareNarrative(full)
      }
    } catch (e) {
      setCompareNarrative('Failed to generate comparison. Please try again.')
      console.error(e)
    } finally {
      setCompareLoading(false)
    }
  }

  const planDocs = documents.filter(d => d.planDetails && Object.values(d.planDetails).some(v => v))
  const canCompare = planDocs.length >= 2

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: 'upload', label: 'Upload & Parse' },
          { id: 'compare', label: `Compare Plans${canCompare ? ` (${planDocs.length})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setDocTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              docTab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* UPLOAD TAB */}
      {docTab === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Upload any health insurance document — insurance cards, EOBs, prior authorization letters, plan summaries, employer guides, or tax forms. Claude will extract key fields and flag important deadlines.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault() }}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              uploading
                ? 'border-brand-300 bg-brand-50'
                : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-brand-600 font-medium">Analyzing document with AI…</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Drop files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WebP — up to {MAX_MB}MB each</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Parsed documents */}
          {documents.length > 0 && (
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Document header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-400">{DOC_TYPE_LABELS[doc.documentType] || 'Document'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedDoc === doc.id
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedDoc === doc.id && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      {/* Summary */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Summary</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{doc.summary}</p>
                      </div>

                      {/* Plan details if available */}
                      {doc.planDetails && Object.values(doc.planDetails).some(v => v) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Plan Details</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              ['Deductible', doc.planDetails.deductible],
                              ['Out-of-pocket max', doc.planDetails.outOfPocketMax],
                              ['Network type', doc.planDetails.networkType],
                              ['Monthly premium', doc.planDetails.premium],
                              ['Coinsurance', doc.planDetails.coinsurance],
                            ].filter(([, v]) => v).map(([label, value]) => (
                              <div key={label as string} className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-xs text-gray-400">{label}</p>
                                <p className="text-sm font-semibold text-gray-800">{value}</p>
                              </div>
                            ))}
                            {doc.planDetails.copays && Object.entries(doc.planDetails.copays).map(([k, v]) => (
                              <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                                <p className="text-xs text-gray-400">Copay: {k}</p>
                                <p className="text-sm font-semibold text-gray-800">{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extracted fields */}
                      {doc.extractedFields.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Extracted Fields</p>
                          <div className="space-y-1.5">
                            {doc.extractedFields.map((f, i) => (
                              <div key={i} className={`flex items-start justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0 ${f.flagged ? 'text-amber-700' : ''}`}>
                                <span className={`text-xs ${f.flagged ? 'font-semibold' : 'text-gray-500'}`}>{f.label}</span>
                                <div className="flex items-center gap-1">
                                  {f.flagged && <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                                  <span className={`text-xs font-medium text-right ${f.flagged ? 'text-amber-700' : 'text-gray-700'}`}>{f.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deadlines */}
                      {doc.deadlines.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Deadlines</p>
                          <div className="space-y-2">
                            {doc.deadlines.map((dl, i) => (
                              <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${dl.urgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-100'}`}>
                                <span className={`text-xs font-medium ${dl.urgent ? 'text-red-700' : 'text-amber-700'}`}>{dl.label}</span>
                                <span className={`text-xs font-bold ${dl.urgent ? 'text-red-600' : 'text-amber-600'}`}>{dl.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {documents.length === 0 && !uploading && (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">Upload a document above to get started.</p>
            </div>
          )}

          {canCompare && (
            <div
              onClick={() => setDocTab('compare')}
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-all"
            >
              <GitCompare className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Compare your plans</p>
                <p className="text-xs text-blue-600">You have {planDocs.length} plan documents — get an AI comparison.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPARE TAB */}
      {docTab === 'compare' && (
        <div className="space-y-4">
          {!canCompare ? (
            <div className="text-center py-12">
              <GitCompare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">Upload at least 2 plan summary documents</p>
              <p className="text-xs text-gray-400 mt-1">Go to Upload & Parse to add plan documents first.</p>
              <button
                onClick={() => setDocTab('upload')}
                className="mt-4 btn-secondary text-sm"
              >
                Upload documents
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Comparing {planDocs.length} plan documents. The AI will analyze cost structure, coverage, and which plan fits your profile.
              </p>

              {/* Side-by-side table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 w-32">Field</th>
                      {planDocs.map((doc, i) => (
                        <th key={doc.id} className="text-left p-3 text-xs font-semibold text-gray-700 border-b border-gray-100">
                          Plan {i + 1}
                          <div className="text-gray-400 font-normal normal-case truncate max-w-[140px]">{doc.fileName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'networkType',   label: 'Network type' },
                      { key: 'premium',       label: 'Monthly premium' },
                      { key: 'deductible',    label: 'Deductible' },
                      { key: 'outOfPocketMax', label: 'Out-of-pocket max' },
                      { key: 'coinsurance',   label: 'Coinsurance' },
                    ].map(row => (
                      <tr key={row.key} className="border-b border-gray-50">
                        <td className="p-3 text-xs text-gray-500 font-medium">{row.label}</td>
                        {planDocs.map(doc => (
                          <td key={doc.id} className="p-3 text-sm text-gray-800 font-medium">
                            {(doc.planDetails as Record<string, string | undefined>)?.[row.key] || <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI narrative */}
              {!compareNarrative && !compareLoading && (
                <button
                  onClick={generateComparison}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <GitCompare className="w-4 h-4" />
                  Get AI comparison & recommendation
                </button>
              )}

              {compareLoading && !compareNarrative && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <p className="text-sm text-gray-500">Analyzing your plans…</p>
                </div>
              )}

              {compareNarrative && (
                <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-brand-600" />
                    <p className="text-sm font-semibold text-brand-800">AI Comparison</p>
                  </div>
                  <p className="text-sm text-brand-900 leading-relaxed whitespace-pre-line">{compareNarrative}</p>
                  <button
                    onClick={generateComparison}
                    className="mt-3 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix: "data:mime/type;base64,"
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
