# Sakai Health Dashboard

Sakai is an application template for Vue based on the [create-vue](https://github.com/vuejs/create-vue), the recommended way to start a Vite-powered Vue project.

## Project Overview

This project is a **Personal Health Dashboard** web application. It allows users to track and manage various aspects of their daily health and wellness, including:

-   **Water intake**
-   **Vitamins & supplements**
-   **Medications**
-   **Toilet logs (pee/poop, with details)**
-   **Sleep (hours, quality, notes)**
-   **Workouts (type, duration, intensity, notes)**
-   **Mood & energy (with notes)**

## Main Features

-   **Comprehensive Health Tracking:** Log daily water, supplements, medications, sleep, workouts, mood, and more.
-   **Interactive UI:** Modern, responsive dashboard built with Vue, PrimeVue, and Tailwind CSS.
-   **Dialog-Driven UX:** Add and edit entries via modal dialogs for a smooth experience.
-   **Historical Data:** Navigate between days to view or edit past health data.
-   **Customizable Lists:** Add new supplements and medications, with quick-add for common items.
-   **Visual Feedback:** Progress bars, color-coded cards, and emoji-based selectors for intuitive tracking.

## General Flow

1. **Open the dashboard** to see today’s health data.
2. **Log new entries** (water, supplements, etc.) via cards or dialogs.
3. **Edit or remove entries** as needed.
4. **Navigate to previous days** to view or edit historical data.
5. **Data is saved** (to backend or local storage) and loaded on demand.

## Getting Started

Visit the [documentation](https://sakai.primevue.org/documentation) to get started.

## 📚 Project Documentation

This project includes comprehensive documentation for development, troubleshooting, and best practices:

-   **[Documentation Index](./docs/README.md)** - Central hub for all project documentation
-   **[Transaction Analyzer Guide](./docs/TRANSACTION_ANALYZER_PROMPT.md)** - Complete implementation guide for the financial transaction analyzer
-   **[Common Issues](./docs/COMMON_ISSUES.md)** - Troubleshooting guide for known problems and solutions
-   **[PrimeVue Patterns](./docs/PRIMEVUE_PATTERNS.md)** - Best practices for PrimeVue component usage
-   **[Documentation Standards](./docs/DOCUMENTATION_STANDARDS.md)** - Guidelines for maintaining documentation

### 🔄 Documentation Update Process

When making changes to the project:

1. **Update relevant documentation** - Check `docs/README.md` for affected files
2. **Add to update history** - Include date and description of changes
3. **Test documented steps** - Ensure instructions work correctly
4. **Cross-reference updates** - Update related documentation files

---

For suggestions and planned improvements, see [IMPROVEMENTS.md](./IMPROVEMENTS.md).
