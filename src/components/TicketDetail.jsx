import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORY_COLORS = {
  Outreach: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  LeetCode: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Concepts: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  College: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Learning: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Resume: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Interview Prep': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' }

export default function TicketDetail({ ticket, userId, onClose, onUpdate }) {
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [loadingAttachments, setLoadingAttachments] = useState(true)

  useEffect(() => {
    fetchAttachments()
  }, [ticket.id])

  async function fetchAttachments() {
    setLoadingAttachments(true)
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .list(`${userId}/${ticket.id}`, { limit: 50 })
    if (!error && data) {
      setAttachments(data.filter(f => f.name !== '.emptyFolderPlaceholder'))
    }
    setLoadingAttachments(false)
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)

    const filePath = `${userId}/${ticket.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file)

    if (error) {
      setUploadError(error.message)
    } else {
      await fetchAttachments()
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDownload(fileName) {
    const filePath = `${userId}/${ticket.id}/${fileName}`
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .download(filePath)
    if (error) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.replace(/^\d+_/, '')
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDeleteAttachment(fileName) {
    const filePath = `${userId}/${ticket.id}/${fileName}`
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .remove([filePath])
    if (!error) await fetchAttachments()
  }

  const categoryColor = CATEGORY_COLORS[ticket.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
              {ticket.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {STATUS_LABELS[ticket.status]}
              </span>
              {ticket.category && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
                    {ticket.category}
                  </span>
                </>
              )}
              {ticket.due_day && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Due {ticket.due_day}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">
          {ticket.description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Description
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>
          )}

          {ticket.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Notes
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {ticket.notes}
              </p>
            </div>
          )}

          {/* Attachments */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Attachments
            </h3>

            {uploadError && (
              <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
                {uploadError}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium">
                {uploading ? 'Uploading...' : '+ Upload file'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>

            {loadingAttachments ? (
              <p className="text-xs text-gray-400 mt-2">Loading...</p>
            ) : attachments.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {attachments.map(file => (
                  <li key={file.name} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="flex-1 truncate">{file.name.replace(/^\d+_/, '')}</span>
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(file.name)}
                      className="text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 italic">No attachments yet</p>
            )}
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-600 pt-1">
            Created {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  )
}
