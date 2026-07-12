# My Sage Plan

My Sage Plan is a mobile-first, single-page application (SPA) designed to help users organize their daily tasks through a clean, intuitive, and modern dashboard. The interface features a soft, accessible sage-and-mint visual profile designed to make planning a calm experience.

## Key Features

* **Interactive Task Management:** Create, edit, prioritize, and delete tasks seamlessly with full persistence.
* **Smart Filtering and Sorting:** Instant free-text search alongside fast filtering options by priority levels, categories, tags, or deadlines.
* **Stats Dashboard:** Live visual tracking that displays active and completed task metrics via an integrated progress bar.
* **Undo Toast Notifications:** Safeguard against accidental deletions with an automatic three-second restoration buffer.
* **Mobile-Portrait Layout:** Designed specifically with a mobile-first philosophy, adapting smoothly into a centered viewport wrapper on desktop devices.

## Core Architecture and Logic

The application relies completely on native web technologies without external frameworks or dependencies:

* **Single Page Application (SPA) Router:** A custom hash-based routing layer dynamically mounts application states without forcing page refreshes.
* **Local Storage Layer:** A dedicated storage wrapper functions as the single source of truth, managing reading, writing, self-healing data migrations, and automated initial data seeding.
* **Performance Optimization:** Built-in custom debouncing limits computational cycles and ensures text inputs remain snappy and responsive while typing.

## Technologies Used

* **Front-End:** Semantic HTML5, native responsive CSS3 (utilizing global design system tokens, flexbox layouts, and custom keyframe animations), and modular JavaScript (ES6+ Modules).
* **Storage:** Browser LocalStorage API for offline data resilience.
