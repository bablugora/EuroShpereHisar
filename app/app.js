(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let activeAdminCourseLevel = null;
  const LEVELS = [
    {level:'A1',name:'Beginner',desc:'Build your first French sentences.',color:'A1'},
    {level:'A2',name:'Elementary',desc:'Grow your everyday vocabulary.',color:'A2'},
    {level:'B1',name:'Intermediate',desc:'Express yourself with confidence.',color:'B1'},
    {level:'B2',name:'Upper Intermediate',desc:'Discuss ideas with fluency.',color:'B2'},
    {level:'C1',name:'Advanced',desc:'Master nuanced French.',color:'C1'}
  ];
  const CONTENT_TYPES = [
    {type:'daily',title:'Daily Video',icon:'▶',desc:'Short daily lessons and guided practice.'},
    {type:'recorded',title:'Recorded Courses',icon:'▣',desc:'Structured lessons you can revisit anytime.'},
    {type:'live',title:'Live Classes',icon:'◷',desc:'Learn with a teacher in scheduled sessions.'},
    {type:'test',title:'Tests & Mock Exams',icon:'✓',desc:'Check your understanding and track results.'},
    {type:'vocabulary',title:'Vocabulary Builder',icon:'Aa',desc:'New words, meanings and revision cards.'},
    {type:'grammar',title:'Grammar Practice',icon:'文',desc:'Build sentences and practise grammar.'},
    {type:'conversation',title:'Conversation Practice',icon:'☏',desc:'Practise everyday real-life dialogues.'},
    {type:'pronunciation',title:'Pronunciation Coach',icon:'♫',desc:'Listen, repeat and practise French sounds.'},
    {type:'revision',title:'Smart Revision',icon:'↻',desc:'Review saved words and difficult topics.'},
    {type:'exam',title:'DELF / DALF Exam Mode',icon:'🏅',desc:'Exam-style preparation and practice.'}
  ];
  let supabase = null, currentUser = null, profile = null, assignedLevels = [], currentCourse = null, currentContentType = null, voiceRecognition = null, lastVoiceFrench = '';
  let localContent = [];
  let liveClassCountdownTimer = null;
  let speakingResultSaved = false;
let speakingAttemptXP = 0;
let speakingXP = 0;
let speakingStreak = 0;
    // Euro Sphere: Student activity logger
  const logStudentActivity = async (
    eventType,
    page = null,
    metadata = {}
  ) => {
    try {
      console.log('Activity logger called:', eventType, currentUser?.id);
      if (!supabase || !currentUser?.id) return;
// Prevent duplicate lesson completion activity
if (eventType === 'lesson_completed') {
  const { data: existingLog, error: checkError } = await supabase
    .from('student_activity_logs')
    .select('id')
    .eq('student_id', currentUser.id)
    .eq('event_type', 'lesson_completed')
    .filter('metadata->>lesson_id', 'eq', String(metadata.lesson_id))
    .limit(1);

  if (checkError) {
    console.error('Activity duplicate check failed:', checkError.message);
    return;
  }

  if (existingLog && existingLog.length > 0) return;
}
      const { error } = await supabase
        .from('student_activity_logs')
        .insert({
          student_id: currentUser.id,
          event_type: eventType,
          page,
          metadata
        });

      if (error) {
        console.error('Activity log failed:', error.message);
      }
    } catch (error) {
      console.error('Activity logger error:', error);
    }
  };
  const toast = (message, type='') => { const el=$('toast'); el.textContent=message; el.className='toast show '+type; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.className='toast',4200); };
  const esc = (s='') => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initSupabase = () => {
  const url = window.EUROSPHERE_SUPABASE_URL?.trim();
  const key = window.EUROSPHERE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!window.supabase || !url || !key) {
    console.error("Supabase config missing", {
      libraryLoaded: Boolean(window.supabase),
      urlLoaded: Boolean(url),
      keyLoaded: Boolean(key)
    });
    $("auth-status").textContent =
      "Supabase configuration missing. Check supabase-config.js.";
    return false;
  }

  try {
    supabase = window.supabase.createClient(url, key);
    console.log("Supabase client initialized", {
      urlLoaded: true,
      keyLoaded: true
    });
    return true;
  } catch (e) {
    console.error("Supabase initialization failed:", e);
    $("auth-status").textContent =
      "Could not initialize Supabase. Check the browser console.";
    return false;
  }
};
 const showAuth = (mode = 'login') => {
  $('auth-screen').classList.remove('hidden');
  $('app-shell').classList.add('hidden');

  const login = mode === 'login';
  const signup = mode === 'signup';
  const reset = mode === 'reset';

  $('login-form').classList.toggle('hidden', !login);
  $('signup-form').classList.toggle('hidden', !signup);
  $('reset-password-form').classList.toggle('hidden', !reset);

  document.querySelector('.auth-tabs').classList.toggle('hidden', reset);

  $('show-login').classList.toggle('active', login);
  $('show-signup').classList.toggle('active', signup);

  $('auth-title').textContent = reset
    ? 'Create New Password'
    : login
      ? 'Welcome back'
      : 'Create your account';

  $('auth-subtitle').textContent = reset
    ? 'Enter and confirm your new password.'
    : login
      ? 'Log in to continue your learning journey.'
      : 'Join Euro Sphere and start learning French.';

  $('auth-status').textContent = '';
};
  const getProfile = async () => {
    const { data, error } = await supabase
  .from('profiles')
  .select('id, full_name, role')
  .eq('id', currentUser.id)
  .maybeSingle();
    if(error) throw error;
    profile=data || {id:currentUser.id,full_name:currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student',email:currentUser.email,role:'student'};
  };
  const loadAccess = async () => {
    const {data,error}=await supabase.from('course_access').select('level').eq('student_id',currentUser.id);
    if(error){ console.warn('Course access could not be loaded',error); assignedLevels=[]; return; }
    assignedLevels=(data||[]).map(x=>x.level);
  };
  
const showApp = async () => {
  $('auth-screen').classList.add('hidden');
  $('app-shell').classList.remove('hidden');

  try {
    await getProfile();
    await loadAccess();
  } catch (e) {
    console.error(e);
    toast(
      'Could not load your profile. Please refresh and try again.',
      'error'
    );
  }

  const name =
    profile?.full_name ||
    currentUser?.email?.split('@')[0] ||
    'Student';

  $('welcome-title').textContent =
    'Bonjour, ' + name.split(' ')[0] + '!';
  $('top-user-name').textContent = name;
  $('top-avatar').textContent = name[0]?.toUpperCase() || 'S';
  $('profile-avatar').textContent = name[0]?.toUpperCase() || 'S';
  $('profile-name').textContent = name;
  $('profile-email').textContent = currentUser?.email || '';
  $('profile-name-input').value = profile?.full_name || '';
  $('profile-role').textContent =
    profile?.role === 'admin'
      ? 'Academy administrator'
      : 'Student account';
  $('year').textContent = new Date().getFullYear();

  document.querySelectorAll('.admin-link').forEach(el =>
    el.classList.toggle('hidden', profile?.role !== 'admin')
  );

  // Restore saved page and course selection
  let savedPage = 'home';

  try {
    const page = sessionStorage.getItem('eurosphere_last_page');
    const course = sessionStorage.getItem('eurosphere_last_course');
    const contentType = sessionStorage.getItem(
      'eurosphere_last_content_type'
    );

    const allowedPages = [
      'home', 'courses', 'course-detail', 'content-detail',
      'voice', 'score', 'profile', 'admin'
    ];

    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];

    if (allowedPages.includes(page)) {
      savedPage = page;
    }

    if (validLevels.includes(course)) {
      currentCourse = course;
    }

    if (
      typeof CONTENT_TYPES !== 'undefined' &&
      Array.isArray(CONTENT_TYPES) &&
      CONTENT_TYPES.some(item => item.type === contentType)
    ) {
      currentContentType = contentType;
    }
  } catch (e) {
    console.warn('Could not restore the previous page.', e);
  }

  await refreshDashboard();


  // Navigate only after profile and course access have loaded
  navigate(savedPage);
};

const loadCourseCompletionProgress = async () => {
  const container = $('home-course-progress');
  if (!container || !currentUser?.id) return;

  container.innerHTML = '<p>Loading course progress...</p>';

  try {
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_content')
      .select('id,course_level,content_type,resource_url')
      .in('course_level', assignedLevels)
      .eq('is_published', true);

    if (lessonsError) throw lessonsError;

    const { data: progressRows, error: progressError } = await supabase
      .from('course_progress')
      .select('level,lesson_key,watch_percentage,completed_at')
      .eq('student_id', currentUser.id);

    if (progressError) throw progressError;

    const progressMap = new Map(
      (progressRows || []).map(item => [
        `${item.level}:${String(item.lesson_key)}`,
        item
      ])
    );

    const categoryNames = {
      daily: 'Daily Video',
      recorded: 'Recorded Courses',
      live: 'Live Classes',
      test: 'Tests & Mock Exams',
      mock: 'Tests & Mock Exams',
      vocabulary: 'Vocabulary',
      grammar: 'Grammar',
      conversation: 'Conversation',
      pronunciation: 'Pronunciation',
      revision: 'Smart Revision',
      smart_revision: 'Smart Revision',
      delf: 'DELF / DALF',
      dalf: 'DELF / DALF'
    };

    const getLessonCompleted = (lesson, level) => {
      const saved = progressMap.get(
        `${level}:${String(lesson.id)}`
      );

      if (!saved) return false;

      const url = String(lesson.resource_url || '');
      const isYouTube = /youtube\.com|youtu\.be/i.test(url);
      const isDirectVideo = /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url);
      const isTrackedVideo = isYouTube || isDirectVideo;

      return isTrackedVideo
        ? Number(saved.watch_percentage) >= 90
        : Boolean(saved.completed_at);
    };

    container.innerHTML = assignedLevels.map((level, index) => {
      const levelLessons = (lessons || []).filter(
        lesson => lesson.course_level === level
      );

      const completedCount = levelLessons.filter(lesson =>
        getLessonCompleted(lesson, level)
      ).length;

      const totalCount = levelLessons.length;
      const percentage = totalCount
        ? Math.round((completedCount / totalCount) * 100)
        : 0;

      const status = totalCount === 0
        ? 'Not Started'
        : percentage === 100
          ? 'Completed'
          : completedCount > 0
            ? 'In Progress'
            : 'Not Started';

      const categories = {};

      levelLessons.forEach(lesson => {
        const type = String(lesson.content_type || 'other')
          .toLowerCase()
          .trim();

        if (!categories[type]) {
          categories[type] = {
            total: 0,
            completed: 0
          };
        }

        categories[type].total++;

        if (getLessonCompleted(lesson, level)) {
          categories[type].completed++;
        }
      });

      const categoryHTML = Object.entries(categories).map(
        ([type, stats]) => {
          const categoryPercentage = stats.total
            ? Math.round((stats.completed / stats.total) * 100)
            : 0;

          const categoryName =
            categoryNames[type] ||
            type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

          return `
            <div class="category-progress-item">
              <div class="category-progress-info">
                <strong>${categoryName}</strong>
                <span>
                  ${stats.completed} / ${stats.total}
                  · ${categoryPercentage}%
                </span>
              </div>
              <div class="course-progress-track">
                <div class="course-progress-fill"
                     style="width:${categoryPercentage}%">
                </div>
              </div>
            </div>
          `;
        }
      ).join('');

      return `
        <div class="data-row course-progress-card">
        <div class="course-progress-header">
  <div class="course-progress-info">
    <strong>${level}</strong>
    <span>${completedCount} / ${totalCount} lessons completed</span>
    <b class="progress-status ${status.toLowerCase().replace(' ', '-')}">
      ${percentage}% · ${status}
    </b>
  </div>

  <div class="course-progress-circle"
       style="--progress:${percentage}%">
    <span>${percentage}%</span>
  </div>
</div>
         

          <div class="course-progress-track">
            <div class="course-progress-fill"
                 style="width:${percentage}%"></div>
          </div>

          <button
            type="button"
            class="inline-link progress-details-toggle"
            data-progress-details="${index}">
            View Details ↓
          </button>

          <div class="course-category-details hidden"
               id="progress-details-${index}">
            ${categoryHTML || '<p>No category data available yet.</p>'}
          </div>
        </div>
      `;
    }).join('') || '<p>No assigned courses yet.</p>';

    container.querySelectorAll('[data-progress-details]').forEach(button => {
      button.addEventListener('click', () => {
        const index = button.dataset.progressDetails;
        const details = $(`progress-details-${index}`);

        if (!details) return;

        const isHidden = details.classList.toggle('hidden');

        button.textContent = isHidden
          ? 'View Details ↓'
          : 'Hide Details ↑';
      });
    });

  } catch (error) {
    console.error('Course progress error:', error.message);
    container.innerHTML = '<p>Could not load course progress.</p>';
  }
};

const loadTopPerformer = async () => {
  const box = $('home-top-performer');
  if (!box || !currentUser?.id) return;

  const levels = [...new Set(assignedLevels || [])];

  if (!levels.length) {
    box.innerHTML = '<p>No course assigned yet.</p>';
    return;
  }

  box.innerHTML = '<p>Loading top performers...</p>';

  try {
    const results = await Promise.all(
      levels.map(async level => {
        const { data, error } = await supabase.rpc(
          'get_course_top_performer',
          { p_level: level }
        );

        if (error) {
          console.warn(`${level} topper error:`, error.message);
          return { level, topper: null };
        }

        return { level, topper: data?.[0] || null };
      })
    );

    box.innerHTML = results.map(({ level, topper }) => `
      <div class="data-row">
        <div>
          <strong>🏆 ${esc(level)} Top Performer</strong>
          <p>${topper ? esc(topper.student_name) : 'No performer data yet.'}</p>
        </div>
        <strong>
          ${topper ? `${Number(topper.completion_percentage)}% Complete` : '—'}
        </strong>
      </div>
    `).join('');

  } catch (error) {
    console.error('Top performers error:', error.message);
    box.innerHTML = '<p>Could not load top performers.</p>';
  }
};
 const refreshDashboard = async () => {
  await loadAccess();
  renderCourseCards('home-course-grid', true);
  renderCourseCards('course-grid', false);
  renderProfileAccess();
  await loadCourseCompletionProgress();
  await loadTopPerformer();

  $('profile-courses').textContent = `${assignedLevels.length} / 5`;

  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('correct_answers,total_questions,points,created_at,level,quiz_id')
      .eq('student_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Quiz results error:', error.message);
      return;
    }

    const rows = data || [];
  // QUIZ PERFORMANCE HISTORY
const historyBox = $('quiz-performance-history');

if (historyBox) {
  if (rows.length) {

    const quizIds = [...new Set(
      rows.map(attempt => attempt.quiz_id).filter(Boolean)
    )];

    let quizTitles = {};

    if (quizIds.length) {
      const { data: quizInfo, error: quizError } = await supabase
        .from('quizzes')
        .select('id,title')
        .in('id', quizIds);

      if (!quizError && quizInfo) {
        quizInfo.forEach(quiz => {
          quizTitles[quiz.id] = quiz.title;
        });
      }
    }

    historyBox.innerHTML = rows.map((attempt, index) => {
      const correct = Number(attempt.correct_answers || 0);
      const total = Number(attempt.total_questions || 0);

      const percentage = total > 0
        ? Math.round((correct / total) * 100)
        : 0;

      const quizName = quizTitles[attempt.quiz_id]
        || `${attempt.level || 'French'} Test`;

      const attemptDate = new Date(attempt.created_at)
        .toLocaleDateString();

      return `
        <div class="quiz-history-item">
          <div class="quiz-history-item-info">
            <strong>${esc(quizName)}</strong>
            <small>Attempt ${rows.length - index} · ${attemptDate}</small>
          </div>
          <div class="quiz-history-item-score">
            <strong>${correct}/${total}</strong>
            <span>${percentage}%</span>
          </div>
        </div>
      `;
    }).join('');

  } else {
    historyBox.innerHTML =
      '<p class="quiz-history-empty">No quiz attempts yet.</p>';
  }
}
     
    // LATEST QUIZ SUMMARY
const latestQuizBox = $('latest-quiz-summary');

if (latestQuizBox) {
  if (rows.length) {
    const latest = rows[0];

    let quizTitle = `${latest.level || 'French'} Test`;

    if (latest.quiz_id) {
      const { data: quizInfo } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', latest.quiz_id)
        .maybeSingle();

      if (quizInfo?.title) {
        quizTitle = quizInfo.title;
      }
    }

    const correct = Number(latest.correct_answers || 0);
    const total = Number(latest.total_questions || 0);
    const percentage = total > 0
      ? Math.round((correct / total) * 100)
      : 0;
      let performanceLabel = '';

if (percentage >= 90) {
  performanceLabel = '🏆 Excellent! Outstanding performance!';
} else if (percentage >= 70) {
  performanceLabel = '👍 Good Work! Keep it up!';
} else if (percentage >= 50) {
  performanceLabel = '📚 Keep Practising! You are improving!';
} else {
  performanceLabel = "💪 Don't Give Up! Practice makes perfect!";
}

    latestQuizBox.innerHTML = `
      <div class="latest-quiz-details">
        <div class="latest-quiz-detail">
          <small>Quiz name</small>
          <strong>${esc(quizTitle)}</strong>
        </div>
        <div class="latest-quiz-detail">
          <small>Your score</small>
          <strong>${correct} / ${total}</strong>
        </div>
        <div class="latest-quiz-detail">
          <small>Percentage</small>
          <strong>${percentage}%</strong>
        </div>
      </div>
      <div class="latest-quiz-performance">
  ${esc(performanceLabel)}
</div>

<p class="latest-quiz-empty">
  Attempted on ${new Date(latest.created_at).toLocaleDateString()}
</p>
    `;
  } else {
    latestQuizBox.innerHTML =
      '<p class="latest-quiz-empty">No quiz attempts yet. Start your first quiz!</p>';
  }
}
   const quizPoints = rows.reduce(
  (sum, r) => sum + Number(r.points || 0), 0
);

const { data: xpTransactions, error: xpError } = await supabase
  .from('student_xp_transactions')
  .select('xp_earned')
  .eq('student_id', currentUser.id);

if (xpError) {
  console.error('Learning XP load error:', xpError.message);
}

const lessonXP = (xpTransactions || []).reduce(
  (sum, item) => sum + Number(item.xp_earned || 0), 0
);

const { data: speakingResults, error: speakingError } = await supabase
  .from('speaking_practice_results')
  .select('xp_earned, sentence_id')
  .eq('student_id', currentUser.id);

if (speakingError) {
  console.error('Speaking XP load error:', speakingError.message);
}

const speakingXP = (speakingResults || [])
  .filter(item => item.sentence_id !== null)
  .reduce(
    (sum, item) => sum + Number(item.xp_earned || 0), 0
  );

const activityXP = lessonXP + speakingXP;

const totalPoints = quizPoints + activityXP;

    $('profile-score').textContent = totalPoints;
    $('score-total').textContent = totalPoints;
   const profileLevel = assignedLevels[0];


if (!profileLevel) {
  $('profile-lessons').textContent = '0';
} else {
  const { data: profileLessons, error: profileLessonsError } =
    await supabase
      .from('course_content')
      .select('id,resource_url')
      .eq('course_level', profileLevel)
      .eq('is_published', true);

  const { data: profileProgress, error: profileProgressError } =
    await supabase
      .from('course_progress')
      .select('lesson_key,watch_percentage,completed_at')
      .eq('student_id', currentUser.id)
      .eq('level', profileLevel);

  if (profileLessonsError || profileProgressError) {
    console.error(
      'Profile lesson progress error:',
      profileLessonsError || profileProgressError
    );
  } else {
    const progressMap = new Map(
      (profileProgress || []).map(item => [
        String(item.lesson_key),
        item
      ])
    );

    const completedCount = (profileLessons || []).filter(lesson => {
      const saved = progressMap.get(String(lesson.id));
      if (!saved) return false;

      const url = String(lesson.resource_url || '');
      const isVideo =
        /youtube\\.com|youtu\\.be/i.test(url) ||
        /\\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url);

      return isVideo
        ? Number(saved.watch_percentage) >= 90
        : Boolean(saved.completed_at);
    }).length;

    $('profile-lessons').textContent = completedCount;
  }
}
    $('score-progress-bar').style.width =
      Math.min(100, totalPoints) + '%';

    $('score-progress-label').textContent = rows.length
      ? `${rows.length} test attempt(s) recorded`
      : 'No test scores yet';

    const ring = $('score-total').closest('.score-ring');

    ring.style.background =
      `conic-gradient(var(--blue) ${Math.min(100, totalPoints) * 3.6}deg,#e6edfa 0deg)`;

   // Show only the latest attempt for each quiz
const latestAttempts = [];
const seenQuizzes = new Set();

rows.forEach(r => {
  const quizKey = r.quiz_id || r.level || 'unknown';

  if (!seenQuizzes.has(quizKey)) {
    seenQuizzes.add(quizKey);
    latestAttempts.push(r);
  }
});

$('test-history').innerHTML = latestAttempts.length
  ? latestAttempts.map(r => `
      <div class="data-row">
        <div>
          <strong>${esc(r.level || 'Course')} Test</strong>
          <small>${new Date(r.created_at).toLocaleDateString()}</small>
        </div>
        <b>${esc(r.correct_answers)} / ${esc(r.total_questions)}</b>
      </div>
    `).join('')
  : '<div class="empty-state">No test results yet.</div>';
  } catch (e) {
    console.warn(e);
  }
};
  const renderCourseCards = (containerId,compact) => {
    const container=$(containerId); if(!container)return;
    container.innerHTML=LEVELS.map(c=>{const unlocked=assignedLevels.includes(c.level);return `<article class="course-card ${unlocked?'':'locked'}"><span class="lock-float">${unlocked?'':'🔒'}</span><div class="course-top"><div class="level-badge level-${c.color}">${c.level}</div><div><h3>${c.name}</h3><p>${c.desc}</p></div></div><p class="course-description">${unlocked?'Your course is unlocked. Open your learning sections.':'Course content stays locked until an admin assigns access.'}</p><span class="${unlocked?'access-chip unlocked':'lock-chip'}">${unlocked?'✓ Access granted':'🔒 Admin approval required'}</span><button class="${unlocked?'primary-button':'secondary-button'} course-action" data-open-course="${c.level}">${unlocked?'Open course':'View course status'} →</button></article>`;}).join('');
    container.querySelectorAll('[data-open-course]').forEach(btn=>btn.addEventListener('click',()=>openCourse(btn.dataset.openCourse)));
  };
  

const navigate = (page) => {
  const allowed = [
    'home', 'courses', 'course-detail', 'content-detail',
    'voice', 'quizzes', 'score', 'profile', 'admin'
  ];

  if (!allowed.includes(page)) page = 'home';

  if (page === 'admin' && profile?.role !== 'admin') {
    toast('Admin access is restricted.', 'error');
    page = 'home';
  }

  // Save current page and learning selection for refresh
  try {
    sessionStorage.setItem('eurosphere_last_page', page);

    if (currentCourse) {
      sessionStorage.setItem('eurosphere_last_course', currentCourse);
    }

    if (currentContentType) {
      sessionStorage.setItem(
        'eurosphere_last_content_type',
        currentContentType
      );
    }
  } catch (e) {
    console.warn('Could not save the current page.', e);
  }

  document.querySelectorAll('.page').forEach(el =>
    el.classList.remove('active')
  );

  const target = $('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('[data-page]').forEach(el =>
    el.classList.toggle(
      'active',
      el.dataset.page === page ||
      (page === 'course-detail' && el.dataset.page === 'courses') ||
      (page === 'content-detail' && el.dataset.page === 'courses')
    )
  );

  $('page-title').textContent = ({
    home: 'Home',
    courses: 'My Courses',
    'course-detail': currentCourse
      ? `${currentCourse} Course`
      : 'Course',
    'content-detail': 'Learning section',
    voice: 'Voice Practice',
    quizzes: 'Quizzes',
    score: 'Score & Progress',
    profile: 'My Profile',
    admin: 'Admin Panel'
  })[page] || 'Home';

  if (page === 'admin') loadAdminStudents();
  if (page === 'quizzes') loadStudentQuizzes();
  if (page === 'course-detail' && currentCourse) {
    renderCourseDetail();
  }
  if (page === 'content-detail') {
    loadCourseContent();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};


  const openCourse = (level) => {currentCourse=level; if(!assignedLevels.includes(level)){renderCourseDetail();navigate('course-detail');return;} renderCourseDetail();navigate('course-detail');};
  const renderCourseDetail = () => {
    const c=LEVELS.find(x=>x.level===currentCourse); if(!c)return; const unlocked=assignedLevels.includes(c.level);
    $('course-detail-content').innerHTML=`<div class="course-detail-hero"><div class="level-badge level-${c.color}">${c.level}</div><div><span class="eyebrow" style="color:#bfd3ff">COURSE LEVEL</span><h1>${c.level} — ${c.name}</h1><p>${c.desc}</p></div></div>${unlocked?'<div class="section-heading"><div><h2>Course library</h2><p>Choose a learning activity to begin.</p></div></div>':'<div class="empty-state" style="margin-bottom:20px">🔒 This course is locked. Ask the academy admin to assign '+c.level+' access to your account.</div>'}<div class="course-section-grid">${CONTENT_TYPES.map(t=>`<article class="content-type-card ${unlocked?'':'locked'}"><div class="content-type-icon">${t.icon}</div><h3>${t.title}</h3><p>${t.desc}</p><button class="inline-link" data-content-type="${t.type}" ${unlocked?'':'disabled'}>${unlocked?'Open section →':'🔒 Locked'}</button></article>`).join('')}</div>`;
    $('course-detail-content').querySelectorAll('[data-content-type]').forEach(b=>b.addEventListener('click',()=>{currentContentType=b.dataset.contentType;navigate('content-detail');}));
  };
  // Load YouTube IFrame Player API
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) return Promise.resolve();

  if (window.youtubeAPILoading) {
    return window.youtubeAPILoading;
  }

  window.youtubeAPILoading = new Promise(resolve => {
    window.onYouTubeIframeAPIReady = () => resolve();

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return window.youtubeAPILoading;
};
// Track actual YouTube video watch time
const initializeYouTubeTracking = async () => {
  await loadYouTubeAPI();

  document.querySelectorAll(
    'iframe[data-youtube-player="true"]'
  ).forEach(async iframe => {
    if (iframe.dataset.trackingReady === 'true') return;

    iframe.dataset.trackingReady = 'true';

    const lessonId = iframe.dataset.lessonId;
    if (!lessonId) return;

    
    let saveTimer = null;
    let player = null;
    let watchSeconds = 0;
let durationSeconds = 0;
let lastTime = null;

const { data: savedProgress, error: progressLoadError } = await supabase
  .from('course_progress')
  .select('watch_seconds, duration_seconds, watch_percentage')
  .eq('student_id', currentUser.id)
  .eq('level', currentCourse)
  .eq('lesson_key', lessonId)
  .maybeSingle();

if (progressLoadError) {
  console.error('Could not load saved video progress:', progressLoadError.message);
} else if (savedProgress) {
  watchSeconds = Number(savedProgress.watch_seconds || 0);
  durationSeconds = Number(savedProgress.duration_seconds || 0);
}

const saveProgress = async () => {
  if (!durationSeconds || !watchSeconds) return;

  const percentage = Math.min(
    100,
    Math.floor((watchSeconds / durationSeconds) * 100)
  );

  const { error } = await supabase
    .from('course_progress')
    .upsert({
      student_id: currentUser.id,
      level: currentCourse,
      lesson_key: lessonId,
      watch_seconds: Math.floor(watchSeconds),
      duration_seconds: Math.ceil(durationSeconds),
      watch_percentage: percentage,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'student_id,lesson_key,level'
    });

  if (error) {
    console.error('Video progress save error:', error.message);
    return;
  }

  // Mark the lesson complete only after 90% watch progress is saved
  if (percentage >= 90) {
   

    toast('🎉 Video 90% watched! Lesson completed.', 'success');
    
        // Award lesson XP only once after 90% completion
    const { data: earnedXP, error: xpError } = await supabase.rpc(
      'award_lesson_xp',
      {
        p_lesson_id: Number(lessonId)
      }
    );

   if (xpError) {
  console.error('XP award error:', xpError.message);
} else if (Number(earnedXP) > 0) {
  toast(`🏆 Congratulations! You earned ${earnedXP} XP!`, 'success');
}

// Log lesson completion independently of XP
await logStudentActivity(
  'lesson_completed',
  'course',
  {
    lesson_id: Number(lessonId),
    completion_percentage: percentage,
    video_type: 'youtube'
  }
);
  }
};
    player = new YT.Player(iframe, {
      events: {
        onReady: event => {
          player = event.target;
          durationSeconds = player.getDuration();
        },

        onStateChange: event => {
          if (event.data === YT.PlayerState.PLAYING) {
            lastTime = player.getCurrentTime();

            if (!saveTimer) {
              saveTimer = setInterval(() => {
                if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) {
                  return;
                }

                const currentTime = player.getCurrentTime();
                const difference = currentTime - lastTime;

                // Count normal playback only; skipped sections won't count.
                if (difference > 0 && difference <= 2) {
                  watchSeconds += difference;
                }

                lastTime = currentTime;
                durationSeconds = player.getDuration();

                if (durationSeconds > 0) {
                  const percentage = Math.floor(
                    (watchSeconds / durationSeconds) * 100
                  );

                  if (percentage >= 90) {
                    saveProgress();
                    clearInterval(saveTimer);
                    saveTimer = null;
                    return;
                  }
                }

                if (watchSeconds > 0 && Math.floor(watchSeconds) % 10 === 0) {
                  saveProgress();
                }
              }, 1000);
            }
          }

          if (
            event.data === YT.PlayerState.PAUSED ||
            event.data === YT.PlayerState.ENDED
          ) {
            if (saveTimer) {
              clearInterval(saveTimer);
              saveTimer = null;
            }
            saveProgress();
          }
        }
      }
    });
  });
};
// Track actual MP4/WebM video watch time
const initializeMP4Tracking = async () => {
  const videos = document.querySelectorAll(
    'video[data-track-mp4="true"]'
  );

  for (const video of videos) {
    if (video.dataset.trackingReady === 'true') continue;

    video.dataset.trackingReady = 'true';

    const lessonId = video.dataset.lessonId;
    if (!lessonId) continue;

    let watchSeconds = 0;
    let durationSeconds = 0;
    let lastTime = null;
    let timer = null;

    const { data: savedProgress, error } = await supabase
      .from('course_progress')
      .select('watch_seconds, duration_seconds')
      .eq('student_id', currentUser.id)
      .eq('level', currentCourse)
      .eq('lesson_key', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Could not load MP4 progress:', error.message);
    } else if (savedProgress) {
      watchSeconds = Number(savedProgress.watch_seconds || 0);
      durationSeconds = Number(savedProgress.duration_seconds || 0);
    }

    const saveProgress = async () => {
      durationSeconds = video.duration || durationSeconds;

      if (!durationSeconds || !watchSeconds) return;

      const percentage = Math.min(
        100,
        Math.floor((watchSeconds / durationSeconds) * 100)
      );

      const { error: saveError } = await supabase
        .from('course_progress')
        .upsert({
          student_id: currentUser.id,
          level: currentCourse,
          lesson_key: lessonId,
          watch_seconds: Math.floor(watchSeconds),
          duration_seconds: Math.ceil(durationSeconds),
          watch_percentage: percentage,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,lesson_key,level'
        });

      if (saveError) {
        console.error('MP4 progress save error:', saveError.message);
        return;
      }

      if (percentage >= 90) {


  // Award lesson XP only once after 90% completion
  const { data: earnedXP, error: xpError } = await supabase.rpc(
    'award_lesson_xp',
    {
      p_lesson_id: Number(lessonId)
    }
  );

  if (xpError) {
  console.error('XP award error:', xpError.message);
} else if (Number(earnedXP) > 0) {
  toast(`🏆 Congratulations! You earned ${earnedXP} XP!`, 'success');
}

// Log lesson completion independently of XP
await logStudentActivity(
  'lesson_completed',
  'course',
  {
    lesson_id: Number(lessonId),
    completion_percentage: percentage,
    video_type: 'mp4'
  }
);

}
    };

    video.addEventListener('loadedmetadata', () => {
      durationSeconds = video.duration || durationSeconds;
    });

    video.addEventListener('play', () => {
      lastTime = video.currentTime;

      if (timer) return;

      timer = setInterval(() => {
        if (video.paused || video.ended) return;

        const currentTime = video.currentTime;
        const difference = currentTime - lastTime;

        // Ignore large jumps caused by seeking
        if (difference > 0 && difference <= 2) {
          watchSeconds += difference;
        }

        lastTime = currentTime;
        durationSeconds = video.duration || durationSeconds;

        if (
          durationSeconds > 0 &&
          watchSeconds / durationSeconds >= 0.90
        ) {
          saveProgress();
          clearInterval(timer);
          timer = null;
        }
      }, 1000);
    });

    const stopTracking = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      saveProgress();
    };

    video.addEventListener('pause', stopTracking);
    video.addEventListener('ended', stopTracking);
  }
};
function renderResource(url, lessonId) {
  if (!url) return "";

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return "";
  }

  // Only allow secure web links
  if (parsed.protocol !== "https:" &&
      parsed.protocol !== "http:") {
    return "";
  }

  const safeUrl = parsed.href;
  const host = parsed.hostname.toLowerCase();
  let videoId = "";

  // YouTube video URL
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "www.youtube-nocookie.com"
  ) {
    videoId = parsed.searchParams.get("v") || "";

    if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/")[2] || "";
    }

    if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/")[2] || "";
    }
  } else if (
    host === "youtu.be" ||
    host === "www.youtu.be"
  ) {
    videoId = parsed.pathname.split("/")[1] || "";
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
  const playerId = 'youtube-player-' + (lessonId || videoId);

  return `
    <div class="lesson-video">
      <iframe
        id="${playerId}"
        data-youtube-player="true"
        data-lesson-id="${lessonId || ''}"
        src="https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}"
        title="French lesson video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write;
               encrypted-media; gyroscope; picture-in-picture;
               web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    </div>
  `;
}

  // Direct video file, such as MP4 or WebM
  if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) {
    return `
      <div class="lesson-video">
        <video
  controls
  playsinline
  preload="metadata"
  data-track-mp4="true"
  data-lesson-id="${lessonId || ''}">
          <source src="${safeUrl}">
          Your browser does not support video playback.
        </video>
      </div>
    `;
  }

  // Other links, such as platforms that need special embedding
  return `
    <a class="secondary-button"
       href="${safeUrl}"
       target="_blank"
       rel="noopener noreferrer">
      Open video ↗
    </a>
  `;
}
// LOAD SPEAKING PRACTICE HISTORY
const loadSpeakingPracticeHistory = async () => {
  const historyBox = $('speaking-practice-history');

  if (!historyBox || !currentUser || !currentCourse) return;

  historyBox.innerHTML = '<p>Loading practice history...</p>';

  const { data, error } = await supabase
    .from('speaking_practice_results')
    .select('language, target_text, spoken_text, match_percentage, created_at')
    .eq('student_id', currentUser.id)
    .eq('course_level', currentCourse)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Speaking history error:', error.message);
    historyBox.innerHTML = '<p>Could not load practice history.</p>';
    return;
  }

  if (!data || !data.length) {
    historyBox.innerHTML = '<p>No speaking practice yet.</p>';
    return;
  }

  historyBox.innerHTML = data.map(item => `
    <div class="data-row">
      <div>
        <strong>${esc(item.target_text)}</strong>
        <small>Language: ${esc(item.language.toUpperCase())}</small>
        <small>You said: ${esc(item.spoken_text || 'Not available')}</small>
        <small>🎯 Match: ${item.match_percentage}%</small>
        <small>📅 ${new Date(item.created_at).toLocaleString()}</small>
      </div>
    </div>
  `).join('');
};
  const loadCourseContent = async () => {
    const type=CONTENT_TYPES.find(t=>t.type===currentContentType); if(!type||!currentCourse)return;
    if(!assignedLevels.includes(currentCourse)){ $('content-detail-content').innerHTML='<div class="empty-state">This course is locked. Ask the admin for access.</div>';return; }
    $('content-detail-content').innerHTML=`<div class="page-intro"><span class="eyebrow">${currentCourse} COURSE</span><h1>${type.title}</h1><p>${type.desc}</p></div><div id="course-content-list" class="data-list"><div class="empty-state">Loading lessons…</div></div>`;
    const list=$('course-content-list');
    // HINDI - ENGLISH - FRENCH COMPARISON LESSON
if (currentContentType === 'conversation') {
  list.innerHTML = `

 <div class="form-card multilingual-practice-card">
  <h2>🌍 Multilingual Speaking Practice</h2>

  <label for="practice-language">Choose Language</label>
  <select id="practice-language">
    <option value="hi">🇮🇳 Hindi</option>
    <option value="en">🇬🇧 English</option>
    <option value="fr" selected>🇫🇷 French</option>
  </select>

  <h3 style="margin-top:18px;">📖 Teacher's Daily Sentence</h3>
  <label for="daily-sentence-select">Choose a Daily Sentence</label>
<select id="daily-sentence-select" style="width:100%;padding:10px;margin:8px 0;">
  <option value="">Loading sentences...</option>
</select>
  <p id="practice-phrase" style="font-size:18px;font-weight:600;margin:12px 0;">
    Bonjour, comment allez-vous ?
  </p>

  <div class="practice-buttons">
    <button class="secondary-button" id="practice-listen">🔊 Listen</button>
    <button class="primary-button" id="speak-french-practice">🎤 Speak</button>
  </div>

  <p id="french-speaking-result">Choose a language and practise speaking.</p>

  <hr style="margin:20px 0;border:0;border-top:1px solid #ddd;">

  <h3>✍️ Practise Your Own Sentence</h3>
  <p>Type your own word or sentence in the selected language.</p>

  <input type="text" id="custom-french-text"
    placeholder="Write your own sentence here..."
    style="width:100%;padding:12px;margin:10px 0;border:1px solid #ccc;border-radius:8px;">

  <div class="practice-buttons">
    <button class="secondary-button" id="custom-french-listen">🔊 Listen</button>
    <button class="primary-button" id="custom-french-speak">🎤 Speak</button>
  </div>

  <p id="custom-french-result">Your practice result will appear here.</p>

  <div class="speaking-game-panel compact-speaking-panel">
    <h3>🏆 Speaking Challenge</h3>
    <div class="speaking-stats">
      <span>⭐ XP: <strong id="speaking-xp">0</strong></span>
      <span>🔥 Streak: <strong id="speaking-streak">0</strong></span>
      <span>🎯 Match: <strong id="speaking-percentage">0%</strong></span>
    </div>
    <div id="speaking-word-results">Speak a sentence to see your word results.</div>
    <p id="speaking-game-message">Ready for your first challenge? 🌟</p>
    <div class="speaking-history-card" style="margin-top:18px;">
  <h3>📚 My Speaking Practice History</h3>
  <div id="speaking-practice-history">
    <p>Your practice history will appear here.</p>
  </div>
</div>
  </div>
</div>
  `;

 const phrases = {
  hi: {
    text: 'नमस्ते, आप कैसे हैं?',
    lang: 'hi-IN'
  },
  en: {
    text: 'Hello, how are you?',
    lang: 'en-IN'
  },
  fr: {
    text: 'Bonjour, comment allez-vous ?',
    lang: 'fr-FR'
  }
};

const languageSelect = $('practice-language');
const getSelectedVoice = (language) => {
  const voices = window.speechSynthesis.getVoices();

  const preferredVoices = {
    hi: 'Google हिन्दी',
    en: 'Google UK English Female',
    fr: 'Google français'
  };

  return voices.find(voice =>
    voice.name === preferredVoices[language]
  ) || voices.find(voice =>
    voice.lang === phrases[language].lang
  );
};
const phraseDisplay = $('practice-phrase');

let adminDailySentence = null;

const updatePracticePhrase = () => {
  const language = languageSelect.value;

  const sentenceFields = {
    hi: 'hindi_text',
    en: 'english_text',
    fr: 'french_text'
  };

  const selectedText = adminDailySentence
    ? adminDailySentence[sentenceFields[language]]
    : phrases[language].text;

  phraseDisplay.textContent = selectedText;
};

languageSelect.addEventListener('change', updatePracticePhrase);
// LOAD ALL PUBLISHED DAILY PRACTICE SENTENCES
const loadDailyPracticeSentence = async () => {
  const sentenceSelect = $('daily-sentence-select');

  const { data, error } = await supabase
    .from('daily_practice_sentences')
    .select('id, title, hindi_text, english_text, french_text, xp_points')
    .eq('course_level', currentCourse)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Could not load sentences:', error.message);
    sentenceSelect.innerHTML = '<option value="">Could not load sentences</option>';
    adminDailySentence = null;
    return;
  }

  const sentences = data || [];

  if (!sentences.length) {
    sentenceSelect.innerHTML = '<option value="">No sentences available</option>';
    adminDailySentence = null;
    updatePracticePhrase();
    return;
  }

  sentenceSelect.innerHTML = sentences.map(sentence => `
    <option value="${esc(sentence.id)}">
      ${esc(sentence.title)}
    </option>
  `).join('');

  adminDailySentence = sentences[0];
  sentenceSelect.value = sentences[0].id;

  updatePracticePhrase();

  sentenceSelect.addEventListener('change', () => {
    adminDailySentence = sentences.find(
      sentence => sentence.id === sentenceSelect.value
    ) || null;

    updatePracticePhrase();
  });
};
// LOAD SAVED SPEAKING PROGRESS
const loadSpeakingProgress = async () => {
  if (!currentUser || !currentCourse) return;
  // LOAD SPEAKING PRACTICE HISTORY

  const { data, error } = await supabase
    .from('speaking_practice_results')
    .select('match_percentage, xp_earned, created_at, sentence_id, target_text, language')
    .eq('student_id', currentUser.id)
    .eq('course_level', currentCourse)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Could not load speaking progress:', error.message);
    return;
  }

  const attempts = data || [];

// Keep only the latest attempt for each sentence
const uniqueAttempts = [];
const seenSentences = new Set();

for (const attempt of attempts) {
  const sentenceKey = attempt.sentence_id
    ? `${attempt.language}_${attempt.sentence_id}`
    : `${attempt.language}_${(attempt.target_text || '').toLowerCase().trim()}`;

  if (!seenSentences.has(sentenceKey)) {
    seenSentences.add(sentenceKey);
    uniqueAttempts.push(attempt);
  }
}

// Calculate XP from unique sentences only
speakingXP = uniqueAttempts.reduce(
  (total, attempt) => total + (attempt.xp_earned || 0),
  0
);

// Calculate streak from unique sentences
speakingStreak = 0;

for (const attempt of uniqueAttempts) {
  if (attempt.match_percentage >= 70) {
    speakingStreak++;
  } else {
    break;
  }
}

  const xpDisplay = $('speaking-xp');
  const streakDisplay = $('speaking-streak');
  const percentageDisplay = $('speaking-percentage');

  if (xpDisplay) xpDisplay.textContent = speakingXP;
  if (streakDisplay) streakDisplay.textContent = speakingStreak;

  if (percentageDisplay && uniqueAttempts.length) {
    percentageDisplay.textContent =
      uniqueAttempts[0].match_percentage + '%';
  }
};
loadDailyPracticeSentence();
loadSpeakingProgress();
loadSpeakingPracticeHistory();

$('practice-listen').addEventListener('click', () => {
  const language = languageSelect.value;

  const sentenceFields = {
    hi: 'hindi_text',
    en: 'english_text',
    fr: 'french_text'
  };

  const selectedText = adminDailySentence
    ? adminDailySentence[sentenceFields[language]]
    : phrases[language].text;

  const speech = new SpeechSynthesisUtterance(selectedText);
  const selectedVoice = getSelectedVoice(language);

  speech.lang = phrases[language].lang;

  if (selectedVoice) {
    speech.voice = selectedVoice;
  }

  speech.rate = language === 'fr' ? 0.65 : 0.80;
  speech.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
});
  // INDIVIDUAL FRENCH WORD AUDIO
list.querySelectorAll('[data-word-audio]').forEach(button => {
  button.addEventListener('click', () => {
    const word = button.dataset.wordAudio;
    const speech = new SpeechSynthesisUtterance(word);

    speech.lang = 'fr-FR';
    speech.rate = 0.55;
    speech.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  });
});

 
// CUSTOM FRENCH TEXT LISTEN
$('custom-french-listen').addEventListener('click', () => {
  const text = $('custom-french-text').value.trim();

  if (!text) {
    $('custom-french-result').textContent =
      'Please type a word or sentence first.';
    return;
  }

  const selectedLanguage = phrases[languageSelect.value];
console.log(window.speechSynthesis.getVoices().map(v => ({
  name: v.name,
  lang: v.lang
})));
 const speech = new SpeechSynthesisUtterance(text);
const selectedVoice = getSelectedVoice(languageSelect.value);

speech.lang = selectedLanguage.lang;

if (selectedVoice) {
  speech.voice = selectedVoice;
}

speech.rate = languageSelect.value === 'fr' ? 0.65 : 0.80;
speech.pitch = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);

  $('custom-french-result').textContent =
    '🔊 Playing your sentence...';
});
// CUSTOM FRENCH SPEAK PRACTICE
$('custom-french-speak').addEventListener('click', () => {
    speakingResultSaved = false;
  const text = $('custom-french-text').value.trim();
  const result = $('custom-french-result');

  if (!text) {
    result.textContent =
      'Please type a French word or sentence first.';
    return;
  }

  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    result.textContent =
      'Speech recognition is not supported in this browser.';
    return;
  }

  const recognition = new Recognition();
  recognition.lang = phrases[languageSelect.value].lang;
  recognition.interimResults = false;

  result.textContent = '⏳ Microphone starting...';

recognition.onstart = () => {
  result.textContent = '🎤 Listening... Speak your sentence.';
};

  recognition.onresult = async event => {
  const spoken = event.results[0][0].transcript;

  const normalizeText = value =>
    value.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,!?;:'"।॥]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const expectedWords = normalizeText(text).split(' ');
  const spokenWords = normalizeText(spoken).split(' ');

  const matchedWords = expectedWords.filter(
    (word, index) => word === spokenWords[index]
  ).length;

  const percentage = Math.round(
    (matchedWords / Math.max(expectedWords.length, 1)) * 100
  );
  
  // CHECK IF THIS CUSTOM SENTENCE ALREADY EARNED XP
const normalizeSentence = value =>
  value.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:'"।॥]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

let alreadyEarnedXP = false;

if (currentUser && currentCourse && percentage >= 70) {
  const { data: previousAttempts, error: checkError } = await supabase
    .from('speaking_practice_results')
    .select('target_text, match_percentage')
    .eq('student_id', currentUser.id)
    .eq('course_level', currentCourse)
    .eq('language', languageSelect.value)
    .gte('match_percentage', 70);

  if (checkError) {
    console.error('Custom sentence XP check failed:', checkError.message);
  } else {
    alreadyEarnedXP = (previousAttempts || []).some(
      attempt =>
        normalizeSentence(attempt.target_text) === normalizeSentence(text)
    );
  }
}
  const percentageDisplay = $('speaking-percentage');

if (percentageDisplay) {
  percentageDisplay.textContent = percentage + '%';
}

 // COMPACT SPEAKING GAME RESULT
const xpDisplay = $('speaking-xp');
const streakDisplay = $('speaking-streak');
const wordResults = $('speaking-word-results');
const gameMessage = $('speaking-game-message');

let currentXP = Number(xpDisplay.textContent) || 0;
let currentStreak = Number(streakDisplay.textContent) || 0;

const wordFeedback = expectedWords.map((word, index) => {
  return word === spokenWords[index]
    ? `${word} ✓`
    : `${word} ✗`;
});

wordResults.textContent = wordFeedback.join('  |  ');

if (percentage >= 90) {
  currentStreak += 1;
  gameMessage.textContent = '🌟 Excellent! Great practice!';
} else if (percentage >= 70) {
  currentStreak += 1;
  gameMessage.textContent = '👍 Good practice! Keep it up!';
} else {
  currentStreak = 0;
  gameMessage.textContent = '💪 Keep Practising!';
}

xpDisplay.textContent = currentXP;
streakDisplay.textContent = currentStreak;

result.textContent =
  `You said: ${spoken} — 🎯 ${percentage}% match`;
  // SAVE SPEAKING PRACTICE RESULT TO SUPABASE
// OWN SENTENCE PRACTICE: NO XP
speakingAttemptXP = 0;

if (!speakingResultSaved && currentUser && currentCourse) {
  speakingResultSaved = true;

  const { error: saveError } = await supabase
    .from('speaking_practice_results')
    .insert({
      student_id: currentUser.id,
      course_level: currentCourse,
      sentence_id: null,
      language: languageSelect.value,
      target_text: text,
      spoken_text: spoken,
      match_percentage: percentage,
      xp_earned: speakingAttemptXP
    });

  if (saveError) {
    speakingResultSaved = false;
    console.error('Speaking result save failed:', saveError.message);
  } else {
    console.log('Speaking result saved successfully.');
    console.log('Custom sentence XP saved:', speakingAttemptXP);
  }
}
};

 recognition.onerror = event => {
  result.textContent =
    'Microphone error: ' + event.error;
  console.log('Speech recognition error:', event.error);
};

  recognition.start();
});
// TEACHER'S DAILY SENTENCE SPEAK PRACTICE
$('speak-french-practice').addEventListener('click', () => {
  speakingResultSaved = false;
  const text = $('practice-phrase').textContent.trim();
  const sentenceId = adminDailySentence?.id || null;
  const result = $('french-speaking-result');

  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    result.textContent =
      'Speech recognition is not supported in this browser.';
    return;
  }

  const recognition = new Recognition();
  recognition.lang = phrases[languageSelect.value].lang;
  recognition.interimResults = false;

  recognition.onstart = () => {
    result.textContent = '🎤 Listening... Speak the displayed sentence.';
  };

  recognition.onresult = async event => {
    const spoken = event.results[0][0].transcript;

    const normalizeText = value =>
      value.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
       .replace(/[.,!?;:'"।॥]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const expectedWords = normalizeText(text).split(' ');
    const spokenWords = normalizeText(spoken).split(' ');

    const matchedWords = expectedWords.filter(
      (word, index) => word === spokenWords[index]
    ).length;

    const percentage = Math.round(
      matchedWords / Math.max(expectedWords.length, 1) * 100
    );
    

    $('speaking-percentage').textContent = percentage + '%';

    const xpDisplay = $('speaking-xp');
    const streakDisplay = $('speaking-streak');
    const wordResults = $('speaking-word-results');
    const gameMessage = $('speaking-game-message');

    let currentXP = Number(xpDisplay.textContent) || 0;
    let currentStreak = Number(streakDisplay.textContent) || 0;

    wordResults.textContent = expectedWords.map((word, index) =>
      word === spokenWords[index] ? `${word} ✓` : `${word} ✗`
    ).join(' | ');

  // CHECK WHETHER THIS SENTENCE ALREADY EARNED XP
let alreadyEarnedXP = false;

if (sentenceId && currentUser) {
  const { data: previousResult, error: checkError } = await supabase
    .from('speaking_practice_results')
    .select('id')
    .eq('student_id', currentUser.id)
    .eq('course_level', currentCourse)
    .eq('sentence_id', sentenceId)
    .gte('match_percentage', 70)
    .limit(1);

  if (checkError) {
    console.error('XP check failed:', checkError.message);
  } else {
    alreadyEarnedXP = (previousResult || []).length > 0;
  }
}

// CALCULATE XP
const xpToSave = alreadyEarnedXP
  ? 0
  : (
      sentenceId
        ? Number(adminDailySentence?.xp_points || 0)
        : (percentage >= 90 ? 10 : percentage >= 70 ? 5 : 0)
    );

// UPDATE XP AND STREAK
if (percentage >= 70) {
  if (!alreadyEarnedXP) {
    currentXP += xpToSave;
    currentStreak += 1;
    gameMessage.textContent = `🌟 Great! +${xpToSave} XP`;
  } else {
    gameMessage.textContent = '🌟 This sentence has already earned XP.';
  }
} else {
  currentStreak = 0;
  gameMessage.textContent = '💪 Keep Practising!';
}

xpDisplay.textContent = currentXP;
streakDisplay.textContent = currentStreak;

result.textContent =
  `You said: ${spoken} — 🎯 ${percentage}% match`;
      // SAVE TEACHER SENTENCE PRACTICE RESULT

if (!speakingResultSaved && currentUser && currentCourse) {
  speakingResultSaved = true;

  const { error: saveError } = await supabase
    .from('speaking_practice_results')
    .insert({
      student_id: currentUser.id,
      course_level: currentCourse,
      sentence_id: sentenceId,
      language: languageSelect.value,
      target_text: text,
      spoken_text: spoken,
      match_percentage: percentage,
      xp_earned: xpToSave
    });

  if (saveError) {
    speakingResultSaved = false;
    console.error('Speaking result save failed:', saveError.message);
  } else {
    console.log('Teacher speaking result saved.');
  }
}
  };

  recognition.onerror = event => {
    result.textContent = 'Microphone error: ' + event.error;
  };

  recognition.start();
});
  return;
}
    if(currentContentType==='live'){
      const {data,error}=await supabase.from('live_classes').select('*').eq('course_level',currentCourse)
.gte('starts_at', new Date().toISOString())
.order('starts_at',{ascending:true});
      if(error){list.innerHTML='<div class="empty-state">Could not load live classes. Check database setup.</div>';return;}
    list.innerHTML = (data || []).length
  ? (data || []).map(x => {
      const startsAt = new Date(x.starts_at);
      const minutesUntil = Math.ceil(
        (startsAt.getTime() - Date.now()) / 60000
      );

      let reminderText = 'Upcoming class';
const countdownId = `class-countdown-${x.id}`;
      if (minutesUntil <= 15) {
        reminderText = '🔔 Reminder: Class starts within 15 minutes!';
      } else if (minutesUntil <= 60) {
        reminderText = '⏰ Reminder: Class starts within 1 hour!';
      } else if (minutesUntil <= 1440) {
        reminderText = '📢 Reminder: Class starts within 24 hours!';
      }

      return `
        <div class="data-row">
          <div>
            <strong>${esc(x.title)}</strong>

            <small>
              ${esc(x.teacher_name || 'Teacher TBA')}
              · ${startsAt.toLocaleString()}
            </small>

            <small id="class-reminder-${x.id}" style="color:#2563eb;font-weight:600;">
              ${esc(reminderText)}
            </small>
            <small id="${countdownId}" style="color:#15803d;font-weight:700;">
  Calculating countdown...
</small>
          </div>

          ${
            x.meeting_url
              ? `<a class="secondary-button"
                   href="${esc(x.meeting_url)}"
                   target="_blank"
                   rel="noopener noreferrer">
                   Join Class ↗
                 </a>`
              : '<small>Meeting link not added yet</small>'
          }
        </div>
      `;
    }).join('')
  : '<div class="empty-state">No live classes scheduled for this level yet.</div>';
  // LIVE CLASS COUNTDOWN AND AUTOMATIC REMINDERS
if (liveClassCountdownTimer) {
  clearInterval(liveClassCountdownTimer);
}

const updateLiveClassCountdown = () => {
  (data || []).forEach(x => {
    const countdownElement = $(`class-countdown-${x.id}`);
    const reminderElement = $(`class-reminder-${x.id}`);

    if (!countdownElement) return;

    const remainingMs = new Date(x.starts_at).getTime() - Date.now();

    if (remainingMs <= 0) {
      countdownElement.textContent = '🔴 Class is starting now!';
      if (reminderElement) {
        reminderElement.textContent = '🔔 Your class is starting now!';
      }
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownElement.textContent =
      `⏳ Starts in ${days ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`;

    if (reminderElement) {
      if (remainingMs <= 15 * 60 * 1000) {
        reminderElement.textContent = '🔔 Special Reminder: Class starts within 15 minutes!';
      } else if (remainingMs <= 60 * 60 * 1000) {
        reminderElement.textContent = '⏰ Reminder: Class starts within 1 hour!';
      } else if (remainingMs <= 24 * 60 * 60 * 1000) {
        reminderElement.textContent = '📢 Reminder: Class starts within 24 hours!';
      } else {
        reminderElement.textContent = 'Upcoming class';
      }
    }
  });
};

updateLiveClassCountdown();
liveClassCountdownTimer = setInterval(updateLiveClassCountdown, 1000);

return;
    }
   const {data,error}=await supabase
  .from('course_content')
  .select('id,title,description,resource_url,thumbnail_url,content_type,created_at')
  .eq('course_level',currentCourse)
  .eq('content_type',currentContentType)
  .eq('is_published', true)
  .order('created_at',{ascending:false});

if(error){
  list.innerHTML='<div class="empty-state">Could not load content. Confirm that the SQL setup has been applied.</div>';
  return;
}

const rows = data || [];

// Load this student's completed lessons
const { data: progressRows, error: progressError } = await supabase
  .from('course_progress')
 .select('lesson_key,watch_percentage,watch_seconds,duration_seconds')
  .eq('student_id', currentUser.id)
  .eq('level', currentCourse);

if(progressError){
  console.error('Could not load lesson progress:', progressError.message);
}

const completedLessons = new Set(
  (progressRows || [])
    .filter(item => {
      const lesson = rows.find(
        x => String(x.id) === String(item.lesson_key)
      );

      if (!lesson) return false;

      const url = String(lesson.resource_url || '');

      const isYouTube = /youtube\.com|youtu\.be/i.test(url);
      const isDirectVideo = /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url);
      const isTrackedVideo = isYouTube || isDirectVideo;

      // YouTube/MP4: 90% watch required
      if (isTrackedVideo) {
        return Number(item.watch_percentage) >= 90;
      }

      // Google Drive/normal lessons: saved completion is enough
      return true;
    })
    .map(item => String(item.lesson_key))
);

// Display lessons and completion buttons
list.innerHTML = rows.length ? rows.map(x => {
 const isCompleted = completedLessons.has(String(x.id));
 const resourceUrl = String(x.resource_url || '');

const isYouTube = /youtube\.com|youtu\.be/i.test(resourceUrl);

const isDirectVideo = /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(resourceUrl);

const isTrackedVideo = isYouTube || isDirectVideo;

  return `
    <div class="data-row">
      <div>
        ${x.thumbnail_url ? `
          <img src="${esc(x.thumbnail_url)}"
               alt="${esc(x.title)}"
               style="width:100%;max-width:260px;height:145px;object-fit:cover;border-radius:10px;margin-bottom:10px;">
        ` : ''}

        <strong>${esc(x.title)}</strong>
        <small>${esc(x.description || type.desc)}</small>

      
      </div>

      ${x.resource_url ? renderResource(x.resource_url, x.id) : ''}
    </div>
  `;
}).join('') : '<div class="empty-state">No content added here yet. The admin can add lessons from Admin Panel.</div>';
initializeYouTubeTracking();
initializeMP4Tracking();
};
  const renderProfileAccess = () => {const el=$('profile-access-list'); if(!el)return;el.innerHTML=LEVELS.map(c=>{const ok=assignedLevels.includes(c.level);return `<div class="data-row"><div><strong>${c.level} — ${c.name}</strong><small>${ok?'You have access to this course.':'Waiting for admin to assign access.'}</small></div><span class="${ok?'access-chip unlocked':'lock-chip'}">${ok?'Unlocked':'🔒 Locked'}</span></div>`}).join('');};
    
  // LOAD ADMIN SPEAKING PERFORMANCE
const loadAdminSpeakingPerformance = async () => {
  if (profile?.role !== 'admin') return;

  const box = $('admin-speaking-performance');
  if (!box) return;

  box.innerHTML = '<p>Loading speaking performance...</p>';

  const [
    { data: students, error: studentError },
    { data: results, error: resultError }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('role', 'admin'),

    supabase
      .from('speaking_practice_results')
      .select('student_id, course_level, sentence_id, language, target_text, xp_earned, match_percentage, created_at')
      .order('created_at', { ascending: false })
  ]);

  if (studentError || resultError) {
    console.error('Speaking dashboard error:', studentError || resultError);
    box.innerHTML = '<p>Could not load speaking performance.</p>';
    return;
  }

  const attemptsByStudent = {};

(results || []).forEach(item => {
  if (!attemptsByStudent[item.student_id]) {
    attemptsByStudent[item.student_id] = [];
  }

  attemptsByStudent[item.student_id].push(item);
});

// Keep only the latest attempt for each unique sentence
Object.keys(attemptsByStudent).forEach(studentId => {
  const seenSentences = new Set();

  attemptsByStudent[studentId] = attemptsByStudent[studentId].filter(item => {
    const sentenceKey = item.sentence_id
      ? `${item.course_level}_${item.language}_${item.sentence_id}`
      : `${item.course_level}_${item.language}_${(item.target_text || '').toLowerCase().trim()}`;

    if (seenSentences.has(sentenceKey)) return false;

    seenSentences.add(sentenceKey);
    return true;
  });
});

  if (!students || !students.length) {
    box.innerHTML = '<p>No students found.</p>';
    return;
  }

  box.innerHTML = students.map(student => {
    const attempts = attemptsByStudent[student.id] || [];

    const totalXP = attempts.reduce(
      (sum, item) => sum + (item.xp_earned || 0), 0
    );

    const latestMatch = attempts.length
  ? attempts[0].match_percentage
  : 0;

    let streak = 0;
    for (const item of attempts) {
      if (item.match_percentage >= 70) {
        streak++;
      } else {
        break;
      }
    }

   return `
  <div class="premium-student-card speaking-student-card">
    <div class="premium-student-header">
      <div class="premium-student-avatar">🎓</div>
      <div class="premium-student-name">
        <strong>${esc(student.full_name || 'Student')}</strong>
        <small>Speaking Performance</small>
      </div>
    </div>

    <div class="premium-student-stats">
      <div class="premium-student-stat">
        <span>⭐ Total XP</span>
        <strong>${totalXP}</strong>
      </div>

      <div class="premium-student-stat">
        <span>🔥 Recent Streak</span>
        <strong>${streak}</strong>
      </div>

      <div class="premium-student-stat">
        <span>🎯 Latest Match</span>
        <strong>${latestMatch}%</strong>
      </div>

      <div class="premium-student-stat">
        <span>📝 Attempts</span>
        <strong>${attempts.length}</strong>
      </div>
    </div>
  </div>
`;
  }).join('');
};
// LOAD ADMIN STUDENT-WISE XP REPORT
const loadAdminXPReport = async () => {
  if (profile?.role !== 'admin') return;

  const box = $('admin-xp-report');
  if (!box) return;

  box.innerHTML = '<p>Loading student XP report...</p>';

  const [
    { data: students, error: studentError },
    { data: quizRows, error: quizError },
    { data: lessonRows, error: lessonError },
    { data: speakingRows, error: speakingError }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('role', 'admin'),

    supabase
      .from('quiz_results')
      .select('student_id, points'),

    supabase
      .from('student_xp_transactions')
      .select('student_id, xp_earned, activity_type'),

    supabase
      .from('speaking_practice_results')
      .select('student_id, sentence_id, xp_earned')
  ]);

  if (studentError || quizError || lessonError || speakingError) {
   console.error('XP report error:', {
  studentError,
  quizError,
  lessonError,
  speakingError
});
alert(
  'Student: ' + (studentError?.message || 'OK') +
  '\nQuiz: ' + (quizError?.message || 'OK') +
  '\nLesson: ' + (lessonError?.message || 'OK') +
  '\nSpeaking: ' + (speakingError?.message || 'OK')
);
    box.innerHTML = '<p>Could not load XP report.</p>';
    return;
  }

  box.innerHTML = (students || []).map(student => {
    const quizXP = (quizRows || [])
      .filter(item => item.student_id === student.id)
      .reduce((sum, item) => sum + Number(item.points || 0), 0);

    const videoXP = (lessonRows || [])
      .filter(item => item.student_id === student.id)
      .reduce((sum, item) => sum + Number(item.xp_earned || 0), 0);

    const speaking = (speakingRows || [])
      .filter(item => item.student_id === student.id);

    const teacherXP = speaking
      .filter(item => item.sentence_id !== null)
      .reduce((sum, item) => sum + Number(item.xp_earned || 0), 0);

    const totalXP = quizXP + videoXP + teacherXP;

   return `
  <div class="premium-student-card xp-student-card">

    <div class="premium-student-header">
      <div class="premium-student-avatar">🏆</div>

      <div class="premium-student-name">
        <strong>${esc(student.full_name || 'Student')}</strong>
        <small>Learning Achievements</small>
      </div>

      <div class="xp-total-badge">
        ${totalXP} XP
      </div>
    </div>

    <div class="premium-student-stats">

      <div class="premium-student-stat">
        <span>🏆 Total XP</span>
        <strong>${totalXP}</strong>
      </div>

      <div class="premium-student-stat">
        <span>📝 Quiz XP</span>
        <strong>${quizXP}</strong>
      </div>

      <div class="premium-student-stat">
        <span>🎬 Lesson XP</span>
        <strong>${videoXP}</strong>
      </div>

      <div class="premium-student-stat">
        <span>🎤 Speaking XP</span>
        <strong>${teacherXP}</strong>
      </div>

    </div>
  </div>
`;
  }).join('') || '<p>No students found.</p>';
};
  const loadAdminStudents = async () => {
    if (profile?.role !== 'admin') return;

    const el = $('admin-student-list');
    if (!el) return;

    el.innerHTML =
      '<div class="empty-state">Loading students…</div>';

    // Last 30 days ki activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

       const [
      { data: students, error: sErr },
      { data: access, error: aErr },
      { data: activity, error: activityErr },
      { data: quizResults, error: quizErr },
      { data: speakingResults, error: speakingErr },
{ data: xpTransactions, error: xpErr }
    ] = await Promise.all([
      supabase
       .from('profiles')
.select('id,full_name,role,created_at,email,phone')
.order('created_at', { ascending: false }),

      supabase
        .from('course_access')
        .select('student_id,level'),

      supabase
        .from('student_activity_logs')
        .select('student_id,event_type,created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('quiz_results')
        .select('student_id,level,correct_answers,total_questions,points,created_at')
        .order('created_at', { ascending: false })
        .limit(5000)
        ,
supabase
  .from('speaking_practice_results')
  .select('student_id,course_level,sentence_id,language,target_text,xp_earned,match_percentage,created_at')
  .order('created_at', { ascending: false })
  .limit(5000),

supabase
  .from('student_xp_transactions')
  .select('student_id,xp_earned,activity_type')
  .limit(5000)
    ]);

    if (sErr || aErr) {
      el.innerHTML =
        '<div class="empty-state">Could not load admin data. Check SQL policies and confirm this user is an admin.</div>';
      return;
    }

    const nonAdmin = (students || []).filter(
      s => s.role !== 'admin'
    );
    // ADMIN OVERVIEW STATS
const totalStudents = nonAdmin.length;

const totalAccess = (access || []).length;

const totalQuizAttempts = (quizResults || []).length;

const activeStudents = new Set(
  (activity || [])
    .filter(item => item.event_type === 'login')
    .map(item => item.student_id)
).size;

if ($('admin-total-students')) {
  $('admin-total-students').textContent = totalStudents;
}

if ($('admin-total-access')) {
  $('admin-total-access').textContent = totalAccess;
}

if ($('admin-total-quiz-attempts')) {
  $('admin-total-quiz-attempts').textContent = totalQuizAttempts;
}

if ($('admin-active-students')) {
  $('admin-active-students').textContent = activeStudents;
}

    if (!nonAdmin.length) {
      el.innerHTML =
        '<div class="empty-state">No student accounts found yet.</div>';
      return;
    }

    // Activity ko student-wise arrange karein
    const activityByStudent = {};

    (activity || []).forEach(item => {
      if (!activityByStudent[item.student_id]) {
        activityByStudent[item.student_id] = [];
      }

      activityByStudent[item.student_id].push(item);
    });
        // Quiz results ko student-wise arrange karein
    const quizByStudent = {};

    (quizResults || []).forEach(result => {
      if (!quizByStudent[result.student_id]) {
        quizByStudent[result.student_id] = [];
      }

      quizByStudent[result.student_id].push(result);
    });
    // Speaking results ko student-wise arrange karein
const speakingByStudent = {};

(speakingResults || []).forEach(result => {
  if (!speakingByStudent[result.student_id]) {
    speakingByStudent[result.student_id] = [];
  }

  speakingByStudent[result.student_id].push(result);
});

// Learning XP transactions ko student-wise arrange karein
const xpByStudent = {};

(xpTransactions || []).forEach(result => {
  if (!xpByStudent[result.student_id]) {
    xpByStudent[result.student_id] = [];
  }

  xpByStudent[result.student_id].push(result);
});

   const renderStudentCards = (studentList) => studentList.map(s => {
      const set = (access || [])
        .filter(a => a.student_id === s.id)
        .map(a => a.level);

      const studentActivity =
        activityByStudent[s.id] || [];
              // Student quiz performance
      const studentQuizzes = quizByStudent[s.id] || [];
      // Student speaking performance
const studentSpeaking = speakingByStudent[s.id] || [];

const uniqueSpeaking = [];
const seenSpeaking = new Set();

studentSpeaking.forEach(item => {
  const key = `${item.course_level}:${item.language}:${
    item.sentence_id || item.target_text
  }`;

  if (!seenSpeaking.has(key)) {
    seenSpeaking.add(key);
    uniqueSpeaking.push(item);
  }
});

const speakingXP = uniqueSpeaking.reduce(
  (sum, item) => sum + (Number(item.xp_earned) || 0), 0
);

const speakingStreak = uniqueSpeaking
  .filter((item, index, arr) => {
    const firstFailed = arr.findIndex(
      x => Number(x.match_percentage) < 70
    );
    return firstFailed === -1 || index < firstFailed;
  }).length;

const latestMatch = uniqueSpeaking.length
  ? Number(uniqueSpeaking[0].match_percentage) || 0
  : 0;

// Student learning XP
const studentTransactions = xpByStudent[s.id] || [];

const quizXP = studentQuizzes.reduce(
  (sum, item) => sum + (Number(item.points) || 0), 0
);

const videoXP = studentTransactions.reduce(
  (sum, item) => sum + (Number(item.xp_earned) || 0), 0
);

const teacherXP = studentSpeaking
  .filter(item => item.sentence_id !== null)
  .reduce(
    (sum, item) => sum + (Number(item.xp_earned) || 0), 0
  );

const totalLearningXP = quizXP + videoXP + teacherXP;

      const totalQuizzes = studentQuizzes.length;

      const averageScore = totalQuizzes
        ? Math.round(
            studentQuizzes.reduce((sum, quiz) => {
              const total = Number(quiz.total_questions) || 0;
              const correct = Number(quiz.correct_answers) || 0;

              return sum + (total > 0 ? (correct / total) * 100 : 0);
            }, 0) / totalQuizzes
          )
        : 0;

      const bestScore = totalQuizzes
        ? Math.max(
            ...studentQuizzes.map(quiz => {
              const total = Number(quiz.total_questions) || 0;
              const correct = Number(quiz.correct_answers) || 0;

              return total > 0
                ? Math.round((correct / total) * 100)
                : 0;
            })
          )
        : 0;

      const latestQuiz = studentQuizzes[0];

      const latestScore = latestQuiz &&
        Number(latestQuiz.total_questions) > 0
          ? Math.round(
              (Number(latestQuiz.correct_answers) /
              Number(latestQuiz.total_questions)) * 100
            )
          : null;

      // Latest recorded activity
      const lastSeen = studentActivity.length
        ? new Date(studentActivity[0].created_at).toLocaleString()
        : 'No activity recorded';

      // Attendance: distinct dates with a login event
      const attendanceDays = new Set(
        studentActivity
          .filter(item => item.event_type === 'login')
          .map(item =>
            new Date(item.created_at).toLocaleDateString()
          )
      ).size;
            // Monthly attendance percentage (last 30 days)
      const attendancePercentage = Math.round(
        (attendanceDays / 30) * 100
      );
            // Last 7 days attendance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const attendanceLast7Days = new Set(
        studentActivity
          .filter(item =>
            item.event_type === 'login' &&
            new Date(item.created_at) >= sevenDaysAgo
          )
          .map(item => new Date(item.created_at).toLocaleDateString())
      ).size;

return `
  <article class="student-row"
    data-student-row="${esc(s.id)}"
    data-search="${esc(`${s.full_name || ''} ${s.email || ''} ${s.phone || ''}`.toLowerCase())}">

    <div class="student-row-head">
      <div class="student-id">
        <div class="avatar">${esc((s.full_name || 'S')[0].toUpperCase())}</div>
        <div>
          <strong>${esc(s.full_name || 'Student')}</strong>
          <small>Joined ${
            s.created_at
              ? new Date(s.created_at).toLocaleDateString()
              : '—'
          }</small>
          <small>📧 ${esc(s.email || 'Email not available')}</small>
${s.phone ? `<small>📱 ${esc(s.phone)}</small>` : ''}
        </div>
      </div>

      <span class="${set.length ? 'access-chip unlocked' : 'lock-chip'}">
        ${set.length
          ? `${set.length} course(s) unlocked`
          : 'Access pending'}
      </span>
    </div>

    <div class="student-quick-stats">
      <div>
        <span>⭐ Learning XP</span>
        <strong>${totalLearningXP}</strong>
      </div>
      <div>
        <span>📝 Quizzes</span>
        <strong>${totalQuizzes}</strong>
      </div>
      <div>
        <span>📅 Attendance</span>
        <strong>${attendancePercentage}%</strong>
      </div>
    </div>

    <details class="student-details">
      <summary>View Student Details</summary>

      <div class="student-details-content">

        <div class="data-row">
          <div>
            <strong>Last Seen</strong>
            <small>${esc(lastSeen)}</small>
          </div>
        </div>

        <div class="data-row">
          <div>
            <strong>Attendance — Last 30 Days</strong>
            <small>
              ${attendanceDays} day(s) with recorded login
              ${activityErr ? ' · Activity data unavailable' : ''}
            </small>
          </div>
        </div>

        <div class="data-row">
          <div>
            <strong>Attendance — Last 7 Days</strong>
            <small>${attendanceLast7Days} day(s) with recorded login</small>
          </div>
        </div>

        <div class="data-row">
          <div>
            <strong>Monthly Attendance Percentage</strong>
            <small>${attendancePercentage}% attendance in last 30 days</small>
          </div>
        </div>

        <div class="data-row">
          <div>
            <strong>Quiz Performance</strong>
            <small>Total Quizzes Attempted: ${totalQuizzes}</small>
            <small>Average Score: ${averageScore}%</small>
            <small>Best Score: ${bestScore}%</small>
            <small>
              Latest Quiz Score:
              ${latestScore === null ? 'No quiz attempted' : `${latestScore}%`}
            </small>
          </div>
        </div>

        <div class="data-row">
          <div>
            <strong>🎤 Speaking Performance</strong>
            <small>Speaking XP: ${speakingXP}</small>
            <small>Recent Streak: ${speakingStreak}</small>
            <small>Latest Match: ${latestMatch}%</small>
            <small>Practice Attempts: ${uniqueSpeaking.length}</small>
          </div>
        </div>

        <div class="data-row">
          <div>
            <strong>⭐ Total Learning XP: ${totalLearningXP}</strong>
            <small>Quiz XP: ${quizXP}</small>
            <small>Video/Lesson XP: ${videoXP}</small>
            <small>Teacher Speaking XP: ${teacherXP}</small>
          </div>
        </div>

      </div>
    </details>

    <div class="course-checkboxes">
      ${LEVELS.map(c => `
        <label>
          <input
            type="checkbox"
            data-level="${c.level}"
            ${set.includes(c.level) ? 'checked' : ''}
          >
          ${c.level}
        </label>
      `).join('')}
    </div>

    <div class="student-actions">
      <button class="primary-button" data-save-access="${esc(s.id)}">
        Save access
      </button>

      <button class="secondary-button" data-revoke-access="${esc(s.id)}">
        Revoke all
      </button>
<button
  type="button"
  class="secondary-button"
  data-edit-contact="${esc(s.id)}"
  data-student-name="${esc(s.full_name || 'Student')}"
  data-student-phone="${esc(s.phone || '')}"
>
  Edit Contact
</button>
      <button
        type="button"
        class="secondary-button"
        data-view-activity="${esc(s.id)}"
        data-student-name="${esc(s.full_name || 'Student')}"
      >
        View Activity
      </button>
    </div>

  </article>
      `;
    }).join('');

   // Dashboard: sirf students jinke paas koi course access nahi
const dashboardStudents = nonAdmin.filter(s =>
  !(access || []).some(a => a.student_id === s.id)
);
console.log('Dashboard students:', dashboardStudents);

el.innerHTML = `
  <div class="admin-student-search">
    <input
      type="search"
      id="admin-student-search"
      placeholder="🔍 Search by name, Gmail or mobile number..."
      autocomplete="off"
    >
  </div>
  <div id="admin-student-search-results">
    ${renderStudentCards(dashboardStudents)}
  </div>
`;
const searchInput = $('admin-student-search');
const searchResults = $('admin-student-search-results');

if (searchInput && searchResults) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

   const studentsToSearch = query ? nonAdmin : dashboardStudents;

const filteredStudents = studentsToSearch.filter(s => {
      const searchText = `
        ${s.full_name || ''}
        ${s.email || ''}
        ${s.phone || ''}
      `.toLowerCase();

      return searchText.includes(query);
    });

    searchResults.innerHTML = filteredStudents.length
      ? renderStudentCards(filteredStudents)
      : '<div class="empty-state">No matching students found.</div>';

    // Filter hone ke baad buttons dobara active karo
    searchResults.querySelectorAll('[data-save-access]').forEach(b => {
      b.addEventListener('click', () =>
        saveStudentAccess(b.dataset.saveAccess)
      );
    });

    searchResults.querySelectorAll('[data-revoke-access]').forEach(b => {
      b.addEventListener('click', () =>
        revokeStudentAccess(b.dataset.revokeAccess)
      );
    });

    searchResults.querySelectorAll('[data-view-activity]').forEach(b => {
      b.addEventListener('click', () =>
        loadStudentActivity(
          b.dataset.viewActivity,
          b.dataset.studentName
        )
      );
    });
    searchResults.querySelectorAll('[data-edit-contact]').forEach(b => {
  b.addEventListener('click', () =>
    editStudentContact(
      b.dataset.editContact,
      b.dataset.studentName,
      b.dataset.studentPhone
    )
  );
});
  });
}
// Course-wise student cards
LEVELS.forEach(course => {
  const courseEl = $('admin-student-list-' + course.level);
  if (!courseEl) return;

  const courseStudents = nonAdmin.filter(s =>
    (access || []).some(a =>
      a.student_id === s.id && a.level === course.level
    )
  );

  courseEl.innerHTML = courseStudents.length
    ? renderStudentCards(courseStudents)
    : '<div class="empty-state">No students have access to this course yet.</div>';
});

// Student card buttons: Dashboard aur sabhi courses mein
const studentContainers = [
  el,
  ...LEVELS.map(course => $('admin-student-list-' + course.level))
].filter(Boolean);

studentContainers.forEach(container => {
  container.querySelectorAll('[data-save-access]').forEach(b => {
    b.addEventListener('click', () =>
      saveStudentAccess(b.dataset.saveAccess)
    );
  });

  container.querySelectorAll('[data-revoke-access]').forEach(b => {
    b.addEventListener('click', () =>
      revokeStudentAccess(b.dataset.revokeAccess)
    );
  });

  container.querySelectorAll('[data-view-activity]').forEach(b => {
    b.addEventListener('click', () =>
      loadStudentActivity(
        b.dataset.viewActivity,
        b.dataset.studentName
      )
    );
  });
});
};


  const loadStudentActivity = async (studentId, studentName) => {
    if (profile?.role !== 'admin') return;

    const panel = $('admin-student-activity');
    const title = $('activity-student-title');
    const list = $('admin-student-activity-list');

    if (!panel || !title || !list) {
      toast('Activity panel HTML not found.', 'error');
      return;
    }

    panel.classList.remove('hidden');
    title.textContent = `${studentName} — Activity History`;
    list.innerHTML =
      '<div class="empty-state">Loading activity…</div>';

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const { data, error } = await supabase
      .from('student_activity_logs')
      .select('event_type,page,metadata,created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Could not load student activity:', error);
      list.innerHTML =
        '<div class="empty-state">Could not load activity. Check the activity table and admin read policy.</div>';
      return;
    }

    if (!data || !data.length) {
      list.innerHTML =
        '<div class="empty-state">No activity recorded for this student yet.</div>';
      return;
    }
// Get lesson titles for completed lessons
const lessonIds = [
  ...new Set(
    data
      .filter(item => item.event_type === 'lesson_completed')
      .map(item => Number(item.metadata?.lesson_id))
      .filter(id => Number.isFinite(id) && id > 0)
  )
];

let lessonTitleMap = {};

if (lessonIds.length) {
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_content')
    .select('id,title')
    .in('id', lessonIds);

  if (lessonsError) {
    console.error('Could not load lesson titles:', lessonsError.message);
  } else {
    (lessons || []).forEach(lesson => {
      lessonTitleMap[lesson.id] = lesson.title;
    });
  }
}
    list.innerHTML = `
      <div class="activity-list">
        ${data.map(item => {
          const date = item.created_at
            ? new Date(item.created_at).toLocaleString()
            : 'Time unavailable';

         let details = '';

if (item.event_type === 'lesson_completed') {
  const lessonId = Number(item.metadata?.lesson_id);
  const lessonTitle = lessonTitleMap[lessonId];

  details = lessonTitle
    ? `Video: ${lessonTitle}`
    : `Completed Lesson #${lessonId}`;
} else if (item.metadata && Object.keys(item.metadata).length) {
  details = JSON.stringify(item.metadata);
}

          return `
            <div class="data-row">
              <div>
                <strong>${esc(item.event_type || 'Activity')}</strong>
                <small>
                  ${esc(item.page || 'No page recorded')}
                  · ${esc(date)}
                </small>
${details
  ? `<small>${esc(details)}</small>`
  : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const closeStudentActivity = () => {
    const panel = $('admin-student-activity');
    if (panel) panel.classList.add('hidden');
  };

  const activityCloseButton = $('close-student-activity');
  if (activityCloseButton) {
    activityCloseButton.onclick = closeStudentActivity;
  }
  const editStudentContact = async (studentId, studentName, currentPhone) => {
  const phone = prompt(
    `Enter 10-digit mobile number for ${studentName}:`,
    currentPhone || ''
  );

  if (phone === null) return;

  const cleanPhone = phone.trim();

  if (!/^[0-9]{10}$/.test(cleanPhone)) {
    toast('Please enter a valid 10-digit mobile number.');
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ phone: cleanPhone })
    .eq('id', studentId);

  if (error) {
    console.error('Contact update error:', error);
    toast('Could not update mobile number.');
    return;
  }

  toast('Mobile number updated successfully!');
  await loadAdminStudents();
};
  const saveStudentAccess = async (studentId) => {const row=document.querySelector(`[data-student-row="${studentId}"]`);const selected=[...row.querySelectorAll('input[data-level]:checked')].map(i=>({student_id:studentId,level:i.dataset.level,granted_by:currentUser.id}));const {error:delErr}=await supabase.from('course_access').delete().eq('student_id',studentId);if(delErr){toast('Could not update access: '+delErr.message,'error');return;}if(selected.length){const {error}=await supabase.from('course_access').insert(selected);if(error){toast('Access update failed: '+error.message,'error');return;}}toast('Student course access updated.','success');loadAdminStudents();};
  const revokeStudentAccess = async (studentId) => {if(!confirm('Revoke all course access for this student?'))return;const {error}=await supabase.from('course_access').delete().eq('student_id',studentId);if(error){toast('Could not revoke access: '+error.message,'error');return;}toast('All course access revoked.','success');loadAdminStudents();};
  

const loadAdminContent = async () => {
  const el = $('admin-content-list');
  const editCard = $('edit-content-card');
  const editForm = $('edit-content-form');

  let contentQuery = supabase
  .from('course_content')
  .select('*');

if (activeAdminCourseLevel) {
  contentQuery = contentQuery.eq('course_level', activeAdminCourseLevel);
}

const { data, error } = await contentQuery
  .order('created_at', { ascending: false })
  .limit(100);

  if (error) {
    el.innerHTML =
      '<div class="empty-state">Could not load content.</div>';
    toast(error.message, 'error');
    return;
  }

 el.innerHTML = (data || []).length
  ? data.map(x => `
      <div class="data-row">
        <div>
          ${x.thumbnail_url
            ? `<img src="${esc(x.thumbnail_url)}"
                alt="Lesson thumbnail"
                style="width:90px;height:55px;object-fit:cover;border-radius:8px;margin-bottom:6px;">`
            : ''
          }
          <strong>${esc(x.course_level)} · ${esc(x.title)}</strong>
          <small>${esc(x.content_type)} · ${esc(x.description || '')}</small>
          <small>Status: <strong>${x.is_published ? 'Published' : 'Draft'}</strong></small>
        </div>
        <div class="row-actions">
          <button class="secondary-button"
            data-edit-content="${x.id}">Edit</button>
          <button class="secondary-button"
            data-delete-content="${x.id}">Delete</button>
        </div>
      </div>
    `).join('')
  : '<div class="empty-state">No lessons added yet.</div>';

  // Edit button: fill the form with the selected lesson
  el.querySelectorAll('[data-edit-content]').forEach(button => {
    button.addEventListener('click', () => {
      const lesson = (data || []).find(
        x => String(x.id) === button.dataset.editContent
      );

      if (!lesson) return;

      $('edit-content-id').value = lesson.id;
      $('edit-content-xp').value = lesson.xp_points ?? 10;
      $('edit-content-level').value = activeAdminCourseLevel || lesson.course_level || 'A1';
      $('edit-content-type').value = lesson.content_type || 'daily';
      $('edit-content-title').value = lesson.title || '';
      $('edit-content-url').value = lesson.resource_url || '';
      $('edit-content-description').value = lesson.description || '';
      $('edit-content-thumbnail').value = lesson.thumbnail_url || '';
$('edit-content-published').value = String(lesson.is_published ?? true);

      editCard.classList.remove('hidden');
      editCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Delete button
  el.querySelectorAll('[data-delete-content]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this lesson?')) return;

      const { error } = await supabase
        .from('course_content')
        .delete()
        .eq('id', button.dataset.deleteContent);

      if (error) {
        toast(error.message, 'error');
      } else {
        editCard.classList.add('hidden');
        toast('Lesson deleted.', 'success');
        await loadAdminContent();
      }
    });
  });

  // Connect form submission only once
  if (editForm.dataset.wired !== 'true') {
    editForm.dataset.wired = 'true';

    editForm.addEventListener('submit', async event => {
      event.preventDefault();

      const id = $('edit-content-id').value;

      const changes = {
        course_level: $('edit-content-level').value,
        content_type: $('edit-content-type').value,
        title: $('edit-content-title').value.trim(),
resource_url: $('edit-content-url').value.trim() || null,
thumbnail_url: $('edit-content-thumbnail').value.trim() || null,
description: $('edit-content-description').value.trim() || null,
xp_points: Number($('edit-content-xp').value || 0),
is_published: $('edit-content-published').value === 'true'
      };

      if (!id || !changes.title) {
        toast('Please enter a lesson title.', 'error');
        return;
      }

      const saveButton = editForm.querySelector(
        'button[type="submit"]'
      );

      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';

      try {
        const { error } = await supabase
          .from('course_content')
          .update(changes)
          .eq('id', id);

        if (error) {
          toast(error.message, 'error');
          return;
        }

        toast('Lesson updated successfully.', 'success');
        editCard.classList.add('hidden');
        editForm.reset();
        await loadAdminContent();
      } catch (err) {
        toast(err.message || 'Could not update lesson.', 'error');
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      }
    });

    $('cancel-edit-content').addEventListener('click', () => {
      editForm.reset();
      editCard.classList.add('hidden');
    });
  }
};


 const loadAdminClasses = async () => {
  const el = $('admin-class-list');

  let classQuery = supabase
    .from('live_classes')
    .select('*');

  if (activeAdminCourseLevel) {
    classQuery = classQuery.eq('course_level', activeAdminCourseLevel);
  }

  const { data, error } = await classQuery
    .order('starts_at', { ascending: true })
    .limit(100);

  if (error) {
    el.innerHTML = '<div class="empty-state">Could not load live classes.</div>';
    toast(error.message, 'error');
    return;
  }

  el.innerHTML = (data || []).length
    ? data.map(x => `
        <div class="data-row">
          <div>
            <strong>${esc(x.course_level)} · ${esc(x.title)}</strong>
            <small>${new Date(x.starts_at).toLocaleString()} · ${esc(x.teacher_name || 'Teacher TBA')}</small>
            ${x.meeting_url ? `
              <a href="${esc(x.meeting_url)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="secondary-button">
                Join Class
              </a>
            ` : '<small>Meeting link not added</small>'}
          </div>
          <div class="row-actions">
            <button class="secondary-button" data-edit-class="${x.id}">
              Edit
            </button>
            <button class="secondary-button" data-delete-class="${x.id}">
              Delete
            </button>
          </div>
        </div>
      `).join('')
    : '<div class="empty-state">No live classes scheduled yet.</div>';

  el.querySelectorAll('[data-edit-class]').forEach(button => {
    button.addEventListener('click', () => {
      const lesson = (data || []).find(
        x => String(x.id) === button.dataset.editClass
      );

      if (!lesson) return;

      $('edit-class-id').value = lesson.id;
      $('edit-class-level').value = activeAdminCourseLevel || lesson.course_level || 'A1';
      $('edit-class-title').value = lesson.title || '';

      const localDate = new Date(lesson.starts_at);
      localDate.setMinutes(
        localDate.getMinutes() - localDate.getTimezoneOffset()
      );

      $('edit-class-time').value = localDate.toISOString().slice(0, 16);
      $('edit-class-teacher').value = lesson.teacher_name || '';
      $('edit-class-url').value = lesson.meeting_url || '';

      $('edit-class-card').classList.remove('hidden');
      $('edit-class-card').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  el.querySelectorAll('[data-delete-class]').forEach(button => {
    button.addEventListener('click', async () => {
      const { error } = await supabase
        .from('live_classes')
        .delete()
        .eq('id', button.dataset.deleteClass);

      if (error) {
        toast(error.message, 'error');
      } else {
        toast('Class deleted.', 'success');
        loadAdminClasses();
      }
    });
  });
};
  const loadAdminQuizzes = async () => {
  const el = $('admin-quiz-list');
  if (!el) return;

  el.innerHTML = '<div class="empty-state">Loading quizzes...</div>';


 let quizQuery = supabase
  .from('quizzes')
  .select('*');

if (activeAdminCourseLevel) {
  quizQuery = quizQuery.eq('level', activeAdminCourseLevel);
}

const { data, error } = await quizQuery
  .order('created_at', { ascending: false })
  .limit(100);

  if (error) {
    el.innerHTML =
      '<div class="empty-state">Could not load quizzes: ' +
      esc(error.message) +
      '</div>';
    return;
  }

  el.innerHTML = (data || []).length
    ? data.map(q => `
        <div class="data-row">
          <div>
            <strong>${esc(q.level)} · ${esc(q.title)}</strong>
            <small>${esc(q.description || 'No description')}</small>
            <small>Status: ${q.is_published ? 'Published' : 'Draft'}</small>
          </div>

          <div class="row-actions">
          <button
  class="secondary-button"
  data-edit-quiz="${q.id}"
>
  Add Questions
</button>
            <button
              class="secondary-button"
              data-toggle-quiz="${q.id}"
              data-published="${q.is_published}"
            >
              ${q.is_published ? 'Unpublish' : 'Publish'}
            </button>

            <button
              class="secondary-button"
              data-delete-quiz="${q.id}"
            >
              Delete
            </button>
          </div>
        </div>
      `).join('')
    : '<div class="empty-state">No quizzes created yet.</div>';

  el.querySelectorAll('[data-toggle-quiz]').forEach(button => {
    button.addEventListener('click', async () => {
      const newStatus = button.dataset.published !== 'true';

      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: newStatus })
        .eq('id', button.dataset.toggleQuiz);

      if (error) {
        toast('Could not update quiz: ' + error.message, 'error');
        return;
      }

      toast(newStatus ? 'Quiz published.' : 'Quiz unpublished.', 'success');
      loadAdminQuizzes();
    });
  });
  el.querySelectorAll('[data-edit-quiz]').forEach(button => {
  button.addEventListener('click', async () => {
    const quizId = button.dataset.editQuiz;
    const editor = $('quiz-question-editor');

    $('editing-quiz-id').value = quizId;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('title')
      .eq('id', quizId)
      .single();

    if (error) {
      toast('Could not open quiz: ' + error.message, 'error');
      return;
    }

    $('quiz-editor-title').textContent = 'Questions: ' + quiz.title;
    editor.classList.remove('hidden');

    await loadQuizQuestions(quizId);

    editor.scrollIntoView({ behavior: 'smooth' });
  });
});

$('close-quiz-editor').onclick = () => {
  $('quiz-question-editor').classList.add('hidden');
};
const loadQuizQuestions = async (quizId) => {
  const el = $('quiz-question-list');

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, question_text, points, sort_order')
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true });

  if (error) {
    el.innerHTML = '<div class="empty-state">' +
      esc(error.message) + '</div>';
    return;
  }

  el.innerHTML = (data || []).length
    ? data.map((q, index) => `
        <div class="data-row">
          <div>
            <strong>Q${index + 1}. ${esc(q.question_text)}</strong>
            <small>${q.points} point(s)</small>
          </div>
        </div>
      `).join('')
    : '<div class="empty-state">No questions added yet.</div>';
};
  el.querySelectorAll('[data-delete-quiz]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this quiz?')) return;

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', button.dataset.deleteQuiz);

      if (error) {
        toast('Could not delete quiz: ' + error.message, 'error');
        return;
      }

      toast('Quiz deleted.', 'success');
      loadAdminQuizzes();
    });
  });
};
// LOAD ADMIN DAILY SENTENCES
const loadAdminSentences = async () => {
  const el = $('admin-sentence-list');
  if (!el) return;

  el.innerHTML = '<div class="empty-state">Loading sentences...</div>';

  let sentenceQuery = supabase
  .from('daily_practice_sentences')
  .select('*');

if (activeAdminCourseLevel) {
  sentenceQuery = sentenceQuery.eq('course_level', activeAdminCourseLevel);
}

const { data, error } = await sentenceQuery
  .order('created_at', { ascending: false })
  .limit(100);

  if (error) {
    el.innerHTML =
      '<div class="empty-state">Could not load sentences: ' +
      esc(error.message) +
      '</div>';
    return;
  }

  el.innerHTML = (data || []).length
  ? data.map(s => `
      <div class="data-row">
        <div>
          <strong>${esc(s.course_level)} · ${esc(s.title)}</strong>
          <small>🇮🇳 ${esc(s.hindi_text)}</small>
          <small>🇬🇧 ${esc(s.english_text)}</small>
          <small>🇫🇷 ${esc(s.french_text)}</small>
          <small>Status: ${s.is_published ? 'Published' : 'Draft'}</small>
        </div>

        <div class="practice-buttons">
          <button class="secondary-button" type="button"
            onclick="editDailySentence('${s.id}')">
            ✏️ Edit
          </button>

          <button class="secondary-button" type="button"
            onclick="deleteDailySentence('${s.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `).join('')
  : '<div class="empty-state">No daily sentences added yet.</div>';
};
// ADD DAILY PRACTICE SENTENCE
$('sentence-form').addEventListener('submit', async e => {
  e.preventDefault();

  const row = {
    course_level: activeAdminCourseLevel || $('sentence-level').value,
    title: $('sentence-title').value.trim(),
    hindi_text: $('sentence-hindi').value.trim(),
    english_text: $('sentence-english').value.trim(),
    french_text: $('sentence-french').value.trim(),
    xp_points: Number($('sentence-xp').value || 0),
    is_published: $('sentence-published').value === 'true',
    created_by: currentUser.id
  };

  const { error } = await supabase
    .from('daily_practice_sentences')
    .insert(row);

  if (error) {
    toast('Could not add sentence: ' + error.message, 'error');
    return;
  }

  e.target.reset();
  toast('Daily sentence added successfully.', 'success');
  loadAdminSentences();
});
// EDIT DAILY SENTENCE
window.editDailySentence = async (id) => {
  const { data, error } = await supabase
    .from('daily_practice_sentences')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    toast('Could not load sentence: ' + error.message, 'error');
    return;
  }

  $('edit-sentence-id').value = data.id;
 $('edit-sentence-level').value = activeAdminCourseLevel || data.course_level || 'A1';
  $('edit-sentence-title').value = data.title;
  $('edit-sentence-hindi').value = data.hindi_text;
  $('edit-sentence-english').value = data.english_text;
  $('edit-sentence-french').value = data.french_text;
  $('edit-sentence-xp').value = data.xp_points ?? 10;
  $('edit-sentence-published').value = String(data.is_published);

  $('edit-sentence-card').classList.remove('hidden');

  $('edit-sentence-card').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
};

// SAVE EDITED SENTENCE
$('edit-sentence-form').addEventListener('submit', async e => {
  e.preventDefault();

  const id = $('edit-sentence-id').value;

  const updates = {
   course_level: activeAdminCourseLevel || $('edit-sentence-level').value,
    title: $('edit-sentence-title').value.trim(),
    hindi_text: $('edit-sentence-hindi').value.trim(),
    english_text: $('edit-sentence-english').value.trim(),
    french_text: $('edit-sentence-french').value.trim(),
    xp_points: Number($('edit-sentence-xp').value || 0),
    is_published: $('edit-sentence-published').value === 'true'
  };

  const { error } = await supabase
    .from('daily_practice_sentences')
    .update(updates)
    .eq('id', id);

  if (error) {
    toast('Could not update sentence: ' + error.message, 'error');
    return;
  }

  $('edit-sentence-card').classList.add('hidden');
  e.target.reset();

  toast('Daily sentence updated successfully.', 'success');
  loadAdminSentences();
});

// CANCEL EDIT
$('cancel-edit-sentence').addEventListener('click', () => {
  $('edit-sentence-card').classList.add('hidden');
  $('edit-sentence-form').reset();
});

// DELETE DAILY SENTENCE
window.deleteDailySentence = async (id) => {
  if (!confirm('Are you sure you want to delete this daily sentence?')) {
    return;
  }

  const { error } = await supabase
    .from('daily_practice_sentences')
    .delete()
    .eq('id', id);

  if (error) {
    toast('Could not delete sentence: ' + error.message, 'error');
    return;
  }

  toast('Daily sentence deleted successfully.', 'success');
  loadAdminSentences();
};
// STUDENT QUIZ: Load published quizzes
const loadStudentQuizzes = async () => {
  const list = $('student-quiz-list');
  const area = $('student-quiz-area');

  if (!list || !area) return;

  area.innerHTML = '';
  list.innerHTML = '<p>Loading quizzes...</p>';

  if (!assignedLevels || assignedLevels.length === 0) {
    list.innerHTML =
      '<div class="empty-state">No course access found.</div>';
    return;
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select('id, level, title, description, created_at')
    .eq('is_published', true)
    .in('level', assignedLevels)
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML =
      '<div class="empty-state">' + esc(error.message) + '</div>';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML =
      '<div class="empty-state">No quizzes available yet.</div>';
    return;
  }

  list.innerHTML = data.map(quiz => `
    <div class="data-row">
      <div>
        <strong>${esc(quiz.title)}</strong>
        <small>${esc(quiz.level)} · ${esc(quiz.description || 'French Practice')}</small>
      </div>
      <button class="btn btn-primary"
        type="button"
        data-start-quiz="${esc(quiz.id)}">
        Start Quiz
      </button>
    </div>
  `).join('');

  list.querySelectorAll('[data-start-quiz]').forEach(button => {
    button.addEventListener('click', () => {
      startStudentQuiz(button.dataset.startQuiz);
    });
  });
};
// STUDENT QUIZ: Open selected quiz
const startStudentQuiz = async (quizId) => {
  const list = $('student-quiz-list');
  const area = $('student-quiz-area');

  list.innerHTML = '';
  area.classList.remove('hidden');

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, title, level, description')
    .eq('id', quizId)
    .eq('is_published', true)
    .single();

  if (quizError) {
    area.innerHTML =
      '<div class="empty-state">' + esc(quizError.message) + '</div>';
    return;
  }

  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('id, question_text, options, points, sort_order')
    .eq('quiz_id', quizId)
    .order('sort_order', { ascending: true });

  if (error) {
    area.innerHTML =
      '<div class="empty-state">' + esc(error.message) + '</div>';
    return;
  }

  if (!questions || questions.length === 0) {
    area.innerHTML =
      '<div class="empty-state">No questions found in this quiz.</div>';
    return;
  }

  area.innerHTML = `
    <div class="card">
      <h2>${esc(quiz.title)}</h2>
      <p>${esc(quiz.level)} · ${questions.length} questions</p>
      <div class="quiz-progress-info">
  <span id="quiz-progress-text">0 of ${questions.length} answered</span>
  <span id="quiz-progress-percent">0%</span>
</div>

<div class="quiz-progress-track">
  <div id="quiz-progress-fill" class="quiz-progress-fill"></div>
</div>

      <form id="student-quiz-form">
        ${questions.map((q, index) => `
          <div class="quiz-question-item">
            <strong>Q${index + 1}. ${esc(q.question_text)}</strong>
            <small>${Number(q.points) || 0} point(s)</small>

            <div class="quiz-options">
              ${Object.entries(q.options || {}).map(([key, value]) => `
                <label>
                  <input type="radio"
                    name="question-${esc(q.id)}"
                    value="${esc(key)}">
                  ${esc(key)}. ${esc(value)}
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <button class="btn btn-primary" type="submit">
          Submit Quiz
        </button>
      </form>
    </div>
  `;
  // LIVE QUIZ PROGRESS
const quizForm = $('student-quiz-form');

const updateQuizProgress = () => {
  const answered = questions.filter(q =>
    quizForm.querySelector(
      `input[name="question-${q.id}"]:checked`
    )
  ).length;

  const percent = Math.round(
    (answered / questions.length) * 100
  );

  $('quiz-progress-text').textContent =
    `${answered} of ${questions.length} answered`;

  $('quiz-progress-percent').textContent = `${percent}%`;

  $('quiz-progress-fill').style.width = `${percent}%`;
};

quizForm.querySelectorAll('input[type="radio"]').forEach(input => {
  input.addEventListener('change', updateQuizProgress);
});

updateQuizProgress();

  if (typeof logStudentActivity === 'function') {
    logStudentActivity('quiz_start', { quiz_id: quizId });
  }

  $('student-quiz-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const answers = {};

    questions.forEach(q => {
      const selected = document.querySelector(
        `input[name="question-${q.id}"]:checked`
      );
      if (selected) answers[q.id] = selected.value;
    });

    if (Object.keys(answers).length !== questions.length) {
      toast('Please answer every question.', 'error');
      return;
    }

    const submitButton = $('student-quiz-form').querySelector(
      'button[type="submit"]'
    );
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const { data: result, error: submitError } = await supabase.rpc(
      'submit_quiz_attempt',
      {
        p_quiz_id: quizId,
        p_answers: answers
      }
    );

    if (submitError) {
      toast('Could not submit quiz: ' + submitError.message, 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Quiz';
      return;
    }

    if (typeof logStudentActivity === 'function') {
      logStudentActivity('quiz_submit', {
        quiz_id: quizId,
        correct_answers: result.correct_answers,
        total_questions: result.total_questions
      });
    }

    area.innerHTML = `
      <div class="card">
        <h2>Quiz Completed!</h2>
        <p>Correct answers: ${Number(result.correct_answers)} / ${Number(result.total_questions)}</p>
        <p>Points: ${Number(result.earned_points)} / ${Number(result.total_points)}</p>
        <button class="btn btn-primary" type="button"
          id="back-to-quizzes">Back to Quizzes</button>
      </div>
    `;

    $('back-to-quizzes').addEventListener('click', loadStudentQuizzes);
  });
};
  const handleVoiceResult = (text) => {
    $('voice-hindi').textContent=text;
    const normalized=text.toLowerCase().replace(/[।.!?]/g,'').trim();
    const phrases=[
      {match:['mujhe pani chahiye','मुझे पानी चाहिए','pani chahiye'],en:'I need water.',fr:"J’ai besoin d’eau.",reply:'Voici de l’eau. (Here is some water.)'},
      {match:['namaste','नमस्ते','hello','bonjour'],en:'Hello.',fr:'Bonjour !',reply:'Bonjour ! Comment allez-vous ? (Hello! How are you?)'},
      {match:['aap kaise hain','आप कैसे हैं','kaise ho'],en:'How are you?',fr:'Comment allez-vous ?',reply:'Je vais bien, merci. Et vous ? (I’m fine, thank you. And you?)'},
      {match:['dhanyavad','धन्यवाद','shukriya','thank you'],en:'Thank you.',fr:'Merci !',reply:'Je vous en prie. (You’re welcome.)'},
      {match:['mujhe bhookh lagi hai','मुझे भूख लगी है','bhookh lagi'],en:'I am hungry.',fr:'J’ai faim.',reply:'Voulez-vous manger quelque chose ? (Would you like something to eat?)'},
      {match:['mera naam','मेरा नाम'],en:'My name is…',fr:'Je m’appelle…',reply:'Enchanté(e) ! (Nice to meet you!)'},
      {match:['madad','मदद','help'],en:'I need help.',fr:'J’ai besoin d’aide.',reply:'Bien sûr, je peux vous aider. (Of course, I can help you.)'}
    ];
    const found=phrases.find(p=>p.match.some(m=>normalized.includes(m.toLowerCase())));
    if(found){$('voice-english').textContent=found.en;$('voice-french').textContent=found.fr;$('voice-reply').textContent=found.reply;lastVoiceFrench=found.fr;}
    else {$('voice-english').textContent='Phrase not in the starter phrasebook yet.';$('voice-french').textContent='Please try a common phrase such as “Mujhe pani chahiye” or “Namaste”.';$('voice-reply').textContent='A suggested reply will appear for supported phrases.';lastVoiceFrench='';}
  };
  const setupVoice = () => {const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){$('voice-support').textContent='Speech recognition is not supported in this browser. Try a recent Chrome browser or type a phrase in a future version.';$('voice-start').disabled=true;return;}voiceRecognition=new SpeechRecognition();voiceRecognition.lang='hi-IN';voiceRecognition.interimResults=false;voiceRecognition.maxAlternatives=1;voiceRecognition.onstart=()=>{$('voice-start').classList.add('hidden');$('voice-stop').classList.remove('hidden');$('voice-hindi').textContent='Listening…';};voiceRecognition.onresult=e=>handleVoiceResult(e.results[0][0].transcript);voiceRecognition.onerror=e=>toast('Microphone issue: '+e.error,'error');voiceRecognition.onend=()=>{$('voice-start').classList.remove('hidden');$('voice-stop').classList.add('hidden');};$('voice-start').addEventListener('click',()=>{try{voiceRecognition.start();}catch(e){toast('Microphone is already active.','error');}});$('voice-stop').addEventListener('click',()=>voiceRecognition.stop());$('speak-french').addEventListener('click',()=>{if(!lastVoiceFrench)return;const u=new SpeechSynthesisUtterance(lastVoiceFrench);u.lang='fr-FR';speechSynthesis.speak(u);});};
  const wireEvents = () => {
    $('show-login').addEventListener('click',()=>showAuth('login'));$('show-signup').addEventListener('click',()=>showAuth('signup'));
    $('login-form').addEventListener('submit',async e=>{e.preventDefault();if(!supabase)return;const button=e.submitter;button.disabled=true;const {data,error}=await supabase.auth.signInWithPassword({email:$('login-email').value.trim(),password:$('login-password').value});button.disabled=false;if(error){$('auth-status').textContent=error.message;toast(error.message,'error');return;}currentUser=data.user;await logStudentActivity('login', 'login');await showApp();});
    $('reset-password-form').addEventListener('submit', async e => {
  e.preventDefault();

  if (!supabase) return;

  const newPassword = $('reset-new-password').value;
  const confirmPassword = $('reset-confirm-password').value;

  if (newPassword.length < 8) {
    toast('Password must be at least 8 characters.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    toast('Passwords do not match.', 'error');
    return;
  }

  const button = e.submitter;
  button.disabled = true;

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  button.disabled = false;

  if (error) {
    toast(error.message, 'error');
    return;
  }

  $('reset-new-password').value = '';
  $('reset-confirm-password').value = '';

  toast('Password updated successfully. Please log in.', 'success');

  await supabase.auth.signOut();
  currentUser = null;
  profile = null;
  showAuth('login');
});
   $('signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!supabase) return;

  const name = $('signup-name').value.trim();
  const email = $('signup-email').value.trim();
  const phone = $('signup-phone').value.trim();
  const password = $('signup-password').value;

  if (!/^[0-9]{10}$/.test(phone)) {
    toast('Please enter a valid 10-digit mobile number.', 'error');
    return;
  }

  if (password.length < 8) {
    toast('Password must be at least 8 characters.', 'error');
    return;
  }

  const button = e.submitter;
  button.disabled = true;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone
      }
    }
  });

  button.disabled = false;

  if (error) {
    $('auth-status').textContent = error.message;
    toast(error.message, 'error');
    return;
  }

  if (data.session) {
    currentUser = data.user;
    await showApp();
    toast('Account created. Welcome to Euro Sphere!', 'success');
  } else {
    $('auth-status').textContent =
      'Account created. Check your email to confirm your account, then log in.';

    toast('Account created. Check your email for the confirmation link.', 'success');
    showAuth('login');
    $('login-email').value = email;
  }
});
    $('forgot-password').addEventListener('click',async()=>{if(!supabase)return;const email=$('login-email').value.trim();if(!email){toast('Enter your email address first.','error');return;}const { error } = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: 'https://foreignlanguagehub.com/app/'
});if(error)toast(error.message,'error');else toast('If this email exists, a password reset link will be sent.','success');});
    $('logout-button').addEventListener('click',async()=>{await logStudentActivity('logout', 'logout');await supabase.auth.signOut();currentUser=null;profile=null;assignedLevels=[];showAuth('login');});
    document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.page)));
    $('back-courses').addEventListener('click',()=>navigate('courses'));$('back-course-detail').addEventListener('click',()=>navigate('course-detail'));
    $('profile-form').addEventListener('submit',async e=>{e.preventDefault();const full_name=$('profile-name-input').value.trim();const {error}=await supabase.from('profiles').update({full_name}).eq('id',currentUser.id);if(error){toast('Profile save failed: '+error.message,'error');return;}profile.full_name=full_name;$('profile-name').textContent=full_name;$('welcome-title').textContent='Bonjour, '+full_name.split(' ')[0]+'!';$('top-user-name').textContent=full_name;$('top-avatar').textContent=full_name[0].toUpperCase();toast('Profile updated.','success');});
    $('refresh-students').addEventListener('click',loadAdminStudents);
  document.querySelectorAll('[data-admin-tab]').forEach(b =>
  b.addEventListener('click', () => {
    const selectedTab = b.dataset.adminTab;

    activeAdminCourseLevel = ['A1', 'A2', 'B1', 'B2', 'C1'].includes(selectedTab)
      ? selectedTab
      : null;

    document.querySelectorAll('[data-admin-tab]').forEach(x =>
      x.classList.toggle('active', x === b)
    );

    // Sabhi admin panels hide karo
    document.querySelectorAll('.admin-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    // Selected panel show karo
    const selectedPanel = $('admin-' + selectedTab);

    if (selectedPanel) {
      selectedPanel.classList.remove('hidden');
    }
    const speakingCard = $('admin-speaking-card');
if (speakingCard) {
  speakingCard.classList.toggle('hidden', selectedTab !== 'students');
}

const xpCard = $('admin-xp-card');
if (xpCard) {
  xpCard.classList.toggle('hidden', selectedTab !== 'students');
}

    // Dashboard
    if (selectedTab === 'students') {
      loadAdminStudents();
      loadAdminSpeakingPerformance();
      loadAdminXPReport();
    }

    // Course-wise management
    if (['A1', 'A2', 'B1', 'B2', 'C1'].includes(selectedTab)) {

      const managementContainer = $('course-management-' + selectedTab);

      const managementPanels = [
        'admin-content',
        'admin-classes',
        'admin-quizzes',
        'admin-sentences'
      ];

      if (managementContainer) {
        managementPanels.forEach(id => {
          const panel = $(id);

          if (panel) {
            managementContainer.appendChild(panel);
            panel.classList.remove('hidden');
          }
        });
      }

      // Selected course ka data load karo
      loadAdminContent();
      loadAdminClasses();
      loadAdminQuizzes();
      loadAdminSentences();
    }
  })
);
$('content-form').addEventListener('submit', async e => {
  e.preventDefault();

  const row = {
   course_level: activeAdminCourseLevel || $('content-level').value,
    content_type: $('content-type').value,
    title: $('content-title').value.trim(),
    resource_url: $('content-url').value.trim() || null,
    thumbnail_url: $('content-thumbnail').value.trim() || null,
    description: $('content-description').value.trim() || null,
    xp_points: Number($('content-xp').value || 0),
    is_published: $('content-published').value === 'true',
    created_by: currentUser.id
  };

  const { error } = await supabase
    .from('course_content')
    .insert(row);

  if (error) {
    toast('Could not add lesson: ' + error.message, 'error');
    return;
  }

  e.target.reset();
  toast('Lesson added successfully.', 'success');
  loadAdminContent();
});  $('class-form').addEventListener('submit',async e=>{e.preventDefault();const row={course_level: activeAdminCourseLevel || $('class-level').value,title:$('class-title').value.trim(),starts_at:new Date($('class-time').value).toISOString(),teacher_name:$('class-teacher').value.trim()||null,meeting_url:$('class-url').value.trim()||null,created_by:currentUser.id};const {error}=await supabase.from('live_classes').insert(row);if(error){toast('Could not schedule class: '+error.message,'error');return;}e.target.reset();toast('Live class scheduled.','success');loadAdminClasses();});
$('edit-class-form').addEventListener('submit', async e => {
  e.preventDefault();

  const id = $('edit-class-id').value;

  const changes = {
    course_level: $('edit-class-level').value,
    title: $('edit-class-title').value.trim(),
    starts_at: new Date($('edit-class-time').value).toISOString(),
    teacher_name: $('edit-class-teacher').value.trim() || null,
    meeting_url: $('edit-class-url').value.trim() || null
  };

  const { error } = await supabase
    .from('live_classes')
    .update(changes)
    .eq('id', id);

  if (error) {
    toast('Could not update class: ' + error.message, 'error');
    return;
  }

  toast('Live class updated successfully.', 'success');
  $('edit-class-card').classList.add('hidden');
  e.target.reset();
  await loadAdminClasses();
});

$('cancel-edit-class').addEventListener('click', () => {
  $('edit-class-card').classList.add('hidden');
  $('edit-class-form').reset();
});
   $('quiz-form').addEventListener('submit', async e => {
  e.preventDefault();

  const row = {
    level: activeAdminCourseLevel || $('quiz-level').value,
    title: $('quiz-title').value.trim(),
    description: $('quiz-description').value.trim() || null,
    created_by: currentUser.id
  };

  const { error } = await supabase
    .from('quizzes')
    .insert(row);

  if (error) {
    toast('Could not create quiz: ' + error.message, 'error');
    return;
  }

  e.target.reset();
  toast('Quiz created successfully.', 'success');
  loadAdminQuizzes();
});
$('quiz-question-form').addEventListener('submit', async e => {
  e.preventDefault();

  const quizId = $('editing-quiz-id').value;

  if (!quizId) {
    toast('Please open a quiz first.', 'error');
    return;
  }

  const options = {
    A: $('quiz-option-a').value.trim(),
    B: $('quiz-option-b').value.trim(),
    C: $('quiz-option-c').value.trim(),
    D: $('quiz-option-d').value.trim()
  };

  const { data: existing, error: countError } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('quiz_id', quizId);

  if (countError) {
    toast('Could not check existing questions: ' + countError.message, 'error');
    return;
  }

  const questionRow = {
    quiz_id: quizId,
    question_text: $('quiz-question-text').value.trim(),
    options,
    points: Number($('quiz-question-points').value),
    sort_order: (existing || []).length + 1
  };

  const { data: question, error: questionError } = await supabase
    .from('quiz_questions')
    .insert(questionRow)
    .select('id')
    .single();

  if (questionError) {
    toast('Could not save question: ' + questionError.message, 'error');
    return;
  }

  const { error: answerError } = await supabase
    .from('quiz_answers')
    .insert({
      question_id: question.id,
      correct_option: $('quiz-correct-option').value
    });

  if (answerError) {
    await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', question.id);

    toast('Could not save correct answer: ' + answerError.message, 'error');
    return;
  }

  e.target.reset();
  $('quiz-question-points').value = 1;

  toast('Question added successfully.', 'success');
  await loadQuizQuestions(quizId);
});
    $('mobile-menu').addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.toggle('mobile-open');
}); 
document.addEventListener('click', (event) => {
  const sidebar = document.querySelector('.sidebar');
  const menuButton = $('mobile-menu');

  if (!sidebar || !sidebar.classList.contains('mobile-open')) return;

  if (
    !sidebar.contains(event.target) &&
    !menuButton?.contains(event.target)
  ) {
    sidebar.classList.remove('mobile-open');
  }
});
 };
document.addEventListener('DOMContentLoaded', async () => {
  wireEvents();
  setupVoice();

  if (!initSupabase()) return;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      currentUser = session?.user || null;
      showAuth('reset');
    } 
    else if (event === 'SIGNED_OUT') {
      currentUser = null;
      profile = null;
      showAuth('login');
    } 
    else if (event === 'SIGNED_IN' && session && !currentUser) {
      currentUser = session.user;
      await showApp();
    }
  });

  const { data } = await supabase.auth.getSession();

  if (data.session) {
    currentUser = data.session.user;
    await showApp();
  } else {
    showAuth('login');
  }
});
})();