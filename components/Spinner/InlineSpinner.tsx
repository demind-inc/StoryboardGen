import React from "react";
import styles from "./InlineSpinner.module.scss";

type SpinnerSize = "sm" | "md";

const SIZE_VARS: Record<SpinnerSize, React.CSSProperties> = {
  sm: { ["--spinner-size" as any]: "14px", ["--spinner-border" as any]: "2px" },
  md: { ["--spinner-size" as any]: "18px", ["--spinner-border" as any]: "3px" },
};

export function InlineSpinner({
  size = "sm",
  label = "Loading",
  className,
}: {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span
        className={[styles.spinner, className].filter(Boolean).join(" ")}
        style={SIZE_VARS[size]}
        aria-hidden
      />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
