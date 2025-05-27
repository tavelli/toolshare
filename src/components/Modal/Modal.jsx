import React from "react";
import styles from "./Modal.module.css";

const Modal = ({open, header, footer, onClose, children}) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>{header}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>{footer}</div>
      </div>
    </div>
  );
};

export default Modal;
