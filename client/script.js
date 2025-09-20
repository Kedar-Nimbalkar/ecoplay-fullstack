// EcoPlay - Enhanced Environmental Awareness Platform
// Features: Authentication, Daily Plant Watering, Certificate Generation

// Base URL for your backend API
const API_BASE_URL = 'https://ecoplay-fullstack.onrender.com'; // Change to your deployed backend URL in production

// App State
const AppState = {
    currentUser: null,
    isAdmin: false,
    isEducator: false,
    currentView: "home",
    token: null, // Store JWT token
};

// Utility functions (keep these)
function nowISO() {
    return new Date().toISOString();
}
function uid(prefix = "id") {
    return prefix + "_" + Math.random().toString(36).slice(2, 9);
}
// No longer using localStorage for main data, but keep for token
function load(key, defaultVal) {
    try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
}
function save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

// --- API Interaction Functions ---
async function apiRequest(method, url, data = null, authRequired = true) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (authRequired && AppState.token) {
        headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method,
            headers,
            body: data ? JSON.stringify(data) : null,
        });

        const result = await response.json();

        if (!response.ok) {
            // Handle specific error messages from backend
            if (response.status === 401 && authRequired) {
                alert('Session expired or unauthorized. Please sign in again.');
                signOut();
            }
            throw new Error(result.message || `API Error: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error(`API Request Failed (${method} ${url}):`, error);
        alert(error.message || 'An unexpected error occurred.');
        throw error;
    }
}

// --- Authentication Functions ---
async function handleSignUp(e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const school = document.getElementById("school").value.trim();
    const grade = document.getElementById("grade").value.trim();

    if (!fullName || !username || !email || !password || !confirmPassword) {
        alert("Please fill in all required fields.");
        return;
    }
    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const newUser = await apiRequest('POST', '/auth/signup', {
            fullName, username, email, password, school, grade
        }, false); // No auth required for signup

        AppState.currentUser = newUser;
        AppState.token = newUser.token;
        AppState.isAdmin = newUser.role === 'admin';
        AppState.isEducator = newUser.role === 'educator';
        save('ecoplay_token', AppState.token); // Save token to localStorage
        alert("Account created successfully! Welcome to EcoPlay!");
        renderApp();
    } catch (error) {
        // Error message already handled by apiRequest
    }
}

async function handleSignIn(e) {
    e.preventDefault();

    const loginInput = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!loginInput || !password) {
        alert("Please enter both username/email and password.");
        return;
    }

    try {
        const user = await apiRequest('POST', '/auth/login', { loginInput, password }, false);

        AppState.currentUser = user;
        AppState.token = user.token;
        AppState.isAdmin = user.role === 'admin';
        AppState.isEducator = user.role === 'educator';
        save('ecoplay_token', AppState.token); // Save token to localStorage
        alert(`Welcome back, ${user.fullName}!`);
        renderApp();
    } catch (error) {
        // Error message already handled by apiRequest
    }
}

function signOut() {
    AppState.currentUser = null;
    AppState.token = null;
    AppState.isAdmin = false;
    AppState.isEducator = false;
    AppState.currentView = "home";
    localStorage.removeItem('ecoplay_token'); // Clear token
    renderApp();
}

// --- Initial App Load & Routing ---
async function initializeApp() {
    const token = load('ecoplay_token', null);
    if (token) {
        AppState.token = token;
        try {
            // Fetch user profile to re-authenticate and get latest data
            const user = await apiRequest('GET', '/users/profile');
            AppState.currentUser = user;
            AppState.isAdmin = user.role === 'admin';
            AppState.isEducator = user.role === 'educator';
        } catch (error) {
            console.error('Failed to re-authenticate user:', error);
            signOut(); // Clear invalid token
        }
    }
    renderApp();
}

function renderApp() {
    const app = document.getElementById("app");

    if (!AppState.currentUser) {
        // Show landing page for non-authenticated users
        app.innerHTML = `
            <div class="container">
                <header class="header">
                    <div class="header-content">
                        <a href="#" class="logo"> EcoPlay</a>
                        <nav class="nav">
                            <a href="#" class="nav-link active">Home</a>
                            <a href="#" onclick="showAboutPublic()">About</a>
                            <a href="#" onclick="showContactPublic()">Contact</a>
                        </nav>
                        <div class="auth-buttons">
                            <button class="btn btn-secondary" onclick="showSignInForm()">Sign In</button>
                            <button class="btn btn-primary" onclick="showSignUpForm()">Sign Up</button>
                        </div>
                    </div>
                </header>
                
                <div class="main-content text-center">
                    <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #2b7a2b;">
                        Welcome to EcoPlay
                    </h1>
                    <p style="font-size: 1.2rem; margin-bottom: 2rem; color: #666;">
                        Join our gamified environmental awareness platform and make a difference!
                    </p>
                    
                    <div class="grid">
                        <div class="card">
                            <h3> Earn Points</h3>
                            <p>Complete quizzes, submit environmental activities, and participate in community events to earn points and badges.</p>
                        </div>
                        
                        <div class="card">
                            <h3> Daily Watering</h3>
                            <p>Track your plant care journey with daily watering submissions. Build streaks and show your commitment!</p>
                        </div>
                        
                        <div class="card">
                            <h3> Certificates</h3>
                            <p>Download personalized certificates showcasing your environmental contributions and achievements.</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 3rem;">
                        <button class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;" onclick="showSignUpForm()">
                            Get Started Today
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Render authenticated user interface
    renderAuthenticatedApp();
}

function showAboutPublic() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="container">
            <header class="header">
                <div class="header-content">
                    <a href="#" class="logo" onclick="renderApp()"> EcoPlay</a>
                    <nav class="nav">
                        <a href="#" onclick="renderApp()">Home</a>
                        <a href="#" class="nav-link active" onclick="showAboutPublic()">About</a>
                        <a href="#" onclick="showContactPublic()">Contact</a>
                    </nav>
                    <div class="auth-buttons">
                        <button class="btn btn-secondary" onclick="showSignInForm()">Sign In</button>
                        <button class="btn btn-primary" onclick="showSignUpForm()">Sign Up</button>
                    </div>
                </div>
            </header>
            
            <div class="main-content">
                ${getAboutContent()}
            </div>
        </div>
    `;
}

function showContactPublic() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <div class="container">
            <header class="header">
                <div class="header-content">
                    <a href="#" class="logo" onclick="renderApp()"> EcoPlay</a>
                    <nav class="nav">
                        <a href="#" onclick="renderApp()">Home</a>
                        <a href="#" onclick="showAboutPublic()">About</a>
                        <a href="#" class="nav-link active" onclick="showContactPublic()">Contact</a>
                    </nav>
                    <div class="auth-buttons">
                        <button class="btn btn-secondary" onclick="showSignInForm()">Sign In</button>
                        <button class="btn btn-primary" onclick="showSignUpForm()">Sign Up</button>
                    </div>
                </div>
            </header>
            
            <div class="main-content">
                <div class="text-center mb-2">
                    <h1>Contact Us</h1>
                    <p class="muted">Get in touch with the EcoPlay team</p>
                </div>
                
                <div class="grid">
                    <div class="card">
                        <h3> General Inquiries</h3>
                        <p>For general questions about EcoPlay, partnerships, or feedback:</p>
                        <p><strong>ecoplay.team@example.com</strong></p>
                    </div>
                    
                    <div class="card">
                        <h3> Educational Institutions</h3>
                        <p>Interested in implementing EcoPlay at your school or college?</p>
                        <p><strong>education@ecoplay.example.com</strong></p>
                    </div>
                    
                    <div class="card">
                        <h3>🔧 Technical Support</h3>
                        <p>Need help with the platform or experiencing technical issues?</p>
                        <p><strong>support@ecoplay.example.com</strong></p>
                    </div>
                </div>
                
                <div class="card">
                    <h3> Send us a Message</h3>
                    <form id="contactForm">
                        <div class="form-group">
                            <label for="contactName">Your Name</label>
                            <input type="text" id="contactName" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactEmail">Your Email</label>
                            <input type="email" id="contactEmail" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactSubject">Subject</label>
                            <input type="text" id="contactSubject" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactMessage">Message</label>
                            <textarea id="contactMessage" class="form-control" rows="5" required></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
                
                <div class="text-center">
                    <p>Ready to join EcoPlay?</p>
                    <button class="btn btn-primary" onclick="showSignUpForm()" style="margin-right: 1rem;">
                        Sign Up Now
                    </button>
                    <button class="btn btn-secondary" onclick="showSignInForm()">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById("contactForm").addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Thank you for your message! We will get back to you soon.");
        renderApp();
    });
}

function getAboutContent() {
    return `
        <div class="text-center mb-2">
            <h1>About EcoPlay</h1>
            <p class="muted">Gamified Environmental Awareness Platform</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>Our Mission</h3>
                <p>EcoPlay is designed to engage students and environmental enthusiasts in meaningful environmental activities through gamification. We believe that making environmental action fun and rewarding leads to lasting behavioral change.</p>
            </div>
            
            <div class="card">
                <h3>  Key Features</h3>
                <ul style="text-align: left; padding-left: 1rem;">
                    <li>Daily plant watering challenges with photo verification</li>
                    <li>Interactive environmental quizzes and learning modules</li>
                    <li>Points and badge system to track progress</li>
                    <li>Downloadable certificates for achievements</li>
                    <li>Community events and group challenges</li>
                    <li>Reward redemption system</li>
                </ul>
            </div>
            
            <div class="card">
                <h3> Perfect for Educational Institutions</h3>
                <p>EcoPlay is specifically designed for schools, colleges, and educational institutions looking to promote environmental awareness among students. Our platform encourages real-world environmental action while providing measurable engagement metrics.</p>
            </div>
        </div>
        
        <div class="card">
            <h3> Development Team</h3>
            <p style="margin-bottom: 1.5rem;">EcoPlay was developed by a dedicated team of students passionate about environmental conservation and technology:</p>
            
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                <div class="card" style="text-align: center; background: #f6fff4;">
                    <div class="avatar" style="margin: 0 auto 1rem auto; background: #2b7a2b;">S</div>
                    <h4>Shreya Pavaskar</h4>
                    <p class="muted">Leader</p>
                </div>
                
                <div class="card" style="text-align: center; background: #f6fff4;">
                    <div class="avatar" style="margin: 0 auto 1rem auto; background: #2b7a2b;">B</div>
                    <h4>Bhagyashri Bhagwat</h4>
                    <p class="muted">Member</p>
                </div>
                
                <div class="card" style="text-align: center; background: #f6fff4;">
                    <div class="avatar" style="margin: 0 auto 1rem auto; background: #2b7a2b;">A</div>
                    <h4>Anvit Naik</h4>
                    <p class="muted">Member</p>
                </div>
                
                <div class="card" style="text-align: center; background: #f6fff4;">
                    <div class="avatar" style="margin: 0 auto 1rem auto; background: #2b7a2b;">K</div>
                    <h4>Kempanna Kadabi</h4>
                    <p class="muted">Member</p>
                </div>
                
                <div class="card" style="text-align: center; background: #f6fff4;">
                    <div class="avatar" style="margin: 0 auto 1rem auto; background: #2b7a2b;">N</div>
                    <h4>Nivrutti Patil</h4>
                    <p class="muted">Member</p>
                </div>
                
                <div class="card" style="text-align: center; background: #f6fff4;">
                    <div class="avatar" style="margin: 0 auto 1rem auto; background: #2b7a2b;">K</div>
                    <h4>Kedar Nimbalkar</h4>
                    <p class="muted">Member</p>
                </div>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3> Technical Implementation</h3>
                <p>EcoPlay is built using modern web technologies with a focus on simplicity and accessibility. The platform uses local storage for data persistence in this demo version, making it easy to deploy and test without requiring backend infrastructure.</p>
            </div>
            
            <div class="card">
                <h3> Environmental Impact</h3>
                <p>By encouraging daily plant care, environmental education, and community engagement, EcoPlay aims to create lasting positive environmental habits. Every photo submitted and quiz completed represents a step toward greater environmental awareness.</p>
            </div>
            
            <div class="card">
                <h3> Contact & Support</h3>
                <p>For questions, suggestions, or partnership opportunities, please reach out to our development team. We're always looking for ways to improve and expand EcoPlay's impact.</p>
                <p class="muted">Email: ecoplay.team@example.com</p>
            </div>
        </div>
        
        <div class="card text-center">
            <h3> Join the Movement</h3>
            <p>Ready to start your environmental journey? Create an account and begin making a difference today!</p>
            ${
              !AppState.currentUser
                ? `
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="showSignUpForm()" style="margin-right: 1rem;">
                        Sign Up Now
                    </button>
                    <button class="btn btn-secondary" onclick="showSignInForm()">
                        Sign In
                    </button>
                </div>
            `
                : `
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="navigateTo('watering')">
                        Start Daily Watering Challenge
                    </button>
                </div>
            `
            }
        </div>
    `;
}

function renderAboutView(content) {
    content.innerHTML = getAboutContent();
}

function renderAuthenticatedApp() {
    const app = document.getElementById("app");
    const user = AppState.currentUser;

    app.innerHTML = `
        <div class="container">
            <header class="header">
                <div class="header-content">
                    <a href="#" class="logo" onclick="navigateTo('home')">🌱 EcoPlay</a>
                    <nav class="nav">
                        <a href="#" class="nav-link ${AppState.currentView === "home" ? "active" : ""}" onclick="navigateTo('home')">Dashboard</a>
                        <a href="#" class="nav-link ${AppState.currentView === "watering" ? "active" : ""}" onclick="navigateTo('watering')">Daily Watering</a>
                        <a href="#" class="nav-link ${AppState.currentView === "games" ? "active" : ""}" onclick="navigateTo('games')">Games</a>
                        <a href="#" class="nav-link ${AppState.currentView === "lessons" ? "active" : ""}" onclick="navigateTo('lessons')">Lessons</a> <!-- New Nav Link -->
                        <a href="#" class="nav-link ${AppState.currentView === "profile" ? "active" : ""}" onclick="navigateTo('profile')">Profile</a>
                        <a href="#" class="nav-link ${AppState.currentView === "redeem" ? "active" : ""}" onclick="navigateTo('redeem')">Redeem</a>
                        <a href="#" class="nav-link ${AppState.currentView === "about" ? "active" : ""}" onclick="navigateTo('about')">About</a>
                        ${(AppState.isAdmin || AppState.isEducator) ? `<a href="#" class="nav-link ${AppState.currentView === "admin" ? "active" : ""}" onclick="navigateTo('admin')">Admin</a>` : ""}
                    </nav>
                    <div class="auth-buttons">
                        <span style="margin-right: 1rem; color: #2b7a2b; font-weight: bold;">
                            ${user.fullName} (${user.points} pts)
                        </span>
                        <button class="btn btn-secondary" onclick="signOut()">Sign Out</button>
                    </div>
                </div>
            </header>
            
            <div class="main-content" id="mainContent">
                <!-- Content will be loaded here -->
            </div>
        </div>
    `;

    // Load the current view
    loadView(AppState.currentView);
}

function navigateTo(view) {
    AppState.currentView = view;
    renderAuthenticatedApp();
}

async function loadView(view) {
    const content = document.getElementById("mainContent");
    content.innerHTML = '<p class="muted text-center">Loading...</p>'; // Loading indicator

    try {
        switch (view) {
            case "home":
                await renderDashboard(content);
                break;
            case "watering":
                await renderWateringView(content);
                break;
            case "games":
                await renderGamesView(content);
                break;
            case "lessons": // New case for lessons
                await renderLessonsView(content);
                break;
            case "profile":
                await renderProfileView(content);
                break;
            case "redeem":
                await renderRedeemView(content);
                break;
            case "about":
                renderAboutView(content); // No API call needed for static content
                break;
            case "admin":
                await renderAdminView(content);
                break;
            default:
                await renderDashboard(content);
        }
    } catch (error) {
        content.innerHTML = `<p class="error-message text-center">Failed to load content: ${error.message}</p>`;
        console.error("Error loading view:", error);
    }
}

async function renderDashboard(content) {
    const user = AppState.currentUser;
    if (!user) {
        content.innerHTML = '<p class="muted text-center">Please sign in to view your dashboard.</p>';
        return;
    }

    // Fetch latest user data
    const latestUser = await apiRequest('GET', '/users/profile');
    AppState.currentUser = latestUser; // Update AppState with latest user data

    const wateringRecords = await apiRequest('GET', '/watering');
    const streak = calculateStreak(wateringRecords);
    const today = new Date().toDateString();
    const todayRecord = wateringRecords.find((r) => new Date(r.date).toDateString() === today);

    content.innerHTML = `
      <div class="dashboard-header">
          <div class="user-info">
              <div class="avatar">${user.fullName[0]}</div>
              <div class="user-details">
                  <h2>Welcome back, ${user.fullName}!</h2>
                  <p class="muted">@${user.username} • Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
          </div>
          <div class="points-badge">
              ${user.points} Points
          </div>
      </div>
      
      <div class="grid">
          <div class="card">
              <h3> Daily Watering Streak</h3>
              <div style="text-align: center; margin: 1rem 0;">
                  <div style="font-size: 2rem; font-weight: bold; color: #2b7a2b;">
                      ${streak} Days
                  </div>
                  <p class="muted">Current streak</p>
              </div>
              ${
                todayRecord
                  ? '<p style="color: #2b7a2b; font-weight: bold;"> Today\'s watering complete!</p>'
                  : '<p style="color: #f57c00; font-weight: bold;"> Don\'t forget to water today!</p>'
              }
              <button class="btn btn-primary" onclick="navigateTo('watering')" style="width: 100%; margin-top: 1rem;">
                  ${todayRecord ? "View Watering History" : "Submit Today's Watering"}
              </button>
          </div>
          
          <div class="card">
              <h3> Quick Stats</h3>
              <div style="display: flex; justify-content: space-between; margin: 1rem 0;">
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${user.points}</div>
                      <p class="muted">Total Points</p>
                  </div>
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${wateringRecords.length}</div>
                      <p class="muted">Plants Watered</p>
                  </div>
                  <div style="text-align: center;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${user.badges ? user.badges.length : 0}</div>
                      <p class="muted">Badges Earned</p>
                  </div>
              </div>
          </div>
          
          <div class="card">
              <h3> Quick Actions</h3>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <button class="btn btn-primary" onclick="navigateTo('games')" style="width: 100%;">
                      Take Quiz
                  </button>
                  <button class="btn btn-primary" onclick="navigateTo('lessons')" style="width: 100%;">
                      Explore Lessons
                  </button>
                  <button class="btn btn-secondary" onclick="navigateTo('profile')" style="width: 100%;">
                      View Profile
                  </button>
                  <button class="btn btn-secondary" onclick="navigateTo('redeem')" style="width: 100%;">
                      Redeem Points
                  </button>
              </div>
          </div>
      </div>
      
      <div class="card">
          <h3> Recent Activity</h3>
          ${await renderRecentActivity()}
      </div>
  `;
}

async function renderRecentActivity() {
    const user = AppState.currentUser;
    const wateringRecords = await apiRequest('GET', '/watering');
    const submissions = await apiRequest('GET', '/submissions');

    const allActivity = [
        ...wateringRecords.map((r) => ({
            type: "watering",
            date: r.date,
            description: `Watered plants: ${r.note}`,
            points: r.points,
        })),
        ...(user.quizzesTaken || []).map((q) => ({
            type: "quiz",
            date: q.takenAt,
            description: `Completed quiz: ${q.quizId?.title || 'Unknown Quiz'}`, // Use populated title
            points: q.earned,
        })),
        ...submissions.map((s) => ({
            type: "activity",
            date: s.createdAt,
            description: `${s.type}: ${s.note}`,
            points: s.points,
        })),
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (allActivity.length === 0) {
        return '<p class="muted">No recent activity. Start by submitting your first watering photo!</p>';
    }

    return allActivity
        .map(
            (activity) => `
      <div class="submission-item">
          <div>
              <strong>${activity.description}</strong>
              <span class="submission-date">${new Date(activity.date).toLocaleDateString()}</span>
          </div>
          <div class="muted">+${activity.points} points</div>
      </div>
  `,
        )
        .join("");
}

async function renderWateringView(content) {
    const user = AppState.currentUser;
    const today = new Date().toDateString();
    const wateringRecords = await apiRequest('GET', '/watering');
    const todayRecord = wateringRecords.find((r) => new Date(r.date).toDateString() === today);

    const streak = calculateStreak(wateringRecords);

    content.innerHTML = `
        <div class="watering-section">
            <div class="watering-header">
                <h2> Daily Plant Watering Challenge</h2>
                <div class="streak-counter">
                     ${streak} Day Streak
                </div>
            </div>
            
            <p>Upload a photo of you watering plants daily to maintain your streak and earn points!</p>
            
            ${
              todayRecord
                ? `
                <div class="card" style="background: #e8f5e8; border: 2px solid #2b7a2b;">
                    <h3> Today's Watering Complete!</h3>
                    <p>Great job! You've already submitted your watering photo for today.</p>
                    <img src="${todayRecord.imageData}" alt="Today's watering" class="image-preview">
                    <p class="muted">Submitted at: ${new Date(todayRecord.date).toLocaleString()}</p>
                    <p class="muted">Note: ${todayRecord.note}</p>
                </div>
            `
                : `
                <div class="card">
                    <h3> Submit Today's Watering Photo</h3>
                    
                    <div class="upload-area" id="uploadArea" onclick="document.getElementById('wateringPhoto').click()">
                        <div id="uploadContent">
                            <p>Click here or drag & drop your watering photo</p>
                            <p class="muted">Show yourself watering plants to maintain authenticity</p>
                        </div>
                        <img id="imagePreview" class="image-preview hidden" alt="Preview">
                    </div>
                    
                    <input type="file" id="wateringPhoto" accept="image/*" style="display: none;">
                    
                    <div class="form-group">
                        <label for="wateringNote">Add a note about your watering activity:</label>
                        <input type="text" id="wateringNote" class="form-control" 
                               placeholder="e.g., Watered my tomato plants in the garden">
                    </div>
                    
                    <button id="submitWatering" class="btn btn-primary" style="width: 100%;" disabled>
                        Submit Today's Watering
                    </button>
                </div>
            `
            }
        </div>
        
        <div class="card">
            <h3> Your Watering History</h3>
            <div class="watering-history">
                ${renderWateringHistory(wateringRecords)}
            </div>
        </div>
        
        <div class="card">
            <h3> Watering Achievements</h3>
            <div class="grid">
                <div class="card ${streak >= 3 ? "card-unlocked" : "card-locked"}">
                    <h4> Seedling Caretaker</h4>
                    <p>Water plants for 3 consecutive days</p>
                    <p class="muted">${streak >= 3 ? "Unlocked!" : `${Math.max(0, 3 - streak)} days to go`}</p>
                </div>
                <div class="card ${streak >= 7 ? "card-unlocked" : "card-locked"}">
                    <h4> Green Thumb</h4>
                    <p>Water plants for 7 consecutive days</p>
                    <p class="muted">${streak >= 7 ? "Unlocked!" : `${Math.max(0, 7 - streak)} days to go`}</p>
                </div>
                <div class="card ${streak >= 30 ? "card-unlocked" : "card-locked"}">
                    <h4> Plant Master</h4>
                    <p>Water plants for 30 consecutive days</p>
                    <p class="muted">${streak >= 30 ? "Unlocked!" : `${Math.max(0, 30 - streak)} days to go`}</p>
                </div>
            </div>
        </div>
    `;

    if (!todayRecord) {
        setupWateringUpload();
    }
}

function setupWateringUpload() {
    const photoInput = document.getElementById("wateringPhoto");
    const uploadArea = document.getElementById("uploadArea");
    const imagePreview = document.getElementById("imagePreview");
    const uploadContent = document.getElementById("uploadContent");
    const submitBtn = document.getElementById("submitWatering");

    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith("image/")) {
            photoInput.files = files;
            handleImagePreview(files[0]);
        }
    });

    photoInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleImagePreview(e.target.files[0]);
        }
    });

    function handleImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove("hidden");
            uploadContent.classList.add("hidden");
            submitBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    submitBtn.addEventListener("click", submitWateringRecord);
}

async function submitWateringRecord() {
    const photoInput = document.getElementById("wateringPhoto");
    const note = document.getElementById("wateringNote").value.trim();

    if (!photoInput.files || photoInput.files.length === 0) {
        alert("Please select a photo first.");
        return;
    }

    const file = photoInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const imageData = e.target.result; // Base64 string

        try {
            const result = await apiRequest('POST', '/watering', { imageData, note });
            alert(`Great job! You've earned ${result.record.points} points for today's watering. Keep up the streak!`);
            // Update AppState.currentUser with latest points and streak
            AppState.currentUser.points = result.userPoints;
            AppState.currentUser.wateringStreak = result.userStreak;
            navigateTo("watering"); // Refresh the view
        } catch (error) {
            // Error message already handled by apiRequest
        }
    };

    reader.readAsDataURL(file);
}

function calculateStreak(records) {
    if (records.length === 0) return 0;

    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

    for (const record of sortedRecords) {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(currentDate.getTime() - recordDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === streak) { // If the record is for the expected day in the streak
            streak++;
            currentDate = new Date(recordDate); // Move to this record's date for next iteration
        } else if (diffDays > streak) { // Gap in streak
            break;
        }
        // If diffDays < streak, it means multiple records for the same day, or out of order, ignore.
    }

    return streak;
}

async function renderGamesView(content) {
    const quizzes = await apiRequest('GET', '/quizzes');

    content.innerHTML = `
        <div class="text-center mb-2">
            <h1> Environmental Games & Quizzes</h1>
            <p class="muted">Test your environmental knowledge and earn points!</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3> Available Quizzes</h3>
                ${(AppState.isAdmin || AppState.isEducator) ? `
                    <div style="margin-bottom: 1rem;">
                        <input type="text" id="quizTopic" class="form-control" placeholder="Enter topic for AI quiz generation">
                        <button class="btn btn-primary" onclick="generateAIQuiz()" style="margin-top: 0.5rem;">Generate AI Quiz</button>
                    </div>
                ` : ''}
                ${
                  quizzes.length === 0
                    ? '<p class="muted">No quizzes available yet. Check back later!</p>'
                    : quizzes
                        .map(
                          (quiz) => `
                        <div class="quiz-item" style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <h4>${quiz.title}</h4>
                            <p class="muted">${quiz.description}</p>
                            <p><strong>${quiz.questions.length} questions</strong> • Up to ${quiz.questions.reduce((sum, q) => sum + (q.points || 10), 0)} points</p>
                            <button class="btn btn-primary" onclick="startQuiz('${quiz._id}')" style="margin-top: 0.5rem;">
                                Take Quiz
                            </button>
                        </div>
                    `,
                        )
                        .join("")
                }
            </div>
            
            <div class="card">
                <h3> Your Quiz History</h3>
                ${renderQuizHistory()}
            </div>
            
            <div class="card">
                <h3> Submit Environmental Activity</h3>
                <p>Upload photos of your environmental activities for bonus points!</p>
                
                <div class="form-group">
                    <label for="activityType">Activity Type</label>
                    <select id="activityType" class="form-control">
                        <option value="Planting">Tree/Plant Planting</option>
                        <option value="Cleanup">Environmental Cleanup</option>
                        <option value="Recycling">Recycling Activity</option>
                        <option value="Conservation">Water/Energy Conservation</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="activityNote">Description</label>
                    <input type="text" id="activityNote" class="form-control" 
                           placeholder="Describe your environmental activity">
                </div>
                
                <div class="form-group">
                    <label for="activityPhoto">Photo Evidence</label>
                    <input type="file" id="activityPhoto" class="form-control" accept="image/*">
                </div>
                
                <button id="submitActivity" class="btn btn-primary" style="width: 100%;">
                    Submit Activity
                </button>
            </div>
        </div>
        
        <div class="card">
            <h3> How to Earn Points</h3>
            <div class="grid">
                <div class="card" style="background: #f6fff4;">
                    <h4> Quizzes</h4>
                    <p>Complete environmental knowledge quizzes to earn 5-10 points per correct answer.</p>
                </div>
                <div class="card" style="background: #f6fff4;">
                    <h4> Daily Watering</h4>
                    <p>Submit daily plant watering photos to earn 15 points and maintain your streak.</p>
                </div>
                <div class="card" style="background: #f6fff4;">
                    <h4> Activities</h4>
                    <p>Upload photos of environmental activities for 10-20 points (subject to verification).</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById("submitActivity").addEventListener("click", handleActivitySubmission);
}

async function generateAIQuiz() {
    const topic = document.getElementById('quizTopic').value.trim();
    if (!topic) {
        alert('Please enter a topic for the AI quiz.');
        return;
    }

    try {
        alert('Generating quiz... This may take a moment.');
        const newQuiz = await apiRequest('POST', '/quizzes/generate', { topic });
        alert(`Quiz "${newQuiz.title}" generated successfully!`);
        navigateTo('games'); // Refresh to show new quiz
    } catch (error) {
        console.error('Error generating AI quiz:', error);
        alert('Failed to generate quiz. Please ensure your OpenAI API key is valid and try again.');
    }
}

function renderQuizHistory() {
    const user = AppState.currentUser;
    if (!user || !user.quizzesTaken || user.quizzesTaken.length === 0) {
        return '<p class="muted">No quizzes taken yet. Start with your first quiz above!</p>';
    }

    return user.quizzesTaken
        .map((qt) => {
            return `
            <div class="submission-item">
                <div>
                    <strong>${qt.quizId?.title || "Unknown Quiz"}</strong>
                    <span class="submission-date">${new Date(qt.takenAt).toLocaleDateString()}</span>
                </div>
                <div class="muted">Earned ${qt.earned} points</div>
            </div>
        `;
        })
        .join("");
}

async function handleActivitySubmission() {
    const type = document.getElementById("activityType").value;
    const note = document.getElementById("activityNote").value.trim();
    const photoInput = document.getElementById("activityPhoto");

    if (!note) {
        alert("Please provide a description of your activity.");
        return;
    }
    if (!photoInput.files || photoInput.files.length === 0) {
        alert("Please select a photo of your activity.");
        return;
    }

    const file = photoInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const imageData = e.target.result; // Base64 string

        try {
            const result = await apiRequest('POST', '/submissions', { type, note, imageData });
            alert(`Activity submitted successfully! You earned ${result.submission.points} points, awaiting admin verification.`);
            AppState.currentUser.points = result.userPoints; // Update points immediately
            document.getElementById("activityNote").value = "";
            document.getElementById("activityPhoto").value = "";
            navigateTo("games");
        } catch (error) {
            // Error message already handled
        }
    };
    reader.readAsDataURL(file);
}

async function startQuiz(quizId) {
    const quiz = await apiRequest('GET', `/quizzes/${quizId}`);
    if (!quiz) {
        alert("Quiz not found.");
        return;
    }

    let currentQuestion = 0;
    const answers = [];

    function showQuestion() {
        const q = quiz.questions[currentQuestion];
        const content = document.getElementById("mainContent");

        content.innerHTML = `
            <div class="quiz-container">
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2>${quiz.title}</h2>
                        <span class="muted">Question ${currentQuestion + 1} of ${quiz.questions.length}</span>
                    </div>
                    
                    <div class="question">
                        <h4>${q.q}</h4>
                        <div class="options">
                            ${q.options
                                .map(
                                    (option, index) => `
                                <label class="option" onclick="selectOption(${index})">
                                    <input type="radio" name="answer" value="${index}" style="margin-right: 0.5rem;">
                                    ${option}
                                </label>
                            `,
                                )
                                .join("")}
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
                        ${
                            currentQuestion > 0
                                ? '<button class="btn btn-secondary" onclick="previousQuestion()">Previous</button>'
                                : "<div></div>"
                        }
                        <button class="btn btn-primary" onclick="nextQuestion()" id="nextBtn" disabled>
                            ${currentQuestion === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                        </button>
                    </div>
                </div>
            </div>
        `;
        // Re-select previously chosen answer if exists
        if (answers[currentQuestion] !== undefined) {
            document.querySelector(`.option input[value="${answers[currentQuestion]}"]`).checked = true;
            document.querySelector(`.option[onclick="selectOption(${answers[currentQuestion]})"]`).classList.add('selected');
            document.getElementById("nextBtn").disabled = false;
        }
    }

    window.selectOption = (index) => {
        answers[currentQuestion] = index;
        document.getElementById("nextBtn").disabled = false;

        document.querySelectorAll(".option").forEach((opt) => {
            opt.classList.remove("selected");
        });
        document.querySelector(`.option[onclick="selectOption(${index})"]`).classList.add('selected');
    };

    window.nextQuestion = () => {
        if (answers[currentQuestion] === undefined) {
            alert('Please select an answer before proceeding.');
            return;
        }
        if (currentQuestion < quiz.questions.length - 1) {
            currentQuestion++;
            showQuestion();
        } else {
            finishQuiz();
        }
    };

    window.previousQuestion = () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion();
        }
    };

    async function finishQuiz() {
        try {
            const result = await apiRequest('POST', '/quizzes/submit', { quizId: quiz._id, answers });
            alert(`Quiz complete! You earned ${result.totalPoints} points.`);
            AppState.currentUser.points += result.totalPoints; // Update points
            navigateTo("games"); // Go back to games view
        } catch (error) {
            // Error handled by apiRequest
        }
    }

    showQuestion();
}

async function renderProfileView(content) {
    const user = AppState.currentUser;
    if (!user) {
        content.innerHTML = '<div class="card"><h3>Profile</h3><p class="muted">Please sign in to view your profile.</p></div>';
        return;
    }

    // Fetch latest user data including populated fields
    const latestUser = await apiRequest('GET', '/users/profile');
    AppState.currentUser = latestUser; // Update AppState with latest user data

    const wateringRecords = await apiRequest('GET', '/watering');
    const submissions = await apiRequest('GET', '/submissions');

    content.innerHTML = `
        <div class="dashboard-header">
            <div class="user-info">
                <div class="avatar" style="width: 80px; height: 80px; font-size: 2rem;">${user.fullName[0]}</div>
                <div class="user-details">
                    <h2>${user.fullName}</h2>
                    <p class="muted">@${user.username} • ${user.email}</p>
                    <p class="muted">Member since ${new Date(user.createdAt).toLocaleDateString()}</p>
                    ${user.school ? `<p class="muted">${user.school}${user.grade ? ` • ${user.grade}` : ""}</p>` : ""}
                </div>
            </div>
            <div class="points-badge" style="font-size: 1.2rem; padding: 1rem 1.5rem;">
                ${user.points} Points
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3> Your Statistics</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: #f6fff4; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${user.points}</div>
                        <p class="muted">Total Points</p>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f6fff4; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${wateringRecords.length}</div>
                        <p class="muted">Plants Watered</p>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f6fff4; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${user.quizzesTaken ? user.quizzesTaken.length : 0}</div>
                        <p class="muted">Quizzes Taken</p>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f6fff4; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #2b7a2b;">${submissions.length}</div>
                        <p class="muted">Activities Submitted</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3> Achievements & Badges</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    ${renderBadges(user)}
                </div>
            </div>
            
            <div class="card">
                <h3> Generate Certificate</h3>
                <p>Download a personalized certificate showcasing your environmental contributions!</p>
                <div style="text-align: center; margin: 1.5rem 0;">
                    <div style="font-size: 1.2rem; margin-bottom: 1rem;">
                        Certificate will include:
                    </div>
                    <ul style="text-align: left; max-width: 300px; margin: 0 auto;">
                        <li>Your name and achievements</li>
                        <li>Total points earned: ${user.points}</li>
                        <li>Environmental activities completed</li>
                        <li>Date of issue</li>
                    </ul>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="generateCertificate('png')">
                        Download as Image
                    </button>
                    <button class="btn btn-secondary" onclick="generateCertificate('pdf')">
                        Download as PDF
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3> Recent Activity</h3>
            ${await renderDetailedActivity(user)}
        </div>
    `;
}

function renderBadges(user) {
    const badges = [
        { name: "First Steps", requirement: "Join EcoPlay", earned: true, icon: "🌱" },
        {
            name: "Quiz Master",
            requirement: "Complete 3 quizzes",
            earned: (user.quizzesTaken?.length || 0) >= 3,
            icon: "🧠",
        },
        { name: "Green Thumb", requirement: "7-day watering streak", earned: user.wateringStreak >= 7, icon: "🌿" },
        { name: "Point Collector", requirement: "Earn 100 points", earned: user.points >= 100, icon: "💎" },
        { name: "Eco Warrior", requirement: "Earn 500 points", earned: user.points >= 500, icon: "🏆" },
        { name: "Plant Master", requirement: "30-day watering streak", earned: user.wateringStreak >= 30, icon: "🌳" },
    ];

    return badges
        .map(
            (badge) => `
        <div class="card ${badge.earned ? "card-unlocked" : "card-locked"}" style="text-align: center; padding: 1rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${badge.icon}</div>
            <h4>${badge.name}</h4>
            <p class="muted" style="font-size: 0.8rem;">${badge.requirement}</p>
            <p style="font-size: 0.8rem; font-weight: bold; color: ${badge.earned ? "#2b7a2b" : "#999"};">
                ${badge.earned ? "Earned!" : "Not yet earned"}
            </p>
        </div>
    `,
        )
        .join("");
}

async function renderDetailedActivity(user) {
    const wateringRecords = await apiRequest('GET', '/watering');
    const submissions = await apiRequest('GET', '/submissions');

    const allActivity = [
        ...wateringRecords.map((r) => ({
            type: "watering",
            date: r.date,
            description: `Watered plants: ${r.note}`,
            points: r.points,
        })),
        ...(user.quizzesTaken || []).map((q) => ({
            type: "quiz",
            date: q.takenAt,
            description: `Completed quiz: ${q.quizId?.title || 'Unknown Quiz'}`,
            points: q.earned,
        })),
        ...submissions.map((s) => ({
            type: "activity",
            date: s.createdAt,
            description: `${s.type}: ${s.note}`,
            points: s.points,
        })),
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    if (allActivity.length === 0) {
        return '<p class="muted">No activity yet. Start by taking a quiz or submitting your first watering photo!</p>';
    }

    return allActivity
        .map(
            (activity) => `
        <div class="submission-item">
            <div>
                <strong>${activity.description}</strong>
                <span class="submission-date">${new Date(activity.date).toLocaleDateString()}</span>
            </div>
            <div class="muted">+${activity.points} points</div>
        </div>
    `,
        )
        .join("");
}

function generateCertificate(format = "png") {
    const user = AppState.currentUser;
    if (!user) {
        alert("Please sign in to generate certificate");
        return;
    }

    // Create canvas for certificate
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f6fff4");
    gradient.addColorStop(1, "#e8f5e8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#2b7a2b";
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Inner border
    ctx.strokeStyle = "#4caf50";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Title
    ctx.fillStyle = "#2b7a2b";
    ctx.font = "bold 48px serif";
    ctx.textAlign = "center";
    ctx.fillText("Certificate of Environmental Achievement", canvas.width / 2, 150);

    // Subtitle
    ctx.fillStyle = "#333";
    ctx.font = "24px serif";
    ctx.fillText("This certificate is proudly awarded to", canvas.width / 2, 220);

    // User name
    ctx.fillStyle = "#2b7a2b";
    ctx.font = "bold 42px serif";
    ctx.fillText(user.fullName, canvas.width / 2, 290);

    // Achievement text
    ctx.fillStyle = "#333";
    ctx.font = "20px serif";
    const achievementText = `For outstanding commitment to environmental conservation and sustainability,`;
    ctx.fillText(achievementText, canvas.width / 2, 350);

    const pointsText = `earning ${user.points} points through active participation in EcoPlay activities.`;
    ctx.fillText(pointsText, canvas.width / 2, 380);

    // Details
    ctx.font = "18px serif";
    const wateringCount = wateringRecords.length; // Use fetched records
    const quizCount = user.quizzesTaken ? user.quizzesTaken.length : 0;

    ctx.fillText(
        `Environmental Activities: ${wateringCount} plant watering sessions, ${quizCount} educational quizzes completed`,
        canvas.width / 2,
        450,
    );

    // Date
    ctx.font = "16px serif";
    ctx.fillText(`Issued on ${new Date().toLocaleDateString()}`, canvas.width / 2, 520);

    // Footer
    ctx.font = "italic 16px serif";
    ctx.fillStyle = "#666";
    ctx.fillText("EcoPlay Environmental Awareness Platform", canvas.width / 2, 600);
    ctx.fillText("Making Environmental Action Fun and Rewarding", canvas.width / 2, 625);

    // Decorative elements
    ctx.fillStyle = "#2b7a2b";
    ctx.font = "40px serif";
    ctx.fillText("", 150, 300);
    ctx.fillText("", canvas.width - 150, 300);
    ctx.fillText("", canvas.width / 2, 550);

    if (format === "pdf") {
        alert("PDF generation requires an additional library (e.g., jsPDF). Downloading as image instead.");
        format = "png";
    }

    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${user.username}_ecoplay_certificate.${format}`;
    link.href = dataURL;
    link.click();

    alert("Certificate downloaded successfully!");
}

async function renderRedeemView(content) {
    const user = AppState.currentUser;
    const userRedemptions = await apiRequest('GET', '/redemptions');

    content.innerHTML = `
        <div class="text-center mb-2">
            <h1> Redeem Your Points</h1>
            <p class="muted">Exchange your hard-earned points for exciting rewards!</p>
            <div class="points-badge" style="font-size: 1.2rem; margin: 1rem 0;">
                Available Points: ${user.points}
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3> Eco Rewards</h3>
                <div class="reward-list">
                    ${renderRewardItem("Digital Plant Care Guide", 50, "Comprehensive guide to caring for indoor and outdoor plants", "📖")}
                    ${renderRewardItem("Eco-Friendly Tips Collection", 75, "Collection of 100 practical environmental tips", "💡")}
                    ${renderRewardItem("Virtual Tree Planting Certificate", 100, "Plant a virtual tree and get a personalized certificate", "🌳")}
                </div>
            </div>
            
            <div class="card">
                <h3>  Achievement Rewards</h3>
                <div class="reward-list">
                    ${renderRewardItem("Environmental Hero Badge", 150, "Special digital badge for your profile", "🏅")}
                    ${renderRewardItem("Sustainability Champion Title", 200, "Exclusive title and profile enhancement", "👑")}
                    ${renderRewardItem("Eco Mentor Status", 300, "Become a mentor and help other users", "👨‍🏫")}
                </div>
            </div>
            
            <div class="card">
                <h3> Platform Perks</h3>
                <div class="reward-list">
                    ${renderRewardItem("Quiz Streak Multiplier", 120, "Double points for next 5 quizzes", "⚡")}
                    ${renderRewardItem("Custom Profile Theme", 180, "Personalize your profile with custom colors", "🎨")}
                    ${renderRewardItem("Early Access Features", 250, "Get early access to new platform features", "🚀")}
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3> Your Redemption History</h3>
            ${
              userRedemptions.length === 0
                ? '<p class="muted">No redemptions yet. Start earning points and redeem your first reward!</p>'
                : userRedemptions
                    .map(
                      (redemption) => `
                    <div class="submission-item">
                        <div>
                            <strong>${redemption.reward}</strong>
                            <span class="submission-date">${new Date(redemption.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="muted">${redemption.cost} points</div>
                    </div>
                `,
                    )
                    .join("")
            }
        </div>
        
        <div class="card text-center">
            <h3> Earn More Points</h3>
            <p>Need more points? Here are some quick ways to earn them:</p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
                <button class="btn btn-primary" onclick="navigateTo('watering')">
                    Daily Watering (+15 pts)
                </button>
                <button class="btn btn-primary" onclick="navigateTo('games')">
                    Take Quiz (+10-50 pts)
                </button>
                <button class="btn btn-secondary" onclick="navigateTo('games')">
                    Submit Activity (+10-20 pts)
                </button>
            </div>
        </div>
    `;
}

function renderRewardItem(name, cost, description, icon) {
    const user = AppState.currentUser;
    const canAfford = user.points >= cost;

    return `
        <div class="reward-item" style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; ${!canAfford ? "opacity: 0.6;" : ""}">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="font-size: 2rem;">${icon}</div>
                <div style="flex: 1;">
                    <h4>${name}</h4>
                    <p class="muted" style="margin: 0.5rem 0;">${description}</p>
                    <p style="font-weight: bold; color: #2b7a2b; margin: 0;">${cost} points</p>
                </div>
                <button class="btn ${canAfford ? "btn-primary" : "btn-secondary"}" 
                        onclick="redeemReward('${name}', ${cost})" 
                        ${!canAfford ? "disabled" : ""}>
                    ${canAfford ? "Redeem" : "Need " + (cost - user.points) + " more"}
                </button>
            </div>
        </div>
    `;
}

async function redeemReward(rewardName, cost) {
    const user = AppState.currentUser;

    if (user.points < cost) {
        alert(`You need ${cost - user.points} more points to redeem this reward.`);
        return;
    }

    if (!confirm(`Are you sure you want to redeem "${rewardName}" for ${cost} points?`)) {
        return;
    }

    try {
        const result = await apiRequest('POST', '/redemptions', { rewardName, cost });
        alert(`Congratulations! You've successfully redeemed "${rewardName}"!`);
        AppState.currentUser.points = result.userPoints; // Update points
        navigateTo("redeem"); // Refresh the view
    } catch (error) {
        // Error handled by apiRequest
    }
}

// --- New Lessons View ---
async function renderLessonsView(content) {
    const lessons = await apiRequest('GET', '/lessons');
    const user = AppState.currentUser;

    content.innerHTML = `
        <div class="text-center mb-2">
            <h1> Interactive Lessons & Videos</h1>
            <p class="muted">Learn about environmental topics and earn points!</p>
        </div>

        ${(AppState.isAdmin || AppState.isEducator) ? `
            <div class="card mb-2">
                <h3>Create New Lesson</h3>
                <form id="createLessonForm">
                    <div class="form-group">
                        <label for="lessonTitle">Title</label>
                        <input type="text" id="lessonTitle" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="lessonDescription">Description</label>
                        <textarea id="lessonDescription" class="form-control"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="lessonType">Type</label>
                        <select id="lessonType" class="form-control" required>
                            <option value="video">Video</option>
                            <option value="text">Text (Markdown)</option>
                            <option value="interactive">Interactive (Link)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="lessonContent">Content (Video URL, Markdown, or Interactive Link)</label>
                        <input type="text" id="lessonContent" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="lessonThumbnail">Thumbnail URL (Optional)</label>
                        <input type="text" id="lessonThumbnail" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="lessonPointsReward">Points Reward</label>
                        <input type="number" id="lessonPointsReward" class="form-control" value="0">
                    </div>
                    <button type="submit" class="btn btn-primary">Create Lesson</button>
                </form>
            </div>
        ` : ''}
        
        <div class="grid">
            ${lessons.length === 0 ? '<p class="muted">No lessons available yet. Check back later!</p>' : lessons.map(lesson => `
                <div class="card lesson-card">
                    ${lesson.thumbnail ? `<img src="${lesson.thumbnail}" alt="${lesson.title}" class="lesson-thumbnail">` : ''}
                    <h4>${lesson.title}</h4>
                    <p class="muted">${lesson.description}</p>
                    <p>Type: ${lesson.type}</p>
                    <p>Points: ${lesson.pointsReward}</p>
                    <button class="btn btn-primary" onclick="viewLesson('${lesson._id}')">View Lesson</button>
                    ${user.joinedEvents.includes(lesson._id) ? '<span class="badge badge-success">Completed</span>' : ''}
                </div>
            `).join('')}
        </div>
    `;

    if (AppState.isAdmin || AppState.isEducator) {
        document.getElementById('createLessonForm').addEventListener('submit', handleCreateLesson);
    }
}

async function handleCreateLesson(e) {
    e.preventDefault();
    const title = document.getElementById('lessonTitle').value.trim();
    const description = document.getElementById('lessonDescription').value.trim();
    const type = document.getElementById('lessonType').value;
    const content = document.getElementById('lessonContent').value.trim();
    const thumbnail = document.getElementById('lessonThumbnail').value.trim();
    const pointsReward = parseInt(document.getElementById('lessonPointsReward').value);

    try {
        const newLesson = await apiRequest('POST', '/lessons', {
            title, description, type, content, thumbnail, pointsReward
        });
        alert(`Lesson "${newLesson.title}" created successfully!`);
        navigateTo('lessons'); // Refresh view
    } catch (error) {
        console.error('Error creating lesson:', error);
    }
}

async function viewLesson(lessonId) {
    try {
        const lesson = await apiRequest('GET', `/lessons/${lessonId}`);
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2>${lesson.title}</h2>
            <p class="muted">${lesson.description}</p>
            <hr>
            ${lesson.type === 'video' ? `<div class="video-container"><iframe src="${lesson.content}" frameborder="0" allowfullscreen></iframe></div>` : ''}
            ${lesson.type === 'text' ? `<div class="markdown-content">${lesson.content}</div>` : ''}
            ${lesson.type === 'interactive' ? `<p>Explore this interactive content: <a href="${lesson.content}" target="_blank">${lesson.content}</a></p>` : ''}
            <p style="margin-top: 1rem;">Complete this lesson to earn <strong>${lesson.pointsReward} points</strong>.</p>
            ${AppState.currentUser.joinedEvents.includes(lesson._id) ?
                '<button class="btn btn-secondary" disabled>Lesson Completed!</button>' :
                `<button class="btn btn-primary" onclick="completeLesson('${lesson._id}')">Mark as Complete</button>`
            }
        `;
        document.getElementById('modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing lesson:', error);
    }
}

async function completeLesson(lessonId) {
    try {
        const result = await apiRequest('POST', `/lessons/${lessonId}/complete`);
        alert(result.message);
        AppState.currentUser.points = result.userPoints;
        AppState.currentUser.joinedEvents.push(lessonId); // Manually update client state
        document.getElementById('modal').classList.add('hidden');
        navigateTo('lessons'); // Refresh view
    } catch (error) {
        console.error('Error completing lesson:', error);
    }
}

// --- Admin View ---
async function renderAdminView(content) {
    if (!AppState.isAdmin && !AppState.isEducator) {
        content.innerHTML = '<p class="error-message text-center">You are not authorized to view this page.</p>';
        return;
    }

    const users = await apiRequest('GET', '/admin/users');
    const pendingSubmissions = await apiRequest('GET', '/admin/submissions/pending');
    const pendingWateringRecords = await apiRequest('GET', '/admin/watering/pending');
    const analytics = await apiRequest('GET', '/admin/analytics');

    content.innerHTML = `
        <div class="text-center mb-2">
            <h1> Admin / Educator Panel</h1>
            <p class="muted">Manage users, verify activities, and view analytics.</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>Platform Analytics</h3>
                <p>Total Users: <strong>${analytics.totalUsers}</strong></p>
                <p>Total Quizzes: <strong>${analytics.totalQuizzes}</strong></p>
                <p>Total Submissions: <strong>${analytics.totalSubmissions}</strong> (${analytics.verifiedSubmissions} verified)</p>
                <p>Total Watering Records: <strong>${analytics.totalWateringRecords}</strong> (${analytics.verifiedWateringRecords} verified)</p>
                <p>Total Points Awarded: <strong>${analytics.totalPointsAwarded}</strong></p>
            </div>

            <div class="card">
                <h3>Pending Submissions (${pendingSubmissions.length})</h3>
                ${pendingSubmissions.length === 0 ? '<p class="muted">No pending activity submissions.</p>' : pendingSubmissions.map(sub => `
                    <div class="submission-item" style="border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                        <p><strong>${sub.userId.fullName}</strong> (${sub.type}) - ${new Date(sub.createdAt).toLocaleDateString()}</p>
                        <p class="muted">${sub.note}</p>
                        <img src="${sub.imageData}" alt="Submission" style="max-width: 100px; max-height: 100px; margin-top: 0.5rem;">
                        <div style="margin-top: 0.5rem;">
                            <button class="btn btn-success btn-small" onclick="verifySubmission('${sub._id}', true)">Verify</button>
                            <button class="btn btn-danger btn-small" onclick="verifySubmission('${sub._id}', false)">Reject</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <h3>Pending Watering Records (${pendingWateringRecords.length})</h3>
                ${pendingWateringRecords.length === 0 ? '<p class="muted">No pending watering records.</p>' : pendingWateringRecords.map(rec => `
                    <div class="submission-item" style="border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                        <p><strong>${rec.userId.fullName}</strong> - ${new Date(rec.date).toLocaleDateString()}</p>
                        <p class="muted">${rec.note}</p>
                        <img src="${rec.imageData}" alt="Watering" style="max-width: 100px; max-height: 100px; margin-top: 0.5rem;">
                        <div style="margin-top: 0.5rem;">
                            <button class="btn btn-success btn-small" onclick="verifyWateringRecord('${rec._id}', true)">Verify</button>
                            <button class="btn btn-danger btn-small" onclick="verifyWateringRecord('${rec._id}', false)">Reject</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="card mt-2">
            <h3>User Management</h3>
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Points</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.fullName}</td>
                            <td>${u.username}</td>
                            <td>${u.email}</td>
                            <td>${u.points}</td>
                            <td>${u.role}</td>
                            <td>
                                <button class="btn btn-info btn-small" onclick="viewUserDetails('${u._id}')">View</button>
                                ${AppState.isAdmin ? `
                                    <button class="btn btn-warning btn-small" onclick="editUserRole('${u._id}', '${u.role}')">Edit Role</button>
                                    <button class="btn btn-danger btn-small" onclick="deleteUser('${u._id}')">Delete</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function verifySubmission(submissionId, verified) {
    const adminNotes = prompt("Add admin notes (optional):");
    try {
        await apiRequest('PUT', `/admin/submissions/${submissionId}/verify`, { verified, adminNotes });
        alert(`Submission ${verified ? 'verified' : 'rejected'} successfully!`);
        navigateTo('admin'); // Refresh admin view
    } catch (error) {
        console.error('Error verifying submission:', error);
    }
}

async function verifyWateringRecord(recordId, verified) {
    const adminNotes = prompt("Add admin notes (optional):");
    try {
        await apiRequest('PUT', `/admin/watering/${recordId}/verify`, { verified, adminNotes });
        alert(`Watering record ${verified ? 'verified' : 'rejected'} successfully!`);
        navigateTo('admin'); // Refresh admin view
    } catch (error) {
        console.error('Error verifying watering record:', error);
    }
}

async function viewUserDetails(userId) {
    try {
        const user = await apiRequest('GET', `/admin/user/${userId}`);
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2>User Details: ${user.fullName}</h2>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Points:</strong> ${user.points}</p>
            <p><strong>School:</strong> ${user.school || 'N/A'}</p>
            <p><strong>Grade:</strong> ${user.grade || 'N/A'}</p>
            <p><strong>Member Since:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
            <hr>
            <h3>Quizzes Taken</h3>
            <ul>
                ${user.quizzesTaken.length > 0 ? user.quizzesTaken.map(q => `<li>${q.quizId?.title || 'Unknown Quiz'} - ${q.earned} points (${q.correctAnswers}/${q.totalQuestions} correct) on ${new Date(q.takenAt).toLocaleDateString()}</li>`).join('') : '<li>No quizzes taken.</li>'}
            </ul>
            <h3>Submissions</h3>
            <ul>
                ${user.submissions.length > 0 ? user.submissions.map(s => `<li>${s.type}: ${s.note} - ${s.points} points (${s.verified ? 'Verified' : 'Pending'}) on ${new Date(s.createdAt).toLocaleDateString()}</li>`).join('') : '<li>No submissions.</li>'}
            </ul>
        `;
        document.getElementById('modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing user details:', error);
    }
}

async function editUserRole(userId, currentRole) {
    const newRole = prompt(`Enter new role for user (current: ${currentRole}). Options: user, educator, admin`);
    if (newRole && ['user', 'educator', 'admin'].includes(newRole)) {
        try {
            await apiRequest('PUT', `/admin/user/${userId}/role`, { role: newRole });
            alert('User role updated successfully!');
            navigateTo('admin'); // Refresh admin view
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    } else if (newRole !== null) {
        alert('Invalid role entered. Please choose from: user, educator, admin.');
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            await apiRequest('DELETE', `/admin/user/${userId}`);
            alert('User deleted successfully!');
            navigateTo('admin'); // Refresh admin view
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();

    // Modal close button
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
    });
});

// Expose functions to global scope for inline HTML event handlers
window.showSignUpForm = showSignUpForm;
window.showSignInForm = showSignInForm;
window.signOut = signOut;
window.navigateTo = navigateTo;
window.showAboutPublic = showAboutPublic;
window.showContactPublic = showContactPublic;
window.renderApp = renderApp;
window.startQuiz = startQuiz;
window.generateCertificate = generateCertificate;
window.redeemReward = redeemReward;
window.generateAIQuiz = generateAIQuiz; // Expose AI quiz generation
window.verifySubmission = verifySubmission; // Expose admin functions
window.verifyWateringRecord = verifyWateringRecord;
window.viewUserDetails = viewUserDetails;
window.editUserRole = editUserRole;
window.deleteUser = deleteUser;
window.viewLesson = viewLesson; // Expose lesson functions
window.completeLesson = completeLesson;
