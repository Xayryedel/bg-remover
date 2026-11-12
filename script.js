document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const emptyState = document.getElementById('emptyState');
    const tools = document.getElementById('tools');
    
    const removeBgBtn = document.getElementById('removeBgBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let originalImage = null;

    // Слайдеры
    const brightness = document.getElementById('brightness');
    const contrast = document.getElementById('contrast');
    const saturate = document.getElementById('saturate');
    const blur = document.getElementById('blur');
    
    const valBrightness = document.getElementById('valBrightness');
    const valContrast = document.getElementById('valContrast');
    const valSaturate = document.getElementById('valSaturate');
    const valBlur = document.getElementById('valBlur');

    // Открытие диалога выбора файла
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 1. Загрузка файла
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            loadImage(event.target.result);
        };
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

    // 2. Применение фильтров
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

    [brightness, contrast, saturate, blur].forEach(el => {
        el.addEventListener('input', applyFilters);
    });

    function resetFilters() {
        brightness.value = 100;
        contrast.value = 100;
        saturate.value = 100;
        blur.value = 0;
    }

    resetBtn.addEventListener('click', () => {
        resetFilters();
        if (originalImage) {
            loadImage(originalImage.src);
        }
    });

    // 3. МЕХАНИЧЕСКОЕ УДАЛЕНИЕ ФОНА
    removeBgBtn.addEventListener('click', () => {
        if (!originalImage) return;

        // Получаем текущие пиксели с холста
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Берем цвет верхнего левого пикселя (0, 0) как эталон фона
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        
        // Погрешность (50 — хороший баланс)
        const tolerance = 50; 

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Разница между текущим пикселем и фоном
            const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
            
            // Если похож на фон — делаем прозрачным
            if (diff < tolerance) {
                data[i + 3] = 0;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    });

    // 4. Скачивание
    downloadBtn.addEventListener('click', () => {
        if (!originalImage) return;
        
        const link = document.createElement('a');
        link.download = 'photolab-edited.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
