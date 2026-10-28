/**
 * Multigo Survey Web Application
 * Handles survey branching flow, local data persistence, analytics dashboard & CSV export.
 */

// =========================================================================
// 🔗 CẤU HÌNH GOOGLE SHEET WEBHOOK CỦA BẠN TẠI ĐÂY
// Dán link Web App URL (Google Apps Script) của bạn vào giữa 2 dấu nháy:
// Ví dụ: const DEFAULT_GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/.../exec";
// Khi cấu hình ở đây, BẤT KỲ AI vào link web làm khảo sát cũng sẽ tự động gửi về Google Sheet của bạn!
// =========================================================================
const DEFAULT_GOOGLE_SHEET_WEBHOOK = "";

// Application State
const state = {
  currentStep: 1,
  branch: null, // 'used' | 'not_used'
  surveyData: {},
  responses: [],
  charts: {
    branchRatio: null,
    reasons: null
  }
};

// LocalStorage Keys
const STORAGE_KEY_RESPONSES = 'multigo_survey_responses_v1';
const STORAGE_KEY_WEBHOOK = 'multigo_survey_webhook_url';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadResponsesFromStorage();
  initStarRatings();
  initRadioVisualHighlighting();
  updateNavigationCount();
  initWebhookSetting();

  // If there are no responses initially, populate with 3 realistic entries so dashboard isn't completely empty
  if (state.responses.length === 0) {
    seedInitialDemoData();
  }
});

/**
 * Switch between Survey Form and Analytics Dashboard
 */
function switchView(viewName) {
  const surveyView = document.getElementById('survey-view');
  const dashboardView = document.getElementById('dashboard-view');
  const navSurveyBtn = document.getElementById('nav-survey-btn');
  const navDashboardBtn = document.getElementById('nav-dashboard-btn');

  if (viewName === 'survey') {
    surveyView.classList.remove('hidden');
    dashboardView.classList.add('hidden');

    navSurveyBtn.className = 'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-brand-600 text-white shadow-sm shadow-brand-600/30';
    navDashboardBtn.className = 'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200';
  } else {
    surveyView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    navDashboardBtn.className = 'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-brand-600 text-white shadow-sm shadow-brand-600/30';
    navSurveyBtn.className = 'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200';

    renderDashboard();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
 * Radio & Checkbox Card Selection Polish
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
 * Collect Form Data and Submit
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

  // Save to LocalStorage
  state.responses.unshift(record);
  saveResponsesToStorage();
  updateNavigationCount();

  // Send to Webhook URL if configured
  const webhookUrl = DEFAULT_GOOGLE_SHEET_WEBHOOK || localStorage.getItem(STORAGE_KEY_WEBHOOK);
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (e) {
      console.warn('Webhook dispatch failed:', e);
    }
  }

  // Show Success Screen
  document.getElementById('step-content-4').classList.add('hidden');
  const successCard = document.getElementById('survey-success-card');
  successCard.classList.remove('hidden');
  document.getElementById('success-survey-id').innerText = id;
  document.getElementById('success-timestamp').innerText = timestamp;

  // Trigger Confetti!
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

/**
 * Storage helpers
 */
function saveResponsesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(state.responses));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function loadResponsesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESPONSES);
    if (raw) {
      state.responses = JSON.parse(raw);
    }
  } catch (e) {
    state.responses = [];
  }
}

function updateNavigationCount() {
  const el = document.getElementById('nav-response-count');
  if (el) el.innerText = state.responses.length;
}

/**
 * ========================================================
 * DASHBOARD & ANALYTICS RENDERING
 * ========================================================
 */
function renderDashboard() {
  const total = state.responses.length;
  const usedCount = state.responses.filter(r => r.branch === 'used').length;
  const notUsedCount = state.responses.filter(r => r.branch === 'not_used').length;

  // Update Metrics
  document.getElementById('metric-total').innerText = total;
  document.getElementById('metric-used').innerText = usedCount;
  document.getElementById('metric-not-used').innerText = notUsedCount;

  const usedPct = total > 0 ? Math.round((usedCount / total) * 100) : 0;
  const notUsedPct = total > 0 ? Math.round((notUsedCount / total) * 100) : 0;
  document.getElementById('metric-used-pct').innerText = `${usedPct}% tổng người tham gia`;
  document.getElementById('metric-not-used-pct').innerText = `${notUsedPct}% khách hàng tiềm năng`;

  // Calculate average satisfaction rating
  let totalRatingSum = 0;
  let ratingCount = 0;
  state.responses.forEach(r => {
    if (r.branch === 'used') {
      const avgOfUser = (
        Number(r.rating_time_accuracy || 4) +
        Number(r.rating_gps_accuracy || 4) +
        Number(r.rating_payment_convenience || 5) +
        Number(r.rating_ui_ux || 4)
      ) / 4;
      totalRatingSum += avgOfUser;
      ratingCount++;
    }
  });

  const avgOverall = ratingCount > 0 ? (totalRatingSum / ratingCount).toFixed(1) : '4.5';
  document.getElementById('metric-rating').innerText = `${avgOverall} ⭐`;

  // Render Charts
  renderBranchRatioChart(usedCount, notUsedCount);
  renderReasonsChart();

  // Render Table
  renderResponsesTable();
}

/**
 * Chart 1: Doughnut ratio
 */
function renderBranchRatioChart(usedCount, notUsedCount) {
  const ctx = document.getElementById('chart-branch-ratio')?.getContext('2d');
  if (!ctx) return;

  if (state.charts.branchRatio) {
    state.charts.branchRatio.destroy();
  }

  const safeUsed = usedCount || 1;
  const safeNotUsed = notUsedCount || 1;

  state.charts.branchRatio = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Đã Dùng Multigo (Nhánh A)', 'Chưa Từng Dùng (Nhánh B)'],
      datasets: [{
        data: [safeUsed, safeNotUsed],
        backgroundColor: ['#059669', '#06b6d4'],
        hoverBackgroundColor: ['#047857', '#0891b2'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
          }
        }
      },
      cutout: '68%'
    }
  });
}

/**
 * Chart 2: Bar chart for Reasons Not Used
 */
function renderReasonsChart() {
  const ctx = document.getElementById('chart-reasons')?.getContext('2d');
  if (!ctx) return;

  if (state.charts.reasons) {
    state.charts.reasons.destroy();
  }

  // Count reasons
  const reasonCounts = {
    'Chưa biết đến app': 0,
    'Dùng quen app khác': 0,
    'Không có nhu cầu': 0,
    'Ngại tốn dung lượng': 0
  };

  state.responses.forEach(r => {
    if (r.branch === 'not_used' && r.b_reason_not_used) {
      if (r.b_reason_not_used.includes('Chưa từng biết')) reasonCounts['Chưa biết đến app']++;
      else if (r.b_reason_not_used.includes('quen dùng ứng dụng khác')) reasonCounts['Dùng quen app khác']++;
      else if (r.b_reason_not_used.includes('Không có nhu cầu')) reasonCounts['Không có nhu cầu']++;
      else reasonCounts['Ngại tốn dung lượng']++;
    }
  });

  state.charts.reasons = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(reasonCounts),
      datasets: [{
        label: 'Số lượt chọn',
        data: Object.values(reasonCounts),
        backgroundColor: '#0891b2',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 }
        },
        x: {
          ticks: { font: { size: 10, family: 'Plus Jakarta Sans' } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/**
 * Render Table of Responses
 */
function renderResponsesTable() {
  const filter = document.getElementById('table-filter')?.value || 'all';
  const tbody = document.getElementById('responses-table-body');
  const emptyState = document.getElementById('table-empty-state');
  if (!tbody) return;

  tbody.innerHTML = '';

  let filtered = state.responses;
  if (filter === 'used') {
    filtered = state.responses.filter(r => r.branch === 'used');
  } else if (filter === 'not_used') {
    filtered = state.responses.filter(r => r.branch === 'not_used');
  }

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';

    const isUsed = item.branch === 'used';
    const badgeClass = isUsed 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-cyan-50 text-cyan-700 border-cyan-200';
    const branchLabel = isUsed ? 'Đã Dùng' : 'Chưa Dùng';

    const mainPoint = isUsed 
      ? `⭐ ${item.rating_time_accuracy || 4}/5 • ${item.a_open_frequency || 'Thường xuyên'}`
      : `${item.b_reason_not_used || 'Chưa biết tới app'}`;

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">${item.timestamp}</td>
      <td class="py-3 px-4 font-semibold text-slate-800">${escapeHtml(item.fullname)}</td>
      <td class="py-3 px-4 text-slate-600">${escapeHtml(item.occupation || '--')}</td>
      <td class="py-3 px-4 text-slate-600">${escapeHtml(item.age_group || '--')}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeClass}">
          ${branchLabel}
        </span>
      </td>
      <td class="py-3 px-4 text-slate-700 max-w-xs truncate" title="${escapeHtml(mainPoint)}">${escapeHtml(mainPoint)}</td>
      <td class="py-3 px-4 text-slate-500 max-w-xs truncate" title="${escapeHtml(item.feedback || '--')}">${escapeHtml(item.feedback || '--')}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Seed 3 realistic responses initially so dashboard looks vivid
 */
function seedInitialDemoData() {
  const initialDemos = [
    {
      id: 'MG-INIT01',
      timestamp: '28/10/2026 09:15',
      fullname: 'Nguyễn Văn Minh',
      occupation: 'Học sinh / Sinh viên',
      age_group: '18 - 24 tuổi',
      transit_habit: 'Hàng ngày (Đi học / Đi làm)',
      has_used_multigo: 'Đã dùng',
      branch: 'used',
      a_open_frequency: 'Hàng ngày (Nhiều lần trong ngày)',
      a_features: 'Tra cứu lộ trình & trạm dừng; Xem vị trí xe bus di chuyển trực tiếp trên GPS; Xác thực sinh viên & mua vé tháng',
      rating_time_accuracy: '4',
      rating_gps_accuracy: '4',
      rating_payment_convenience: '5',
      rating_ui_ux: '5',
      a_issues: 'Chưa từng gặp lỗi, dùng mượt mà',
      feedback: 'App rất tốt, mong sớm tích hợp thêm tuyến Metro số 1 để đổi tuyến tiện hơn.'
    },
    {
      id: 'MG-INIT02',
      timestamp: '28/10/2026 14:30',
      fullname: 'Trần Thị Thu Hà',
      occupation: 'Nhân viên văn phòng',
      age_group: '25 - 35 tuổi',
      transit_habit: 'Thường xuyên (3 - 4 lần / tuần)',
      has_used_multigo: 'Chưa dùng',
      branch: 'not_used',
      b_reason_not_used: 'Đang quen dùng ứng dụng khác (BusMap, Google Maps, Grab...)',
      b_concerns: 'Giờ xe đến chính xác theo thời gian thực; Thông báo nhắc xe sắp đến đúng lúc',
      b_incentive: 'Tính năng tìm đường và dự báo giờ xe thông minh vượt trội',
      b_pain_points: 'Chờ xe quá lâu và không biết khi nào xe đến',
      feedback: 'Nếu app Multigo định vị giờ xe chuẩn xác hơn Google Maps thì mình sẽ chuyển sang dùng ngay.'
    },
    {
      id: 'MG-INIT03',
      timestamp: '28/10/2026 18:45',
      fullname: 'Lê Hoàng Long',
      occupation: 'Kinh doanh / Tự do',
      age_group: '18 - 24 tuổi',
      transit_habit: 'Thỉnh thoảng (1 - 2 lần / tuần hoặc khi cần)',
      has_used_multigo: 'Chưa dùng',
      branch: 'not_used',
      b_reason_not_used: 'Chưa từng biết đến ứng dụng Multigo',
      b_concerns: 'Thanh toán vé 1 chạm không cần tiền mặt; Giá vé rẻ, có mã giảm giá khuyến mãi',
      b_incentive: 'Tặng mã giảm giá / Miễn phí vé trải nghiệm đầu tiên',
      b_pain_points: 'Bất tiện khi chuẩn bị tiền lẻ trả vé',
      feedback: 'Nên quảng bá rộng rãi ở các trường đại học và trạm xe buýt lớn.'
    }
  ];

  state.responses = initialDemos;
  saveResponsesToStorage();
}

/**
 * Add 10 Realistic Mock Data
 */
function addMockData() {
  const sampleNames = ['Phạm Hải Yến', 'Đỗ Gia Bảo', 'Vũ Quỳnh Anh', 'Lý Tuấn Kiệt', 'Bùi Ngọc Linh', 'Hoàng Trọng Nghĩa', 'Dương Thúy Nga', 'Mai Văn Đạt', 'Lê Khánh Huyền', 'Ngô Quang Huy'];
  const occupations = ['Học sinh / Sinh viên', 'Nhân viên văn phòng', 'Kinh doanh / Tự do'];
  const ageGroups = ['18 - 24 tuổi', '25 - 35 tuổi', 'Dưới 18 tuổi'];

  for (let i = 0; i < 10; i++) {
    const isUsed = Math.random() > 0.45;
    const now = new Date();
    const timeStr = now.toLocaleDateString('vi-VN') + ' ' + (8 + i).toString().padStart(2, '0') + ':' + Math.floor(Math.random() * 50).toString().padStart(2, '0');

    const item = {
      id: 'MG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      timestamp: timeStr,
      fullname: sampleNames[i % sampleNames.length],
      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      age_group: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      transit_habit: isUsed ? 'Hàng ngày (Đi học / Đi làm)' : 'Thỉnh thoảng (1 - 2 lần / tuần)',
      has_used_multigo: isUsed ? 'Đã dùng' : 'Chưa dùng',
      branch: isUsed ? 'used' : 'not_used'
    };

    if (isUsed) {
      item.a_open_frequency = '3 - 5 lần một tuần';
      item.rating_time_accuracy = (3 + Math.floor(Math.random() * 3)).toString();
      item.rating_gps_accuracy = (4 + Math.floor(Math.random() * 2)).toString();
      item.rating_payment_convenience = '5';
      item.rating_ui_ux = '4';
      item.a_issues = Math.random() > 0.5 ? 'Chưa từng gặp lỗi, dùng mượt mà' : 'App thỉnh thoảng bị lag hoặc tự văng';
      item.feedback = 'App chạy ổn định, thích nhất tính năng xem giờ xe thời gian thực.';
    } else {
      const reasons = [
        'Chưa từng biết đến ứng dụng Multigo',
        'Đang quen dùng ứng dụng khác (BusMap, Google Maps, Grab...)',
        'Ngại cài thêm app vì sợ tốn dung lượng hoặc phức tạp'
      ];
      item.b_reason_not_used = reasons[Math.floor(Math.random() * reasons.length)];
      item.b_incentive = 'Tặng mã giảm giá / Miễn phí vé trải nghiệm đầu tiên';
      item.feedback = 'Mong app có nhiều chương trình khuyến mãi cho sinh viên.';
    }

    state.responses.unshift(item);
  }

  saveResponsesToStorage();
  updateNavigationCount();
  renderDashboard();
  alert('Đã thêm 10 phản hồi mẫu thành công!');
}

/**
 * Clear All Responses
 */
function clearAllResponses() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ phản hồi đã lưu không?')) {
    state.responses = [];
    saveResponsesToStorage();
    updateNavigationCount();
    renderDashboard();
  }
}

/**
 * Export Responses to CSV (with UTF-8 BOM for Excel support)
 */
function exportToCSV() {
  if (state.responses.length === 0) {
    alert('Chưa có dữ liệu phản hồi nào để xuất file!');
    return;
  }

  const headers = [
    'Mã ID',
    'Thời Gian',
    'Họ Tên',
    'Nghề Nghiệp',
    'Độ Tuổi',
    'Thói Quen Đi Lại',
    'Tình Trạng Dùng App',
    'Nhánh Khảo Sát',
    'Tần Suất Mở (Nhánh A)',
    'Tính Năng Thích (Nhánh A)',
    'Điểm Giờ Xe (Nhánh A)',
    'Điểm GPS (Nhánh A)',
    'Điểm Thanh Toán (Nhánh A)',
    'Điểm Giao Diện (Nhánh A)',
    'Lỗi Gặp Phải (Nhánh A)',
    'Lý Do Chưa Dùng (Nhánh B)',
    'Mối Quan Tâm (Nhánh B)',
    'Yếu Tố Thuyết Phục (Nhánh B)',
    'Khó Khăn Chung (Nhánh B)',
    'Ý Kiến Đóng Góp / Mong Muốn'
  ];

  const rows = state.responses.map(r => {
    return [
      `"${r.id || ''}"`,
      `"${r.timestamp || ''}"`,
      `"${cleanCSV(r.fullname)}"`,
      `"${cleanCSV(r.occupation)}"`,
      `"${cleanCSV(r.age_group)}"`,
      `"${cleanCSV(r.transit_habit)}"`,
      `"${cleanCSV(r.has_used_multigo)}"`,
      `"${cleanCSV(r.branch === 'used' ? 'Nhánh A (Đã dùng)' : 'Nhánh B (Chưa dùng)')}"`,
      `"${cleanCSV(r.a_open_frequency || '')}"`,
      `"${cleanCSV(r.a_features || '')}"`,
      `"${r.rating_time_accuracy || ''}"`,
      `"${r.rating_gps_accuracy || ''}"`,
      `"${r.rating_payment_convenience || ''}"`,
      `"${r.rating_ui_ux || ''}"`,
      `"${cleanCSV(r.a_issues || '')}"`,
      `"${cleanCSV(r.b_reason_not_used || '')}"`,
      `"${cleanCSV(r.b_concerns || '')}"`,
      `"${cleanCSV(r.b_incentive || '')}"`,
      `"${cleanCSV(r.b_pain_points || '')}"`,
      `"${cleanCSV(r.feedback || '')}"`
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens Vietnamese characters correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Multigo_KhaoSat_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cleanCSV(str) {
  if (!str) return '';
  return str.toString().replace(/"/g, '""').replace(/\n/g, ' ');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Settings Webhook Modal
 */
function openSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function initWebhookSetting() {
  const url = localStorage.getItem(STORAGE_KEY_WEBHOOK) || '';
  const input = document.getElementById('setting-sheet-url');
  if (input) input.value = url;
}

function saveSettingsModal() {
  const url = document.getElementById('setting-sheet-url').value.trim();
  localStorage.setItem(STORAGE_KEY_WEBHOOK, url);
  closeSettingsModal();
  alert('Đã lưu cấu hình Google Sheet Webhook thành công!');
}

