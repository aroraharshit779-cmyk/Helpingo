import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

// --- In-Memory DB & File System Fallback System ---
// Seed data for a premium experience right away
const SEED_USERS = [
  {
    username: "Vikram Singh",
    email: "vikram@helpingo.com",
    password: "password123",
    bio: "Local volunteer and civil engineer. Passionate about urban cleanup projects and structural safety.",
    joinedDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    status: "online",
    avatarSeed: "Vikram"
  },
  {
    username: "Neha Sharma",
    email: "neha@helpingo.com",
    password: "password123",
    bio: "College student majoring in biology. Happy to tutor kids and help out in NGOs.",
    joinedDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    status: "away",
    avatarSeed: "Neha"
  },
  {
    username: "Dev Rawat",
    email: "dev@helpingo.com",
    password: "password123",
    bio: "Road inspector and emergency responder. Always on the move.",
    joinedDate: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    status: "offline",
    avatarSeed: "Dev"
  }
];

const SEED_PROBLEMS = [
  {
    _id: "seed-1",
    title: "Severe Water Logging near Central Market Gate 2",
    description: "The road is flooded with knee-deep water after the heavy rain. Vehicles are stuck and pedestrians are unable to cross. Needs immediate local municipality attention or drainage support.",
    category: "Emergency",
    location: { lat: 28.6139, lng: 77.2090 }, // Delhi Central coords
    status: "Active",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    upvotes: 8,
    author: "Dev Rawat",
    solutions: [
      {
        id: "sol-1-1",
        author: "Vikram Singh",
        text: "Avoid taking the Gate 2 route. The traffic police has diverted cars through the flyover bypass.",
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        upvotes: 4
      }
    ]
  },
  {
    _id: "seed-2",
    title: "Looking for volunteer tutors for local orphanage education camp",
    description: "We are organizing a 2-week basic science & mathematics study camp for kids at the Asha Children's Home. Looking for high school/college students who can volunteer 2 hours a day.",
    category: "NGO Assistance",
    location: { lat: 28.6250, lng: 77.2200 },
    status: "Active",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    upvotes: 12,
    author: "Neha Sharma",
    solutions: [
      {
        id: "sol-2-1",
        author: "Neha Sharma",
        text: "I am a college biology major. I would love to volunteer for the science sessions! Please let me know the contact process.",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        upvotes: 5
      }
    ]
  },
  {
    _id: "seed-3",
    title: "Lost my folder containing academic certificates near Central Library",
    description: "I lost a blue plastic folder containing my 10th and 12th board certificates and college transcripts. Probably dropped it around the parking lot or cafeteria. Extremely urgent!",
    category: "Student Support",
    location: { lat: 28.5980, lng: 77.1950 },
    status: "Active",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    upvotes: 3,
    author: "Vikram Singh",
    solutions: [
      {
        id: "sol-3-1",
        author: "Rajesh Kumar",
        text: "Check with the Lost & Found desk inside the main library lobby. They keep items found in the cafeteria there.",
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        upvotes: 2
      }
    ]
  },
  {
    _id: "seed-4",
    title: "High voltage electricity line sparking continuously",
    description: "The overhead cable near sector 4 crossing is sparking badly due to a tree branch leaning on it. Risk of fire or short circuit. Electric board needs to trim the tree branch and fix the wire.",
    category: "Emergency",
    location: { lat: 28.6300, lng: 77.2500 },
    status: "Resolved",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    upvotes: 15,
    author: "Dev Rawat",
    solutions: [
      {
        id: "sol-4-1",
        author: "Electric Grid Officer",
        text: "Line has been shut down, branches cleared, and wire insulated. Status marked resolved.",
        timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
        upvotes: 14
      }
    ]
  }
];

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ problems: SEED_PROBLEMS, users: SEED_USERS }, null, 2));
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Ensure seeds are injected if empty
    if (!parsed.problems || parsed.problems.length === 0) {
      parsed.problems = SEED_PROBLEMS;
    }
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = SEED_USERS;
    }
    return parsed;
  } catch (err) {
    console.error("Error reading fallback db file:", err);
    return { problems: SEED_PROBLEMS, users: SEED_USERS };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing fallback db file:", err);
  }
}

// --- Database connection configuration ---
let useMongo = false;
const MONGO_URI = process.env.MONGODB_URI || '';

if (MONGO_URI && MONGO_URI !== 'your_mongodb_connection_string') {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully');
      useMongo = true;
    })
    .catch(err => {
      console.warn('MongoDB connection failed. Operating in resilient JSON database mode.', err.message);
      useMongo = false;
    });
} else {
  console.log('No MONGODB_URI set. Operating in resilient local JSON database mode.');
  useMongo = false;
}

// --- Mongoose Schema (if MongoDB is active) ---
const problemSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  location: { lat: Number, lng: Number },
  status: { type: String, default: 'Active' },
  timestamp: { type: Date, default: Date.now },
  upvotes: { type: Number, default: 0 },
  author: { type: String, default: 'Anonymous Helper' },
  solutions: [
    {
      id: String,
      author: String,
      text: String,
      timestamp: { type: Date, default: Date.now },
      upvotes: { type: Number, default: 0 },
      isAI: { type: Boolean, default: false }
    }
  ]
});

const Problem = mongoose.model('Problem', problemSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
  bio: { type: String, default: 'Helpingo neighbor ready to assist!' },
  joinedDate: { type: Date, default: Date.now },
  status: { type: String, default: 'online' },
  avatarSeed: { type: String }
});

const User = mongoose.model('User', userSchema);

// --- Data Abstraction Layer (Service) ---
const DataService = {
  async getAllProblems() {
    if (useMongo) {
      const problems = await Problem.find().sort({ timestamp: -1 });
      const users = await User.find();
      const userStatusMap = {};
      users.forEach(u => {
        userStatusMap[u.username] = u.status;
      });
      return problems.map(p => {
        const plainProb = p.toObject();
        plainProb.authorStatus = userStatusMap[plainProb.author] || 'online';
        if (plainProb.solutions) {
          plainProb.solutions.forEach(s => {
            s.authorStatus = userStatusMap[s.author] || 'online';
          });
        }
        return plainProb;
      });
    } else {
      const db = readDb();
      const problems = [...db.problems];
      problems.forEach(p => {
        const user = db.users.find(u => u.username === p.author);
        if (user) p.authorStatus = user.status;
        if (p.solutions) {
          p.solutions.forEach(s => {
            const su = db.users.find(u => u.username === s.author);
            if (su) s.authorStatus = su.status;
          });
        }
      });
      return problems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  },

  async createProblem(data) {
    if (useMongo) {
      const newProblem = new Problem({
        title: data.title,
        description: data.description,
        category: data.category || 'General',
        location: data.location || { lat: 28.6139, lng: 77.2090 },
        status: 'Active',
        timestamp: new Date(),
        upvotes: 0,
        solutions: [],
        author: data.author || 'Anonymous Helper'
      });
      return await newProblem.save();
    } else {
      const db = readDb();
      const newProblem = {
        _id: Math.random().toString(36).substring(2, 9),
        title: data.title,
        description: data.description,
        category: data.category || 'General',
        location: data.location || { lat: 28.6139, lng: 77.2090 },
        status: 'Active',
        timestamp: new Date().toISOString(),
        upvotes: 0,
        solutions: [],
        author: data.author || 'Anonymous Helper'
      };
      db.problems.unshift(newProblem);
      writeDb(db);
      return newProblem;
    }
  },

  async addSolution(problemId, solutionData) {
    const solId = Math.random().toString(36).substring(2, 9);
    const newSolution = {
      id: solId,
      author: solutionData.author || 'Anonymous Helper',
      text: solutionData.text,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      isAI: !!solutionData.isAI
    };

    if (useMongo) {
      const updated = await Problem.findByIdAndUpdate(
        problemId,
        { $push: { solutions: newSolution } },
        { new: true }
      );
      if (!updated) throw new Error("Problem not found");
      return updated;
    } else {
      const db = readDb();
      const problem = db.problems.find(p => p._id === problemId);
      if (!problem) throw new Error("Problem not found");
      if (!problem.solutions) problem.solutions = [];
      problem.solutions.push(newSolution);
      writeDb(db);
      return problem;
    }
  },

  async upvoteSolution(problemId, solutionId) {
    if (useMongo) {
      const problem = await Problem.findById(problemId);
      if (!problem) throw new Error("Problem not found");
      const sol = problem.solutions.find(s => s.id === solutionId);
      if (sol) {
        sol.upvotes = (sol.upvotes || 0) + 1;
        await problem.save();
      }
      return problem;
    } else {
      const db = readDb();
      const problem = db.problems.find(p => p._id === problemId);
      if (!problem) throw new Error("Problem not found");
      const sol = problem.solutions.find(s => s.id === solutionId);
      if (sol) {
        sol.upvotes = (sol.upvotes || 0) + 1;
        writeDb(db);
      }
      return problem;
    }
  },

  async resolveProblem(problemId) {
    if (useMongo) {
      const updated = await Problem.findByIdAndUpdate(
        problemId,
        { status: 'Resolved' },
        { new: true }
      );
      if (!updated) throw new Error("Problem not found");
      return updated;
    } else {
      const db = readDb();
      const problem = db.problems.find(p => p._id === problemId);
      if (!problem) throw new Error("Problem not found");
      problem.status = 'Resolved';
      writeDb(db);
      return problem;
    }
  },

  async registerUser(userData) {
    if (useMongo) {
      const existing = await User.findOne({
        $or: [{ username: userData.username }, { email: userData.email }]
      });
      if (existing) throw new Error("Username or Email already registered");
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        bio: userData.bio || "Helpingo neighbor ready to assist!",
        joinedDate: new Date(),
        status: 'online',
        avatarSeed: userData.username
      });
      return await newUser.save();
    } else {
      const db = readDb();
      const existing = db.users.find(u => u.username === userData.username || u.email === userData.email);
      if (existing) throw new Error("Username or Email already registered");
      const newUser = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        bio: userData.bio || "Helpingo neighbor ready to assist!",
        joinedDate: new Date().toISOString(),
        status: 'online',
        avatarSeed: userData.username
      };
      db.users.push(newUser);
      writeDb(db);
      return newUser;
    }
  },

  async loginUser(username, password) {
    if (useMongo) {
      const user = await User.findOne({ username });
      if (!user || user.password !== password) throw new Error("Invalid username or password");
      user.status = 'online';
      await user.save();
      return user;
    } else {
      const db = readDb();
      const user = db.users.find(u => u.username === username);
      if (!user || user.password !== password) throw new Error("Invalid username or password");
      user.status = 'online';
      writeDb(db);
      return user;
    }
  },

  async getUserStats(username) {
    const dbProblems = await this.getAllProblems();
    const userProblems = dbProblems.filter(p => p.author === username);
    
    let solutionCount = 0;
    let totalUpvotes = 0;
    dbProblems.forEach(p => {
      if (p.solutions) {
        p.solutions.forEach(s => {
          if (s.author === username) {
            solutionCount++;
            totalUpvotes += (s.upvotes || 0);
          }
        });
      }
    });

    // Fetch user details to get bio & joinedDate
    let userDetails = { bio: "Helpingo neighbor ready to assist!", joinedDate: new Date().toISOString(), status: 'online' };
    if (useMongo) {
      const u = await User.findOne({ username });
      if (u) {
        userDetails = { bio: u.bio, joinedDate: u.joinedDate.toISOString(), status: u.status };
      }
    } else {
      const db = readDb();
      const u = db.users.find(usr => usr.username === username);
      if (u) {
        userDetails = { bio: u.bio, joinedDate: u.joinedDate, status: u.status };
      }
    }

    return {
      bio: userDetails.bio,
      joinedDate: userDetails.joinedDate,
      status: userDetails.status,
      problemsShared: userProblems.length,
      solutionsProvided: solutionCount,
      upvotesReceived: totalUpvotes,
      problemsList: userProblems
    };
  },

  async updateUserProfile(username, bio) {
    if (useMongo) {
      const user = await User.findOneAndUpdate({ username }, { bio }, { new: true });
      if (!user) throw new Error("User not found");
      return user;
    } else {
      const db = readDb();
      const user = db.users.find(u => u.username === username);
      if (!user) throw new Error("User not found");
      user.bio = bio;
      writeDb(db);
      return user;
    }
  },

  async updateUserStatus(username, status) {
    if (useMongo) {
      const user = await User.findOneAndUpdate({ username }, { status }, { new: true });
      if (!user) throw new Error("User not found");
      return user;
    } else {
      const db = readDb();
      const user = db.users.find(u => u.username === username);
      if (!user) throw new Error("User not found");
      user.status = status;
      writeDb(db);
      return user;
    }
  },

  async getOnlineUsersCount() {
    if (useMongo) {
      const count = await User.countDocuments({ status: { $in: ['online', 'away'] } });
      return count;
    } else {
      const db = readDb();
      return db.users.filter(u => u.status === 'online' || u.status === 'away').length;
    }
  }
};

// --- API Endpoints ---

// Get all problems (with filters)
app.get('/api/problems', async (req, res) => {
  try {
    const { search, category } = req.query;
    let list = await DataService.getAllProblems();

    // Apply simple category filter
    if (category && category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Apply simple keyword search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Error fetching problems", error: error.message });
  }
});

// Post a new problem
app.post('/api/problems', async (req, res) => {
  try {
    const { title, description, category, location, author } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }
    const saved = await DataService.createProblem({ title, description, category, location, author });
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: "Error posting problem", error: error.message });
  }
});

// Get similar/related problems to prevent duplicates
app.get('/api/problems/similar', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.json([]);

    const all = await DataService.getAllProblems();
    const queryWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    if (queryWords.length === 0) return res.json([]);

    // Find problems that share common words in title
    const matches = all.map(prob => {
      let score = 0;
      const probTitleLower = prob.title.toLowerCase();
      queryWords.forEach(word => {
        if (probTitleLower.includes(word)) score += 1;
      });
      return { prob, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.prob)
    .slice(0, 3); // top 3 matches

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: "Error searching similar problems", error: error.message });
  }
});

// Post a solution for a problem
app.post('/api/problems/:id/solutions', async (req, res) => {
  try {
    const { id } = req.params;
    const { author, text, isAI } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Solution text is required." });
    }
    const updated = await DataService.addSolution(id, { author, text, isAI });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error adding solution", error: error.message });
  }
});

// Upvote a solution
postUpvote();
async function postUpvote() {
  app.post('/api/problems/:id/solutions/:solId/upvote', async (req, res) => {
    try {
      const { id, solId } = req.params;
      const updated = await DataService.upvoteSolution(id, solId);
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: "Error upvoting solution", error: error.message });
    }
  });
}

// Mark problem as resolved
app.patch('/api/problems/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DataService.resolveProblem(id);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error resolving problem", error: error.message });
  }
});



// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required." });
    }
    const saved = await DataService.registerUser({ username, email, password, bio });
    res.status(201).json({
      username: saved.username,
      email: saved.email,
      bio: saved.bio,
      joinedDate: saved.joinedDate,
      status: saved.status,
      avatarSeed: saved.avatarSeed
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    const user = await DataService.loginUser(username, password);
    res.status(200).json({
      username: user.username,
      email: user.email,
      bio: user.bio,
      joinedDate: user.joinedDate,
      status: user.status,
      avatarSeed: user.avatarSeed
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// User Stats endpoint
app.get('/api/users/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    const stats = await DataService.getUserStats(username);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user stats", error: error.message });
  }
});

// Update Profile endpoint
app.patch('/api/users/:username/profile', async (req, res) => {
  try {
    const { username } = req.params;
    const { bio } = req.body;
    const updated = await DataService.updateUserProfile(username, bio);
    res.json({
      username: updated.username,
      email: updated.email,
      bio: updated.bio,
      joinedDate: updated.joinedDate,
      status: updated.status,
      avatarSeed: updated.avatarSeed
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Update Status presence endpoint
app.post('/api/users/:username/status', async (req, res) => {
  try {
    const { username } = req.params;
    const { status } = req.body;
    if (!status || !['online', 'away', 'offline'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    const updated = await DataService.updateUserStatus(username, status);
    res.json({ username: updated.username, status: updated.status });
  } catch (error) {
    res.status(500).json({ message: "Error updating presence status", error: error.message });
  }
});

// Online users count endpoint
app.get('/api/users/online', async (req, res) => {
  try {
    const count = await DataService.getOnlineUsersCount();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching online count", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;