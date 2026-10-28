/**
 * Multigo Survey Web Application
 * Handles survey branching flow & automatic Google Sheets synchronization.
 */

// =========================================================================
// 🔗 CẤU HÌNH GOOGLE SHEET WEBHOOK
// Dữ liệu từ người dùng sẽ tự động gửi thẳng vào file Google Sheet của bạn!
// =========================================================================
const DEFAULT_GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzzNGzwLTqxwfo-PR6p73-qJ_-G7zOAb_qXbyycwwzy489CVUeGPRo_MlhL2AuErpl_/exec";

// Application State
const state = {
  currentStep: 1,
  branch: null // 'used' | 'not_used'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initStarRatings();
  initRadioVisualHighlighting();
});

/**
 * Handle Step Navigation
 */
function goToStep(step) {
  state.currentStep = step;

  // Hide all steps & success card
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('survey-success-card').classList.add('hidden');

  if (step === 1) {
    document.getElementById('step-content-1').classList.remove('hidden');
  } else if (step === 2) {
    document.getElementById('step-content-2').classList.remove('hidden');
  } else if (step === 3) {
    // Show Branch A or Branch B depending on screener answer
    if (state.branch === 'used') {
      document.getElementById('step-content-3-branch-a').classList.remove('hidden');
    } else {
      document.getElementById('step-content-3-branch-b').classList.remove('hidden');
    }
  } else if (step === 4) {
    populateSummaryStep();
    document.getElementById('step-content-4').classList.remove('hidden');
  }

  updateProgressTracker(step);
  window.scrollTo({ top: 180, behavior: 'smooth' });
}

/**
 * Validation before proceeding to next step
 */
function validateAndGoToStep(targetStep) {
  if (targetStep === 2) {
    // Validate Step 1
    const occupation = document.querySelector('input[name="occupation"]:checked');
    const ageGroup = document.querySelector('input[name="age_group"]:checked');
    const transitHabit = document.querySelector('input[name="transit_habit"]:checked');

    if (!occupation) {
      alert('Vui lòng chọn thông tin: Bạn hiện đang là? (Học sinh, Sinh viên, Nhân viên...)');
      return;
    }
    if (!ageGroup) {
      alert('Vui lòng chọn Nhóm độ tuổi của bạn');
      return;
    }
    if (!transitHabit) {
      alert('Vui lòng chọn Thói quen sử dụng phương tiện công cộng của bạn');
      return;
    }

    goToStep(2);
  } else if (targetStep === 3) {
    // Validate Step 2: Screener
    if (!state.branch) {
      alert('Vui lòng chọn 1 trong 2 lựa chọn: Bạn ĐÃ TỪNG hay CHƯA TỪNG tải/dùng Multigo?');
      return;
    }
    goToStep(3);
  } else if (targetStep === 4) {
    // Validate Step 3
    if (state.branch === 'used') {
      const openFreq = document.querySelector('input[name="a_open_frequency"]:checked');
      if (!openFreq) {
        alert('Vui lòng chọn tần suất mở ứng dụng Multigo của bạn');
        return;
      }
    } else {
      const reasonNotUsed = document.querySelector('input[name="b_reason_not_used"]:checked');
      const incentive = document.querySelector('input[name="b_incentive"]:checked');
      if (!reasonNotUsed) {
        alert('Vui lòng chọn lý do chính bạn chưa dùng Multigo');
        return;
      }
      if (!incentive) {
        alert('Vui lòng chọn điều gì sẽ thuyết phục bạn tải Multigo');
        return;
      }
    }
    goToStep(4);
  }
}

/**
 * Select Screener Branch Option
 */
function selectScreenerOption(branchType) {
  state.branch = branchType;

  const cardUsed = document.getElementById('card-branch-used');
  const cardNotUsed = document.getElementById('card-branch-not-used');
  const radioYes = document.getElementById('radio-used-yes');
  const radioNo = document.getElementById('radio-used-no');
  const hintText = document.getElementById('branch-hint-text');

  if (branchType === 'used') {
    radioYes.checked = true;
    radioNo.checked = false;
    cardUsed.classList.add('active-branch-used');
    cardNotUsed.classList.remove('active-branch-not-used');

    hintText.innerHTML = '<i class="fa-solid fa-check text-brand-600 mr-1.5"></i> Bạn đã chọn: <strong>ĐÃ TỪNG DÙNG</strong>. Hệ thống sẽ chuyển tiếp đến bảng đánh giá trải nghiệm thực tế & báo lỗi ứng dụng.';
    hintText.classList.remove('hidden');
  } else {
    radioNo.checked = true;
    radioYes.checked = false;
    cardNotUsed.classList.add('active-branch-not-used');
    cardUsed.classList.remove('active-branch-used');

    hintText.innerHTML = '<i class="fa-solid fa-compass text-cyan-600 mr-1.5"></i> Bạn đã chọn: <strong>CHƯA TỪNG DÙNG</strong>. Hệ thống sẽ chuyển tiếp đến bảng câu hỏi khảo sát nhu cầu thị trường & tính năng mong đợi.';
    hintText.classList.remove('hidden');
  }
}

/**
 * Update Progress Bar and Dots
 */
function updateProgressTracker(step) {
  const percentMap = { 1: 25, 2: 50, 3: 75, 4: 100 };
  const badgeMap = {
    1: 'Bước 1 / 4: Thông tin cơ bản',
    2: 'Bước 2 / 4: Câu hỏi lọc phân nhánh',
    3: state.branch === 'used' ? 'Bước 3 / 4: Đánh giá chi tiết (Nhánh A)' : 'Bước 3 / 4: Nhu cầu & Kỳ vọng (Nhánh B)',
    4: 'Bước 4 / 4: Xác nhận & Gửi phản hồi'
  };

  const pct = percentMap[step] || 25;
  document.getElementById('progress-bar-fill').style.width = pct + '%';
  document.getElementById('progress-percent').innerText = pct + '% Hoàn thành';
  document.getElementById('step-badge').innerText = badgeMap[step] || '';

  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    if (!dot) continue;
    dot.classList.remove('active', 'completed');
    if (i < step) {
      dot.classList.add('completed');
    } else if (i === step) {
      dot.classList.add('active');
    }
  }
}

/**
 * Radio & Checkbox Card Selection Visuals
 */
function initRadioVisualHighlighting() {
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const name = radio.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        const card = r.closest('.choice-card');
        if (card) {
          card.classList.toggle('selected-radio', r.checked);
        }
      });
    });
  });
}

/**
 * Star Rating Interactive Widget
 */
function initStarRatings() {
  document.querySelectorAll('.star-rating').forEach(container => {
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const stars = container.querySelectorAll('.star-btn');
    const initialVal = parseInt(hiddenInput?.value || '4', 10);

    const updateStars = (val) => {
      stars.forEach(btn => {
        const btnVal = parseInt(btn.getAttribute('data-value'), 10);
        btn.classList.toggle('active', btnVal <= val);
      });
      if (hiddenInput) hiddenInput.value = val;
    };

    updateStars(initialVal);

    stars.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-value'), 10);
        updateStars(val);
      });
    });
  });
}

/**
 * Populate Summary Step before Final Submission
 */
function populateSummaryStep() {
  const fullnameInput = document.getElementById('input-fullname').value.trim();
  const occupation = document.querySelector('input[name="occupation"]:checked')?.value || 'Chưa chọn';
  const ageGroup = document.querySelector('input[name="age_group"]:checked')?.value || 'Chưa chọn';

  document.getElementById('summary-name').innerText = fullnameInput || 'Người dùng ẩn danh';
  document.getElementById('summary-occupation').innerText = occupation;
  document.getElementById('summary-age').innerText = ageGroup;
  document.getElementById('summary-branch').innerText = state.branch === 'used' 
    ? 'Nhánh A (Đã từng dùng Multigo)' 
    : 'Nhánh B (Chưa từng dùng Multigo)';
}

/**
 * Collect Form Data and Submit directly to Google Sheet
 */
async function submitSurvey() {
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang ghi nhận...</span>';

  // Gather general data
  const fullname = document.getElementById('input-fullname').value.trim() || 'Người dùng ẩn danh';
  const occupation = document.querySelector('input[name="occupation"]:checked')?.value || '';
  const ageGroup = document.querySelector('input[name="age_group"]:checked')?.value || '';
  const transitHabit = document.querySelector('input[name="transit_habit"]:checked')?.value || '';

  const id = 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const now = new Date();
  const timestamp = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const record = {
    id: id,
    timestamp: timestamp,
    fullname: fullname,
    occupation: occupation,
    age_group: ageGroup,
    transit_habit: transitHabit,
    has_used_multigo: state.branch === 'used' ? 'Đã dùng' : 'Chưa dùng',
    branch: state.branch
  };

  if (state.branch === 'used') {
    record.a_open_frequency = document.querySelector('input[name="a_open_frequency"]:checked')?.value || '';
    
    // Checked features
    const features = [];
    document.querySelectorAll('input[name="a_features"]:checked').forEach(c => features.push(c.value));
    record.a_features = features.join('; ');

    // Ratings
    record.rating_time_accuracy = document.querySelector('input[name="rating_time_accuracy"]')?.value || '4';
    record.rating_gps_accuracy = document.querySelector('input[name="rating_gps_accuracy"]')?.value || '4';
    record.rating_payment_convenience = document.querySelector('input[name="rating_payment_convenience"]')?.value || '5';
    record.rating_ui_ux = document.querySelector('input[name="rating_ui_ux"]')?.value || '4';

    // Issues
    const issues = [];
    document.querySelectorAll('input[name="a_issues"]:checked').forEach(c => issues.push(c.value));
    record.a_issues = issues.join('; ');

    record.feedback = document.getElementById('textarea-a-feedback')?.value.trim() || '';
  } else {
    record.b_reason_not_used = document.querySelector('input[name="b_reason_not_used"]:checked')?.value || '';
    
    // Concerns
    const concerns = [];
    document.querySelectorAll('input[name="b_concerns"]:checked').forEach(c => concerns.push(c.value));
    record.b_concerns = concerns.join('; ');

    record.b_incentive = document.querySelector('input[name="b_incentive"]:checked')?.value || '';

    // Pain points
    const painPoints = [];
    document.querySelectorAll('input[name="b_pain_points"]:checked').forEach(c => painPoints.push(c.value));
    record.b_pain_points = painPoints.join('; ');

    record.feedback = document.getElementById('textarea-b-wish')?.value.trim() || '';
  }

  // Backup locally
  try {
    const raw = localStorage.getItem('multigo_responses') || '[]';
    const list = JSON.parse(raw);
    list.unshift(record);
    localStorage.setItem('multigo_responses', JSON.stringify(list));
  } catch (e) {}

  // Send to Google Sheet Webhook immediately
  const webhookUrl = DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(record)
      });
      console.log('✅ Đã gửi dữ liệu về Google Sheet:', record.id);
    } catch (e) {
      console.warn('Gửi webhook thất bại:', e);
    }
  }

  // Show Success Screen
  document.getElementById('step-content-4').classList.add('hidden');
  const successCard = document.getElementById('survey-success-card');
  successCard.classList.remove('hidden');
  document.getElementById('success-survey-id').innerText = id;
  document.getElementById('success-timestamp').innerText = timestamp;

  // Trigger Confetti Celebration!
  triggerConfetti();

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Gửi Khảo Sát Ngay</span>';
  window.scrollTo({ top: 150, behavior: 'smooth' });
}

/**
 * Reset survey for a new submission
 */
function resetSurveyForm() {
  document.getElementById('multigo-survey-form').reset();
  state.branch = null;
  state.currentStep = 1;

  document.querySelectorAll('.screener-card').forEach(c => {
    c.classList.remove('active-branch-used', 'active-branch-not-used');
  });
  document.getElementById('branch-hint-text').classList.add('hidden');

  initStarRatings();
  goToStep(1);
}

/**
 * Trigger celebration fireworks
 */
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
}
