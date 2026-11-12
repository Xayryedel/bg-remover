document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const fileInput = document.getElementById('fileInput');
  const emptyState = document.getElementById('emptyState');
  const tools = document.getElementById('tools');
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loaderText');
  const removeBgBtn = document.getElementById('removeBgBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');

  let originalImage = null;
  let currentImageSrc = null;

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
      currentImageSrc = event.target.result;
      loadImage(currentImageSrc);
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
      
      // Сброс фильтров при новой загрузке
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
    
    // Применяем CSS-фильтры к контексту
    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${bl}px)`;
    
    // Если у картинки прозрачный фон (после удаления), он сохранится
    ctx.drawImage(originalImage, 0, 0);
    
    // Обновляем текст
    valBrightness.textContent = b + '%';
    valContrast.textContent = c + '%';
    valSaturate.textContent = s + '%';
    valBlur.textContent = bl + 'px';
  }

  // Слушатели ползунков
  [brightness, contrast, saturate, blur].forEach(el => {
    el.addEventListener('input', applyFilters);
  });

  // 3. Сброс
  function resetFilters() {
    brightness.value = 100;
    contrast.value = 100;
    saturate.value = 100;
    blur.value = 0;
  }

  resetBtn.addEventListener('click', () => {
    resetFilters();
    applyFilters();
  });

  // 4. Удаление фона (IMG.LY)
  removeBgBtn.addEventListener('click', async () => {
    if (!currentImageSrc) return;

    loader.classList.add('active');
    loaderText.textContent = 'Нейросеть загружается (первый раз может быть долго)...';
    
    try {
      // Вызов функции из библиотеки
      const blob = await imglyRemoveBackground(currentImageSrc);
      
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
        
        // Сохраняем новый src, чтобы можно было удалить фон повторно (если нужно)
        currentImageSrc = url;
      };
      newImg.src = url;
      
    } catch (error) {
      console.error(error);
      alert('Ошибка удаления фона. Проверьте интернет или попробуйте другое фото.');
      loader.classList.remove('active');
    }
  });

  // 5. Скачивание
  downloadBtn.addEventListener('click', () => {
    if (!originalImage) return;
    
    // Экспортируем именно то, что видим на холсте (с учетом фильтров)
    const link = document.createElement('a');
    link.download = 'photolab-edited.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});