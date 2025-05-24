import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ToolCard from '../../components/ToolCard/ToolCard'
import styles from './Home.module.css'

const Home = () => {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = [
    'All Categories',
    'Power Tools',
    'Hand Tools',
    'Garden Tools',
    'Automotive',
    'Kitchen Appliances',
    'Cleaning Equipment',
    'Other'
  ]

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
      // ...existing code...
      if (error) throw error
      setTools(data || [])
    } catch (error) {
      console.error('Error fetching tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All Categories' || 
                           tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className={styles.loading}>
      </div>
    )
  }

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
      </div>

      <div className={styles.searchSection}>
      </div>

    </div>
  )
}

export default Home
