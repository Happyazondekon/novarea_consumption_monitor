# Novarea Textiles Monitoring Platform 🏭📊

An elite, industrial-grade monitoring ecosystem designed for **Novarea Textiles Benin**. This platform provides real-time utility tracking (Electricity & Water), VISSIM-standard analytical reporting, and a high-fidelity mobile-first experience for field technicians and administrators.

👉 **Production Hub:** [https://novarea-consumption.vercel.app](https://novarea-consumption.vercel.app)

---

## 🚀 Key Features

### 🔐 Secure Authentication & RBAC
- **Dual-Role System:** Distinct workspaces for **Administrators** (Audit & Analytics) and **Field Technicians** (Logging & Missions).
- **Hardened Middleware:** Route-level protection preventing unauthorized access.
- **Session Management:** Strict 1-hour secure tokens with automated redirection.

### 📊 Real-Time Analytics Engine
- **Industrial KPIs:** Live tracking of daily consumption, averages, and anomaly counts.
- **Dynamic Charts:** Interactive dual-axis trend analysis (Consumption vs. Events).
- **Contextual Awareness:** Integrated event codes (PTR, GPO, etc.) directly on data points for root cause analysis.

### 📱 Mobile-First PWA Experience
- **Progressive Web App:** Fully "Installable" on iOS and Android with official branding.
- **Ergonomic Navigation:** Role-specific bottom navigation bar with a floating "+" action button for high-speed field data entry.
- **Glassmorphism UI:** Premium "Apple-style" aesthetics with backdrop-blur effects and fluid transitions.

### 📄 Professional Reporting Center
- **High-Fidelity PDF:** Client-side document builder with chart captures, ink-saving table headers, and operational definitions.
- **Multi-Sheet Excel:** Industrial-standard exports featuring separate sheets for Consumption Data and Event Logs.
- **Granular Filtering:** Query data by Week, Month, or Year with precise date selection.

---

## 🛠️ Technical Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Database:** [Neon PostgreSQL](https://neon.tech/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Auth:** [NextAuth.js v5 (Beta)](https://authjs.dev/)
- **Styling:** Tailwind CSS / Framer Motion
- **Charts:** Recharts
- **Deployment:** Vercel

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Happyazondekon/novarea_consumption_monitor.git
cd novarea_consumption_monitor
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root and add your production credentials:
```env
# Neon PostgreSQL
DATABASE_URL="your_pooled_connection_string"
DIRECT_URL="your_direct_connection_string"

# Next Auth
AUTH_SECRET="your_secure_random_key"
```

### 4. Initialize Database
```bash
npx prisma db push
npx prisma db seed # Populates 30 days of industrial data
```

### 5. Run Development Server
```bash
npm run dev
```
Access the portal at `http://localhost:3000`.

---

## 🛡️ Security Baseline

- **CSP Headers:** Prevent XSS and unauthorized script execution.
- **HSTS:** Enforce HTTPS protocols globally.
- **X-Frame-Options:** Protection against Clickjacking.
- **Data Scoping:** Technicians can strictly only view/modify their own submitted data.

---

## 🏗️ Operational Workflow

### For Administrators
1. **Analytics:** Monitor global trends and daily efficiency.
2. **Audit:** Validate or adjust field readings in the **Submission Audit** hub.
3. **Dispatch:** Broadcast operational directives to technicians via the **Mission Control**.
4. **Reporting:** Generate monthly compliance documents for stakeholder review.

### For Technicians
1. **Logging:** Use the mobile "+" button to capture meter indexes and photo proof.
2. **Missions:** View and mark active directives as **DONE** in real-time.
3. **History:** Review personal submission archives and audit status.

---

**Developed for Novarea Textiles Benin.** Managed by high-performance industrial standards. 🛡️🦾
