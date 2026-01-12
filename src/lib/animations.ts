import type { Variants, Transition } from "motion/react"

// ============================================
// Standard Transitions
// ============================================

export const defaultTransition: Transition = {
  duration: 0.3,
  ease: "easeOut",
}

export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
}

export const gentleSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
}

// ============================================
// Fade Animations
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: gentleSpring,
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

// ============================================
// Stagger Animations (Lists)
// ============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: gentleSpring,
  },
}

// ============================================
// Card & Interactive Animations
// ============================================

export const cardHover = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.99 },
  transition: springTransition,
}

export const cardHoverSubtle = {
  whileHover: { scale: 1.01, y: -2 },
  whileTap: { scale: 0.99 },
  transition: springTransition,
}

export const buttonPress = {
  whileTap: { scale: 0.95 },
  transition: springTransition,
}

export const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: springTransition,
}

// ============================================
// Modal & Dialog Animations
// ============================================

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: gentleSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

export const sheetContent: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: gentleSpring },
  exit: { x: "100%", transition: { duration: 0.2 } },
}

// ============================================
// Slide Animations
// ============================================

export const slideInRight: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: gentleSpring,
  },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.2 } },
}

export const slideInLeft: Variants = {
  initial: { x: "-100%", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: gentleSpring,
  },
  exit: { x: "-100%", opacity: 0, transition: { duration: 0.2 } },
}

export const slideInUp: Variants = {
  initial: { y: "100%", opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: gentleSpring,
  },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } },
}

export const slideInDown: Variants = {
  initial: { y: "-100%", opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: gentleSpring,
  },
  exit: { y: "-100%", opacity: 0, transition: { duration: 0.2 } },
}

// ============================================
// Page Transitions
// ============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// ============================================
// Micro-interactions
// ============================================

export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export const badgePop: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15,
    },
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.1 } },
}

export const checkmarkDraw: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
}

// ============================================
// Toast / Notification Animations
// ============================================

export const toastSlideIn: Variants = {
  initial: { x: "calc(100% + 24px)", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: gentleSpring,
  },
  exit: {
    x: "calc(100% + 24px)",
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// ============================================
// Skeleton Loading
// ============================================

export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

// ============================================
// Utility: Reduced Motion
// ============================================

export function getReducedMotionVariants(variants: Variants): Variants {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.01 } },
    exit: { opacity: 0, transition: { duration: 0.01 } },
  }
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
