'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Edit, Trash2, MapPin, Tag, Loader, RefreshCw } from 'lucide-react'
import { useInventoryItems } from '../hooks/useFirestore'

// Quick tag suggestions
const QUICK_TAGS = [
  'electronics', 'cables', 'tools', 'kitchen', 'bathroom', 'office',
  'bedroom', 'living room', 'storage', 'cleaning', 'books', 'clothes',
  'charging', 'computer', 'phone', 'gaming', 'furniture', 'decorative'
]

// ItemForm component
const ItemForm = ({ item, onSave, onCancel, onUpdateField, isEditing = false, loading = false }) => {
  const addQuickTag = (tag) => {
    const currentTags = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ')
      onUpdateField('tags', newTags)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
              placeholder="e.g., USB-C Cable"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room/Location</label>
              <input
                type="text"
                value={item.location}
                onChange={(e) => onUpdateField('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                placeholder="e.g., Room 2"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-location</label>
              <input
                type="text"
                value={item.subLocation}
                onChange={(e) => onUpdateField('subLocation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                placeholder="e.g., Drawer A"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={item.description}
              onChange={(e) => onUpdateField('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-gray-900 placeholder-gray-500"
              rows="3"
              placeholder="Optional description..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={item.tags}
              onChange={(e) => onUpdateField('tags', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
              placeholder="e.g., electronics, cables, usb"
              disabled={loading}
            />

            {/* Quick Tag Buttons */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Quick add tags:</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {QUICK_TAGS.map((tag) => {
                  const currentTags = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                  const isSelected = currentTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addQuickTag(tag)}
                      disabled={isSelected || loading}
                      className={`px-3 py-1 text-sm rounded-lg transition-all ${isSelected
                          ? 'bg-blue-100 text-blue-700 cursor-not-allowed opacity-50'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading || !item.name || !item.location}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Update' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { items, loading, error, addItem, updateItem, deleteItem, refreshData, getCacheInfo } = useInventoryItems()

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [recentSearches, setRecentSearches] = useState(['electronics', 'cables', 'tools'])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    location: '',
    subLocation: '',
    description: '',
    tags: ''
  })

  // Debounce search term for recent searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 800)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Update recent searches only when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 3 && !recentSearches.includes(debouncedSearchTerm)) {
      setRecentSearches(prev => [debouncedSearchTerm, ...prev.slice(0, 4)])
    }
  }, [debouncedSearchTerm, recentSearches])

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items

    const term = searchTerm.toLowerCase()
    return items.filter(item =>
      item.name.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.subLocation?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.tags?.some(tag => tag.toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  // Handler functions for form field updates
  const updateNewItemField = (field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }))
  }

  const updateEditingItemField = (field, value) => {
    setEditingItem(prev => ({ ...prev, [field]: value }))
  }

  const handleAddItem = async () => {
    if (newItem.name && newItem.location) {
      setFormLoading(true)
      try {
        const itemData = {
          ...newItem,
          tags: typeof newItem.tags === 'string'
            ? newItem.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            : newItem.tags
        }
        await addItem(itemData)
        setNewItem({ name: '', location: '', subLocation: '', description: '', tags: '' })
        setShowAddForm(false)
      } catch (error) {
        console.error('Error adding item:', error)
        alert('Error adding item. Please try again.')
      } finally {
        setFormLoading(false)
      }
    }
  }

  const handleEditItem = (item) => {
    setEditingItem({ ...item, tags: item.tags?.join(', ') || '' })
  }

  const handleUpdateItem = async () => {
    if (editingItem.name && editingItem.location) {
      setFormLoading(true)
      try {
        const updatedData = {
          name: editingItem.name,
          location: editingItem.location,
          subLocation: editingItem.subLocation,
          description: editingItem.description,
          tags: typeof editingItem.tags === 'string'
            ? editingItem.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            : editingItem.tags
        }
        await updateItem(editingItem.id, updatedData)
        setEditingItem(null)
      } catch (error) {
        console.error('Error updating item:', error)
        alert('Error updating item. Please try again.')
      } finally {
        setFormLoading(false)
      }
    }
  }

  const handleDeleteItem = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id)
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Error deleting item. Please try again.')
      }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">Failed to load inventory: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 animate-fadeIn">
            🏠 Home Inventory
          </h1>
          <p className="text-gray-600 text-lg animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Find anything in your house, instantly
          </p>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={loading}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-all duration-200 hover:bg-gray-100 rounded-lg"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for items, locations, or tags..."
              className="w-full pl-12 pr-12 py-4 text-lg border border-gray-200 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={() => setShowAddForm(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recent Searches */}
        {!searchTerm && recentSearches.length > 0 && (
          <div className="mb-8 animate-slideUp" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(term)}
                  className="px-4 py-2 bg-white/60 backdrop-blur-sm text-gray-700 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your inventory...</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="space-y-4">
            {filteredItems.length === 0 && searchTerm && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">No items found matching "{searchTerm}"</p>
              </div>
            )}

            {filteredItems.length === 0 && !searchTerm && !loading && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-lg mb-4">Your inventory is empty</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Add Your First Item
                </button>
              </div>
            )}

            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-slideUp group"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>

                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="font-medium">{item.location}</span>
                      {item.subLocation && (
                        <>
                          <span className="mx-2">→</span>
                          <span>{item.subLocation}</span>
                        </>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-gray-600 mb-3">{item.description}</p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              onClick={() => handleSearch(tag)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Form Modal */}
        {showAddForm && (
          <ItemForm
            item={newItem}
            onSave={handleAddItem}
            onUpdateField={updateNewItemField}
            loading={formLoading}
            onCancel={() => {
              setShowAddForm(false)
              setNewItem({ name: '', location: '', subLocation: '', description: '', tags: '' })
            }}
          />
        )}

        {/* Edit Form Modal */}
        {editingItem && (
          <ItemForm
            item={editingItem}
            onSave={handleUpdateItem}
            onUpdateField={updateEditingItemField}
            loading={formLoading}
            onCancel={() => setEditingItem(null)}
            isEditing={true}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}