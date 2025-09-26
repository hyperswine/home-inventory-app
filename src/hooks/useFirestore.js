// hooks/useFirestore.js
import { useState, useEffect, useRef } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

// Cache management
class FirebaseCache {
  constructor() {
    this.items = new Map() // Map of id -> item data
    this.lastUpdated = null
    this.listeners = new Set()
  }

  setItems(items) {
    this.items.clear()
    items.forEach(item => {
      this.items.set(item.id, item)
    })
    this.lastUpdated = Date.now()
    this.notifyListeners()
  }

  addItem(item) {
    this.items.set(item.id, item)
    this.notifyListeners()
  }

  updateItem(id, updates) {
    const existing = this.items.get(id)
    if (existing) {
      this.items.set(id, { ...existing, ...updates })
      this.notifyListeners()
    }
  }

  removeItem(id) {
    this.items.delete(id)
    this.notifyListeners()
  }

  getAllItems() {
    return Array.from(this.items.values())
  }

  getItem(id) {
    return this.items.get(id)
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getAllItems()))
  }

  clear() {
    this.items.clear()
    this.lastUpdated = null
    this.notifyListeners()
  }
}

// Global cache instance
const firebaseCache = new FirebaseCache()

export const useInventoryItems = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubscribeRef = useRef(null)
  const cacheSubscriptionRef = useRef(null)

  useEffect(() => {
    // Subscribe to cache updates
    cacheSubscriptionRef.current = firebaseCache.subscribe((cachedItems) => {
      setItems(cachedItems)
      if (loading) {
        setLoading(false)
      }
    })

    // Check if we have cached data
    const cachedItems = firebaseCache.getAllItems()
    if (cachedItems.length > 0) {
      setItems(cachedItems)
      setLoading(false)
    }

    // Set up Firestore listener
    const q = query(
      collection(db, 'inventory'),
      orderBy('createdAt', 'desc')
    )

    unsubscribeRef.current = onSnapshot(q,
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to date string
          dateAdded: doc.data().createdAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        }))

        // Update cache with fresh data
        firebaseCache.setItems(itemsData)
        setError(null)

        if (loading) {
          setLoading(false)
        }
      },
      (err) => {
        console.error('Error fetching items:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (cacheSubscriptionRef.current) {
        cacheSubscriptionRef.current()
      }
    }
  }, [])

  const addItem = async (itemData) => {
    try {
      // Create optimistic update
      const tempId = `temp_${Date.now()}`
      const optimisticItem = {
        id: tempId,
        ...itemData,
        dateAdded: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        _isOptimistic: true
      }

      // Add to cache immediately for instant UI update
      firebaseCache.addItem(optimisticItem)

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...itemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Remove optimistic item and let the onSnapshot update with real data
      firebaseCache.removeItem(tempId)

      return docRef.id
    } catch (err) {
      console.error('Error adding item:', err)
      // Remove optimistic update on error
      firebaseCache.removeItem(`temp_${Date.now()}`)
      throw err
    }
  }

  const updateItem = async (id, itemData) => {
    try {
      // Get current item for optimistic update
      const currentItem = firebaseCache.getItem(id)
      if (currentItem) {
        // Apply optimistic update
        firebaseCache.updateItem(id, {
          ...itemData,
          updatedAt: new Date(),
          _isOptimistic: true
        })
      }

      // Update in Firestore
      const itemRef = doc(db, 'inventory', id)
      await updateDoc(itemRef, {
        ...itemData,
        updatedAt: serverTimestamp()
      })

      // The onSnapshot listener will update the cache with the real data
    } catch (err) {
      console.error('Error updating item:', err)
      // Revert optimistic update on error
      if (currentItem) {
        firebaseCache.updateItem(id, currentItem)
      }
      throw err
    }
  }

  const deleteItem = async (id) => {
    try {
      // Get current item for potential rollback
      const currentItem = firebaseCache.getItem(id)

      // Remove from cache immediately for instant UI update
      firebaseCache.removeItem(id)

      // Delete from Firestore
      await deleteDoc(doc(db, 'inventory', id))
    } catch (err) {
      console.error('Error deleting item:', err)
      // Restore item on error
      if (currentItem) {
        firebaseCache.addItem(currentItem)
      }
      throw err
    }
  }

  // Function to manually refresh data (useful for pull-to-refresh)
  const refreshData = () => {
    firebaseCache.clear()
    setLoading(true)
  }

  // Function to get cache info for debugging
  const getCacheInfo = () => ({
    itemCount: firebaseCache.getAllItems().length,
    lastUpdated: firebaseCache.lastUpdated,
    cacheAge: firebaseCache.lastUpdated ? Date.now() - firebaseCache.lastUpdated : null
  })

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refreshData,
    getCacheInfo
  }
}