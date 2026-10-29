document.addEventListener('DOMContentLoaded', () => {
  const ecgUpload = document.getElementById('ecgUpload');
  const uploadedImage = document.getElementById('uploadedImage');
  const emptyState = document.getElementById('emptyState');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sampleCards = document.querySelectorAll('.sample-card');

  const summaryTitle = document.getElementById('summaryTitle');
  const riskPill = document.getElementById('riskPill');
  const heartRate = document.getElementById('heartRate');
  const qrsValue = document.getElementById('qrsValue');
  const prValue = document.getElementById('prValue');
  const qtValue = document.getElementById('qtValue');
  const findingsList = document.getElementById('findingsList');
  const reportContent = document.getElementById('reportContent');
  const reportDate = document.getElementById('reportDate');
  const waveCanvas = document.getElementById('waveCanvas');
  const ctx = waveCanvas.getContext('2d');

  let currentScenario = null;

  const scenarios = {
    normal: {
      title: "Normal Sinüs Ritmi",
      risk: "Normal",
      riskClass: "success",
      hr: "72 bpm",
      qrs: "88 ms",
      pr: "160 ms",
      qt: "380 ms",
      findings: [
        "Normal sinüs ritmi ve aksı gözlendi.",
        "ST segmentlerinde patolojik elevasyon/depresyon saptanmadı.",
        "P ve T dalga morfolojileri fizyolojik sınırda."
      ],
      report: "Hasta bulguları hemodinamik olarak stabil ve normal sinüs ritmindedir. Acil klinik müdahale gerektiren herhangi bir bulguya rastlanmamıştır."
    },
    af: {
      title: "Atriyal Fibrilasyon (AF)",
      risk: "Risk",
      riskClass: "warning",
      hr: "118 bpm",
      qrs: "92 ms",
      pr: "Yok (P yok)",
      qt: "410 ms",
      findings: [
        "P dalgaları izlenmiyor, düzensiz fibrilasyon dalgaları mevcut.",
        "RR aralıkları tamamen düzensiz (takyarritmik seyir).",
        "Ventrikül hızı 100 bpm üzerinde ölçüldü."
      ],
      report: "Hastada atriyal fibrilasyon ve hızlı ventriküler yanıt saptanmıştır. Ritim kontrolü ve antikoagülan değerlendirmesi önerilir."
    },
    inferiorMi: {
      title: "Akut Inferior MI (STEMI)",
      risk: "Kritik",
      riskClass: "danger",
      hr: "84 bpm",
      qrs: "104 ms",
      pr: "150 ms",
      qt: "440 ms",
      findings: [
        "DII, DIII ve aVF derivasyonlarında belirgin ST elevasyonu.",
        "DI ve aVL'de karşılıklı (reciprocal) ST depresyonu.",
        "Akut koroner sendrom / inferior duvar enfarktüsü uyumlu."
      ],
      report: "ACİL: Hastada akut inferior STEMI bulguları mevcuttur. Acilen kardiyoloji konsültasyonu ve primer KAG/reperfüzyon protokolü başlatılmalıdır."
    },
    nstemi: {
      title: "NSTEMI / ST Depresyonu",
      risk: "Kritik",
      riskClass: "danger",
      hr: "90 bpm",
      qrs: "96 ms",
      pr: "155 ms",
      qt: "420 ms",
      findings: [
        "Göğüs derivasyonlarında yaygın yatay/inici ST depresyonları.",
        "T dalgası inversiyonları eşlik ediyor.",
        "Miyokardiyal iskemi bulgusu."
      ],
      report: "NSTEMI şüphesi ile yakın takip gerektirir. Seri enzim takibi ve antikoagülan tedavi planlanmalıdır."
    },
    vt: {
      title: "Ventriküler Taşikardi (VT)",
      risk: "Kritik",
      riskClass: "danger",
      hr: "165 bpm",
      qrs: "160 ms",
      pr: "Ayrıştırılamaz",
      qt: "500 ms",
      findings: [
        "Geniş QRS kompleksli ritim (>120 ms).",
        "Atriyoventriküler disosiyasyon bulguları.",
        "Hemodinamiyi tehdit edici taşiarritmi."
      ],
      report: "ACİL KRİTİK DURUM: Geniş QRS taşikardi / VT tablosu. Hayati bulgular kontrol edilmeli, hemodinamik stabiliteye göre müdahale edilmelidir."
    },
    brady: {
      title: "Sinüs Bradikardisi",
      risk: "Risk",
      riskClass: "warning",
      hr: "48 bpm",
      qrs: "90 ms",
      pr: "170 ms",
      qt: "430 ms",
      findings: [
        "Kalp hızı 60 bpm altında.",
        "P dalgaları normal morfolojide ve her QRS'e eşlik ediyor.",
        "İleti zamanları normal aralıkta."
      ],
      report: "Semptomatik bradikardi varlığında atropin veya pacemaker ihtiyacı açısından hasta monitörize edilmelidir."
    }
  };

  function drawWave(type) {
    ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let step = 3;
    let heightFactor = type === 'vt' ? 40 : (type === 'inferiorMi' ? 30 : 20);

    for (let x = 0; x < waveCanvas.width; x += step) {
      let y = waveCanvas.height / 2;
      let mod = (x % 100);

      if (mod > 40 && mod < 48) {
        y -= heightFactor * 1.5; // R peak
      } else if (mod >= 48 && mod < 56) {
        y += heightFactor; // S wave
      } else if (mod > 20 && mod < 30) {
        y -= 8; // P wave
      }

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawWave('normal');
  reportDate.textContent = new Date().toLocaleDateString('tr-TR');

  ecgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImage.src = event.target.result;
        uploadedImage.hidden = false;
        emptyState.hidden = true;
        currentScenario = 'normal';
      };
      reader.readAsDataURL(file);
    }
  });

  sampleCards.forEach(card => {
    card.addEventListener('click', () => {
      const sampleKey = card.getAttribute('data-sample');
      currentScenario = sampleKey;
      
      // Placeholder görsel oluştur
      uploadedImage.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='150'><rect width='100%' height='100%' fill='%23020617'/><text x='50%' y='50%' fill='%2306b6d4' font-size='14' font-family='sans-serif' dominant-baseline='middle' text-anchor='middle'>" + encodeURIComponent(scenarios[sampleKey].title) + "</text></svg>";
      uploadedImage.hidden = false;
      emptyState.hidden = true;

      drawWave(sampleKey);
    });
  });

  analyzeBtn.addEventListener('click', () => {
    if (!currentScenario) {
      alert('Lütfen önce bir ECG görseli yükleyin veya örnek senaryo seçin.');
      return;
    }

    const data = scenarios[currentScenario];
    summaryTitle.textContent = data.title;
    riskPill.textContent = data.risk;
    riskPill.style.color = data.riskClass === 'danger' ? 'var(--danger)' : (data.riskClass === 'warning' ? 'var(--warning)' : 'var(--success)');
    riskPill.style.borderColor = riskPill.style.color;

    heartRate.textContent = data.hr;
    qrsValue.textContent = data.qrs;
    prValue.textContent = data.pr;
    qtValue.textContent = data.qt;

    findingsList.innerHTML = '';
    data.findings.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      findingsList.appendChild(li);
    });

    reportContent.textContent = data.report;
  });

  resetBtn.addEventListener('click', () => {
    currentScenario = null;
    uploadedImage.hidden = true;
    emptyState.hidden = false;
    ecgUpload.value = '';
    summaryTitle.textContent = "Analiz bekleniyor";
    riskPill.textContent = "-";
    riskPill.style.color = "var(--text-muted)";
    riskPill.style.borderColor = "var(--border-color)";
    heartRate.textContent = "-- bpm";
    qrsValue.textContent = "-- ms";
    prValue.textContent = "-- ms";
    qtValue.textContent = "-- ms";
    findingsList.innerHTML = "<li>Yüklenen görsel için analiz bekleniyor.</li>";
    reportContent.textContent = "Analiz yapılmadı.";
    drawWave('normal');
  });
});
