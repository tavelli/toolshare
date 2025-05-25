import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import styles from './ToolDetail.module.css'

const ToolDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [tool, setTool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    start_date: '',
    end_date: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTool()
  }, [id])

  const fetchTool = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          profiles (
            full_name,
            location
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setTool(data)
    } catch (error) {
      console.error('Error fetching tool:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .insert([{
          tool_id: tool.id,
          requester_id: user.id,
          start_date: requestForm.start_date,
          end_date: requestForm.end_date,
          message: requestForm.message,
          status: 'pending'
        }])

      if (error) throw error

      alert('Request sent successfully!')
      setShowRequestForm(false)
      setRequestForm({ start_date: '', end_date: '', message: '' })
    } catch (error) {
      console.error('Error sending request:', error)
      alert('Failed to send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="container">Loading tool details...</div>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className={styles.notFound}>
        <div className="container">Tool not found</div>
      </div>
    )
  }

  const isOwner = user?.id === tool.owner_id

  return (
    <div className={styles.toolDetail}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.imageSection}>
            {tool.image_url ? (
              <img src={tool.image_url} alt={tool.name} className={styles.image} />
            ) : (
              <div className={styles.placeholder}>🔧</div>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <div className={styles.category}>{tool.category}</div>
              <h1 className={styles.title}>{tool.name}</h1>
              {/* <div className={styles.location}>📍 {tool.location}</div> */}
            </div>

            <div className={styles.description}>
              <h3>Description</h3>
              <p>{tool.description}</p>
            </div>

            {/* <div className={styles.owner}>
              <h3>Shared by</h3>
              <p>{tool.profiles?.full_name}</p>
              <p className={styles.ownerLocation}>{tool.profiles?.location}</p>
            </div> */}

            <div className={styles.availability}>
              <span className={`${styles.status} ${tool.is_available ? styles.available : styles.unavailable}`}>
                {tool.is_available ? '✓ Available' : '✗ Not Available'}
              </span>
            </div>

            {!isOwner && tool.is_available && (
              <div className={styles.actions}>
                {!showRequestForm ? (
                  <button 
                    onClick={() => setShowRequestForm(true)}
                    className={styles.requestButton}
                  >
                    Request to Borrow
                  </button>
                ) : (
                  <form onSubmit={handleRequestSubmit} className={styles.requestForm}>
                    <h3>Request to Borrow</h3>
                    <div className={styles.dateFields}>
                      <div className={styles.field}>
                        <label>Start Date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={requestForm.start_date}
                          onChange={e => setRequestForm(prev => ({ ...prev, start_date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className={styles.field}>
                        <label>End Date</label>
                        <input
                          type="date"
                          min={requestForm.start_date || new Date().toISOString().split('T')[0]}
                          value={requestForm.end_date}
                          onChange={e => setRequestForm(prev => ({ ...prev, end_date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label>Message (optional)</label>
                      <textarea
                        value={requestForm.message}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell the owner why you need this tool and any other details..."
                        rows={3}
                      />
                    </div>
                    <div className={styles.formActions}>
                      <button 
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setShowRequestForm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className={styles.submitButton}
                        disabled={submitting}
                      >
                        {submitting ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {isOwner && (
              <div className={styles.ownerNote}>
                <p>This is your tool. You can manage it from your dashboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolDetail
