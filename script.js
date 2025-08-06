 // Confetti effect based on: https://www.cssscript.com/confetti-explosion-javascript-canvas/
        class Confetti {
            constructor(options) {
                this.options = {
                    count: 50,
                    size: {
                        min: 5,
                        max: 15
                    },
                    velocity: {
                        min: -10,
                        max: 10
                    },
                    rotation: {
                        min: 0,
                        max: 360
                    },
                    colors: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'],
                    ...options
                };
                this.particles = [];
                this.canvas = document.getElementById('confetti-canvas');
                this.ctx = this.canvas.getContext('2d');
                this.resizeCanvas();
                window.addEventListener('resize', this.resizeCanvas.bind(this));
            }

            resizeCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }

            createParticle(x, y) {
                const size = this.options.size.min + Math.random() * (this.options.size.max - this.options.size.min);
                const velocityX = this.options.velocity.min + Math.random() * (this.options.velocity.max - this.options.velocity.min);
                // FIX: Corrected the access to velocityY.max and velocityY.min to velocity.max and velocity.min
                const velocityY = this.options.velocity.min + Math.random() * (this.options.velocity.max - this.options.velocity.min);
                const rotation = this.options.rotation.min + Math.random() * (this.options.rotation.max - this.options.rotation.min);
                const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];

                this.particles.push({
                    x: x,
                    y: y,
                    size: size,
                    velocityX: velocityX,
                    velocityY: velocityY,
                    rotation: rotation,
                    color: color,
                    alpha: 1,
                    gravity: 0.5,
                    opacityDecay: 0.02
                });
            }

            drawParticles() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];

                    p.x += p.velocityX;
                    p.y += p.velocityY;
                    p.velocityY += p.gravity;
                    p.alpha -= p.opacityDecay;

                    if (p.alpha <= 0 || p.y > this.canvas.height) {
                        this.particles.splice(i, 1);
                        continue;
                    }

                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate(p.rotation * Math.PI / 180);
                    this.ctx.globalAlpha = p.alpha;
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    this.ctx.restore();
                }

                if (this.particles.length > 0) {
                    requestAnimationFrame(this.drawParticles.bind(this));
                }
            }

            shoot(x, y) {
                for (let i = 0; i < this.options.count; i++) {
                    this.createParticle(x, y);
                }
                this.drawParticles();
            }
        }

        class TodoApp {
            constructor() {
                this.tasks = this.loadTasks();
                this.currentFilter = 'all';
                this.editingId = null;
                this.confetti = new Confetti();
                this.initializeEventListeners();
                this.loadDarkModePreference();
                this.render();
            }

            loadTasks() {
                try {
                    const saved = JSON.parse(localStorage.getItem('todoTasks') || '[]');
                    return saved.map(task => ({
                        ...task,
                        id: task.id || Date.now() + Math.random()
                    }));
                } catch (error) {
                    console.error('Error loading tasks:', error);
                    return [];
                }
            }

            saveTasks() {
                try {
                    localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
                } catch (error) {
                    console.warn('Could not save tasks to localStorage:', error);
                }
            }

            initializeEventListeners() {
                const taskInput = document.getElementById('taskInput');
                const addBtn = document.getElementById('addBtn');
                const filterBtns = document.querySelectorAll('.filter-btn');
                const darkModeToggle = document.getElementById('darkModeToggle');

                addBtn.addEventListener('click', () => this.addTask());
                taskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addTask();
                });

                filterBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFilter(e.target.dataset.filter);
                    });
                });

                darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
            }

            addTask() {
                const input = document.getElementById('taskInput');
                const text = input.value.trim();

                if (!text) {
                    input.classList.add('shake-animation');
                    setTimeout(() => input.classList.remove('shake-animation'), 500);
                    return;
                }

                const newTask = {
                    id: Date.now() + Math.random(),
                    text: text,
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                this.tasks.unshift(newTask);
                input.value = '';
                this.saveTasks();
                this.render();
            }

            deleteTask(id) {
                this.tasks = this.tasks.filter(task => task.id !== id);
                this.saveTasks();
                this.render();
            }

            toggleTask(id) {
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    this.saveTasks();
                    this.render();
                    if (task.completed) {
                        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
                        if (taskElement) {
                            const rect = taskElement.getBoundingClientRect();
                            this.confetti.shoot(rect.left + rect.width / 2, rect.top + rect.height / 2);
                        }
                    }
                }
            }

            startEdit(id) {
                this.editingId = id;
                this.render();
            }

            saveEdit(id, newText) {
                const text = newText.trim();
                if (!text) {
                    // Optionally add feedback for empty edit
                    return;
                }

                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    task.text = text;
                    this.editingId = null;
                    this.saveTasks();
                    this.render();
                }
            }

            cancelEdit() {
                this.editingId = null;
                this.render();
            }

            setFilter(filter) {
                this.currentFilter = filter;
                
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filter === filter);
                });
                
                this.render();
            }

            getFilteredTasks() {
                switch (this.currentFilter) {
                    case 'completed':
                        return this.tasks.filter(task => task.completed);
                    case 'pending':
                        return this.tasks.filter(task => !task.completed);
                    default:
                        return this.tasks;
                }
            }

            updateStats() {
                const total = this.tasks.length;
                const completed = this.tasks.filter(t => t.completed).length;
                const pending = total - completed;

                document.getElementById('totalTasks').textContent = total;
                document.getElementById('completedTasks').textContent = completed;
                document.getElementById('pendingTasks').textContent = pending;
            }

            createTaskElement(task) {
                const isEditing = this.editingId === task.id;
                
                if (isEditing) {
                    return `
                        <div class="task-item" data-id="${task.id}">
                            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                                 onclick="todoApp.toggleTask(${task.id})">
                                ${task.completed ? '✓' : ''}
                            </div>
                            <input type="text" class="edit-input" value="${task.text}" 
                                   id="edit-input-${task.id}" maxlength="200"
                                   onkeypress="if(event.key === 'Enter') todoApp.saveEdit(${task.id}, this.value)">
                            <div class="edit-actions">
                                <button class="save-btn" onclick="todoApp.saveEdit(${task.id}, document.getElementById('edit-input-${task.id}').value)">Save</button>
                                <button class="cancel-btn" onclick="todoApp.cancelEdit()">Cancel</button>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                        <div class="task-content">
                            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                                 onclick="todoApp.toggleTask(${task.id})">
                                ${task.completed ? '✓' : ''}
                            </div>
                            <div class="task-text">${task.text}</div>
                        </div>
                        <div class="task-actions">
                            <button class="edit-btn" onclick="todoApp.startEdit(${task.id})" title="Edit task">✏️</button>
                            <button class="delete-btn" onclick="todoApp.deleteTask(${task.id})" title="Delete task">🗑️</button>
                        </div>
                    </div>
                `;
            }

            render() {
                const taskList = document.getElementById('taskList');
                const filteredTasks = this.getFilteredTasks();

                if (filteredTasks.length === 0) {
                    const emptyMessage = this.currentFilter === 'completed' ? 
                        'No completed tasks yet' : 
                        this.currentFilter === 'pending' ? 
                        'No pending tasks' : 
                        'No tasks yet';
                    
                    const emptyDescription = this.currentFilter === 'completed' ? 
                        'Complete some tasks to see them here!' : 
                        this.currentFilter === 'pending' ? 
                        'All tasks completed! 🎉' : 
                        'Add your first task above to get started!';

                    taskList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <h3>${emptyMessage}</h3>
                            <p>${emptyDescription}</p>
                        </div>
                    `;
                } else {
                    taskList.innerHTML = filteredTasks.map(task => this.createTaskElement(task)).join('');
                }

                this.updateStats();

                // Focus on edit input if editing
                if (this.editingId) {
                    setTimeout(() => {
                        const editInput = document.getElementById(`edit-input-${this.editingId}`);
                        if (editInput) {
                            editInput.focus();
                            editInput.select();
                        }
                    }, 0);
                }
            }

            toggleDarkMode() {
                document.body.classList.toggle('dark-mode');
                const isDarkMode = document.body.classList.contains('dark-mode');
                localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
                document.getElementById('darkModeToggle').querySelector('.icon').textContent = isDarkMode ? '☀️' : '💡';
            }

            loadDarkModePreference() {
                const darkModePreference = localStorage.getItem('darkMode');
                if (darkModePreference === 'enabled') {
                    document.body.classList.add('dark-mode');
                    document.getElementById('darkModeToggle').querySelector('.icon').textContent = '☀️';
                } else {
                    document.getElementById('darkModeToggle').querySelector('.icon').textContent = '💡';
                }
            }
        }

        // Initialize the app
        const todoApp = new TodoApp();
