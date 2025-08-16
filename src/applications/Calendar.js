/**
 * Calendar Application - Desktop calendar with date editing capabilities
 */
class CalendarApp {
    constructor() {
        this.appId = 'calendar';
        this.windows = new Map();
        this.currentDate = new Date();
        this.selectedDate = new Date();
        
        this.init();
    }

    init() {
        // Listen for app launch events
        eventManager.on('app:launch', (data) => {
            if (data.appId === this.appId) {
                this.launch(data);
            }
        });

        // Listen for window resize events
        eventManager.on('window:resize', (data) => this.handleWindowResize(data));

        // Listen for window closed events to clean up
        eventManager.on('window:closed', (data) => {
            if (this.windows.has(data.windowId)) {
                this.closeWindow(data.windowId);
                console.log(`📅 Calendar: Cleaned up window ${data.windowId}`);
            }
        });
    }

    /**
     * Launch the Calendar application
     */
    launch() {
        const existingWindow = Array.from(this.windows.keys())[0];
        if (existingWindow) {
            // Check if the window actually exists in windowManager
            if (windowManager.getWindow(existingWindow)) {
                windowManager.focusWindow(existingWindow);
                return existingWindow;
            } else {
                // Window doesn't exist anymore, clean it up
                console.log(`📅 Calendar: Cleaning up stale window reference ${existingWindow}`);
                this.windows.delete(existingWindow);
            }
        }

        const windowId = windowManager.openWindow(
            this.appId,
            'Calendar',
            this.createCalendarContent(),
            {
                width: 600,
                height: 500,
                resizable: true,
                minimizable: true,
                maximizable: true
            }
        );

        if (windowId) {
            this.windows.set(windowId, {
                currentDate: new Date(this.currentDate),
                selectedDate: new Date(this.selectedDate),
                viewMode: 'month', // month, week, day
                events: this.loadEvents()
            });
            
            this.setupEventListeners(windowId);
            this.updateCalendarDisplay(windowId);
            
            // Emit app launch event
            eventManager.emit('app:launch', { appId: this.appId, title: 'Calendar' });
        }

        return windowId;
    }

    /**
     * Create the calendar application content
     */
    createCalendarContent() {
        return `
            <div class="calendar-container" style="height: 100%; display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, sans-serif; position: relative; overflow: hidden;">
                <!-- Calendar Header -->
                <div class="calendar-header" style="
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 12px 16px;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                ">
                    <div class="calendar-navigation" style="display: flex; align-items: center; gap: 8px; width: 100px;">
                        <button class="nav-button" data-action="today" style="
                            background: var(--bg-primary);
                            color: var(--text-primary);
                            border: 1px solid var(--border-color);
                            border-radius: 6px;
                            padding: 6px 12px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 500;
                        ">Today</button>
                    </div>
                    
                    <div class="calendar-title" style="
                        font-size: 18px;
                        font-weight: 600;
                        color: var(--text-primary);
                        text-align: center;
                        flex: 1;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 6px;
                        transition: background 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " data-action="show-month-year-picker" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                        <span class="current-month-year" style="pointer-events: none;">December 2024</span>
                    </div>
                    
                    <!-- Placeholder for balance -->
                    <div style="width: 100px;"></div>
                </div>

                <!-- Calendar Content -->
                <div class="calendar-content" style="flex: 1; padding: 16px; overflow: hidden; display: flex; flex-direction: column;">
                    <!-- Month View -->
                    <div class="month-view" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
                        <!-- Days of week header -->
                        <div class="weekdays-header" style="
                            display: grid;
                            grid-template-columns: repeat(7, 1fr);
                            gap: 1px;
                            margin-bottom: 8px;
                        ">
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Sun</div>
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Mon</div>
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Tue</div>
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Wed</div>
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Thu</div>
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Fri</div>
                            <div class="weekday" style="
                                padding: 8px;
                                text-align: center;
                                font-weight: 600;
                                font-size: 12px;
                                color: #666666;
                                background: #f8f9fa;
                                border-radius: 4px;
                            ">Sat</div>
                        </div>

                        <!-- Calendar grid -->
                        <div class="calendar-grid" style="
                            display: grid;
                            grid-template-columns: repeat(7, 1fr);
                            grid-template-rows: repeat(6, 1fr);
                            gap: 2px;
                            flex: 1;
                            overflow: hidden;
                        ">
                            <!-- Calendar days will be generated here -->
                        </div>
                    </div>
                </div>

                <!-- Date Editor Modal (hidden by default) -->
                <div class="date-editor-modal" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: none;
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                ">
                    <div class="date-editor-content" style="
                        background: #ffffff !important;
                        border-radius: 12px;
                        padding: 24px;
                        width: 400px;
                        border: 2px solid #cccccc;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        backdrop-filter: none;
                        opacity: 1 !important;
                        position: relative;
                        z-index: 1001;
                    ">
                        <h3 style="margin: 0 0 16px 0; color: var(--text-primary);">Set System Date</h3>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Date:</label>
                            <input type="date" id="date-input" style="
                                width: 100%;
                                padding: 8px;
                                border: 1px solid var(--border-color);
                                border-radius: 6px;
                                background: var(--bg-secondary);
                                color: var(--text-primary);
                                font-size: 14px;
                            ">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Time:</label>
                            <input type="time" id="time-input" style="
                                width: 100%;
                                padding: 8px;
                                border: 1px solid var(--border-color);
                                border-radius: 6px;
                                background: var(--bg-secondary);
                                color: var(--text-primary);
                                font-size: 14px;
                            ">
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button class="cancel-date-edit" style="
                                padding: 8px 16px;
                                border: 1px solid var(--border-color);
                                border-radius: 6px;
                                background: var(--bg-secondary);
                                color: var(--text-primary);
                                cursor: pointer;
                                font-size: 14px;
                            ">Cancel</button>
                            <button class="apply-date-edit" style="
                                padding: 8px 16px;
                                border: none;
                                border-radius: 6px;
                                background: var(--accent-color);
                                color: white;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: 500;
                            ">Apply</button>
                        </div>
                    </div>
                </div>

                <!-- Month/Year Picker Modal (hidden by default) -->
                <div class="month-year-picker-modal" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: none;
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                ">
                    <div class="month-year-picker-content" style="
                        background: #ffffff !important;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        border: 2px solid #cccccc;
                        min-width: 300px;
                        max-width: 400px;
                        backdrop-filter: none;
                        opacity: 1 !important;
                        position: relative;
                        z-index: 1001;
                    ">
                        <h3 style="
                            margin: 0 0 20px 0;
                            font-size: 18px;
                            color: #333333;
                            text-align: center;
                        ">Select Month & Year</h3>
                        
                        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                            <!-- Month Selector -->
                            <div style="flex: 1;">
                                <label style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-size: 14px;
                                    font-weight: 500;
                                    color: #333333;
                                ">Month</label>
                                <select class="month-selector" style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 1px solid #cccccc;
                                    border-radius: 6px;
                                    background: #ffffff;
                                    color: #333333;
                                    font-size: 14px;
                                ">
                                    <option value="0">January</option>
                                    <option value="1">February</option>
                                    <option value="2">March</option>
                                    <option value="3">April</option>
                                    <option value="4">May</option>
                                    <option value="5">June</option>
                                    <option value="6">July</option>
                                    <option value="7">August</option>
                                    <option value="8">September</option>
                                    <option value="9">October</option>
                                    <option value="10">November</option>
                                    <option value="11">December</option>
                                </select>
                            </div>
                            
                            <!-- Year Selector -->
                            <div style="flex: 1;">
                                <label style="
                                    display: block;
                                    margin-bottom: 8px;
                                    font-size: 14px;
                                    font-weight: 500;
                                    color: #333333;
                                ">Year</label>
                                <select class="year-selector" style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 1px solid #cccccc;
                                    border-radius: 6px;
                                    background: #ffffff;
                                    color: #333333;
                                    font-size: 14px;
                                    max-height: 120px;
                                    overflow-y: auto;
                                ">
                                    <!-- Years will be populated dynamically -->
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button class="cancel-month-year-picker" style="
                                padding: 8px 16px;
                                border: 1px solid #cccccc;
                                border-radius: 6px;
                                background: #f5f5f5;
                                color: #333333;
                                cursor: pointer;
                                font-size: 14px;
                            ">Cancel</button>
                            <button class="apply-month-year-picker" style="
                                padding: 8px 16px;
                                border: none;
                                border-radius: 6px;
                                background: #007bff;
                                color: white;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: 500;
                            ">Select</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for the calendar window
     */
    setupEventListeners(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        
        // Navigation buttons
        windowElement.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                switch (action) {
                    case 'today':
                        this.goToToday(windowId);
                        break;
                    case 'show-month-year-picker':
                        this.showMonthYearPicker(windowId);
                        break;
                }
            }
            
            // Calendar day clicks
            if (e.target.classList.contains('calendar-day')) {
                this.selectDate(windowId, e.target);
            }
            
            // Date editor buttons
            if (e.target.classList.contains('edit-date-btn')) {
                this.showDateEditor(windowId);
            }
            
            if (e.target.classList.contains('cancel-date-edit')) {
                this.hideDateEditor(windowId);
            }
            
            if (e.target.classList.contains('apply-date-edit')) {
                this.applyDateEdit(windowId);
            }
            
            // Month/Year Picker buttons
            if (e.target.classList.contains('cancel-month-year-picker')) {
                this.hideMonthYearPicker(windowId);
            }
            
            if (e.target.classList.contains('apply-month-year-picker')) {
                this.applyMonthYearPicker(windowId);
            }
        });

        // Close modal when clicking outside
        const modal = windowElement.querySelector('.date-editor-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideDateEditor(windowId);
            }
        });
        
        // Close month/year picker modal when clicking outside
        const monthYearModal = windowElement.querySelector('.month-year-picker-modal');
        monthYearModal.addEventListener('click', (e) => {
            if (e.target === monthYearModal) {
                this.hideMonthYearPicker(windowId);
            }
        });
    }

    /**
     * Update the calendar display
     */
    updateCalendarDisplay(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        
        // Update month/year title
        const monthYearElement = windowElement.querySelector('.current-month-year');
        monthYearElement.textContent = windowData.currentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        
        // Generate calendar grid
        this.generateCalendarGrid(windowId);
    }

    /**
     * Generate the calendar grid for the current month
     */
    generateCalendarGrid(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        const grid = windowElement.querySelector('.calendar-grid');
        
        const year = windowData.currentDate.getFullYear();
        const month = windowData.currentDate.getMonth();
        
        // Get first day of month and how many days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Clear grid
        grid.innerHTML = '';
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            emptyDay.style.cssText = `
                border: 1px solid #f0f0f0;
                border-radius: 6px;
                background: #fafafa;
                display: flex;
                flex-direction: column;
                padding: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 0;
                height: 100%;
                opacity: 0.5;
                overflow: hidden;
            `;
            grid.appendChild(emptyDay);
        }
        
        // Add days of the month
        // Use system-adjusted time if available, otherwise use actual time
        const baseTime = Date.now();
        const offset = window.systemTimeOffset || 0;
        const today = new Date(baseTime + offset);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const isToday = dayDate.toDateString() === today.toDateString();
            const isSelected = windowData.selectedDate && dayDate.toDateString() === windowData.selectedDate.toDateString();
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = dayDate.toISOString();
            dayElement.style.cssText = `
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                background: #ffffff;
                color: #333333;
                display: flex;
                flex-direction: column;
                padding: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 0;
                height: 100%;
                position: relative;
                overflow: hidden;
                ${isToday ? `
                    border: 2px solid #007bff;
                    background: #e3f2fd;
                    color: #1976d2;
                ` : ''}
                ${isSelected ? `
                    background: #bbdefb;
                    border: 2px solid #007bff;
                    color: #1976d2;
                ` : ''}
            `;
            
            dayElement.innerHTML = `
                <div class="day-number" style="
                    font-weight: ${isToday ? 'bold' : '500'};
                    font-size: 14px;
                    margin-bottom: 4px;
                    color: ${isToday || isSelected ? '#1976d2' : '#333333'};
                ">${day}</div>
                ${isToday ? '<div class="day-indicator" style="font-size: 10px; color: #1976d2; font-weight: bold;">TODAY</div>' : ''}
            `;
            
            // Add hover effect
            dayElement.addEventListener('mouseenter', () => {
                if (!isSelected) {
                    dayElement.style.background = '#f5f5f5';
                    dayElement.style.color = '#333333';
                    dayElement.style.transform = 'scale(1.02)';
                }
            });
            
            dayElement.addEventListener('mouseleave', () => {
                if (!isSelected) {
                    dayElement.style.background = '#ffffff';
                    dayElement.style.color = '#333333';
                    dayElement.style.transform = 'scale(1)';
                }
            });
            
            grid.appendChild(dayElement);
        }
    }

    /**
     * Navigate to previous/next month
     */
    navigateMonth(windowId, direction) {
        const windowData = this.windows.get(windowId);
        windowData.currentDate.setMonth(windowData.currentDate.getMonth() + direction);
        this.updateCalendarDisplay(windowId);
    }

    /**
     * Go to today's date
     */
    goToToday(windowId) {
        const windowData = this.windows.get(windowId);
        // Use system-adjusted time if available
        const baseTime = Date.now();
        const offset = window.systemTimeOffset || 0;
        const systemToday = new Date(baseTime + offset);
        
        windowData.currentDate = new Date(systemToday);
        windowData.selectedDate = new Date(systemToday);
        this.updateCalendarDisplay(windowId);
    }

    /**
     * Change view mode (month/week)
     */
    changeView(windowId, viewMode) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        
        // Update window data
        windowData.viewMode = viewMode;
        
        // Update active button
        const viewButtons = windowElement.querySelectorAll('.view-button');
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewMode) {
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'white';
            } else {
                btn.style.background = 'var(--bg-primary)';
                btn.style.color = 'var(--text-primary)';
            }
        });
        
        SystemUtils.showNotification('Calendar', `Switched to ${viewMode} view`);
    }

    /**
     * Select a date on the calendar
     */
    selectDate(windowId, dayElement) {
        const windowData = this.windows.get(windowId);
        const dateString = dayElement.dataset.date;
        
        if (dateString) {
            windowData.selectedDate = new Date(dateString);
            this.updateCalendarDisplay(windowId);
            
            // Show options for the selected date
            this.showDateOptions(windowId, windowData.selectedDate);
        }
    }

    /**
     * Show options for selected date
     */
    showDateOptions(windowId, date) {
        const windowElement = windowManager.getWindow(windowId).element;
        const modal = windowElement.querySelector('.date-editor-modal');
        const modalContent = modal.querySelector('.date-editor-content');
        
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="color: #333333; margin-bottom: 16px; font-size: 18px;">${dateStr}</h3>
                <p style="color: #666666; margin-bottom: 0;">What would you like to do with this date?</p>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="set-system-date-btn" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                ">Set as System Date</button>
                
                <button class="cancel-btn" style="
                    background: #f5f5f5;
                    color: #333333;
                    border: 1px solid #cccccc;
                    border-radius: 8px;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                ">Cancel</button>
            </div>
        `;
        
        // Add event listeners for the buttons
        modalContent.querySelector('.set-system-date-btn').addEventListener('click', () => {
            this.setSystemDate(windowId, date);
            modal.style.display = 'none';
        });
        
        modalContent.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.style.display = 'flex';
    }

    /**
     * Show date editor modal
     */
    showDateEditor(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const modal = windowElement.querySelector('.date-editor-modal');
        const dateInput = windowElement.querySelector('#date-input');
        const timeInput = windowElement.querySelector('#time-input');
        
        const now = new Date();
        dateInput.value = now.toISOString().split('T')[0];
        timeInput.value = now.toTimeString().split(' ')[0].substring(0, 5);
        
        modal.style.display = 'flex';
    }

    /**
     * Hide date editor modal
     */
    hideDateEditor(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const modal = windowElement.querySelector('.date-editor-modal');
        modal.style.display = 'none';
    }

    /**
     * Apply date edit changes
     */
    applyDateEdit(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const dateInput = windowElement.querySelector('#date-input');
        const timeInput = windowElement.querySelector('#time-input');
        
        const dateValue = dateInput.value;
        const timeValue = timeInput.value;
        
        if (dateValue && timeValue) {
            const newDate = new Date(`${dateValue}T${timeValue}`);
            this.setSystemDate(windowId, newDate);
            this.hideDateEditor(windowId);
        }
    }

    /**
     * Show month/year picker modal
     */
    showMonthYearPicker(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const modal = windowElement.querySelector('.month-year-picker-modal');
        const monthSelector = windowElement.querySelector('.month-selector');
        const yearSelector = windowElement.querySelector('.year-selector');
        const windowData = this.windows.get(windowId);
        
        // Populate year options (current year ± 50 years)
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear - 50; year <= currentYear + 50; year++) {
            years.push(year);
        }
        
        yearSelector.innerHTML = years.map(year => 
            `<option value="${year}">${year}</option>`
        ).join('');
        
        // Set current month and year
        monthSelector.value = windowData.currentDate.getMonth();
        yearSelector.value = windowData.currentDate.getFullYear();
        
        modal.style.display = 'flex';
    }

    /**
     * Hide month/year picker modal
     */
    hideMonthYearPicker(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const modal = windowElement.querySelector('.month-year-picker-modal');
        modal.style.display = 'none';
    }

    /**
     * Apply month/year picker selection
     */
    applyMonthYearPicker(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const monthSelector = windowElement.querySelector('.month-selector');
        const yearSelector = windowElement.querySelector('.year-selector');
        const windowData = this.windows.get(windowId);
        
        const selectedMonth = parseInt(monthSelector.value);
        const selectedYear = parseInt(yearSelector.value);
        
        // Update the current date
        windowData.currentDate = new Date(selectedYear, selectedMonth, 1);
        
        // Update the display
        this.updateCalendarDisplay(windowId);
        
        // Hide the modal
        this.hideMonthYearPicker(windowId);
    }

    /**
     * Set system date (updates the menu bar clock)
     */
    setSystemDate(windowId, date) {
        // Update the global system time reference
        if (window.systemTimeOffset === undefined) {
            window.systemTimeOffset = 0;
        }
        
        window.systemTimeOffset = date.getTime() - Date.now();
        
        // Update menu bar immediately
        this.updateMenuBarDateTime(date);
        
        // Update calendar display
        const windowData = this.windows.get(windowId);
        windowData.currentDate = new Date(date);
        // Clear selection after setting system date to avoid white cell
        windowData.selectedDate = null;
        this.updateCalendarDisplay(windowId);
        
        SystemUtils.showNotification('Calendar', `System date set to ${date.toLocaleDateString()}`);
        
        // Emit event for other components
        eventManager.emit('system:dateChanged', { date: date });
    }

    /**
     * Update menu bar datetime display
     */
    updateMenuBarDateTime(date) {
        const dateTimeElement = document.getElementById('datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = SystemUtils.formatTime(date);
        }
    }

    /**
     * Load events (placeholder for future event functionality)
     */
    loadEvents() {
        return [];
    }

    /**
     * Handle window resize
     */
    handleWindowResize(data) {
        if (!this.windows.has(data.windowId)) return;
        
        // Refresh calendar grid on resize
        setTimeout(() => {
            this.updateCalendarDisplay(data.windowId);
        }, 100);
    }

    /**
     * Close window and cleanup
     */
    closeWindow(windowId) {
        if (this.windows.has(windowId)) {
            this.windows.delete(windowId);
        }
    }
}

// Create global instance
window.calendarApp = new CalendarApp();
