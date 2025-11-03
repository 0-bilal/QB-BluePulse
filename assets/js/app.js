/**
 * QB-BluePulse - Pool Management System
 * Main Application Logic
 * Version: 3.0
 * 
 * This file contains the main application logic
 * and UI interaction handlers
 */

// ============================================
// Constants and Configuration
// ============================================

const CONFIG = {
    // Chemical dosage rates (per ton of water)
    DOSAGE_RATES: {
        'CLR 90': 2.6,          // grams per ton (normal)
        'CLR 90 (Shock)': 5,    // grams per ton (shock)
        'TIRA POOL 40': 2.4,    // ml per ton
        'CLEAR POWER': 5.2      // ml per ton
    },

    // Task templates for 4 weeks
    TASKS_TEMPLATES: [
        // Week 1
        { week: 1, day: 'السبت', time: '9:00 AM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'التطهير الأسبوعي الرئيسي' },
        { week: 1, day: 'الاثنين', time: '10:00 AM', product: 'TIRA POOL 40', pump: '4 ساعات', wait: '4 ساعات', notes: 'الوقاية الأسبوعية من الطحالب' },
        { week: 1, day: 'الأربعاء', time: '8:00 PM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'تعزيز الكلور' },
        { week: 1, day: 'الجمعة', time: '6:00 PM', product: 'CLEAR POWER', pump: '8 ساعات', wait: 'حتى الصباح', notes: 'منقي الماء (اختياري)' },
        
        // Week 2
        { week: 2, day: 'السبت', time: '9:00 AM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'التطهير المنتظم' },
        { week: 2, day: 'الاثنين', time: '10:00 AM', product: 'TIRA POOL 40', pump: '4 ساعات', wait: '4 ساعات', notes: 'مكافحة الطحالب' },
        { week: 2, day: 'الأربعاء', time: '8:00 PM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'جرعة تعزيزية' },
        { week: 2, day: 'الجمعة', time: '6:00 PM', product: '-', pump: '-', wait: '-', notes: 'فحص صفاء الماء فقط' },
        
        // Week 3
        { week: 3, day: 'السبت', time: '9:00 AM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'التطهير' },
        { week: 3, day: 'الاثنين', time: '10:00 AM', product: 'TIRA POOL 40', pump: '4 ساعات', wait: '4 ساعات', notes: 'الوقاية من الطحالب' },
        { week: 3, day: 'الأربعاء', time: '8:00 PM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'جرعة تعزيزية' },
        { week: 3, day: 'الجمعة', time: '6:00 PM', product: 'CLEAR POWER', pump: '8 ساعات', wait: 'حتى الصباح', notes: 'استخدم إذا كان الماء غائماً' },
        
        // Week 4
        { week: 4, day: 'السبت', time: '9:00 AM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'التطهير' },
        { week: 4, day: 'الاثنين', time: '10:00 AM', product: 'TIRA POOL 40', pump: '4 ساعات', wait: '4 ساعات', notes: 'الوقاية من الطحالب' },
        { week: 4, day: 'الأربعاء', time: '8:00 PM', product: 'CLR 90', pump: '6 ساعات', wait: '6-12 ساعة', notes: 'تعزيز الكلور' },
        { week: 4, day: 'الجمعة', time: '8:00 PM', product: 'CLR 90 (Shock)', pump: '8 ساعات', wait: 'حتى الصباح', notes: 'معالجة الصدمة في نهاية الشهر' }
    ]
};

// ============================================
// Application State
// ============================================

const AppState = {
    completedTasks: new Set(),
    poolVolume: 29,
    currentWeek: 'all',
    currentPage: 'dashboard'
};

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate chemical dosage based on pool volume
 * @param {string} product - Product name
 * @param {number} volume - Pool volume in tons
 * @returns {string} Calculated amount with unit
 */
function calculateDosage(product, volume) {
    const rate = CONFIG.DOSAGE_RATES[product];
    if (!rate || product === '-') return '-';
    
    const amount = (rate * volume).toFixed(1);
    const unit = (product.includes('CLR') || product.includes('Shock')) ? 'غ' : 'مل';
    return `${amount} ${unit}`;
}

/**
 * Generate unique task ID
 * @param {number} week - Week number
 * @param {number} index - Task index
 * @returns {string} Task ID
 */
function getTaskId(week, index) {
    return `task-${week}-${index}`;
}

/**
 * Get element by ID safely
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
function getElement(id) {
    return document.getElementById(id);
}

// ============================================
// Data Management
// ============================================

/**
 * Load data from storage
 */
function loadData() {
    AppState.completedTasks = StorageManager.getCompletedTasks();
    AppState.poolVolume = StorageManager.getPoolVolume();
    AppState.currentWeek = StorageManager.getCurrentWeek();
}

/**
 * Save data to storage
 */
function saveData() {
    StorageManager.saveCompletedTasks(AppState.completedTasks);
    StorageManager.savePoolVolume(AppState.poolVolume);
    StorageManager.saveCurrentWeek(AppState.currentWeek);
}

// ============================================
// UI Rendering
// ============================================

/**
 * Render tasks based on current filter
 */
function renderTasks() {
    const container = getElement('tasksList');
    if (!container) return;
    
    container.innerHTML = '';

    // Filter tasks by week
    const filtered = AppState.currentWeek === 'all' 
        ? CONFIG.TASKS_TEMPLATES 
        : CONFIG.TASKS_TEMPLATES.filter(t => t.week === parseInt(AppState.currentWeek));

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">لا توجد مهام</div>
            </div>
        `;
        return;
    }

    // Render each task
    filtered.forEach((task, idx) => {
        const taskId = getTaskId(task.week, idx);
        const isCompleted = AppState.completedTasks.has(taskId);
        const calculatedAmount = calculateDosage(task.product, AppState.poolVolume);
        const isCalculated = calculatedAmount !== '-';

        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${isCompleted ? 'completed' : ''}`;
        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-day">📅 ${task.day} - أسبوع ${task.week}</div>
                <div class="task-time">⏰ ${task.time}</div>
            </div>
            <div class="task-details">
                <div class="detail-box">
                    <div class="detail-label">المادة</div>
                    <div class="detail-value">${task.product}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">الكمية ${isCalculated ? '<span class="calculated-badge">محسوبة</span>' : ''}</div>
                    <div class="detail-value">${calculatedAmount}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">المضخة</div>
                    <div class="detail-value">${task.pump}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">الانتظار</div>
                    <div class="detail-value">${task.wait}</div>
                </div>
            </div>
            <div class="task-notes">💡 ${task.notes}</div>
            <div class="task-checkbox-wrapper">
                <input type="checkbox" id="${taskId}" ${isCompleted ? 'checked' : ''} onchange="toggleTask('${taskId}')">
                <label for="${taskId}">تم إنجاز المهمة</label>
            </div>
        `;

        container.appendChild(taskCard);
    });

    updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
    const total = CONFIG.TASKS_TEMPLATES.length;
    const completed = AppState.completedTasks.size;
    const pending = total - completed;
    const percent = Math.round((completed / total) * 100);

    // Update dashboard stats
    const elements = {
        totalTasks: getElement('totalTasks'),
        completedTasks: getElement('completedTasks'),
        pendingTasks: getElement('pendingTasks'),
        progressPercent: getElement('progressPercent'),
        progressText: getElement('progressText'),
        progressBar: getElement('progressBar'),
        notificationBadge: getElement('notificationBadge'),
        completedTasksSetting: getElement('completedTasksSetting')
    };

    if (elements.totalTasks) elements.totalTasks.textContent = total;
    if (elements.completedTasks) elements.completedTasks.textContent = completed;
    if (elements.pendingTasks) elements.pendingTasks.textContent = pending;
    if (elements.progressPercent) elements.progressPercent.textContent = percent + '%';
    if (elements.progressText) elements.progressText.textContent = `${completed} / ${total}`;
    if (elements.progressBar) elements.progressBar.style.width = percent + '%';
    if (elements.notificationBadge) elements.notificationBadge.textContent = pending;
    if (elements.completedTasksSetting) elements.completedTasksSetting.textContent = completed;
}

/**
 * Update calculator display
 */
function updateCalculations() {
    const elements = {
        poolVolumeDisplay: getElement('poolVolumeDisplay'),
        clr90Normal: getElement('clr90Normal'),
        clr90Shock: getElement('clr90Shock'),
        tiraPool: getElement('tiraPool'),
        clearPower: getElement('clearPower')
    };

    if (elements.poolVolumeDisplay) {
        elements.poolVolumeDisplay.textContent = AppState.poolVolume;
    }
    if (elements.clr90Normal) {
        elements.clr90Normal.textContent = (AppState.poolVolume * CONFIG.DOSAGE_RATES['CLR 90']).toFixed(1);
    }
    if (elements.clr90Shock) {
        elements.clr90Shock.textContent = (AppState.poolVolume * CONFIG.DOSAGE_RATES['CLR 90 (Shock)']).toFixed(1);
    }
    if (elements.tiraPool) {
        elements.tiraPool.textContent = (AppState.poolVolume * CONFIG.DOSAGE_RATES['TIRA POOL 40']).toFixed(1);
    }
    if (elements.clearPower) {
        elements.clearPower.textContent = (AppState.poolVolume * CONFIG.DOSAGE_RATES['CLEAR POWER']).toFixed(1);
    }
}

// ============================================
// Task Management
// ============================================

/**
 * Toggle task completion status
 * @param {string} taskId - Task ID
 */
function toggleTask(taskId) {
    if (AppState.completedTasks.has(taskId)) {
        AppState.completedTasks.delete(taskId);
    } else {
        AppState.completedTasks.add(taskId);
    }
    saveData();
    renderTasks();
}

// ============================================
// Navigation
// ============================================

/**
 * Switch between pages
 * @param {string} page - Page name
 */
function switchPage(page) {
    // Hide all pages
    document.querySelectorAll('.main-content').forEach(p => p.classList.remove('active'));
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show selected page and activate nav item
    if (page === 'dashboard') {
        getElement('dashboardPage').classList.add('active');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
        AppState.currentPage = 'dashboard';
    } else if (page === 'calculator') {
        getElement('calculatorPage').classList.add('active');
        document.querySelectorAll('.nav-item')[2].classList.add('active');
        updateCalculations();
        AppState.currentPage = 'calculator';
    } else if (page === 'settings') {
        getElement('settingsPage').classList.add('active');
        document.querySelectorAll('.nav-item')[3].classList.add('active');
        const volumeSetting = getElement('poolVolumeSetting');
        if (volumeSetting) {
            volumeSetting.textContent = AppState.poolVolume;
        }
        AppState.currentPage = 'settings';
    }
}

// ============================================
// Week Selection
// ============================================

/**
 * Show week selector modal
 */
function showWeekSelector() {
    // Update selected state
    document.querySelectorAll('.week-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.week === AppState.currentWeek) {
            opt.classList.add('selected');
        }
    });
    
    getElement('weekModal').classList.add('active');
}

/**
 * Close week selector modal
 */
function closeWeekModal() {
    getElement('weekModal').classList.remove('active');
}

/**
 * Select a week
 * @param {string} week - Week selection
 */
function selectWeek(week) {
    AppState.currentWeek = week;
    saveData();
    
    // Update week tabs
    document.querySelectorAll('.week-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.week === week) {
            btn.classList.add('active');
        }
    });
    
    renderTasks();
    closeWeekModal();
    
    // Switch to dashboard if not already there
    if (AppState.currentPage !== 'dashboard') {
        switchPage('dashboard');
    }
}

// ============================================
// Modal Management - Pool Volume
// ============================================

/**
 * Show volume modal
 */
function showVolumeModal() {
    const input = getElement('volumeInput');
    if (input) {
        input.value = AppState.poolVolume;
    }
    getElement('volumeModal').classList.add('active');
}

/**
 * Close volume modal
 */
function closeVolumeModal() {
    getElement('volumeModal').classList.remove('active');
}

/**
 * Save pool volume
 */
function savePoolVolume() {
    const input = getElement('volumeInput');
    const newVolume = parseFloat(input.value);
    
    if (newVolume && newVolume > 0) {
        AppState.poolVolume = newVolume;
        saveData();
        updateCalculations();
        renderTasks();
        closeVolumeModal();
        alert('✅ تم تحديث حجم المسبح بنجاح!\nسيتم تحديث جميع الكميات تلقائياً.');
    }
}

// ============================================
// Modal Management - Notifications
// ============================================

/**
 * Show notifications modal
 */
function showNotifications() {
    const total = CONFIG.TASKS_TEMPLATES.length;
    const completed = AppState.completedTasks.size;
    const pending = total - completed;
    
    const elements = {
        notifTotal: getElement('notifTotal'),
        notifCompleted: getElement('notifCompleted'),
        notifPending: getElement('notifPending'),
        notifVolume: getElement('notifVolume')
    };
    
    if (elements.notifTotal) elements.notifTotal.textContent = total;
    if (elements.notifCompleted) elements.notifCompleted.textContent = completed;
    if (elements.notifPending) elements.notifPending.textContent = pending;
    if (elements.notifVolume) elements.notifVolume.textContent = AppState.poolVolume + ' طن';
    
    getElement('notificationModal').classList.add('active');
}

/**
 * Close notification modal
 */
function closeNotificationModal() {
    getElement('notificationModal').classList.remove('active');
}

// ============================================
// Modal Management - Reset
// ============================================

/**
 * Show reset confirmation modal
 */
function resetAllTasks() {
    getElement('resetModal').classList.add('active');
}

/**
 * Close reset modal
 */
function closeResetModal() {
    getElement('resetModal').classList.remove('active');
}

/**
 * Confirm reset and clear all tasks
 */
function confirmReset() {
    AppState.completedTasks.clear();
    saveData();
    updateStats();
    renderTasks();
    closeResetModal();
    
    setTimeout(() => {
        switchPage('dashboard');
        showSuccessMessage();
    }, 100);
}

/**
 * Show success message after reset
 */
function showSuccessMessage() {
    const total = CONFIG.TASKS_TEMPLATES.length;
    
    const elements = {
        notifTotal: getElement('notifTotal'),
        notifCompleted: getElement('notifCompleted'),
        notifPending: getElement('notifPending'),
        notifVolume: getElement('notifVolume')
    };
    
    if (elements.notifTotal) elements.notifTotal.textContent = total;
    if (elements.notifCompleted) elements.notifCompleted.textContent = '0';
    if (elements.notifPending) elements.notifPending.textContent = total;
    if (elements.notifVolume) elements.notifVolume.textContent = AppState.poolVolume + ' طن';
    
    const modal = getElement('notificationModal');
    const content = modal.querySelector('.notification-modal-content');
    const icon = content.querySelector('.notification-icon');
    const title = content.querySelector('.modal-title');
    
    icon.textContent = '✅';
    icon.style.background = 'linear-gradient(135deg, var(--success), #16A34A)';
    title.textContent = 'تمت إعادة التعيين بنجاح!';
    
    modal.classList.add('active');
    
    // Reset to normal after 3 seconds
    setTimeout(() => {
        icon.textContent = '🔔';
        icon.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        title.textContent = 'ملخص المهام';
    }, 3000);
}

// ============================================
// Event Listeners
// ============================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Week tab buttons
    document.querySelectorAll('.week-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.week-tab').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.currentWeek = this.dataset.week;
            saveData();
            renderTasks();
        });
    });
}

// ============================================
// Application Initialization
// ============================================

/**
 * Initialize the application
 */
function initApp() {
    console.log('QB-BluePulse v3.0 - Initializing...');
    
    // Load data from storage
    loadData();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initial render
    renderTasks();
    updateCalculations();
    updateStats();
    
    console.log('QB-BluePulse initialized successfully!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
