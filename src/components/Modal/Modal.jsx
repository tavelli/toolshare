import React from "react";
import styles from "./Modal.module.css";

const Modal = ({open, onClose, children}) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          ×
        </button>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
