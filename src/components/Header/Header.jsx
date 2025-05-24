import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Header.module.css'

const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setShowUserMenu(false)
  }

  return (
    <header className={styles.header}>
      <div className="container">
      </div>
    </header>
  )
}

export default Header
