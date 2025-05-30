import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import styles from "./Header.module.css";

const Header = () => {
  const {user, signOut} = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setShowUserMenu(false);
  };

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>🔧</span>
            Toolshare
          </Link>

          <nav className={styles.nav}>
            {user ? (
              <div className={styles.userMenu}>
                <Link to="/add-tool" className={styles.hostButton}>
                  Share a tool
                </Link>
                <div className={styles.userMenuContainer}>
                  <button
                    className={styles.userMenuButton}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <span className={styles.menuIcon}>☰</span>
                    <div className={styles.avatar}>
                      {user.user_metadata?.full_name?.[0] || user.email[0]}
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className={styles.userMenuDropdown}>
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Dashboard
                      </Link>
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <hr />
                      <button onClick={handleSignOut}>Sign out</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login" className={styles.loginButton}>
                  Log in
                </Link>
                <Link to="/register" className={styles.signupButton}>
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
