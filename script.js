// Importation des modules Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "TON_API_KEY",
    authDomain: "TON_PROJET.firebaseapp.com",
    databaseURL: "https://TON_PROJET.firebaseio.com",
    projectId: "TON_PROJET",
    storageBucket: "TON_PROJET.appspot.com",
    messagingSenderId: "ID",
    appId: "APP_ID"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'kanbanData');

let projects = ['Général'];
let currentProject = 'Général';
let tasks = [];

// --- SYNC & CLOUD ---

// ÉCOUTER LES CHANGEMENTS (Temps réel pour tout le monde)
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        tasks = data.tasks || [];
        projects = data.projects || ['Général'];
        render(); 
    }
});

function syncWithCloud() {
    set(dbRef, {
        tasks: tasks,
        projects: projects
    });
}

// --- LOGIQUE METIER (Attaches à Window pour le HTML) ---

window.addProject = () => {
    const input = document.getElementById('newProjectInput');
    const name = input.value.trim();
    if (name && !projects.includes(name)) {
        projects.push(name);
        currentProject = name; // Switch auto sur le nouveau projet
        syncWithCloud();
        input.value = "";
    }
};

window.switchProject = (name) => {
    currentProject = name;
    render(); // Pas besoin de sync cloud ici, c'est juste un affichage local
};

window.deleteProject = (name, event) => {
    event.stopPropagation();
    if (projects.length === 1) return alert("Impossible de supprimer le dernier projet.");
    
    if(confirm(`Supprimer le projet "${name}" et toutes ses tâches ?`)) {
        projects = projects.filter(p => p !== name);
        tasks = tasks.filter(t => t.project !== name);
        if (currentProject === name) currentProject = projects[0];
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
    // 1. Onglets
    const tabsCont = document.getElementById('projectTabs');
    if (!tabsCont) return;

    tabsCont.innerHTML = projects.map(p => `
        <div class="tab ${p === currentProject ? 'active' : ''}" onclick="switchProject('${p}')">
            ${p}
            <span class="btn-delete-tab" onclick="deleteProject('${p}', event)">×</span>
        </div>
    `).join('');

    // 2. Tâches
    const containers = {
        todo: document.getElementById('todo'),
        doing: document.getElementById('doing'),
        done: document.getElementById('done')
    };
    
    if (!containers.todo) return; // Sécurité

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

// --- RESPONSIVE MOBILE ---

window.switchCol = (colId) => {
    document.querySelectorAll('.column').forEach(col => col.classList.remove('active'));
    document.getElementById('col-' + colId).classList.add('active');

    document.querySelectorAll('.col-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + colId).classList.add('active');
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    if(window.innerWidth <= 768) {
        switchCol('todo');
    }
    render();
});