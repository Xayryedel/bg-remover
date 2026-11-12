// Импортируем библиотеку удаления фона
import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";

// Импортируем Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

// Твой конфиг Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDSWaq-t5lJVxlh-PtXiRyo6GZOA_uzhg8",
  authDomain: "photolab-ef572.firebaseapp.com",
  projectId: "photolab-ef572",
  storageBucket: "photolab-ef572.firebasestorage.app",
  messagingSenderId: "168894868190",
  appId: "1:168894868190:web:0fc6e560aad5aec3afb04f"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    // === АВТОРИЗАЦИЯ ===
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => {
            console.error("Ошибка входа:", error);
            alert("Не удалось войти. Проверьте настройки домена в Firebase.");
        });
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginBtn.style.display = 'none';
            userProfile.style.display = 'flex';
            userName.textContent = user.displayName ? user.displayName.split(' ')[0] : 'User';
            userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
        } else {
            loginBtn.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    });


    // === ЛОГИКА РЕДАКТОРА ===
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const emptyState = document.getElementById('emptyState');
    const tools = document.getElementById('tools');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loaderText');
    
    const removeBgBtn = document.getElementById('removeBgBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let originalImage = null;
    let currentFile = null;

    const brightness = document.getElementById('brightness');
    const contrast = document.getElementById('contrast');
    const saturate = document.getElementById('saturate');
    const blur = document.getElementById('blur');
    
    const valBrightness = document.getElementById('valBrightness');
    const valContrast = document.getElementById('valContrast');
    const valSaturate = document.getElementById('valSaturate');
    const valBlur = document.getElementById('valBlur');

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFile = file;

        const reader = new FileReader();
        reader.onload = (event) => loadImage(event.target.result);
        reader.readAsDataURL(file);
    });

    function loadImage(src) {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            canvas.width = img.width;
            canvas.height = img.height;
            
            canvas.style.display = 'block';
            emptyState.style.display = 'none';
            tools.style.display = 'block';
            
            resetFilters();
            applyFilters();
        };
        img.src = src;
    }

    function applyFilters() {
        if (!originalImage) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const b = brightness.value;
        const c = contrast.value;
        const s = saturate.value;
        const bl = blur.value;
        
        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${bl}px)`;
        ctx.drawImage(originalImage, 0, 0);
        
        valBrightness.textContent = b + '%';
        valContrast.textContent = c + '%';
        valSaturate.textContent = s + '%';
        valBlur.textContent = bl + 'px';
    }

    [brightness, contrast, saturate, blur].forEach(el => el.addEventListener('input', applyFilters));

    function resetFilters() {
        brightness.value = 100;
        contrast.value = 100;
        saturate.value = 100;
        blur.value = 0;
    }

    resetBtn.addEventListener('click', () => {
        resetFilters();
        if (originalImage) loadImage(originalImage.src);
    });

    removeBgBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        loader.classList.add('active');
        loaderText.textContent = 'Нейросеть загружается (первый раз ~40МБ)...';

        try {
            const blob = await removeBackground(currentFile, {
                model: "isnet_quint8", 
                device: "cpu",         
                output: { format: "image/png" }
            });

            loaderText.textContent = 'Применяем результат...';
            const url = URL.createObjectURL(blob);
            
            const newImg = new Image();
            newImg.onload = () => {
                originalImage = newImg;
                canvas.width = newImg.width;
                canvas.height = newImg.height;
                
                resetFilters();
                applyFilters();
                loader.classList.remove('active');
            };
            newImg.src = url;

        } catch (error) {
            console.error("Ошибка удаления фона:", error);
            alert('Ошибка: ' + error.message + '\n\nПопробуйте отключить блокировщик рекламы или использовать другое фото.');
            loader.classList.remove('active');
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!originalImage) return;
        const link = document.createElement('a');
        link.download = 'photolab-ai-result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
