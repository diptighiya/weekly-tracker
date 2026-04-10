import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Column from './Column'
import CreateTicketModal from './CreateTicketModal'
import TicketDetail from './TicketDetail'

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function formatWeekRange(weekStart) {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

export default function Board({ user, darkMode, onToggleDark }) {
  const [tickets, setTickets] = useState([])
  const [streak, setStreak] = useState(null)
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newWeekLoading, setNewWeekLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: ticketData }, { data: streakData }] = await Promise.all([
      supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .order('created_at', { ascending: true }),
      supabase
        .from('leetcode_streak')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])
    setTickets(ticketData || [])
    setStreak(streakData)
    setLoading(false)
  }, [user.id, weekStart])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleCreateTicket(fields) {
    const { error } = await supabase.from('tickets').insert({
      ...fields,
      status: 'todo',
      week_start: weekStart,
      user_id: user.id,
    })
    if (error) return error.message
    await fetchData()
    setShowCreate(false)
    return null
  }

  async function handleMove(ticketId, newStatus) {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return

    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', ticketId)
      .eq('user_id', user.id)

    if (error) return

    // LeetCode streak logic
    if (newStatus === 'done' && ticket.category === 'LeetCode') {
      await updateLeetCodeStreak()
    }

    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
  }

  async function updateLeetCodeStreak() {
    const today = new Date().toISOString().split('T')[0]

    if (!streak) {
      // Create streak record
      const { data } = await supabase
        .from('leetcode_streak')
        .insert({ user_id: user.id, last_completed: today, current_streak: 1 })
        .select()
        .single()
      setStreak(data)
      return
    }

    const lastDate = streak.last_completed
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak
    if (lastDate === today) {
      // Already incremented today
      return
    } else if (lastDate === yesterdayStr) {
      newStreak = streak.current_streak + 1
    } else {
      newStreak = 1
    }

    const { data } = await supabase
      .from('leetcode_streak')
      .update({ last_completed: today, current_streak: newStreak })
      .eq('user_id', user.id)
      .select()
      .single()
    setStreak(data)
  }

  async function handleDelete(ticketId) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId)
      .eq('user_id', user.id)
    if (!error) setTickets(prev => prev.filter(t => t.id !== ticketId))
  }

  async function handleNewWeek() {
    setNewWeekLoading(true)
    // Archive current week by moving week_start to past — tickets stay, just advance the week
    const nextMonday = new Date(weekStart + 'T00:00:00')
    nextMonday.setDate(nextMonday.getDate() + 7)
    const nextWeekStr = nextMonday.toISOString().split('T')[0]
    setWeekStart(nextWeekStr)
    setNewWeekLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const todo = tickets.filter(t => t.status === 'todo')
  const inprogress = tickets.filter(t => t.status === 'inprogress')
  const done = tickets.filter(t => t.status === 'done')

  const streakCount = streak ? streak.current_streak : 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Top Nav */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Weekly Tracker</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500 hidden sm:block">
            {formatWeekRange(weekStart)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 py-5 min-h-0">
        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <MetricCard label="To Do" value={todo.length} color="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200" />
          <MetricCard label="In Progress" value={inprogress.length} color="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300" />
          <MetricCard label="Done" value={done.length} color="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" />
          <MetricCard
            label="LeetCode Streak"
            value={`${streakCount} day${streakCount !== 1 ? 's' : ''}`}
            color="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
            icon="🔥"
          />
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>

          <div className="flex items-center gap-2">
            {weekStart > getWeekStart() && (
              <button
                onClick={() => {
                  const prev = new Date(weekStart + 'T00:00:00')
                  prev.setDate(prev.getDate() - 7)
                  setWeekStart(prev.toISOString().split('T')[0])
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                &larr; Prev Week
              </button>
            )}
            {weekStart !== getWeekStart() && (
              <button
                onClick={() => setWeekStart(getWeekStart())}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                This Week
              </button>
            )}
            <button
              onClick={handleNewWeek}
              disabled={newWeekLoading}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
            >
              {newWeekLoading ? 'Loading...' : 'Next Week →'}
            </button>
          </div>
        </div>

        {/* Kanban board */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
            Loading...
          </div>
        ) : (
          <div className="flex gap-4 flex-1 min-h-0">
            <Column
              status="todo"
              tickets={todo}
              onMove={handleMove}
              onDelete={handleDelete}
              onTicketClick={setSelectedTicket}
            />
            <Column
              status="inprogress"
              tickets={inprogress}
              onMove={handleMove}
              onDelete={handleDelete}
              onTicketClick={setSelectedTicket}
            />
            <Column
              status="done"
              tickets={done}
              onMove={handleMove}
              onDelete={handleDelete}
              onTicketClick={setSelectedTicket}
            />
          </div>
        )}
      </main>

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateTicket}
        />
      )}

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          userId={user.id}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  )
}

function MetricCard({ label, value, color, icon }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
