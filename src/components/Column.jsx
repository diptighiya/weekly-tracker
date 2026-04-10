import TicketCard from './TicketCard'

const COLUMN_META = {
  todo: {
    label: 'To Do',
    dot: 'bg-gray-400',
    header: 'bg-gray-100 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
  },
  inprogress: {
    label: 'In Progress',
    dot: 'bg-yellow-400',
    header: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/40',
  },
  done: {
    label: 'Done',
    dot: 'bg-green-400',
    header: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40',
  },
}

export default function Column({ status, tickets, onMove, onDelete, onTicketClick }) {
  const meta = COLUMN_META[status]

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 ${meta.header}`}>
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {meta.label}
        </span>
        <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
          {tickets.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin flex-1 pr-0.5">
        {tickets.length === 0 && (
          <div className="text-center py-10 text-xs text-gray-400 dark:text-gray-600 italic select-none">
            No tickets
          </div>
        )}
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onMove={onMove}
            onDelete={onDelete}
            onClick={onTicketClick}
          />
        ))}
      </div>
    </div>
  )
}
