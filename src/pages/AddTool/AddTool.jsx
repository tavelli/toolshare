import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import styles from './AddTool.module.css'
import Compressor from 'compressorjs'

const AddTool = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image_url: '',
    is_available: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const categories = [
    'Power Tools',
    'Hand Tools',
    'Yard Equipment',
    'Automotive',
    'Cycling tools',
    'Other'
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    // Compress image before upload
    new Compressor(file, {
      quality: 0.6, // Adjust quality as needed (0-1)
      maxWidth: 1200, // Optional: limit max width
      success: async (compressedFile) => {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}_${Date.now()}.${fileExt}`
          const { data, error } = await supabase.storage
            .from('tool-images')
            .upload(fileName, compressedFile)
          if (error) throw error
          const { data: publicUrlData } = supabase.storage
            .from('tool-images')
            .getPublicUrl(fileName)
          setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }))
        } catch (error) {
          setError('Image upload failed. ' + error.message)
        } finally {
          setUploading(false)
        }
      },
      error: (err) => {
        setError('Image compression failed. ' + err.message)
        setUploading(false)
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('tools')
        .insert([{
          ...formData,
          owner_id: user.id
        }])

      if (error) throw error

      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.addTool}>
      <div className="container">
        <div className={styles.header}>
          <h1>Share a Tool</h1>
          <p>Help your community by sharing tools you're not using</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="name">Tool Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Cordless Drill"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* <div className={styles.field}>
              <label htmlFor="location">Location *</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="City, State"
              />
            </div> */}

            <div className={styles.field}>
              <label htmlFor="image_upload">Upload Image</label>
              <input
                id="image_upload"
                name="image_upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <span>Uploading...</span>}
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" style={{ marginTop: 8, maxWidth: 200, borderRadius: 8 }} />
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              
              rows={4}
              placeholder="Describe your tool, its condition, and any special instructions for borrowers..."
            />
          </div>

          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
              />
              <span className={styles.checkmark}></span>
              Available for borrowing
            </label>
          </div>

          <div className={styles.actions}>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Adding Tool...' : 'Add Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTool
