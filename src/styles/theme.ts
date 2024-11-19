import { motion } from "framer-motion";

// Animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

// Common animation settings
export const transition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
};

// Reusable motion components
export const MotionDiv = motion.div;
export const MotionButton = motion.button;

// Theme configuration
export const theme = {
  colors: {
    primary: {
      DEFAULT: "#6366f1",
      light: "#818cf8",
      dark: "#4f46e5",
    },
    secondary: {
      DEFAULT: "#ec4899",
      light: "#f472b6",
      dark: "#db2777",
    },
    accent: {
      DEFAULT: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
    },
    background: {
      DEFAULT: "#f3f4f6",
      card: "#ffffff",
      overlay: "rgba(0, 0, 0, 0.5)",
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
};