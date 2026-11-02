/* =========================================================
   WEDDING INVITATION INTERACTIVE SCRIPT
   - Falling Petals Canvas (60fps physics)
   - Auto-play Orchestral Music with smart mute memory
   - Simulated Open Envelope with Pop-out cards (image-8)
   - Scroll Unlocking & Live Countdown Timer
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     1. PETALS PARTICLE SYSTEM (Canvas 60fps Physics)
     ========================================================= */
  const canvas = document.getElementById('petals-canvas');
  const ctx = canvas.getContext('2d');

  // Petal image assets
  const petalSrcs = [
    'assets/petals/petal1.png?v=1',
    'assets/petals/petal2.png?v=1',
    'assets/petals/petal3.png?v=1',
    'assets/petals/petal4.png?v=1'
  ];
  const petalImages = [];
  let loadedPetals = 0;

  petalSrcs.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedPetals++;
      if (loadedPetals === petalSrcs.length) {
        initPetals();
      }
    };
    petalImages.push(img);
  });

  let width = 0;
  let height = 0;
  let particles = [];
  const NUM_PETALS = 36;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Mouse & Scroll wind interaction
  let mouseSpeedX = 0;
  let lastMouseX = width / 2;
  let scrollBoost = 0;

  window.addEventListener('mousemove', (e) => {
    mouseSpeedX = (e.clientX - lastMouseX) * 0.12;
    lastMouseX = e.clientX;
  });

  class Petal {
    constructor(initialScatter = true) {
      this.reset(initialScatter);
    }

    reset(initialScatter = false) {
      this.img = petalImages[Math.floor(Math.random() * petalImages.length)];
      this.baseWidth = 20 + Math.random() * 24;
      this.aspectRatio = (this.img && this.img.width && this.img.height) ? (this.img.height / this.img.width) : 0.8;
      
      this.x = Math.random() * (width + 100) - 50;
      this.y = initialScatter ? (Math.random() * (height + 100) - 50) : (-50 - Math.random() * 80);
      
      this.speedY = 1.1 + Math.random() * 1.5;
      this.swayAngle = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.016 + Math.random() * 0.02;
      this.swayAmp = 1.2 + Math.random() * 2.0;
      
      this.rot = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.025;
      
      this.flipAngle = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.02 + Math.random() * 0.035;

      this.depth = Math.random();
      this.scale = 0.65 + this.depth * 0.55;
      this.opacity = 0.6 + this.depth * 0.38;
    }

    update(time) {
      const globalBreeze = Math.sin(time * 0.0006) * 0.7 + 0.2;
      this.swayAngle += this.swaySpeed;
      const swayX = Math.sin(this.swayAngle) * this.swayAmp;

      // Scroll speed adds dynamic flutter to petals
      this.x += swayX + globalBreeze + mouseSpeedX * 0.2 + (Math.sin(this.rot) * scrollBoost * 0.3);
      this.y += this.speedY * this.scale + scrollBoost * 0.45;

      this.rot += this.rotSpeed + scrollBoost * 0.008;
      this.flipAngle += this.flipSpeed + scrollBoost * 0.01;

      if (this.y > height + 60 || this.x < -100 || this.x > width + 100) {
        this.reset(false);
      }
    }

    draw() {
      if (!this.img || !this.img.complete) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);

      const currentScaleY = Math.cos(this.flipAngle);
      ctx.scale(this.scale, this.scale * currentScaleY);
      ctx.globalAlpha = this.opacity;

      const w = this.baseWidth;
      const h = w * this.aspectRatio;
      ctx.drawImage(this.img, -w / 2, -h / 2, w, h);

      ctx.restore();
    }
  }

  function initPetals() {
    particles = [];
    for (let i = 0; i < NUM_PETALS; i++) {
      particles.push(new Petal(true));
    }
    requestAnimationFrame(animatePetals);
  }

  function animatePetals(time) {
    ctx.clearRect(0, 0, width, height);
    mouseSpeedX *= 0.94;
    scrollBoost *= 0.92; // Smooth wind decay

    for (let p of particles) {
      p.update(time);
      p.draw();
    }
    requestAnimationFrame(animatePetals);
  }


  /* =========================================================
     2. SMART AUTOPLAY MUSIC (Indila - Love Story Orchestra)
     - تبدأ تلقائياً فور فتح الموقع
     - إذا كتمها المستخدم يدوياً تظل مكتومة ولا تعود للعمل إلا بفتحه لها
     ========================================================= */
  const bgMusic = document.getElementById('wedding-music');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const toast = document.getElementById('toast');

  let isPlaying = false;
  let userManuallyMuted = false;

  if (bgMusic) {
    bgMusic.volume = 0.75;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function playMusicNow() {
    if (!bgMusic || userManuallyMuted || isPlaying) return;
    bgMusic.play().then(() => {
      isPlaying = true;
      if (audioIcon) audioIcon.textContent = '🎵';
      if (audioToggle) audioToggle.classList.add('playing');
    }).catch(() => {
      // Browser blocked unmuted sound without interaction:
      // Listen to ANY gesture anywhere on screen
      const unlockOnAnyGesture = () => {
        if (!userManuallyMuted && !isPlaying && bgMusic) {
          bgMusic.play().then(() => {
            isPlaying = true;
            if (audioIcon) audioIcon.textContent = '🎵';
            if (audioToggle) audioToggle.classList.add('playing');
          }).catch(() => {});
        }
      };
      const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'scroll', 'wheel', 'mousemove'];
      events.forEach((evt) => {
        window.addEventListener(evt, unlockOnAnyGesture, { once: true, passive: true });
      });
    });
  }

  // Attempt autoplay immediately and at micro-intervals to beat browser policy
  playMusicNow();
  setTimeout(playMusicNow, 150);
  setTimeout(playMusicNow, 600);
  setTimeout(playMusicNow, 1200);

  if (audioToggle) {
    audioToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!bgMusic) return;

      if (isPlaying) {
        // User manually mutes:
        bgMusic.pause();
        isPlaying = false;
        userManuallyMuted = true; // علامة الكتم اليدوي: لا تعمل ثانية تلقائياً
        audioIcon.textContent = '🔇';
        audioToggle.classList.remove('playing');
        showToast('تم كتم الموسيقى 🔇');
      } else {
        // User manually unmutes:
        userManuallyMuted = false;
        bgMusic.play().then(() => {
          isPlaying = true;
          audioIcon.textContent = '🎵';
          audioToggle.classList.add('playing');
          showToast('🎶 Indila - Love Story (Orchestra)');
        }).catch(() => {});
      }
    });
  }


  /* =========================================================
     3. ENVELOPE OPENING SIMULATION (الانتقال السينمائي لفك الختم)
     - ينكسر الختم بهالة ذهبية متوهجة
     - تنبثق صور البولارويد والبجعة وشارة Save Our Date
     - يتفعل السكرول للأسفل
     ========================================================= */
  const closedView = document.getElementById('closed-envelope-view');
  const openedView = document.getElementById('opened-envelope-view');
  const envelope = document.getElementById('envelope');
  const waxStamp = document.getElementById('wax-stamp');
  const openBtn = document.getElementById('open-btn');
  const detailsSection = document.getElementById('details-section');
  const scrollCta = document.getElementById('scroll-cta');
  const replayBtn = document.getElementById('replay-btn');

  let isOpened = false;

  function openEnvelopeScene() {
    if (isOpened) return;
    isOpened = true;

    // Start music immediately if not manually muted
    playMusicNow();

    // Step 1: Trigger dramatic wax unsealing & golden tremble
    closedView.classList.add('unsealing');

    // Step 2: Smooth cinematic transition to opened cards view
    setTimeout(() => {
      closedView.classList.add('hide');
      openedView.classList.add('active');

      // Reveal scrollable details section & enable smooth scrolling
      if (detailsSection) {
        detailsSection.classList.add('active');
      }
      document.documentElement.classList.add('scroll-enabled');
      document.body.classList.add('scroll-enabled');

      showToast('✨ زفاف محمد & نرجس - 26 يوليو 2027 ✨');

      // Start live countdown
      startCountdown();
    }, 550);
  }

  if (waxStamp) waxStamp.addEventListener('click', openEnvelopeScene);
  if (envelope) envelope.addEventListener('click', openEnvelopeScene);
  if (openBtn) openBtn.addEventListener('click', openEnvelopeScene);

  // Scroll down CTA button
  if (scrollCta) {
    scrollCta.addEventListener('click', () => {
      detailsSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Replay Button (Resets back to closed envelope)
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      isOpened = false;
      openedView.classList.remove('active');
      closedView.classList.remove('hide');
      closedView.classList.remove('unsealing');
      document.documentElement.classList.remove('scroll-enabled');
      document.body.classList.remove('scroll-enabled');
      showToast('تمت إعادة مشهد افتتاحية الزرف ✨');
    });
  }


  /* =========================================================
     4. LIVE COUNTDOWN TIMER (26 July 2027)
     ========================================================= */
  const targetDate = new Date('2027-07-26T18:00:00').getTime();
  let countdownInterval = null;

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById('cd-days').textContent = '0';
      document.getElementById('cd-hours').textContent = '0';
      document.getElementById('cd-minutes').textContent = '0';
      document.getElementById('cd-seconds').textContent = '0';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMin = document.getElementById('cd-minutes');
    const elSec = document.getElementById('cd-seconds');

    if (elDays) elDays.textContent = days;
    if (elHours) elHours.textContent = hours;
    if (elMin) elMin.textContent = minutes;
    if (elSec) elSec.textContent = seconds;
  }

  function startCountdown() {
    updateCountdown();
    if (!countdownInterval) {
      countdownInterval = setInterval(updateCountdown, 1000);
    }
  }


  /* =========================================================
     5. CREATIVE SCROLL REVEAL & PARALLAX ENGINE
     ========================================================= */
  const scrollProgressBar = document.getElementById('scroll-progress');
  const glassCards = document.querySelectorAll('.glass-card');
  const heroScene = document.getElementById('hero-scene');
  const sceneBg = document.getElementById('scene-bg');

  let lastScrollY = window.scrollY;

  // IntersectionObserver for 3D spring reveal of cards
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('scrolled-in');
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -40px 0px'
  });

  glassCards.forEach((card) => {
    cardObserver.observe(card);

    // Creative 3D Interactive Parallax on Mouse Move
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / (rect.height / 2)) * 6;
      const rotY = (x / (rect.width / 2)) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.018, 1.018, 1.018)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Window scroll handler for parallax & progress
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // 1. Scroll Progress Bar
    if (scrollProgressBar && maxScroll > 0) {
      const pct = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
      scrollProgressBar.style.width = pct + '%';
    }

    // 2. Petal flutter wind boost proportional to scroll velocity
    const deltaY = Math.abs(scrollY - lastScrollY);
    scrollBoost = Math.min(18, scrollBoost + deltaY * 0.18);
    lastScrollY = scrollY;

    // Background remains strictly fixed and anchored (No scroll parallax movement)
  }, { passive: true });

});
