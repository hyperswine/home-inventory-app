// hooks/useFirestore.js
import { useState, useEffect } from 'react'
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

export const useInventoryItems = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'inventory'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to date string
          dateAdded: doc.data().createdAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        }))
        setItems(itemsData)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching items:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addItem = async (itemData) => {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...itemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (err) {
      console.error('Error adding item:', err)
      throw err
    }
  }

  const updateItem = async (id, itemData) => {
    try {
      const itemRef = doc(db, 'inventory', id)
      await updateDoc(itemRef, {
        ...itemData,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error updating item:', err)
      throw err
    }
  }

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'inventory', id))
    } catch (err) {
      console.error('Error deleting item:', err)
      throw err
    }
  }

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  }
}