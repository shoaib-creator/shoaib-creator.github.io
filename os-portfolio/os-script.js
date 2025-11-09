// OS Portfolio JavaScript

// Global variables
let zIndex = 100;
let activeWindow = null;
const openWindows = new Set();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeWindows();
    initializeTaskbar();
    initializeStartMenu();
    initializeClock();
    initializeTerminal();
    initializeContactForm();
    initializeKeyboardShortcuts();
    initializeContextMenu();
    initializeCalculator();
    initializeSettings();
});

// Initialize windows
function initializeWindows() {
    const icons = document.querySelectorAll('.icon');
    const windows = document.querySelectorAll('.window');

    icons.forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.dataset.window;
            openWindow(windowId);
        });
    });

    windows.forEach(window => {
        makeWindowDraggable(window);
        setupWindowControls(window);
    });
}

// Open window
function openWindow(windowId) {
    const window = document.getElementById(`${windowId}-window`);
    if (!window) return;

    if (window.classList.contains('active')) {
        focusWindow(window);
        return;
    }

    window.classList.add('active');
    window.classList.remove('minimized');
    openWindows.add(windowId);

    // Center window if not positioned
    if (!window.style.left || !window.style.top) {
        centerWindow(window);
    }

    focusWindow(window);
    updateTaskbar();
}

// Center window
function centerWindow(window) {
    const windowWidth = window.offsetWidth;
    const windowHeight = window.offsetHeight;
    const screenWidth = window.parentElement.offsetWidth;
    const screenHeight = window.parentElement.offsetHeight - 48; // Subtract taskbar

    window.style.left = `${(screenWidth - windowWidth) / 2}px`;
    window.style.top = `${(screenHeight - windowHeight) / 2}px`;
}

// Focus window
function focusWindow(window) {
    document.querySelectorAll('.window').forEach(w => {
        w.style.zIndex = 100;
    });
    window.style.zIndex = ++zIndex;
    activeWindow = window;
}

// Make window draggable
function makeWindowDraggable(window) {
    const header = window.querySelector('.window-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let snapIndicator = null;

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-controls')) return;
        if (window.classList.contains('maximized')) return;

        isDragging = true;
        initialX = e.clientX - (parseFloat(window.style.left) || 0);
        initialY = e.clientY - (parseFloat(window.style.top) || 0);

        focusWindow(window);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        window.style.left = `${currentX}px`;
        window.style.top = `${currentY}px`;

        // Snap to edge preview
        showSnapPreview(e, window);
    });

    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            applySnapToEdge(e, window);
            removeSnapPreview();
        }
    });

    // Make window resizable
    makeWindowResizable(window);
}

// Show snap preview
function showSnapPreview(e, window) {
    const screenWidth = window.parentElement.offsetWidth;
    const screenHeight = window.parentElement.offsetHeight - 48;
    const margin = 10;

    if (!document.getElementById('snapIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'snapIndicator';
        indicator.style.cssText = `
            position: absolute;
            border: 2px solid var(--primary-color);
            background: rgba(0, 120, 212, 0.1);
            pointer-events: none;
            z-index: 9998;
            display: none;
        `;
        document.querySelector('.desktop').appendChild(indicator);
    }

    const indicator = document.getElementById('snapIndicator');

    // Left edge
    if (e.clientX < margin) {
        indicator.style.display = 'block';
        indicator.style.left = '0';
        indicator.style.top = '0';
        indicator.style.width = `${screenWidth / 2}px`;
        indicator.style.height = `${screenHeight}px`;
    }
    // Right edge
    else if (e.clientX > screenWidth - margin) {
        indicator.style.display = 'block';
        indicator.style.left = `${screenWidth / 2}px`;
        indicator.style.top = '0';
        indicator.style.width = `${screenWidth / 2}px`;
        indicator.style.height = `${screenHeight}px`;
    }
    // Top edge (maximize)
    else if (e.clientY < margin) {
        indicator.style.display = 'block';
        indicator.style.left = '0';
        indicator.style.top = '0';
        indicator.style.width = `${screenWidth}px`;
        indicator.style.height = `${screenHeight}px`;
    }
    else {
        indicator.style.display = 'none';
    }
}

// Remove snap preview
function removeSnapPreview() {
    const indicator = document.getElementById('snapIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Apply snap to edge
function applySnapToEdge(e, window) {
    const screenWidth = window.parentElement.offsetWidth;
    const screenHeight = window.parentElement.offsetHeight - 48;
    const margin = 10;

    window.classList.remove('snapped-left', 'snapped-right');

    // Left edge
    if (e.clientX < margin) {
        window.style.left = '0';
        window.style.top = '0';
        window.style.width = `${screenWidth / 2}px`;
        window.style.height = `${screenHeight}px`;
        window.classList.add('snapped-left');
    }
    // Right edge
    else if (e.clientX > screenWidth - margin) {
        window.style.left = `${screenWidth / 2}px`;
        window.style.top = '0';
        window.style.width = `${screenWidth / 2}px`;
        window.style.height = `${screenHeight}px`;
        window.classList.add('snapped-right');
    }
    // Top edge (maximize)
    else if (e.clientY < margin) {
        window.classList.add('maximized');
    }
}

// Make window resizable
function makeWindowResizable(window) {
    const resizers = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
    
    resizers.forEach(direction => {
        const resizer = document.createElement('div');
        resizer.className = `resizer resizer-${direction}`;
        window.appendChild(resizer);

        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        resizer.addEventListener('mousedown', (e) => {
            if (window.classList.contains('maximized')) return;
            
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = window.offsetWidth;
            startHeight = window.offsetHeight;
            startLeft = parseFloat(window.style.left) || 0;
            startTop = parseFloat(window.style.top) || 0;

            focusWindow(window);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Horizontal resizing
            if (direction.includes('e')) {
                window.style.width = `${Math.max(400, startWidth + deltaX)}px`;
            }
            if (direction.includes('w')) {
                const newWidth = Math.max(400, startWidth - deltaX);
                if (newWidth >= 400) {
                    window.style.width = `${newWidth}px`;
                    window.style.left = `${startLeft + deltaX}px`;
                }
            }

            // Vertical resizing
            if (direction.includes('s')) {
                window.style.height = `${Math.max(300, startHeight + deltaY)}px`;
            }
            if (direction.includes('n')) {
                const newHeight = Math.max(300, startHeight - deltaY);
                if (newHeight >= 300) {
                    window.style.height = `${newHeight}px`;
                    window.style.top = `${startTop + deltaY}px`;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    });
}

// Setup window controls
function setupWindowControls(window) {
    const minimizeBtn = window.querySelector('.minimize');
    const maximizeBtn = window.querySelector('.maximize');
    const closeBtn = window.querySelector('.close');
    const windowId = window.dataset.window;

    minimizeBtn.addEventListener('click', () => {
        window.classList.add('minimized');
        window.classList.remove('active');
        updateTaskbar();
    });

    maximizeBtn.addEventListener('click', () => {
        window.classList.toggle('maximized');
    });

    closeBtn.addEventListener('click', () => {
        window.classList.remove('active', 'minimized', 'maximized');
        openWindows.delete(windowId);
        updateTaskbar();
    });
}

// Initialize taskbar
function initializeTaskbar() {
    const taskbarItems = document.getElementById('taskbarItems');

    taskbarItems.addEventListener('click', (e) => {
        const item = e.target.closest('.taskbar-item');
        if (!item) return;

        const windowId = item.dataset.window;
        const window = document.getElementById(`${windowId}-window`);

        if (window.classList.contains('active')) {
            window.classList.add('minimized');
            window.classList.remove('active');
        } else {
            window.classList.remove('minimized');
            window.classList.add('active');
            focusWindow(window);
        }
        updateTaskbar();
    });
}

// Update taskbar
function updateTaskbar() {
    const taskbarItems = document.getElementById('taskbarItems');
    taskbarItems.innerHTML = '';

    openWindows.forEach(windowId => {
        const window = document.getElementById(`${windowId}-window`);
        const title = window.querySelector('.window-title span').textContent;
        const icon = window.querySelector('.window-title i').className;

        const item = document.createElement('div');
        item.className = 'taskbar-item';
        item.dataset.window = windowId;
        if (window.classList.contains('active')) {
            item.classList.add('active');
        }
        // Create icon and title elements safely
        const iconElement = document.createElement('i');
        iconElement.className = icon;
        const titleElement = document.createElement('span');
        titleElement.textContent = title;
        item.appendChild(iconElement);
        item.appendChild(titleElement);
        taskbarItems.appendChild(item);
    });
}

// Initialize start menu
function initializeStartMenu() {
    const startButton = document.querySelector('.start-button');
    const startMenuPanel = document.getElementById('startMenuPanel');
    const startMenuItems = document.querySelectorAll('.start-menu-item');
    const powerBtn = document.querySelector('.power-btn');

    startButton.addEventListener('click', () => {
        startMenuPanel.classList.toggle('active');
    });

    startMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const windowId = item.dataset.window;
            openWindow(windowId);
            startMenuPanel.classList.remove('active');
        });
    });

    powerBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to shutdown?')) {
            document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; font-size: 24px;"><div><i class="fas fa-power-off" style="font-size: 60px; margin-bottom: 20px; display: block;"></i>Shutting down...</div></div>';
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.start-menu') && !e.target.closest('.start-menu-panel')) {
            startMenuPanel.classList.remove('active');
        }
    });
}

// Initialize clock
function initializeClock() {
    const clock = document.getElementById('clock');

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clock.textContent = `${hours}:${minutes}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// Initialize terminal
function initializeTerminal() {
    const terminalInput = document.getElementById('terminalInput');
    const terminalOutput = document.getElementById('terminalOutput');
    let commandHistory = [];
    let historyIndex = -1;

    const commands = {
        help: () => {
            return `Available commands:
  help      - Show this help message
  about     - Display information about me
  skills    - List my technical skills
  projects  - Show my projects
  contact   - Display contact information
  clear     - Clear terminal
  whoami    - Display current user
  date      - Show current date and time
  echo      - Echo text back
  ls        - List available sections
  cat       - Display content of a section
  neofetch  - Display system information
  history   - Show command history
  banner    - Display ASCII art banner`;
        },
        about: () => {
            return `Shoaib Alam
Full Stack Developer & Software Engineer
Passionate about creating innovative solutions and building exceptional digital experiences.`;
        },
        skills: () => {
            return `Technical Skills:
- Frontend: HTML, CSS, JavaScript, React, Vue.js, TypeScript
- Backend: Node.js, Python, Django, Express
- Database: MongoDB, PostgreSQL, MySQL
- Cloud: AWS, Docker, Kubernetes
- Tools: Git, CI/CD, Agile/Scrum`;
        },
        projects: () => {
            return `Featured Projects:
1. E-Commerce Platform - Full-stack solution with payment integration
2. Task Management App - Collaborative tool with real-time updates
3. Analytics Dashboard - Data visualization with custom reports
4. Blog Platform - Modern blogging with SEO optimization`;
        },
        contact: () => {
            return `Contact Information:
Email: contact@shoaibalam.me
Phone: +1 (234) 567-890
GitHub: github.com/shoaib-creator
LinkedIn: linkedin.com/in/shoaib-alam`;
        },
        clear: () => {
            terminalOutput.innerHTML = '<div class="terminal-line">Terminal cleared</div>';
            return null;
        },
        whoami: () => {
            return 'shoaib';
        },
        date: () => {
            return new Date().toString();
        },
        echo: (args) => {
            return args.join(' ');
        },
        ls: () => {
            return `about.txt    skills.txt    projects.txt    experience.txt    contact.txt`;
        },
        cat: (args) => {
            if (!args[0]) return 'Usage: cat <filename>';
            const file = args[0].replace('.txt', '');
            if (commands[file]) {
                return commands[file]([]);
            }
            return `cat: ${args[0]}: No such file or directory`;
        },
        neofetch: () => {
            return `
     _______________        shoaib@portfolio
    /               \\       OS: ShoaibOS v1.0
   |   SHOAIB OS    |      Kernel: JavaScript ES6+
   |   o       o    |      Uptime: ${getUptime()}
   |      ___       |      Shell: Web Terminal
    \\     \\_/      /       Terminal: ShoaibOS Terminal
     \\___________/         CPU: Your Browser
                            GPU: Canvas/WebGL
                            Memory: ${getMemoryInfo()}`;
        },
        history: () => {
            return commandHistory.length > 0 
                ? commandHistory.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n')
                : 'No command history';
        },
        banner: () => {
            return `
  _____ _                 _ _        ___  _____ 
 / ____| |               (_) |      / _ \\/ ____|
| (___ | |__   ___   __ _ _| |__   | | | | (___  
 \\___ \\| '_ \\ / _ \\ / _\` | | '_ \\  | | | |\\___ \\ 
 ____) | | | | (_) | (_| | | |_) | | |_| |____) |
|_____/|_| |_|\\___/ \\__,_|_|_.__/   \\___/|_____/ 
                                                  
        Welcome to Shoaib's OS Portfolio!
        Type 'help' for available commands`;
        }
    };

    // Helper functions for neofetch
    function getUptime() {
        const now = new Date().getTime();
        const bootTime = window.bootTime || now;
        const uptime = Math.floor((now - bootTime) / 1000);
        const minutes = Math.floor(uptime / 60);
        const seconds = uptime % 60;
        return `${minutes}m ${seconds}s`;
    }

    function getMemoryInfo() {
        if (performance.memory) {
            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
            return `${used}MB / ${total}MB`;
        }
        return 'N/A';
    }

    // Tab completion
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const input = terminalInput.value.trim();
            const matches = Object.keys(commands).filter(cmd => cmd.startsWith(input));
            
            if (matches.length === 1) {
                terminalInput.value = matches[0];
            } else if (matches.length > 1) {
                const outputLine = document.createElement('div');
                outputLine.className = 'terminal-line';
                outputLine.textContent = matches.join('  ');
                terminalOutput.appendChild(outputLine);
                scrollTerminal();
            }
        }
        // Arrow up - previous command
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                if (historyIndex === -1) {
                    historyIndex = commandHistory.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                terminalInput.value = commandHistory[historyIndex];
            }
        }
        // Arrow down - next command
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                historyIndex++;
                if (historyIndex >= commandHistory.length) {
                    historyIndex = -1;
                    terminalInput.value = '';
                } else {
                    terminalInput.value = commandHistory[historyIndex];
                }
            }
        }
    });

    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = terminalInput.value.trim();
            terminalInput.value = '';

            if (!input) return;

            // Add to history
            commandHistory.push(input);
            historyIndex = -1;

            // Add command to output safely
            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            const promptSpan = document.createElement('span');
            promptSpan.className = 'terminal-prompt';
            promptSpan.textContent = 'shoaib@portfolio:~$ ';
            commandLine.appendChild(promptSpan);
            const inputText = document.createTextNode(input);
            commandLine.appendChild(inputText);
            terminalOutput.appendChild(commandLine);

            // Parse and execute command
            const parts = input.split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            let output;
            if (commands[command]) {
                output = commands[command](args);
            } else {
                output = `Command not found: ${command}. Type 'help' for available commands.`;
            }

            if (output !== null) {
                const outputLine = document.createElement('div');
                outputLine.className = 'terminal-line';
                outputLine.style.whiteSpace = 'pre-wrap';
                outputLine.textContent = output;
                terminalOutput.appendChild(outputLine);
            }

            scrollTerminal();
        }
    });

    // Scroll terminal to bottom
    function scrollTerminal() {
        const terminalContent = terminalOutput.parentElement;
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }

    // Focus terminal input when terminal window is opened
    document.querySelector('[data-window="terminal"]').addEventListener('dblclick', () => {
        setTimeout(() => terminalInput.focus(), 100);
    });

    // Store boot time
    window.bootTime = new Date().getTime();
}

// Initialize contact form
function initializeContactForm() {
    const form = document.querySelector('.contact-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const name = form.querySelector('input[type="text"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const message = form.querySelector('textarea').value;

        // Simple validation
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Simulate form submission
        console.log('Form submitted:', { name, email, message });
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        form.reset();
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto-open About window on first load
setTimeout(() => {
    openWindow('about');
}, 4000);

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    let altTabOpen = false;
    let currentTabIndex = 0;

    document.addEventListener('keydown', (e) => {
        // Alt + Tab - Window switcher
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            
            if (openWindows.size === 0) return;

            if (!altTabOpen) {
                altTabOpen = true;
                showWindowSwitcher();
            }

            const windowsArray = Array.from(openWindows);
            currentTabIndex = (currentTabIndex + 1) % windowsArray.length;
            highlightSwitcherWindow(windowsArray[currentTabIndex]);
        }
        // Ctrl + W - Close active window
        else if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            if (activeWindow) {
                const windowId = activeWindow.dataset.window;
                activeWindow.classList.remove('active', 'minimized', 'maximized');
                openWindows.delete(windowId);
                updateTaskbar();
            }
        }
        // Ctrl + Shift + T - Open terminal
        else if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            openWindow('terminal');
        }
        // F11 - Toggle fullscreen for active window
        else if (e.key === 'F11') {
            e.preventDefault();
            if (activeWindow) {
                activeWindow.classList.toggle('maximized');
            }
        }
        // Escape - Close start menu, window switcher
        else if (e.key === 'Escape') {
            document.getElementById('startMenuPanel').classList.remove('active');
            hideWindowSwitcher();
            altTabOpen = false;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt' && altTabOpen) {
            altTabOpen = false;
            const windowsArray = Array.from(openWindows);
            if (windowsArray[currentTabIndex]) {
                openWindow(windowsArray[currentTabIndex]);
            }
            hideWindowSwitcher();
            currentTabIndex = 0;
        }
    });
}

// Show window switcher
function showWindowSwitcher() {
    let switcher = document.getElementById('windowSwitcher');
    if (!switcher) {
        switcher = document.createElement('div');
        switcher.id = 'windowSwitcher';
        switcher.className = 'window-switcher';
        document.body.appendChild(switcher);
    }

    switcher.innerHTML = '';
    switcher.style.display = 'flex';

    openWindows.forEach(windowId => {
        const window = document.getElementById(`${windowId}-window`);
        const title = window.querySelector('.window-title span').textContent;
        const icon = window.querySelector('.window-title i').className;

        const item = document.createElement('div');
        item.className = 'switcher-item';
        item.dataset.window = windowId;
        
        const iconEl = document.createElement('i');
        iconEl.className = icon;
        const titleEl = document.createElement('span');
        titleEl.textContent = title;
        
        item.appendChild(iconEl);
        item.appendChild(titleEl);
        switcher.appendChild(item);
    });
}

// Highlight switcher window
function highlightSwitcherWindow(windowId) {
    const items = document.querySelectorAll('.switcher-item');
    items.forEach(item => {
        if (item.dataset.window === windowId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Hide window switcher
function hideWindowSwitcher() {
    const switcher = document.getElementById('windowSwitcher');
    if (switcher) {
        switcher.style.display = 'none';
    }
}

// Initialize context menu
function initializeContextMenu() {
    const desktop = document.querySelector('.desktop');
    let contextMenu = document.getElementById('contextMenu');

    if (!contextMenu) {
        contextMenu = document.createElement('div');
        contextMenu.id = 'contextMenu';
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="refresh">
                <i class="fas fa-sync-alt"></i>
                <span>Refresh</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" data-action="about">
                <i class="fas fa-user"></i>
                <span>About Me</span>
            </div>
            <div class="context-menu-item" data-action="terminal">
                <i class="fas fa-terminal"></i>
                <span>Open Terminal</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" data-action="settings">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </div>
        `;
        document.body.appendChild(contextMenu);
    }

    // Show context menu on right-click
    desktop.addEventListener('contextmenu', (e) => {
        if (e.target === desktop || e.target.classList.contains('wallpaper')) {
            e.preventDefault();
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
        }
    });

    // Hide context menu on click
    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    // Handle context menu actions
    contextMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.context-menu-item');
        if (!item) return;

        const action = item.dataset.action;
        
        switch(action) {
            case 'refresh':
                location.reload();
                break;
            case 'about':
                openWindow('about');
                break;
            case 'terminal':
                openWindow('terminal');
                break;
            case 'settings':
                showNotification('Settings feature coming soon!', 'info');
                break;
        }
    });
}

// Initialize calculator
function initializeCalculator() {
    const display = document.getElementById('calcDisplay');
    const buttons = document.querySelectorAll('.calc-btn');
    
    let currentValue = '0';
    let previousValue = '';
    let operation = null;
    let shouldResetDisplay = false;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;

            if (!isNaN(value) || value === '.') {
                handleNumber(value);
            } else if (value === 'C') {
                clear();
            } else if (value === '±') {
                toggleSign();
            } else if (value === '%') {
                percentage();
            } else if (['+', '-', '*', '/'].includes(value)) {
                handleOperation(value);
            } else if (value === '=') {
                calculate();
            }

            updateDisplay();
        });
    });

    function handleNumber(num) {
        if (shouldResetDisplay) {
            currentValue = num === '.' ? '0.' : num;
            shouldResetDisplay = false;
        } else {
            if (num === '.' && currentValue.includes('.')) return;
            currentValue = currentValue === '0' ? num : currentValue + num;
        }
    }

    function clear() {
        currentValue = '0';
        previousValue = '';
        operation = null;
        shouldResetDisplay = false;
    }

    function toggleSign() {
        currentValue = String(parseFloat(currentValue) * -1);
    }

    function percentage() {
        currentValue = String(parseFloat(currentValue) / 100);
    }

    function handleOperation(op) {
        if (operation !== null) {
            calculate();
        }
        previousValue = currentValue;
        operation = op;
        shouldResetDisplay = true;
    }

    function calculate() {
        if (operation === null || shouldResetDisplay) return;

        const prev = parseFloat(previousValue);
        const current = parseFloat(currentValue);
        let result = 0;

        switch (operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                result = current !== 0 ? prev / current : 'Error';
                break;
        }

        currentValue = String(result);
        operation = null;
        previousValue = '';
        shouldResetDisplay = true;
    }

    function updateDisplay() {
        display.textContent = currentValue;
    }

    // Keyboard support for calculator
    document.addEventListener('keydown', (e) => {
        const calcWindow = document.getElementById('calculator-window');
        if (!calcWindow.classList.contains('active')) return;

        const key = e.key;
        
        if (!isNaN(key) || key === '.') {
            handleNumber(key);
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            clear();
        } else if (key === 'Enter' || key === '=') {
            calculate();
        } else if (['+', '-', '*', '/'].includes(key)) {
            handleOperation(key);
        } else if (key === 'Backspace') {
            currentValue = currentValue.slice(0, -1) || '0';
        }

        updateDisplay();
    });
}

// Initialize settings
function initializeSettings() {
    const themeSelect = document.getElementById('themeSelect');
    const wallpaperSelect = document.getElementById('wallpaperSelect');
    const animationsToggle = document.getElementById('animationsToggle');
    const glassToggle = document.getElementById('glassToggle');
    const applyBtn = document.getElementById('applySettings');
    const resetBtn = document.getElementById('resetSettings');

    // Load saved settings
    loadSettings();

    // Theme colors
    const themes = {
        blue: { primary: '#0078d4', secondary: '#005a9e' },
        purple: { primary: '#8b5cf6', secondary: '#6d28d9' },
        green: { primary: '#10b981', secondary: '#059669' },
        red: { primary: '#ef4444', secondary: '#dc2626' },
        orange: { primary: '#f59e0b', secondary: '#d97706' }
    };

    // Wallpapers
    const wallpapers = {
        gradient1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        gradient2: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
        gradient3: 'linear-gradient(135deg, #FBDA61 0%, #FF5ACD 100%)',
        gradient4: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
        gradient5: 'linear-gradient(135deg, #000428 0%, #004e92 100%)'
    };

    applyBtn.addEventListener('click', () => {
        const theme = themeSelect.value;
        const wallpaper = wallpaperSelect.value;
        const animations = animationsToggle.checked;
        const glass = glassToggle.checked;

        // Apply theme
        document.documentElement.style.setProperty('--primary-color', themes[theme].primary);
        document.documentElement.style.setProperty('--secondary-color', themes[theme].secondary);

        // Apply wallpaper
        document.querySelector('.wallpaper').style.background = wallpapers[wallpaper];

        // Apply animations toggle
        if (!animations) {
            document.querySelectorAll('*').forEach(el => {
                el.style.transition = 'none';
            });
        } else {
            document.querySelectorAll('*').forEach(el => {
                el.style.transition = '';
            });
        }

        // Apply glass effect toggle
        if (!glass) {
            document.querySelectorAll('.window, .taskbar, .start-menu-panel').forEach(el => {
                el.style.backdropFilter = 'none';
                el.style.webkitBackdropFilter = 'none';
            });
        } else {
            document.querySelectorAll('.window').forEach(el => {
                el.style.backdropFilter = 'blur(20px)';
                el.style.webkitBackdropFilter = 'blur(20px)';
            });
            document.querySelector('.taskbar').style.backdropFilter = 'blur(20px)';
        }

        // Save settings
        const settings = { theme, wallpaper, animations, glass };
        localStorage.setItem('shoaibos-settings', JSON.stringify(settings));

        showNotification('Settings applied successfully!', 'success');
    });

    resetBtn.addEventListener('click', () => {
        themeSelect.value = 'blue';
        wallpaperSelect.value = 'gradient1';
        animationsToggle.checked = true;
        glassToggle.checked = true;
        
        localStorage.removeItem('shoaibos-settings');
        showNotification('Settings reset to default', 'info');
        
        // Reload to apply defaults
        setTimeout(() => location.reload(), 1000);
    });

    function loadSettings() {
        const saved = localStorage.getItem('shoaibos-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            themeSelect.value = settings.theme || 'blue';
            wallpaperSelect.value = settings.wallpaper || 'gradient1';
            animationsToggle.checked = settings.animations !== false;
            glassToggle.checked = settings.glass !== false;

            // Auto-apply on load
            setTimeout(() => {
                applyBtn.click();
            }, 100);
        }
    }
}

// Console Easter egg
console.log('%c👾 Welcome to ShoaibOS!', 'font-size: 24px; color: #0078d4; font-weight: bold;');
console.log('%cType "help" in the Terminal for available commands', 'font-size: 14px; color: #888;');
