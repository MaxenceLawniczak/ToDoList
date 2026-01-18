import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCn0mi9AiuEdDt385KI84tppSjpq0eFVn4",
    authDomain: "todolist-3ea18.firebaseapp.com",
    projectId: "todolist-3ea18",
    storageBucket: "todolist-3ea18.firebasestorage.app",
    messagingSenderId: "277903582226",
    appId: "1:277903582226:web:826934f9c6c99514eee4cb",
    measurementId: "G-MES5MEEZMP",
    databaseURL: "https://todolist-3ea18-default-rtdb.europe-west1.firebasedatabase.app/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'kanbanData');

// On ne définit pas de valeurs par défaut ici, on laisse Firebase remplir
let projects = [];
let tasks = [];
let currentProject = localStorage.getItem('last_project') || 'Général';

// --- SYNC & CLOUD ---

onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        tasks = data.tasks || [];
        projects = data.projects || ['Général'];
        
        // Si le projet courant n'existe plus dans la liste cloud, on reset
        if (!projects.includes(currentProject)) {
            currentProject = projects[0];
        }
    } else {
        // Premier lancement : on initialise le cloud
        projects = ['Général'];
        tasks = [];
        syncWithCloud();
    }
    render(); 
});

function syncWithCloud() {
    set(dbRef, {
        tasks: tasks,
        projects: projects
    });
}

// --- LOGIQUE METIER ---

window.addProject = () => {
    const input = document.getElementById('newProjectInput');
    const name = input.value.trim();
    if (name && !projects.includes(name)) {
        projects.push(name);
        currentProject = name;
        localStorage.setItem('last_project', name);
        syncWithCloud();
        input.value = "";
    }
};

window.switchProject = (name) => {
    currentProject = name;
    localStorage.setItem('last_project', name);
    render();
};

window.deleteProject = (name, event) => {
    event.stopPropagation();
    if (projects.length === 1) return alert("Impossible de supprimer le dernier projet.");
    
    if(confirm(`Supprimer le projet "${name}" ?`)) {
        projects = projects.filter(p => p !== name);
        tasks = tasks.filter(t => t.project !== name);
        if (currentProject === name) currentProject = projects[0];
        localStorage.setItem('last_project', currentProject);
        syncWithCloud();
    }
};

window.addTask = () => {
    const input = document.getElementById('taskInput');
    if (!input.value.trim()) return;
    tasks.push({ 
        id: Date.now(), 
        title: input.value, 
        status: 'todo', 
        project: currentProject 
    });
    syncWithCloud();
    input.value = "";
};

window.moveTask = (id, newStatus) => {
    tasks = tasks.map(t => t.id === id ? {...t, status: newStatus} : t);
    syncWithCloud();
};

window.deleteTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    syncWithCloud();
};

// --- AFFICHAGE ---

function render() {
    const tabsCont = document.getElementById('projectTabs');
    const containers = {
        todo: document.getElementById('todo'),
        doing: document.getElementById('doing'),
        done: document.getElementById('done')
    };
    
    if (!tabsCont || !containers.todo) return;

    // Rendre les onglets
    tabsCont.innerHTML = projects.map(p => `
        <div class="tab ${p === currentProject ? 'active' : ''}" onclick="switchProject('${p}')">
            ${p}
            <span class="btn-delete-tab" onclick="deleteProject('${p}', event)">×</span>
        </div>
    `).join('');

    // Vider les colonnes
    Object.values(containers).forEach(c => c.innerHTML = "");

    // Filtrer et afficher
    const projectTasks = tasks.filter(t => t.project === currentProject);
    
    projectTasks.forEach(t => {
        const card = document.createElement('div');
        card.className = "task-card shadow-sm"; // Ajout d'une ombre pour le style
        
        let moveBtns = "";
        if (t.status === 'todo') moveBtns = `<button onclick="moveTask(${t.id}, 'doing')">➡️</button>`;
        else if (t.status === 'doing') moveBtns = `<button onclick="moveTask(${t.id}, 'todo')">⬅️</button> <button onclick="moveTask(${t.id}, 'done')">✅</button>`;
        else if (t.status === 'done') moveBtns = `<button onclick="moveTask(${t.id}, 'doing')">⬅️</button>`;

        card.innerHTML = `
            <span>${t.title}</span>
            <div class="task-actions">
                ${moveBtns}
                <button onclick="deleteTask(${t.id})" style="color: #ff4d4d; margin-left: 10px;">🗑️</button>
            </div>
        `;
        containers[t.status].appendChild(card);
    });
}

// --- RESPONSIVE ---

window.switchCol = (colId) => {
    document.querySelectorAll('.column').forEach(col => col.classList.remove('active'));
    const targetCol = document.getElementById('col-' + colId);
    if(targetCol) targetCol.classList.add('active');

    document.querySelectorAll('.col-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById('btn-' + colId);
    if(targetBtn) targetBtn.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.innerWidth <= 768) switchCol('todo');
});