# 🎓 CampusGigs: The Hyperlocal Student Economy

![CampusGigs Platform](https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

A high-trust, peer-to-peer freelance marketplace built exclusively for college campuses. Verified by `.edu` email, secured by Razorpay Escrow, and moderated by a God-Mode Admin Dashboard.

> **Why we built this:** Students have skills but lack flexible ways to monetize them locally. Clubs need quick talent but global platforms like Upwork are too expensive and disconnected. CampusGigs solves the trust and pricing gap.

---

## 🚀 Live Demo & Credentials
**Live App Link:** [Insert your Vercel URL here]


---

## ✨ Key Features
1. **Hyperlocal Gig Board:** Real-time polling gig feed matching student buyers with student freelancers.
2. **Strict Integrity (Cascade Deletion):** Admin dashboard allows permanent banning of users and clearing of absurd reviews. Deleting a user automatically eradicates all associated database entries to maintain referential integrity.
3. **Deep Security:**
   * **Passwords:** Fully hashed via Bcrypt (No passwords leak in JSON responses).
   * **Auth:** Stateless JWT authentication with automatic 401 token-expiry logout.
   * **DDoS Protection:** Express-Rate-Limit blocks aggressive IP brute-forcing.
   * **NoSQL Injection Guard:** `express-mongo-sanitize` actively strips malicious database queries from request bodies.
4. **Performance (Scalability):** 
   * GZIP Compression on all API payloads reduces network load by 70%.
   * Compound MongoDB Indexes (`status`, `category`, `acceptedBy`) + `.lean()` object fetching for blazing fast queries.
5. **Razorpay Escrow Integration:** Secure mock checkout process that simulates locking funds before a gig begins.

---

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS v4, Vite, Lucide React
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Security:** Helmet.js, Bcrypt, JWT, express-rate-limit

---

## 💻 How to Run Locally

1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd Campus-Gig-App
   ```

2. **Backend Setup:**
   ```bash
   cd campus-gig-backend
   npm install
   ```
   *Rename `.env.example` to `.env` and add your MongoDB connection string.*
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../campus-gig-frontend
   npm install
   npm run dev
   ```
   
   The app will open at `http://localhost:5173`.
