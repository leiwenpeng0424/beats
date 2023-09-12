import React from "react";
import "./index.css";
import styles from "./styles.module.css";
import lessStyles from "./style.module.less";

export default function App() {
  return (
    <h1 className={`bg-amber-500 ${styles.link} ${lessStyles.link}`}>
      {"App"}
    </h1>
  );
}
