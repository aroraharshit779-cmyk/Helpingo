# 🤝 Helpingo - Hyperlocal Community Aid & Coordination Platform

**Helpingo** is a neighborhood-driven platform that connects residents to collaborate on local issues, coordinate volunteer actions, and build safer, more supportive communities. 

Designed with visual excellence and network resilience, Helpingo ensures community coordination remains active even under unstable internet conditions.

---

## 🌟 Key Features (What Helpingo Does)

### 📢 1. Broadcast & Track Local Issues
* **Quick Reporting:** Post neighborhood issues under specific categories: **Emergency Alerts**, **NGO/Volunteer Assistance**, **Student Support**, or **General Help**.
* **Smart Duplicate Prevention:** As you type the title of a new issue, Helpingo searches in real-time to show similar existing reports, preventing duplicates.
* **Resolution Tracking:** Authors of a post or coordinators can mark issues as **Resolved** once they are addressed.

### 📶 2. Offline-First Network Resilience
* **Auto-Fallback:** If the network goes down, the app switches to an offline mode using local browser storage (`localStorage`). You can still view, report, and reply to posts.
* **Background Syncing:** Any posts, solutions, or updates made offline are saved in a synchronization queue. The moment your internet connection returns, Helpingo automatically uploads and merges all changes with the central database.

### 🗺️ 3. Interactive Proximity Radar Map
* **Visual Coordinates:** A clean, SVG-powered radar map maps issues dynamically using coordinates.
* **15km Proximity Filter:** Toggle a "Nearby Only" mode to filter and display issues within a walking/driving distance of 15 kilometers from your current location.

### 💬 4. Double-Channel Chat Rooms
For every issue reported, Helpingo provides two distinct coordination channels:
* **🤖 Helpingo AI Coordinator:** A smart assistant that instantly generates customized safety guides, volunteer steps, and references depending on the issue category.
* **👤 Peer Chat Room:** A live coordination chatroom for nearby volunteers and neighbors to align on meeting times, tools, and group cleanup/support details.

### 🏆 5. Community-Driven Solutions & Leaderboard
* **Appreciation Upvotes:** Neighbors can post solutions or advice for any problem. The community can upvote the most practical advice, pushing the best solutions to the top.
* **Personal Coordinator Dashboard:** Track your community impact, including the number of issues reported, solutions provided, and upvotes received.

---

## 🛠️ The Tech Stack (Under the Hood)

* **Frontend:** React + Vite (ES6+, React 19)
* **Styling & UI:** Custom Vanilla CSS with modern dark glassmorphism gradients, responsive panels, and smooth micro-animations.
* **Backend:** Node.js + Express.js API Server
* **Database:** Multi-tier support. Automatically connects to **MongoDB** if a connection string is provided, or seamlessly falls back to a local JSON file-based database (`server/db.json`) for zero-configuration setups.

---

## 🚀 How to Run the Project Locally

Follow these quick steps to get Helpingo running on your local machine:

### 1. Install Dependencies
In the root directory of the project, run:
```bash
npm install
```

### 2. Start the Backend Server
Run the backend Express server:
```bash
npm run server
```
*This starts the API server on [http://localhost:5000](http://localhost:5000). If no database string is set, it will automatically initialize a local `db.json` database.*

### 3. Start the Frontend App
In a new terminal, run the Vite development server:
```bash
npm run dev
```
*This will launch the app in your browser (usually at [http://localhost:5173](http://localhost:5173)).*
