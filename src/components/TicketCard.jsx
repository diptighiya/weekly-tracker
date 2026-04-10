import { useState } from 'react'

const CATEGORY_COLORS = {
  Outreach: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  LeetCode: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Concepts: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  College: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Learning: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Resume: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Interview Prep': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const STATUS_ORDER = ['todo', 'inprogress', 'done']

export default function TicketCard({ ticket, onMove, onDelete, onClick }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const currentIndex = STATUS_ORDER.indexOf(ticket.status)
  const canMoveForward = currentIndex < STATUS_ORDER.length - 1

  function handleDelete(e) {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(ticket.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 2500)
    }
  }

  function handleMove(e) {
    e.stopPropagation()
    if (canMoveForward) {
      onMove(ticket.id, STATUS_ORDER[currentIndex + 1])
    }
  }

  const categoryColor = CATEGORY_COLORS[ticket.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

  return (
    <div
      onClick={() => onClick(ticket)}
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 flex-1">
          {ticket.title}
        </h3>
        {ticket.category && (
          <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
            {ticket.category}
          </span>
        )}
      </div>

      {ticket.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {ticket.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {ticket.due_day && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Due {ticket.due_day}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canMoveForward && (
            <button
              onClick={handleMove}
              title="Move forward"
              className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
            >
              Move &rarr;
            </button>
          )}
          <button
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${
              confirmDelete
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
            }`}
          >
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
