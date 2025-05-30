import React from "react";
import {Link} from "react-router-dom";
import styles from "./ToolCard.module.css";

const ToolCard = ({tool}) => {
  return (
    <Link to={`/tool/${tool.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {tool.image_url ? (
          <img src={tool.image_url} alt={tool.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>🔧</div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h3 className={styles.name}>{tool.name}</h3>
          {tool.created_at &&
            (() => {
              const createdDate = new Date(tool.created_at);
              const now = new Date();
              const oneWeekAgo = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 7
              );
              if (createdDate > oneWeekAgo) {
                return <span className={styles.newBadge}>NEW</span>;
              }
              return null;
            })()}
        </div>
        <div className={styles.category}>{tool.category}</div>
      </div>
    </Link>
  );
};

export default ToolCard;
