document.addEventListener('DOMContentLoaded', async () => {
    // State Management
    const state = {
        currentView: 'dashboard',
        theme: localStorage.getItem('theme') || 'light-theme',
        date: new Date(), // Defaults to today
        firstName: 'Friend', // Default
        email: ''
    };

    // Check authentication
    const { data: { session } } = await window.sb.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Load User Name
    const user = session.user;
    const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
    state.firstName = fullName.split(' ')[0];
    state.email = user.email;

    // Add User Profile to Sidebar
    // Add User Profile to Sidebar (Desktop)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const profileDiv = document.createElement('div');
        profileDiv.style.marginBottom = '20px';
        profileDiv.style.padding = '10px';
        profileDiv.style.background = 'rgba(255,255,255,0.05)';
        profileDiv.style.borderRadius = '8px';
        profileDiv.innerHTML = `
            <div style="font-size:12px; opacity:0.7">Logged in as</div>
            <div style="font-weight:600; display:flex; justify-content:space-between; align-items:center">
                <span id="user-display-name"></span>
                <button id="edit-name-btn" title="Edit First Name" style="background:none; border:none; color:inherit; cursor:pointer; font-size:12px;">✏️</button>
            </div>
        `;
        profileDiv.querySelector('#user-display-name').textContent = state.firstName;
        sidebar.insertBefore(profileDiv, sidebar.querySelector('.nav-links'));

        // Edit Name Logic
        document.getElementById('edit-name-btn').addEventListener('click', async () => {
            const newName = prompt("Update your First Name:", state.firstName);
            if (newName && newName.trim() !== "") {
                const { error } = await window.sb.auth.updateUser({
                    data: { full_name: newName } // We store first name in full_name field for simplicity
                });
                if (!error) {
                    state.firstName = newName;
                    document.getElementById('user-display-name').textContent = newName;
                    if (mainContainer.querySelector('.dashboard-view')) {
                        renderDashboard(); // Re-render to update greeting
                    }
                } else {
                    alert("Error updating name");
                }
            }
        });
    }



    // Strict Session Expiry
    window.sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            window.location.href = 'login.html';
        }
    });

    // Store current user ID for database operations
    window.currentUserId = session.user.id;

    // UI Elements
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const viewTitle = document.getElementById('view-title');
    const dateDisplay = document.getElementById('date-display');
    const mainContainer = document.getElementById('main-container');
    const prevDateBtn = document.getElementById('prev-date');
    const nextDateBtn = document.getElementById('next-date');
    const datePicker = document.getElementById('date-picker');

    // Initialize UI
    body.className = state.theme;
    updateDateDisplay();
    switchView(state.currentView);

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light-theme' ? 'dark-theme' : 'light-theme';
        body.className = state.theme;
        localStorage.setItem('theme', state.theme);
        themeToggle.innerHTML = state.theme === 'light-theme' ? '☀️' : '🌙';
    });

    // Add logout button
    // Add logout button (Desktop)
    if (document.querySelector('.sidebar-footer')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.innerHTML = '⎋'; // Logout Symbol
        logoutBtn.title = 'Logout';
        logoutBtn.className = 'theme-btn';
        logoutBtn.style.fontSize = '20px';
        logoutBtn.addEventListener('click', async () => {
            await window.sb.auth.signOut();
            window.location.href = 'login.html';
        });
        document.querySelector('.sidebar-footer').appendChild(logoutBtn);
    }

    // Mobile Logout
    const mobileLogout = document.getElementById('mobile-logout-btn');
    if (mobileLogout) {
        mobileLogout.addEventListener('click', async () => {
            await window.sb.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Date Navigation Listeners

    prevDateBtn.addEventListener('click', () => {
        if (state.date.getFullYear() === 2026 && state.date.getMonth() === 0 && state.date.getDate() === 1) return;
        state.date.setDate(state.date.getDate() - 1);
        handleDateChange();
    });

    nextDateBtn.addEventListener('click', () => {
        if (state.date.getFullYear() === 2026 && state.date.getMonth() === 11 && state.date.getDate() === 31) return;
        state.date.setDate(state.date.getDate() + 1);
        handleDateChange();
    });

    datePicker.addEventListener('change', (e) => {
        const newDate = new Date(e.target.value);
        if (newDate.getFullYear() === 2026) {
            state.date = newDate;
            handleDateChange();
        } else {
            updateDateDisplay(); // Revert picker value
        }
    });

    function handleDateChange() {
        updateDateDisplay();
        switchView(state.currentView);
    }

    function switchView(view) {
        state.currentView = view;
        if (viewTitle) {
            viewTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1);
        }

        switch (view) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'daily':
                renderDailyPage();
                break;
            case 'monthly':
                renderMonthlyView();
                break;
            case 'strategy':
                renderWeeklyStrategy();
                break;
            case 'weekly':
                renderWeeklyTracking();
                break;
            case 'roadmap':
                renderRoadmap();
                break;
            case 'help':
                renderHelpPage();
                break;
        }
    }

    function getWeekNumber(d) {
        const start = new Date(2026, 0, 1);
        const diff = d - start;
        return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    }

    function getLocalISODate(d) {
        return d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    }

    function updateDateDisplay() {
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        dateDisplay.textContent = state.date.toLocaleDateString('en-US', options);
        datePicker.value = state.date.toISOString().split('T')[0];

        // Disable buttons at 2026 boundaries
        const isJan1 = state.date.getMonth() === 0 && state.date.getDate() === 1;
        const isDec31 = state.date.getMonth() === 11 && state.date.getDate() === 31;

        prevDateBtn.style.opacity = isJan1 ? '0.3' : '1';
        prevDateBtn.style.cursor = isJan1 ? 'default' : 'pointer';

        nextDateBtn.style.opacity = isDec31 ? '0.3' : '1';
        nextDateBtn.style.cursor = isDec31 ? 'default' : 'pointer';
    }

    // Render Functions
    async function renderDashboard() {
        const today = getLocalISODate(state.date);
        const weekNum = getWeekNumber(state.date);

        // Fetch data from DB (or fallback to local object if offline/loading logic needed)
        // For simplicity, we await direct DB call. 
        // Note: This makes rendering async.
        const dailyData = await window.db.getDailyEntry(today);

        // Seed today's targets if missing (Generic Defaults)
        if (!dailyData.target_1 && today === '2026-01-01') {
            await window.db.saveDailyEntry(today, {
                target_1: "Identify Top 3 Priorities",
                target_2: "Complete Key Project Milestone",
                target_3: "30 Mins of Personal Development"
            });
            // Reload to get new values
            Object.assign(dailyData, {
                target_1: "Identify Top 3 Priorities",
                target_2: "Complete Key Project Milestone",
                target_3: "30 Mins of Personal Development"
            });
        }

        const targets = [
            dailyData.target_1 || 'No target set',
            dailyData.target_2 || 'No target set',
            dailyData.target_3 || 'No target set'
        ];

        let completedCount = 0;
        // Check completion status (stored as target_1_completed etc in DB)
        if (dailyData.target_1_completed) completedCount++;
        if (dailyData.target_2_completed) completedCount++;
        if (dailyData.target_3_completed) completedCount++;

        const habitScore = calculateHabitScore();
        const dayStreak = calculateDayStreak();

        mainContainer.innerHTML = `
            <div class="dashboard-view">
                <div class="welcome-card card">
                    <h2 class="serif">Good Morning, <span id="dashboard-user-name"></span></h2>
                    <p>Current Progress: <strong>Week ${weekNum} of 13</strong></p>
                </div>

                <div class="dashboard-stats">
                    <div class="stat-card card">
                        <span class="stat-value" id="target-count">${completedCount}/3</span>
                        <span class="stat-label">Daily Targets</span>
                    </div>
                    <div class="stat-card card">
                        <span class="stat-value">${dayStreak}</span>
                        <span class="stat-label">Day Streak</span>
                    </div>
                    <div class="stat-card card">
                        <span class="stat-value">${habitScore}%</span>
                        <span class="stat-label">Habit Score</span>
                    </div>
                </div>
                </div>

                ${renderGoalsProgress(weekNum)}

                <div class="card dot-grid" style="margin-top: 24px;">
                    <h3 class="serif italics">Today's Focus</h3>
                    <ul style="list-style: none; margin-top: 12px; display: flex; flex-direction: column; gap: 12px;">
                        ${targets.map((t, i) => {
            const isChecked = dailyData[`target_${i + 1}_completed`] === true;
            return `
                                <li style="display: flex; align-items: center; gap: 12px;">
                                    <input type="checkbox" class="target-checkbox" data-index="${i + 1}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px;">
                                    <span style="${isChecked ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t}</span>
                                </li>
                            `;
        }).join('')}
                    </ul>
                </div>
            </div>
        `;
        // Safe Text Insertion
        document.getElementById('dashboard-user-name').textContent = state.firstName;

        attachDashboardListeners();
    }

    function attachDashboardListeners() {
        const today = getLocalISODate(state.date);
        const checkboxes = mainContainer.querySelectorAll('.target-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const index = e.target.dataset.index;
                const update = {};
                update[`target_${index}_completed`] = e.target.checked;
                await window.db.saveDailyEntry(today, update);
                renderDashboard(); // Re-render to update stats and strikethrough
            });
        });
    }

    function calculateHabitScore() {
        const weekNum = getWeekNumber(state.date);
        const habits = JSON.parse(localStorage.getItem('habits') || '[]');
        if (habits.length === 0) return 0;

        let totalPossible = habits.length * 7;
        let completedCount = 0;

        habits.forEach((_, index) => {
            for (let day = 0; day < 7; day++) {
                if (localStorage.getItem(`weekly_v1_w${weekNum}_habit_${index}_day_${day}`) === 'true') {
                    completedCount++;
                }
            }
        });

        return Math.round((completedCount / totalPossible) * 100);
    }

    function calculateDayStreak() {
        let streak = 0;
        let checkDate = new Date(state.date.getTime());
        while (true) {
            const dateStr = getLocalISODate(checkDate);
            let hasCompletedTarget = false;
            for (let i = 1; i <= 3; i++) {
                if (localStorage.getItem(`${dateStr}_target_${i}_completed`) === 'true') {
                    hasCompletedTarget = true;
                    break;
                }
            }
            if (hasCompletedTarget) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
                if (checkDate.getFullYear() < 2026) break;
            } else {
                break;
            }
        }
        return streak;
    }

    async function renderDailyPage() {
        mainContainer.innerHTML = `
            <div class="daily-view">
                <div class="daily-grid">
                    <!-- Morning Section -->
                    <div class="morning-section card dot-grid">
                        <h3 class="serif italics icon-label">☀️ Morning Routine</h3>
                        <div class="input-group">
                            <label>This morning I am grateful for...</label>
                            <textarea placeholder="1." data-key="morning_gratitude_1"></textarea>
                            <textarea placeholder="2." data-key="morning_gratitude_2"></textarea>
                            <textarea placeholder="3." data-key="morning_gratitude_3"></textarea>
                        </div>
                        <div class="input-group">
                            <label>Today's Targets</label>
                            <textarea placeholder="Target 1" data-key="target_1"></textarea>
                            <textarea placeholder="Target 2" data-key="target_2"></textarea>
                            <textarea placeholder="Target 3" data-key="target_3"></textarea>
                        </div>
                    </div>

                    <!-- Timeline Section -->
                    <div class="timeline-section card dot-grid">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <h3 class="serif italics">Schedule / Actions</h3>
                            <span style="font-size: 10px; text-transform: uppercase;">Midday Check-In at 1 PM</span>
                        </div>
                        <div class="timeline">
                            ${generateTimeline()}
                        </div>
                    </div>

                    <!-- Evening Section -->
                    <div class="evening-section card dot-grid">
                        <h3 class="serif italics icon-label">🌙 Evening Review</h3>
                        <div class="input-group">
                            <label>Tonight I am grateful for...</label>
                            <textarea placeholder="1." data-key="evening_gratitude_1"></textarea>
                            <textarea placeholder="2." data-key="evening_gratitude_2"></textarea>
                            <textarea placeholder="3." data-key="evening_gratitude_3"></textarea>
                        </div>
                        <div class="input-group">
                            <label>Wins / Lessons Learned</label>
                            <textarea placeholder="Wins" data-key="win_1"></textarea>
                            <textarea placeholder="Lessons Learned" data-key="lesson_1"></textarea>
                        </div>
                    </div>
                </div>

                <div class="reflection-checkpoints">
                    <div class="card dot-grid">
                        <label class="serif italics">Midday Check-In</label>
                        <textarea placeholder="Am I on track? What can I improve?" data-key="midday_reflection" class="reflection-textarea"></textarea>
                    </div>
                    <div class="card dot-grid">
                        <label class="serif italics">End of Day Reflection</label>
                        <textarea placeholder="How did today go?" data-key="eod_reflection" class="reflection-textarea"></textarea>
                    </div>
                </div>

                <div class="card quote-card">
                    <p class="quote-text">"Success is not final, failure is not fatal: it is the courage to continue that counts."</p>
                    <small>— Winston Churchill</small>
                </div>
            </div>
        `;

        await loadSavedData(); // Now async
        attachInputListeners();
    }

    function generateTimeline() {
        let html = '';
        for (let i = 6; i <= 21; i++) {
            const time = i > 12 ? `${i - 12} PM` : `${i} ${i === 12 ? 'PM' : 'AM'}`;
            html += `
                <div class="timeline-slot">
                    <span class="time-label">${time}</span>
                    <input type="text" class="timeline-input" data-key="time_${i}_00" placeholder="">
                </div>
                <div class="timeline-slot">
                    <span class="time-label">:30</span>
                    <input type="text" class="timeline-input" data-key="time_${i}_30" placeholder="">
                </div>
            `;
        }
        return html;
    }

    function attachInputListeners() {
        const inputs = mainContainer.querySelectorAll('textarea, input');
        inputs.forEach(input => {
            // Debounce save to DB
            let timeout;
            input.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(async () => {
                    const today = getLocalISODate(state.date);
                    const key = e.target.dataset.key;
                    const val = e.target.value;
                    await window.db.saveDailyEntry(today, { [key]: val });
                }, 500); // 500ms debounce
            });
        });
    }

    async function loadSavedData() {
        const today = getLocalISODate(state.date);
        const data = await window.db.getDailyEntry(today);

        const inputs = mainContainer.querySelectorAll('textarea, input');
        inputs.forEach(input => {
            const key = input.dataset.key;
            if (data[key]) {
                input.value = data[key];
            }
        });
    }


    async function renderWeeklyTracking() {
        const weekNum = getWeekNumber(state.date);
        mainContainer.innerHTML = `
            <div class="weekly-view">
                <div class="card habit-tracker">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h2 class="serif">Weekly Habit Tracking</h2>
                        <span class="milestone-week">Week ${weekNum} of 2026</span>
                    </div>
                    <table class="habit-table">
                        <thead>
                            <tr>
                                <th class="habit-name-cell">Habit / Activity</th>
                                <th>T</th>
                                <th>F</th>
                                <th>S</th>
                                <th>S</th>
                                <th>M</th>
                                <th>T</th>
                                <th>W</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="habit-body">
                            <!-- Habits loaded async -->
                            <tr><td colspan="9">Loading habits...</td></tr>
                        </tbody>
                    </table>
                    <button id="add-habit-btn" class="nav-item" style="color: var(--text-main); background: var(--bg-color); margin-top: 16px; width: auto; opacity: 1;">
                        + Add Habit
                    </button>
                </div>

                <div class="weekly-insights-section card dot-grid" style="margin-top: 24px;">
                    <h2 class="serif italics">Automated Weekly Insights</h2>
                    <div class="insights-grid">
                        ${generateWeeklyInsightsHTML()}
                    </div>
                </div>
            </div>
        `;

        // Async load
        await loadAndRenderHabits();

        attachWeeklyListeners();
    }

    // New Helper to load habits from DB
    async function loadAndRenderHabits() {
        let habits = await window.db.getHabitsList();

        // Seed if empty
        if (habits.length === 0) {
            let defaultHabits = [
                "Daily Exercise / Movement", "Read 20 Mins / Learn Skill",
                "Mindfulness / Meditation", "Quality Time with Family/Friends",
                "Hydration (8 Glasses)", "Plan Tomorrow's Priorities", "Review Finances / Budget"
            ];
            // Personalization for Rasika (Auto-Restore)
            if (state.email === 'chessdreams@gmail.com') {
                defaultHabits = [
                    "English Practice (Speaking/Listening)",
                    "Swim / Exercise / Healthy Life",
                    "Reading (Target: 4 books/mo)",
                    "Chess with Kids",
                    "Family Time / Fun Activity",
                    "Financial Review / Asset Growth",
                    "Healthy Eating / Nutritious Meals"
                ];
            }
            await window.db.saveHabitsList(defaultHabits);
            habits = defaultHabits;
        }

        // Render rows
        const habitBody = document.getElementById('habit-body');
        if (habitBody) {
            habitBody.innerHTML = habits.map((habit, index) => `
                <tr>
                    <td class="habit-name-cell" style="display: flex; align-items: center; justify-content: space-between;">
                        <input type="text" class="habit-input" value="${habit}" data-habit-index="${index}" style="flex-grow: 1;">
                        <button class="delete-habit-btn" data-index="${index}" title="Delete Habit">×</button>
                    </td>
                    ${[0, 1, 2, 3, 4, 5, 6].map(day => `
                        <td><input type="checkbox" class="habit-check" data-key="habit_${index}_day_${day}" data-habit="${index}" data-day="${day}"></td>
                    `).join('')}
                    <td id="habit_${index}_total">0</td>
                </tr>
            `).join('');

            await loadSavedWeeklyData();
        }
    }

    function generateHabitRows() {
        return ''; // Deprecated, handled by loadAndRenderHabits
    }

    function attachWeeklyListeners() {
        const weekNum = getWeekNumber(state.date);

        // Delegate for simpler handling of dynamic content
        mainContainer.addEventListener('change', async (e) => {
            if (e.target.classList.contains('habit-check')) {
                const habitIdx = parseInt(e.target.dataset.habit);
                const dayIdx = parseInt(e.target.dataset.day);
                await window.db.saveWeeklyHabit(weekNum, habitIdx, dayIdx, e.target.checked);
                updateHabitTotals();
            }
            if (e.target.classList.contains('habit-input')) {
                const index = parseInt(e.target.dataset.habitIndex);
                const habits = Array.from(document.querySelectorAll('.habit-input')).map(i => i.value);
                await window.db.saveHabitsList(habits);
            }
        });

        // Delete Habit logic (Delegated)
        mainContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-habit-btn')) {
                const index = parseInt(e.target.dataset.index);
                if (confirm("Delete this habit?")) {
                    const habits = Array.from(document.querySelectorAll('.habit-input')).map(i => i.value);
                    habits.splice(index, 1);
                    await window.db.saveHabitsList(habits);
                    renderWeeklyTracking(); // Re-render
                }
            }
            if (e.target.id === 'add-habit-btn') {
                const habits = Array.from(document.querySelectorAll('.habit-input')).map(i => i.value);
                habits.push("New Habit");
                await window.db.saveHabitsList(habits);
                renderWeeklyTracking(); // Re-render
            }
        });
    }

    function updateHabitTotals() {
        // Logic needs to run on current DOM state or re-fetch?
        // Simple DOM counting for responsiveness
        const rows = document.querySelectorAll('#habit-body tr');
        rows.forEach((row, i) => {
            const checks = row.querySelectorAll('.habit-check:checked');
            const totalEl = document.getElementById(`habit_${i}_total`);
            if (totalEl) totalEl.textContent = checks.length;
        });
    }

    async function loadSavedWeeklyData() {
        const weekNum = getWeekNumber(state.date);
        const weeklyData = await window.db.getWeeklyHabits(weekNum);

        weeklyData.forEach(item => {
            const checkbox = document.querySelector(`.habit-check[data-habit="${item.habit_index}"][data-day="${item.day_index}"]`);
            if (checkbox) checkbox.checked = item.completed;
        });
        updateHabitTotals();
    }

    function renderRoadmap() {
        mainContainer.innerHTML = `
            <div class="roadmap-view">
                <div class="card roadmap-header dot-grid">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                        <h1 class="serif" style="margin:0;">13-Week Roadmap</h1>
                    </div>
                    
                    <div class="input-group">
                        <label class="premium-label">MY MAIN RESULT GOAL</label>
                        <textarea class="premium-textarea" placeholder="The one thing I want to achieve..." data-key="roadmap_main_goal"></textarea>
                    </div>

                    <div class="progress-goals-row">
                        <div class="progress-goal">
                            <label class="premium-label">Progress Goal 1</label>
                            <textarea class="premium-textarea mini-textarea" placeholder="Milestone 1..." data-key="roadmap_pg_1"></textarea>
                        </div>
                        <div class="progress-goal">
                            <label class="premium-label">Progress Goal 2</label>
                            <textarea class="premium-textarea mini-textarea" placeholder="Milestone 2..." data-key="roadmap_pg_2"></textarea>
                        </div>
                        <div class="progress-goal">
                            <label class="premium-label">Progress Goal 3</label>
                            <textarea class="premium-textarea mini-textarea" placeholder="Milestone 3..." data-key="roadmap_pg_3"></textarea>
                        </div>
                    </div>
                </div>

                <div class="roadmap-grid-container">
                    ${generateRoadmapWeeks()}
                </div>

                <div class="card wellness-section dot-grid" style="margin-top: 40px;">
                    <h2 class="serif" style="margin-bottom: 24px;">13-Week Wellness Plan</h2>
                    <div class="wellness-grid">
                        <div class="wellness-quadrant">
                            <h3>Physical</h3>
                            <textarea class="premium-textarea" data-key="wellness_physical" placeholder="Sleep, food, exercise context..." style="min-height: 100px;"></textarea>
                        </div>
                        <div class="wellness-quadrant">
                            <h3>Spiritual</h3>
                            <textarea class="premium-textarea" data-key="wellness_spiritual" placeholder="Mindfulness, meditation, nature..." style="min-height: 100px;"></textarea>
                        </div>
                        <div class="wellness-quadrant">
                            <h3>Contribution & Service</h3>
                            <textarea class="premium-textarea" data-key="wellness_service" placeholder="Helping others, volunteering..." style="min-height: 100px;"></textarea>
                        </div>
                        <div class="wellness-quadrant">
                            <h3>Relationships</h3>
                            <textarea class="premium-textarea" data-key="wellness_relationships" placeholder="Family, friends, community..." style="min-height: 100px;"></textarea>
                        </div>
                    </div>
                </div>

                <div class="card vision-section dot-grid" style="margin-top: 40px;">
                    <h2 class="serif" style="margin-bottom: 24px;">Life Vision & Core Values</h2>
                    <div class="vision-grid">
                        ${generateLifeVisionSlots()}
                    </div>
                </div>
            </div>
        `;
        attachRoadmapListeners();
        loadSavedRoadmapData();
    }

    function generateRoadmapWeeks() {
        let html = '';
        for (let i = 1; i <= 13; i++) {
            html += `
                <div class="milestone-card card dot-grid">
                    <div class="milestone-week-label">WEEK ${i}</div>
                    <textarea class="premium-textarea" placeholder="Key milestone for this week..." data-key="week_${i}_milestone"></textarea>
                </div>
            `;
        }
        return html;
    }

    function generateLifeVisionSlots() {
        let html = '';
        for (let i = 1; i <= 15; i++) {
            html += `
                <div class="vision-slot">
                    <span class="vision-number">${i}</span>
                    <input type="text" class="premium-input-line" placeholder="Long-term goal or value..." data-key="vision_goal_${i}">
                </div>
            `;
        }
        return html;
    }

    function attachRoadmapListeners() {
        const inputs = mainContainer.querySelectorAll('textarea, input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                localStorage.setItem(`roadmap_v1_${e.target.dataset.key}`, e.target.value);
            });
        });
    }

    function loadSavedRoadmapData() {
        const inputs = mainContainer.querySelectorAll('textarea, input');
        inputs.forEach(input => {
            const savedValue = localStorage.getItem(`roadmap_v1_${input.dataset.key}`);
            if (savedValue) input.value = savedValue;
        });
    }

    function renderHelpPage() {
        mainContainer.innerHTML = `
            <div class="help-view" style="max-width: 900px; margin: 0 auto;">
                <div class="card" style="text-align: center; margin-bottom: 32px; padding: 40px;">
                    <h1 class="serif" style="margin-bottom: 16px;">Journaling Success Guide</h1>
                    <p style="color: var(--text-muted); margin-bottom: 24px;">Don't want to read the full guide? Here is the cheat sheet.</p>
                    <a href="https://www.hemati.com/wp-content/uploads/2017/07/Best-Self-Journal.pdf" target="_blank" 
                       style="display: inline-block; background: var(--text-main); color: var(--card-bg); padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600;">
                       Download Full PDF Guide ↗
                    </a>
                </div>

                <div class="help-grid">
                    
                    <!-- Roadmap -->
                    <div class="card dot-grid">
                        <h3 class="serif italics" style="margin-bottom: 16px;">1. The 13-Week Roadmap</h3>
                        <p style="font-size: 14px; margin-bottom: 12px;"><strong>The Goal:</strong> Pick ONE big outcome that would make the biggest difference in your life.</p>
                        <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; font-size: 13px;">
                            <strong>Reference Example:</strong><br>
                            <em>Result Goal:</em> Run a Half Marathon (21km).<br>
                            <em>Progress 1:</em> Build Base Fitness (Weeks 1-4).<br>
                            <em>Progress 2:</em> Increase Distance (Weeks 5-9).<br>
                            <em>Progress 3:</em> Taper & Race Day (Weeks 10-13).
                        </div>
                    </div>

                    <!-- Weekly Strategy -->
                    <div class="card dot-grid">
                        <h3 class="serif italics" style="margin-bottom: 16px;">2. Weekly Strategy</h3>
                        <p style="font-size: 14px; margin-bottom: 12px;"><strong>The Goal:</strong> Break down your 13-week goals into 7-day sprints.</p>
                        <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; font-size: 13px;">
                            <strong>Reference Example:</strong><br>
                            <em>Milestone 1:</em> Run 15km total this week.<br>
                            <em>Milestone 2:</em> Prioritize 8 hours sleep.<br>
                            <em>Routine:</em> Stretch daily at 8 PM.
                        </div>
                    </div>

                    <!-- Daily Planning -->
                    <div class="card dot-grid">
                        <h3 class="serif italics" style="margin-bottom: 16px;">3. Daily Planning</h3>
                        <p style="font-size: 14px; margin-bottom: 12px;"><strong>The Goal:</strong> Win the day by prioritizing just 3 things.</p>
                        <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; font-size: 13px;">
                            <strong>Reference Example:</strong><br>
                            <em>Morning Gratitude:</em> "I'm grateful for fresh air."<br>
                            <em>Target 1:</em> Morning Jog (45 mins).<br>
                            <em>Target 2:</em> Meal Prep for the week.<br>
                            <em>Timeline:</em> 6-7 AM Run, 7-8 PM Cooking.
                        </div>
                    </div>

                    <!-- Reflection -->
                    <div class="card dot-grid">
                        <h3 class="serif italics" style="margin-bottom: 16px;">4. Review & Reflect</h3>
                        <p style="font-size: 14px; margin-bottom: 12px;"><strong>The Goal:</strong> Learn from your wins and losses.</p>
                        <div style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; font-size: 13px;">
                            <strong>Reference Example:</strong><br>
                            <em>Win:</em> Felt energetic during the run.<br>
                            <em>Improvement:</em> Ate junk food, need to track meals.<br>
                            <em>Habit:</em> Check off "Drink 3L Water".
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
    function renderMonthlyView() {
        mainContainer.innerHTML = `
            <div class="monthly-view">
                <div class="card dot-grid">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h2 class="serif" style="display:none">Calendar</h2> 
                        <button id="export-month-btn" class="nav-item" style="font-size:12px; padding:6px 12px;">📥 Export Month to Calendar</button>
                    </div>
                    <div class="monthly-planner-grid">
                        ${generateMonthlyGrid()}
                    </div>
                    <div class="card dot-grid" style="margin-top: 20px;">
                        <h3 class="serif italics">Notes</h3>
                        <textarea class="premium-textarea" data-key="monthly_notes" style="min-height:100px;"></textarea>
                    </div>
                </div>

                </div>
            </div>
        `;
        attachGenericListeners('monthly_v1');
        loadGenericData('monthly_v1');
        attachGoogleCalendarListeners();

        document.getElementById('export-month-btn').addEventListener('click', exportMonthToICS);
    }

    function exportMonthToICS() {
        const year = state.date.getFullYear();
        const month = state.date.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        let icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//SELFJournal//EN",
            "CALSCALE:GREGORIAN"
        ];

        let eventCount = 0;

        for (let day = 1; day <= lastDay; day++) {
            const dayNum = day < 10 ? `0${day}` : day;
            const textarea = mainContainer.querySelector(`textarea[data-key="day_${dayNum}"]`);
            if (textarea && textarea.value.trim()) {
                const text = textarea.value.trim().replace(/\n/g, "\\n");

                // Format Date YYYYMMDD
                const d = new Date(year, month, day);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}${mm}${dd}`;

                icsContent.push(
                    "BEGIN:VEVENT",
                    `DTSTART;VALUE=DATE:${dateStr}`,
                    `DTEND;VALUE=DATE:${dateStr}`,
                    `SUMMARY:${text}`,
                    `DESCRIPTION:Journal Entry from SELFJournal App`,
                    "END:VEVENT"
                );
                eventCount++;
            }
        }

        icsContent.push("END:VCALENDAR");

        if (eventCount === 0) {
            alert("No events found to export for this month.");
            return;
        }

        const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `journal_${year}_${month + 1}.ics`; // e.g. journal_2026_1.ics
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function attachGoogleCalendarListeners() {
        mainContainer.querySelectorAll('.gcal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = e.currentTarget.dataset.day;
                const textarea = mainContainer.querySelector(`textarea[data-key="day_${day}"]`);
                const text = textarea.value.trim();

                if (!text) {
                    alert('Please enter an event description first.');
                    return;
                }

                // Construct Date
                const year = state.date.getFullYear();
                const month = state.date.getMonth(); // 0-indexed
                const eventDate = new Date(year, month, parseInt(day));

                // Format YYYYMMDD
                const yyyy = eventDate.getFullYear();
                const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
                const dd = String(eventDate.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}${mm}${dd} `;

                // Open Google Calendar
                // action=TEMPLATE, text=Title, dates=Start/End, details=Description
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${dateStr}/${dateStr}&details=Generated from BestSelf Journal`;
                window.open(url, '_blank');
            });
        });
    }

    function generateMonthlyGrid() {
        const year = state.date.getFullYear();
        const month = state.date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get day of week for first day (0=Sun, 1=Mon, etc.)
        let firstDayOfWeek = firstDay.getDay();
        // Convert to Monday-first (0=Mon, 1=Tue, ..., 6=Sun)
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        let html = '';

        // Add day headers
        const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayHeaders.forEach(day => {
            html += `<div class="month-day-header">${day}</div>`;
        });

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += `<div class="appointment-slot empty-slot"></div>`;
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayNum = day < 10 ? `0${day}` : day;
            html += `
                <div class="appointment-slot">
                    <div class="slot-header">
                        <div class="slot-number">${dayNum}</div>
                        <button class="gcal-btn" data-day="${dayNum}" title="Add to Google Calendar">📅</button>
                    </div>
                    <textarea class="slot-input" data-key="day_${dayNum}"></textarea>
                </div>
            `;
        }

        return html;
    }

    function renderWeeklyStrategy() {
        const defaultMorning = "1. Hydrate & Make Bed\n2. 10 Mins Meditation/Mindfulness\n3. 30 Mins Exercise\n4. Review Daily Targets";
        const defaultNightly = "1. Disconnect from Screens\n2. 15 Mins Reading\n3. Plan Tomorrow's 3 Targets\n4. Reflect on 3 Wins Today";

        mainContainer.innerHTML = `
            <div class="weekly-strategy">
                <div class="card dot-grid strategy-header">
                    <h2 class="serif">Weekly Strategy</h2>
                    <p>What are the big milestones for this week?</p>
                    <div class="milestone-list">
                        ${[1, 2, 3, 4, 5, 6, 7].map(num => `
                            <div class="milestone-row">
                                <span class="milestone-number">${num}</span>
                                <input type="text" class="habit-input" data-key="weekly_milestone_${num}" placeholder="Strategic milestone ${num}">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="reflection-checkpoints">
                    <div class="card dot-grid">
                        <h3 class="serif italics">Morning Routine</h3>
                        <textarea class="premium-textarea" data-key="strategy_morning_routine" placeholder="Define your ideal morning flow..." style="min-height:150px;"></textarea>
                    </div>
                    <div class="card dot-grid">
                        <h3 class="serif italics">Nightly Routine</h3>
                        <textarea class="premium-textarea" data-key="strategy_nightly_routine" placeholder="Define your ideal evening wind-down..." style="min-height:150px;"></textarea>
                    </div>
                </div>
            </div>
        `;
        attachGenericListeners('strategy_v1');

        // Seed defaults if empty
        if (!localStorage.getItem('strategy_v1_strategy_morning_routine')) {
            localStorage.setItem('strategy_v1_strategy_morning_routine', defaultMorning);
        }
        if (!localStorage.getItem('strategy_v1_strategy_nightly_routine')) {
            localStorage.setItem('strategy_v1_strategy_nightly_routine', defaultNightly);
        }

        loadGenericData('strategy_v1');
    }

    // Generic Listeners/Loaders for new views
    function attachGenericListeners(prefix) {
        const inputs = mainContainer.querySelectorAll('textarea, input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let dateKey = '';
                if (prefix === 'monthly_v1') {
                    dateKey = ''; // Monthly is global for that month (wait, month needs scoping too? Yes, usually month is unique. But month views are generated dynamically. Currently monthly notes are global! This needs fixing too probably, but let's stick to user request.)
                    // Actually monthly_v1 uses manual keys generated in grid, but the notes...
                    // Let's fix Strategy first.
                } else if (prefix === 'strategy_v1') {
                    const weekNum = getWeekNumber(state.date);
                    dateKey = `w${weekNum}_`;
                } else {
                    dateKey = `${state.date.toISOString().split('T')[0]}_`;
                }
                localStorage.setItem(`${dateKey}${prefix}_${e.target.dataset.key}`, e.target.value);
            });
        });
    }

    function loadGenericData(prefix) {
        const inputs = mainContainer.querySelectorAll('textarea, input');
        inputs.forEach(input => {
            let dateKey = '';
            if (prefix === 'monthly_v1') {
                dateKey = '';
            } else if (prefix === 'strategy_v1') {
                const weekNum = getWeekNumber(state.date);
                dateKey = `w${weekNum}_`;
            } else {
                dateKey = `${state.date.toISOString().split('T')[0]}_`;
            }
            const savedValue = localStorage.getItem(`${dateKey}${prefix}_${input.dataset.key}`);
            if (savedValue) input.value = savedValue;
        });
    }

    function generateWeeklyInsightsHTML() {
        const stats = getWeeklyInsightsData();
        return `
            <div class="insight-card">
                <span class="insight-value">${stats.habitScore}%</span>
                <span class="insight-label">Habit Consistency</span>
            </div>
            <div class="insight-card">
                <span class="insight-value">${stats.targetCompletion}/21</span>
                <span class="insight-label">Targets Mastered</span>
            </div>
            <div class="insight-card">
                <span class="insight-value">${stats.mostConsistentHabit || 'None'}</span>
                <span class="insight-label">Most Consistent Habit</span>
            </div>
            <div class="insight-card">
                <span class="insight-value">${stats.peakDay || 'N/A'}</span>
                <span class="insight-label">Peak Performance Day</span>
            </div>
        `;
    }

    function getWeeklyInsightsData() {
        const weekNum = getWeekNumber(state.date);
        const habits = JSON.parse(localStorage.getItem('habits') || '[]');

        // Habit Score
        let totalPossibleHabits = habits.length * 7;
        let completedHabits = 0;
        let habitCounts = habits.map(() => 0);

        habits.forEach((_, hIdx) => {
            for (let day = 0; day < 7; day++) {
                if (localStorage.getItem(`weekly_v1_w${weekNum}_habit_${hIdx}_day_${day}`) === 'true') {
                    completedHabits++;
                    habitCounts[hIdx]++;
                }
            }
        });

        const habitScore = totalPossibleHabits > 0 ? Math.round((completedHabits / totalPossibleHabits) * 100) : 0;

        let mostConsistentHabit = null;
        if (habits.length > 0) {
            const maxVal = Math.max(...habitCounts);
            const mostConsistentIdx = habitCounts.indexOf(maxVal);
            mostConsistentHabit = maxVal > 0 ? habits[mostConsistentIdx] : null;
        }

        // Weekly Targets
        let targetCompletion = 0;
        let dailyWins = [0, 0, 0, 0, 0, 0, 0]; // Thu to Wed

        // Find Thursday of this week (Start of our Week X)
        const startOf2026 = new Date(2026, 0, 1);
        const daysSinceStart = Math.floor((state.date - startOf2026) / (24 * 60 * 60 * 1000));
        const weekIndex = Math.floor(daysSinceStart / 7);
        const thursday = new Date(2026, 0, 1);
        thursday.setDate(thursday.getDate() + (weekIndex * 7));

        const dayNames = ['Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(thursday);
            currentDay.setDate(thursday.getDate() + i);
            const dateStr = getLocalISODate(currentDay);

            for (let tIdx = 1; tIdx <= 3; tIdx++) {
                if (localStorage.getItem(`${dateStr}_target_${tIdx}_completed`) === 'true') {
                    targetCompletion++;
                    dailyWins[i]++;
                }
            }
        }

        const peakDayWins = Math.max(...dailyWins);
        const peakDayIdx = dailyWins.indexOf(peakDayWins);
        const peakDay = peakDayWins > 0 ? dayNames[peakDayIdx] : null;

        return {
            habitScore,
            targetCompletion,
            mostConsistentHabit: mostConsistentHabit ? (mostConsistentHabit.length > 20 ? mostConsistentHabit.substring(0, 17) + '...' : mostConsistentHabit) : null,
            peakDay
        };
    }

    function renderGoalsProgress(weekNum) {
        const habitScore = calculateHabitScore();
        // Simple progress visual
        return `
            <div class="card progress-goals-row" style="margin-top: 12px; padding: 16px;">
                 <h3 class="serif italics" style="margin-bottom: 8px;">Weekly Goal Progress</h3>
                 <div style="width: 100%; background: var(--dot-color); height: 10px; border-radius: 5px; overflow: hidden;">
                     <div style="width: ${habitScore}%; background: var(--accent-color); height: 100%; transition: width 0.3s ease;"></div>
                 </div>
                 <p style="text-align: right; font-size: 12px; margin-top: 4px;">${habitScore}% Complete</p>
            </div>
        `;
    }
});
