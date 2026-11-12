document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const fileInput = document.getElementById('fileInput');
  const emptyState = document.getElementById('emptyState');
  const tools = document.getElementById('tools');
  
  const removeBgBtn = document.getElementById('removeBgBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');

  let originalImage = null;
  let originalImageData = null; // Храним исходные данные пикселей

  // Слайдеры
  const brightness = document.getElementById('brightness');
  const contrast = document.getElementById('contrast');
  const saturate = document.getElementById('saturate');
  const blur = document.getElementById('blur');
  
  const valBrightness = document.getElementById('valBrightness');
  const valContrast = document.getElementById('valContrast');
  const valSaturate = document.getElementById('valSaturate');
  const valBlur = document.getElementById('valBlur');

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
      
      // Сохраняем исходное состояние пикселей (без фильтров)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      ctx.drawImage(img, 0, 0);
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
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
    // Восстанавливаем исходное изображение (возвращаем фон, если он был удален)
    if (originalImage) {
        loadImage(originalImage.src);
    }
  });

  // 3. МЕХАНИЧЕСКОЕ УДАЛЕНИЕ ФОНА
  removeBgBtn.addEventListener('click', () => {
    if (!originalImageData) return;

    // Получаем текущие пиксели с холста (с учетом фильтров, если они применены)
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = currentData.data;
    
    // Берем цвет верхнего левого пикселя (0, 0) как эталон фона
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    
    // Насколько сильно цвет пикселя должен отличаться от фона, чтобы считаться объектом.
    // 50 — хороший баланс. Если фон удаляется плохо — уменьши, если удаляет лишнее — увеличь.
    const tolerance = 50; 

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Вычисляем разницу между текущим пикселем и цветом фона
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      
      // Если цвет похож на фон — делаем пиксель прозрачным
      if (diff < tolerance) {
        data[i + 3] = 0; // Alpha = 0 (прозрачность)
      }
    }
    
    // Применяем измененные данные обратно на холст
    ctx.putImageData(currentData, 0, 0);
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
