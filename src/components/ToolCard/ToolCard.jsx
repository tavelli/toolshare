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
        <h3 className={styles.name}>{tool.name}</h3>
        <div className={styles.category}>{tool.category}</div>
      </div>
    </Link>
  );
};

export default ToolCard;
