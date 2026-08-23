# Contributing to Jeevan Setu (जीवन सेतु)

Thank you for your interest in contributing to **Jeevan Setu**! This project is built for disaster response, emergency supply continuity, and resilient humanitarian logistics across India's North Eastern Region.

---

## 🧭 Code of Conduct
We are committed to providing a welcoming, safe, and professional environment for all contributors regardless of background or experience level.

---

## 🛠️ How to Contribute

### 1. Reporting Bugs & Highway Data Discrepancies
- Open a GitHub Issue using the **Bug Report** template.
- Specify the state, highway corridor (e.g. `NH-6`, `NH-13`), coordinates, and failure modes observed.

### 2. Feature Requests
- Check open issues and discussions before submitting a new proposal.
- Clearly describe the disaster management use case and target stakeholders (MoDoNER, NDRF, SDRF, Relief Convoys).

### 3. Submitting Pull Requests
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Follow standard coding guidelines and ensure zero lint errors.
3. Test offline PWA capability and 3D WebGL performance on mobile viewports.
4. Open a PR with a concise description of changes and test steps.

---

## 📜 Architectural Rules
- **Zero-Key First**: Core mapping, routing, and weather services MUST operate out-of-the-box with zero paid credit card restrictions.
- **Offline Resiliency**: Never break PWA Service Worker caching or the 160-character offline SMS payload format for NDRF (1078).
- **Sovereignty**: Prioritize sovereign Indian geospatial data (ISRO Bhuvan, Survey of India) alongside global open protocols (OpenStreetMap, Open-Meteo).

---

## 🛡️ License
By contributing to Jeevan Setu, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
