// Импортируем библиотеку напрямую с CDN
import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";

document.addEventListener('DOMContentLoaded', () => {
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
    let currentFile = null; // Храним исходный файл для нейросети

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

    // УДАЛЕНИЕ ФОНА ЧЕРЕЗ НЕЙРОСЕТЬ
    removeBgBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        loader.classList.add('active');
        loaderText.textContent = 'Нейросеть загружается (первый раз ~40МБ)...';

        try {
            // Вызываем функцию removeBackground из импортированной библиотеки
            const blob = await removeBackground(currentFile, {
                model: "isnet_quint8", // Легкая модель (~40МБ), чтобы быстрее скачалась
                device: "cpu",         // Принудительно CPU для стабильности на GitHub Pages
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
