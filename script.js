document.addEventListener('DOMContentLoaded', () => {
    let projects = JSON.parse(localStorage.getItem('my_projects')) || ['Général'];
    let currentProject = localStorage.getItem('current_project') || 'Général';
    let tasks = JSON.parse(localStorage.getItem('my_tasks')) || [];

    window.addProject = () => {
        const input = document.getElementById('newProjectInput');
        const name = input.value.trim();
        if (name && !projects.includes(name)) {
            projects.push(name);
            currentProject = name;
            saveAndRender();
            input.value = "";
        }
    };

    window.switchProject = (name) => {
        currentProject = name;
        saveAndRender();
    };

    window.deleteProject = (name, event) => {
        event.stopPropagation();
        if (projects.length === 1) return;
        projects = projects.filter(p => p !== name);
        tasks = tasks.filter(t => t.project !== name);
        if (currentProject === name) currentProject = projects[0];
        saveAndRender();
    };

    window.addTask = () => {
        const input = document.getElementById('taskInput');
        if (!input.value.trim()) return;
        tasks.push({ id: Date.now(), title: input.value, status: 'todo', project: currentProject });
        saveAndRender();
        input.value = "";
    };

    window.moveTask = (id, newStatus) => {
        tasks = tasks.map(t => t.id === id ? {...t, status: newStatus} : t);
        saveAndRender();
    };

    window.deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRender();
    };

    function saveAndRender() {
        localStorage.setItem('my_projects', JSON.stringify(projects));
        localStorage.setItem('my_tasks', JSON.stringify(tasks));
        localStorage.setItem('current_project', currentProject);
        render();
    }

    function render() {
        // Rendre les onglets
        const tabsCont = document.getElementById('projectTabs');
        tabsCont.innerHTML = projects.map(p => `
            <div class="tab ${p === currentProject ? 'active' : ''}" onclick="switchProject('${p}')">
                ${p}
                <span class="btn-delete-tab" onclick="deleteProject('${p}', event)">×</span>
            </div>
        `).join('');

        // Rendre les tâches
        const containers = {
            todo: document.getElementById('todo'),
            doing: document.getElementById('doing'),
            done: document.getElementById('done')
        };
        Object.values(containers).forEach(c => c.innerHTML = "");

        tasks.filter(t => t.project === currentProject).forEach(t => {
            const card = document.createElement('div');
            card.className = "task-card";
            
            let moveBtns = "";
            if (t.status === 'todo') moveBtns = `<button onclick="moveTask(${t.id}, 'doing')">➡️</button>`;
            else if (t.status === 'doing') moveBtns = `<button onclick="moveTask(${t.id}, 'todo')">⬅️</button> <button onclick="moveTask(${t.id}, 'done')">✅</button>`;
            else if (t.status === 'done') moveBtns = `<button onclick="moveTask(${t.id}, 'doing')">⬅️</button>`;

            card.innerHTML = `
                <span>${t.title}</span>
                <div class="task-actions">
                    ${moveBtns}
                    <button onclick="deleteTask(${t.id})">🗑️</button>
                </div>
            `;
            containers[t.status].appendChild(card);
        });
    }

    render();
});

window.switchCol = (colId) => {
    // 1. Gérer l'affichage des colonnes
    document.querySelectorAll('.column').forEach(col => {
        col.classList.remove('active');
    });
    document.getElementById('col-' + colId).classList.add('active');

    // 2. Gérer l'état des boutons
    document.querySelectorAll('.col-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('btn-' + colId).classList.add('active');
};

// On s'assure qu'au moins une colonne est active au départ
document.addEventListener('DOMContentLoaded', () => {
    if(window.innerWidth <= 768) {
        switchCol('todo');
    }
});