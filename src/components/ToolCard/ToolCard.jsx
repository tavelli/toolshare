import React from 'react'
import { Link } from 'react-router-dom'
import styles from './ToolCard.module.css'

const ToolCard = ({ tool }) => {
  return (
    <Link to={`/tool/${tool.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
      </div>
      <div className={styles.content}>
      </div>
    </Link>
  )
}

export default ToolCard
