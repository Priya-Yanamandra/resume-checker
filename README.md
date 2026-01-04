# ATS Keyword Gap Checker

A frontend-only web application that analyzes resumes against job descriptions and highlights missing and matching keywords using ATS-style logic.

## Features
- PDF resume upload with client-side text extraction
- Job description keyword comparison
- Match percentage calculation
- Visual feedback using charts and color-coded tags
- Fully client-side (no backend, no data storage)

## Tech Stack
- HTML, CSS, JavaScript
- PDF.js
- Chart.js
- GitHub Pages

## Design Decisions
- Frontend-only architecture for privacy and zero maintenance
- Keyword-based matching to reflect real ATS behavior
- Minimal, transparent logic for explainability

## Limitations
- No semantic or synonym matching
- Keyword-based comparison only

## Future Enhancements
- Semantic keyword matching
- Section-wise resume analysis

All resume processing and keyword analysis is performed client-side in the browser.
No files or data are sent to any backend server.
