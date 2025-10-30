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
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
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
        item.innerHTML = `<i class="${icon}"></i><span>${title}</span>`;
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
  echo      - Echo text back`;
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
        }
    };

    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = terminalInput.value.trim();
            terminalInput.value = '';

            if (!input) return;

            // Add command to output
            const commandLine = document.createElement('div');
            commandLine.className = 'terminal-line';
            commandLine.innerHTML = `<span class="terminal-prompt">shoaib@portfolio:~$</span> ${input}`;
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
                outputLine.textContent = output;
                terminalOutput.appendChild(outputLine);
            }

            // Scroll to bottom
            const terminalContent = terminalOutput.parentElement;
            terminalContent.scrollTop = terminalContent.scrollHeight;
        }
    });

    // Focus terminal input when terminal window is opened
    document.querySelector('[data-window="terminal"]').addEventListener('dblclick', () => {
        setTimeout(() => terminalInput.focus(), 100);
    });
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

// Console Easter egg
console.log('%c👾 Welcome to ShoaibOS!', 'font-size: 24px; color: #0078d4; font-weight: bold;');
console.log('%cType "help" in the Terminal for available commands', 'font-size: 14px; color: #888;');
