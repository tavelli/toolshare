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
        .from('tools')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
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
        <div className="container">Loading tools...</div>
      </div>
    )
  }

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Share tools with your community
            </h1>
            <p className={styles.heroSubtitle}>
              Borrow tools from neighbors or share your own. Build a sustainable community together.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.searchSection}>
        <div className="container">
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.toolsSection}>
        <div className="container">
          <div className={styles.toolsGrid}>
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
          {filteredTools.length === 0 && (
            <div className={styles.noResults}>
              <p>No tools found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
