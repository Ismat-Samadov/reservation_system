'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight, X } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
  currency: string
  bufferTimeMinutes: number
  isActive: boolean
}

const EMPTY_FORM = {
  name: '',
  description: '',
  durationMinutes: '30',
  price: '',
  currency: 'USD',
  bufferTimeMinutes: '0',
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    try {
      const res = await fetch('/api/provider/services')
      if (!res.ok) throw new Error('Failed to load services')
      setServices(await res.json())
    } catch {
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  function openAddForm() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  function openEditForm(service: Service) {
    setForm({
      name: service.name,
      description: service.description || '',
      durationMinutes: String(service.durationMinutes),
      price: service.price || '',
      currency: service.currency,
      bufferTimeMinutes: String(service.bufferTimeMinutes),
    })
    setEditingId(service.id)
    setShowForm(true)
    setError('')
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Service name is required')
      return
    }
    if (!form.durationMinutes || parseInt(form.durationMinutes) < 1) {
      setError('Duration must be at least 1 minute')
      return
    }

    setSaving(true)
    try {
      const url = editingId ? `/api/provider/services/${editingId}` : '/api/provider/services'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save service')
      }

      await fetchServices()
      closeForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(service: Service) {
    try {
      const res = await fetch(`/api/provider/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
      )
    } catch {
      setError('Failed to toggle service status')
    }
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/provider/services/${service.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchServices()
    } catch {
      setError('Failed to delete service')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Services</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage the services you offer to clients</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={openAddForm} className="bg-blue-600 hover:bg-blue-700 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Service
          </Button>
        )}
      </header>

      <main className="p-4 sm:p-8">
        <div className="max-w-3xl">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingId ? 'Edit Service' : 'New Service'}
                </h3>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Service Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Haircut, Consultation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional description for your clients"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.durationMinutes}
                      onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Buffer Time (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.bufferTimeMinutes}
                      onChange={(e) => setForm((f) => ({ ...f, bufferTimeMinutes: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="Leave blank if free"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AZN">AZN</option>
                      <option value="TRY">TRY</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Service'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={closeForm} className="flex-1 text-xs">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Services List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No services yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Add your first service so clients can start booking appointments.
              </p>
              <Button size="sm" onClick={openAddForm} className="bg-blue-600 hover:bg-blue-700 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Your First Service
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                    service.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-gray-900">{service.name}</h4>
                        {!service.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes} min
                          {service.bufferTimeMinutes > 0 && ` + ${service.bufferTimeMinutes} min buffer`}
                        </span>
                        {service.price && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {service.price} {service.currency}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(service)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title={service.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {service.isActive ? (
                          <ToggleRight className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditForm(service)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
