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

let projects = [];
let tasks = [];
let currentProject = localStorage.getItem('last_project') || 'Général';
let isSyncedOnce = false; 

// --- CLOUD SYNC ---

onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        tasks = data.tasks || [];
        projects = data.projects || ['Général'];
        if (!projects.includes(currentProject)) currentProject = projects[0];
    } else {
        projects = ['Général'];
        tasks = [];
        syncWithCloud();
    }
    isSyncedOnce = true;
    render(); 
});

function syncWithCloud() {
    if (!isSyncedOnce) return; // Empêche d'écraser le cloud avec du vide au chargement
    set(dbRef, { tasks, projects });
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
    if (projects.length === 1) return;
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

// --- RENDER ---

function render() {
    const tabsCont = document.getElementById('projectTabs');
    const containers = { todo: document.getElementById('todo'), doing: document.getElementById('doing'), done: document.getElementById('done') };
    
    if (!tabsCont || !containers.todo) return;

    tabsCont.innerHTML = projects.map(p => `
        <div class="tab ${p === currentProject ? 'active' : ''}" onclick="switchProject('${p}')">
            ${p} <span class="btn-delete-tab" onclick="deleteProject('${p}', event)">×</span>
        </div>
    `).join('');

    Object.values(containers).forEach(c => c.innerHTML = "");

    tasks.filter(t => t.project === currentProject).forEach(t => {
        const card = document.createElement('div');
        card.className = "task-card";
        
        let btns = "";
        if (t.status === 'todo') btns = `<button onclick="moveTask(${t.id}, 'doing')">➡️</button>`;
        else if (t.status === 'doing') btns = `<button onclick="moveTask(${t.id}, 'todo')">⬅️</button> <button onclick="moveTask(${t.id}, 'done')">✅</button>`;
        else if (t.status === 'done') btns = `<button onclick="moveTask(${t.id}, 'doing')">⬅️</button>`;

        card.innerHTML = `<span>${t.title}</span><div class="task-actions">${btns}<button onclick="deleteTask(${t.id})">🗑️</button></div>`;
        containers[t.status].appendChild(card);
    });
}

// --- MOBILE ---
window.switchCol = (id) => {
    document.querySelectorAll('.column').forEach(c => c.classList.remove('active'));
    document.getElementById('col-' + id).classList.add('active');
    document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + id).classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.innerWidth <= 768) switchCol('todo');
});