const lessons = {
  A1: [
    { title: 'Greetings and Introductions', tag: 'Conversation', objective: 'Greet people, introduce yourself, and ask how someone is doing.', items: [['Bonjour !','Hello / Good morning'],['Je m’appelle Léa.','My name is Léa.'],['Comment allez-vous ?','How are you? (formal)'],['Enchanté(e).','Nice to meet you.']], example: 'Bonjour, je m’appelle Samir. Enchanté !' },
    { title: 'Articles and Nouns', tag: 'Grammar', objective: 'Recognize noun gender and use basic articles.', items: [['un livre','a book (masculine)'],['une table','a table (feminine)'],['le café','the coffee'],['la maison','the house']], example: 'C’est un livre et c’est une table.' },
    { title: 'Être and Avoir in the Present Tense', tag: 'Verbs', objective: 'Use two essential verbs in the present tense.', items: [['Je suis étudiant(e).','I am a student.'],['Tu es français(e).','You are French.'],['J’ai vingt ans.','I am twenty years old.'],['Nous avons un cours.','We have a class.']], example: 'Je suis prêt(e) et j’ai mon cahier.' },
    { title: 'Numbers and Time', tag: 'Vocabulary', objective: 'Use numbers and ask for the time.', items: [['un, deux, trois','one, two, three'],['dix','ten'],['Quelle heure est-il ?','What time is it?'],['Il est neuf heures.','It is nine o’clock.']], example: 'Le cours commence à neuf heures.' }
  ],
  A2: [
    { title: 'Talking About Your Routine', tag: 'Conversation', objective: 'Describe your habits using the present tense.', items: [['Je me réveille à sept heures.','I wake up at seven.'],['Je prends le petit-déjeuner.','I have breakfast.'],['Ensuite','Then / afterwards'],['D’habitude','Usually']], example: 'D’habitude, je prends le bus pour aller au travail.' },
    { title: 'The passé composé', tag: 'Grammar', objective: 'Talk about a completed past action.', items: [['J’ai étudié.','I studied.'],['Nous avons mangé.','We ate.'],['Elle est arrivée.','She arrived.'],['Hier','Yesterday']], example: 'Hier, j’ai étudié le français pendant une heure.' },
    { title: 'Shopping', tag: 'Vocabulary', objective: 'Ask for a price and buy an item.', items: [['Combien ça coûte ?','How much does it cost?'],['Je voudrais…','I would like…'],['C’est trop cher.','It is too expensive.'],['Un reçu, s’il vous plaît.','A receipt, please.']], example: 'Bonjour, je voudrais une baguette, s’il vous plaît.' }
  ],
  B1: [
    { title: 'Describing an Experience', tag: 'Expression', objective: 'Structure a story and connect events.', items: [['Tout d’abord','First of all'],['Puis','Then'],['Finalement','Finally'],['Je me suis rendu compte que…','I realized that…']], example: 'Tout d’abord, j’étais nerveux, puis je me suis senti plus à l’aise.' },
    { title: 'Expressing an Opinion', tag: 'Argumentation', objective: 'Present a point of view and justify it.', items: [['À mon avis…','In my opinion…'],['Je pense que…','I think that…'],['En revanche','On the other hand'],['Cela dépend de…','That depends on…']], example: 'À mon avis, apprendre une langue demande une pratique régulière.' },
    { title: 'The Polite Conditional', tag: 'Grammar', objective: 'Make polite requests.', items: [['Je voudrais…','I would like…'],['Pourriez-vous… ?','Could you…?'],['J’aimerais…','I would like…'],['Ce serait possible ?','Would that be possible?']], example: 'Pourriez-vous répéter, s’il vous plaît ?' }
  ],
  B2: [
    { title: 'Defending an Idea', tag: 'Argumentation', objective: 'Structure an argument and respond to an objection.', items: [['D’une part… d’autre part…','On one hand… on the other…'],['Certes… toutefois…','Certainly… however…'],['Il convient de souligner que…','It should be emphasized that…'],['Par conséquent','Consequently']], example: 'Certes, cette solution est coûteuse ; toutefois, elle présente des avantages durables.' },
    { title: 'Adding Nuance to Your Speech', tag: 'Expression', objective: 'Express degrees of certainty and reservations.', items: [['Il semblerait que…','It would seem that…'],['Dans une certaine mesure','To some extent'],['Je ne suis pas entièrement convaincu(e).','I am not entirely convinced.'],['Sous réserve de…','Subject to…']], example: 'Dans une certaine mesure, cette proposition pourrait améliorer la situation.' },
    { title: 'Logical Connectors', tag: 'Grammar', objective: 'Connect ideas in a structured text.', items: [['Néanmoins','Nevertheless'],['En outre','Furthermore'],['Bien que + subjonctif','Although + subjunctive'],['À condition que + subjonctif','Provided that + subjunctive']], example: 'Bien que le délai soit court, nous pouvons terminer le projet.' }
  ],
  C1: [
    { title: 'Formal Register', tag: 'Style', objective: 'Adapt your language to academic or professional situations.', items: [['Je vous saurais gré de…','I would be grateful if you…'],['Il me paraît opportun de…','It seems appropriate to me to…'],['Veuillez trouver ci-joint…','Please find attached…'],['Je me permets de vous contacter…','I am taking the liberty of contacting you…']], example: 'Je vous saurais gré de bien vouloir confirmer votre disponibilité.' },
    { title: 'Summarizing and Rephrasing', tag: 'Method', objective: 'Summarize an idea without repeating the source word for word.', items: [['En d’autres termes','In other words'],['Il ressort de cette analyse que…','This analysis shows that…'],['Pour résumer','To summarize'],['Cela met en évidence…','This highlights…']], example: 'En d’autres termes, les résultats mettent en évidence une tendance durable.' },
    { title: 'Hypotheses and Concession', tag: 'Grammar', objective: 'Build complex sentences accurately.', items: [['À supposer que…','Assuming that…'],['Quoiqu’il en soit','Be that as it may'],['Quand bien même…','Even if…'],['Pour peu que…','Provided that…']], example: 'À supposer que les conditions soient réunies, le projet pourrait aboutir.' }
  ]
};
const quizzes = {
  A1: [
    {q:'What does “Bonjour” mean?', options:['Goodbye','Hello / Good morning','Good night','Please'], a:1, why:'“Bonjour” is a greeting used during the day.'},
    {q:'Complete the sentence: Je ___ étudiant.', options:['suis','es','sommes','êtes'], a:0, why:'With “je,” the present-tense form of être is “suis.”'},
    {q:'Which article goes with “maison”?', options:['un','le (masculin)','une','des (masculin singulier)'], a:2, why:'“Maison” is feminine, so we say “une maison.”'},
    {q:'What does “Merci” mean?', options:['Thank you','Excuse me','See you tomorrow','Welcome'], a:0, why:'“Merci” means “thank you.”'},
    {q:'Complete the question: Comment ___-vous ?', options:['t’appelles','allez','suis','ont'], a:1, why:'The polite expression is “Comment allez-vous?”'}
  ],
  A2: [
    {q:'Complete the sentence: Hier, j’___ regardé un film.', options:['ai','suis','est','as'], a:0, why:'The passé composé of regarder is formed with avoir: “j’ai regardé.”'},
    {q:'What does “D’habitude” mean?', options:['Rarely','Tomorrow','Usually','Last week'], a:2, why:'“D’habitude” means “usually.”'},
    {q:'Choose the most polite request.', options:['Donne-moi ça.','Je voudrais un café, s’il vous plaît.','Tu dois me donner un café.','Café maintenant.'], a:1, why:'“Je voudrais… s’il vous plaît” is a polite request.'},
    {q:'Complete the sentence: Elle ___ arrivée à midi.', options:['a','est','ont','as'], a:1, why:'With the verb arriver, the passé composé generally uses être: “elle est arrivée.”'},
    {q:'What does “Combien ça coûte ?” mean?', options:['Where is it?','How much does it cost?','What time is it?','Can I help you?'], a:1, why:'This question is used to ask the price.'}
  ],
  B1: [
    {q:'Which connector means “however / on the other hand”?', options:['Donc','En revanche','Puisque','D’abord'], a:1, why:'“En revanche” introduces a contrast.'},
    {q:'Complete the sentence: Si j’avais le temps, je ___ davantage.', options:['voyage','voyagerai','voyagerais','voyagé'], a:2, why:'In a hypothetical sentence with “si” + imperfect, the main clause uses the present conditional.'},
    {q:'What does “se rendre compte de” mean?', options:['To realize','To get dressed','To leave early','To introduce someone'], a:0, why:'“Se rendre compte de” means to become aware of something.'},
    {q:'Choose the sentence that expresses an opinion.', options:['Il est huit heures.','À mon avis, ce projet est utile.','Fermez la porte.','J’ai deux frères.'], a:1, why:'“À mon avis” explicitly introduces a point of view.'},
    {q:'Complete the sentence: Il faut que tu ___ tes devoirs.', options:['fais','feras','fasses','faire'], a:2, why:'After “il faut que,” use the subjunctive: “que tu fasses.”'}
  ],
  B2: [
    {q:'Which expression introduces a concession?', options:['Par conséquent','Bien que','En premier lieu','C’est pourquoi'], a:1, why:'“Bien que” introduces a concession and is followed by the subjunctive.'},
    {q:'Choose the connector that means “furthermore.”', options:['Néanmoins','En outre','Pourtant','Au contraire'], a:1, why:'“En outre” adds an argument and means “furthermore.”'},
    {q:'Complete the sentence: Bien qu’il ___ fatigué, il continue.', options:['est','soit','sera','être'], a:1, why:'“Bien que” is followed by the subjunctive: “bien qu’il soit.”'},
    {q:'Which statement is the most nuanced?', options:['Tout le monde a tort.','C’est toujours impossible.','Cette solution pourrait être pertinente dans certains cas.','Il n’y a aucun débat.'], a:2, why:'“Pourrait” and “dans certains cas” express a limited possibility.'},
    {q:'“Par conséquent” mainly expresses…', options:['Une conséquence','Une opposition','Une salutation','Une comparaison'], a:0, why:'“Par conséquent” introduces the result or consequence of an idea.'}
  ],
  C1: [
    {q:'Which phrase is suitable for a formal professional email?', options:['Salut, réponds vite.','Je vous saurais gré de bien vouloir me répondre.','Réponds-moi, ok ?','Yo, donne des nouvelles.'], a:1, why:'This phrase is formal and courteous.'},
    {q:'What does “Il ressort de cette analyse que…” mean?', options:['This analysis suggests/shows that…','This analysis is missing…','This analysis must stop…','This analysis is expensive…'], a:0, why:'“Il ressort de” introduces a conclusion drawn from an analysis.'},
    {q:'Complete the sentence: À supposer que les données ___ exactes…', options:['sont','seront','soient','étaient'], a:2, why:'“À supposer que” is followed by the subjunctive: “soient.”'},
    {q:'What is the purpose of a summary?', options:['Copy every sentence','Bring the main ideas together concisely','Add unrelated details','Replace facts with opinions'], a:1, why:'A summary selects and rephrases the essential ideas.'},
    {q:'Which expression means “nevertheless”?', options:['En outre','Néanmoins','Autrement dit','Par exemple'], a:1, why:'“Néanmoins” signals contrast or reservation.'}
  ]
};
let currentLevel = 'A1';
let quizQuestions = [], quizIndex = 0, quizCorrect = 0, quizAnswered = false, quizFinished = false;
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === id));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (id === 'dashboard-screen') document.querySelector('.nav-item')?.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}
function selectLevel(level) {
  if (!lessons[level]) return;
  currentLevel = level;
  document.querySelectorAll('.level-btn').forEach(btn => btn.classList.toggle('active-level', btn.dataset.level === level));
  document.getElementById('current-level-title').textContent = `${level} Course`;
  updateProgressUI();
}
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function openSection(type) {
  if (type === 'test') { startQuiz(); return; }
  const body = document.getElementById('dynamic-content-body');
  const title = document.getElementById('content-title');
  document.getElementById('content-level-chip').textContent = currentLevel;
  body.innerHTML = '';
  if (type === 'chapters') {
    title.textContent = `Lessons ${currentLevel}`;
    lessons[currentLevel].forEach((lesson, index) => {
      const card = document.createElement('article'); card.className = 'lesson-card';
      card.innerHTML = `<div class="lesson-card-top"><span class="lesson-tag">${escapeHTML(lesson.tag)}</span><span class="lesson-number">LESSON ${index + 1}</span></div><h3>${escapeHTML(lesson.title)}</h3><p>${escapeHTML(lesson.objective)}</p><div class="example-box"><strong>Example</strong><p>${escapeHTML(lesson.example)}</p><button class="text-audio-btn" type="button" data-speak="${escapeHTML(lesson.example)}"><i class="fa-solid fa-volume-high"></i> Listen</button></div><button class="secondary-btn lesson-vocab-btn" type="button" data-lesson="${index}">Show vocabulary <i class="fa-solid fa-chevron-down"></i></button><div class="lesson-vocab" id="lesson-vocab-${index}" hidden>${lesson.items.map(pair=>`<div class="vocab-row"><strong>${escapeHTML(pair[0])}</strong><span>${escapeHTML(pair[1])}</span></div>`).join('')}</div>`;
      body.appendChild(card);
    });
    body.querySelectorAll('[data-speak]').forEach(btn => btn.addEventListener('click', () => speakText(btn.dataset.speak)));
    body.querySelectorAll('.lesson-vocab-btn').forEach(btn => btn.addEventListener('click', () => { const panel=document.getElementById(`lesson-vocab-${btn.dataset.lesson}`); panel.hidden=!panel.hidden; btn.innerHTML=panel.hidden?'Show vocabulary <i class="fa-solid fa-chevron-down"></i>':'Hide vocabulary <i class="fa-solid fa-chevron-up"></i>'; }));
  } else if (type === 'vocabulary') {
    title.textContent = `Vocabulary ${currentLevel}`;
    const pairs = lessons[currentLevel].flatMap(lesson => lesson.items);
    body.innerHTML = `<div class="content-intro"><h3>Review essential words</h3><p>Select “Listen” to hear the French pronunciation.</p></div>` + pairs.map(pair=>`<div class="vocab-card"><div><strong>${escapeHTML(pair[0])}</strong><p>${escapeHTML(pair[1])}</p></div><button class="round-audio" type="button" data-speak="${escapeHTML(pair[0])}" aria-label="Listen ${escapeHTML(pair[0])}"><i class="fa-solid fa-volume-high"></i></button></div>`).join('');
    body.querySelectorAll('[data-speak]').forEach(btn=>btn.addEventListener('click',()=>speakText(btn.dataset.speak)));
  } else if (type === 'audio') {
    title.textContent = 'French Pronunciation';
    body.innerHTML = `<div class="content-intro"><h3>Listen, then repeat</h3><p>The available voice depends on the languages installed in your browser or device.</p></div>` + lessons[currentLevel].map(lesson=>`<article class="lesson-card"><span class="lesson-tag">${escapeHTML(lesson.tag)}</span><h3>${escapeHTML(lesson.title)}</h3><p class="french-phrase">${escapeHTML(lesson.example)}</p><button class="primary-btn" type="button" data-speak="${escapeHTML(lesson.example)}"><i class="fa-solid fa-volume-high"></i> Listen in French</button></article>`).join('');
    body.querySelectorAll('[data-speak]').forEach(btn=>btn.addEventListener('click',()=>speakText(btn.dataset.speak)));
  } else if (type === 'video') {
    title.textContent = 'Video Resources';
    body.innerHTML = `<div class="content-intro"><h3>Keep Practicing</h3><p>These YouTube searches open outside the app. Choose a resource suited to your level.</p></div><a class="resource-link" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=French+${currentLevel}+lesson">French lessons ${currentLevel} <i class="fa-solid fa-arrow-up-right-from-square"></i></a><a class="resource-link" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=French+${currentLevel}+listening+practice">Listening practice ${currentLevel} <i class="fa-solid fa-arrow-up-right-from-square"></i></a><p class="auth-note">External links are search results, not lessons produced or verified by the academy.</p>`;
  }
  showScreen('content-screen');
}
function speakText(text) {
  if (!('speechSynthesis' in window)) { alert('Text-to-speech is not available in this browser.'); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'fr-FR'; utterance.rate = 0.88;
  const voices = window.speechSynthesis.getVoices(); const frenchVoice = voices.find(voice => voice.lang.toLowerCase().startsWith('fr'));
  if (frenchVoice) utterance.voice = frenchVoice;
  window.speechSynthesis.speak(utterance);
}
function startQuiz() {
  quizQuestions = quizzes[currentLevel].slice(); quizIndex = 0; quizCorrect = 0; quizAnswered = false; quizFinished = false;
  document.getElementById('quiz-level-chip').textContent = currentLevel;
  showScreen('quiz-screen'); renderQuestion();
}
function renderQuestion() {
  const q = quizQuestions[quizIndex]; quizAnswered = false;
  document.getElementById('quiz-question').textContent = q.q;
  document.getElementById('quiz-counter').textContent = `Question ${quizIndex + 1} of ${quizQuestions.length}`;
  document.getElementById('quiz-progress-fill').style.width = `${quizIndex / quizQuestions.length * 100}%`;
  document.getElementById('quiz-result').textContent = '';
  const options = document.getElementById('quiz-options'); options.innerHTML = '';
  q.options.forEach((label, index) => {
    const button = document.createElement('button'); button.type='button'; button.className='quiz-option';
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65+index)}</span><span>${escapeHTML(label)}</span>`;
    button.addEventListener('click', () => answerQuestion(index, button)); options.appendChild(button);
  });
  const next = document.getElementById('next-btn'); next.hidden = true; next.textContent = quizIndex === quizQuestions.length - 1 ? 'View My Results' : 'Next Question';
}
function answerQuestion(selected, button) {
  if (quizAnswered) return; quizAnswered = true;
  const q = quizQuestions[quizIndex]; const correct = selected === q.a;
  if (correct) quizCorrect++;
  document.querySelectorAll('.quiz-option').forEach((option, index) => { option.disabled = true; if(index === q.a) option.classList.add('correct'); else if(index === selected) option.classList.add('incorrect'); });
  document.getElementById('quiz-result').textContent = `${correct ? 'Well done! ' : 'Not quite. '}${q.why}`;
  document.getElementById('quiz-result').className = `quiz-feedback ${correct ? 'success' : 'error'}`;
  document.getElementById('next-btn').hidden = false;
}
function nextQuestion() {
  if (!quizAnswered) return;
  if (quizIndex < quizQuestions.length - 1) { quizIndex++; renderQuestion(); return; }
  const earned = quizCorrect * 10;
  const user = getActiveUser() || 'guest';
  const key = getUserScoreKey(user); setUserScore(user, getUserScore(user) + earned);
  document.getElementById('quiz-progress-fill').style.width = '100%';
  document.getElementById('quiz-counter').textContent = 'Quiz completed';
  document.getElementById('quiz-question').textContent = `${quizCorrect} / ${quizQuestions.length} correct answers`;
  document.getElementById('quiz-options').innerHTML = `<div class="result-medal">${quizCorrect >= 4 ? '🏆' : quizCorrect >= 3 ? '⭐' : '📘'}</div><p>You earned <strong>${earned} points</strong>.</p><p class="muted small">${quizCorrect === 5 ? 'Excellent work!' : 'Keep practicing to improve.'}</p>`;
  document.getElementById('quiz-result').textContent = 'Your score has been saved in this browser.';
  document.getElementById('quiz-result').className = 'quiz-feedback success';
  quizFinished = true;
  document.getElementById('next-btn').hidden = false; document.getElementById('next-btn').textContent = 'Back au tableau de bord';
  updateLeaderboardUI(); updateProgressUI();
}
document.getElementById('next-btn').addEventListener('click', () => { if (quizFinished) { showScreen('dashboard-screen'); updateLeaderboardUI(); updateProgressUI(); } else nextQuestion(); });
function updateLeaderboardUI() {
  const top = getTopScorer();
  document.getElementById('top-scorer-name').textContent = top.name === 'No scores yet' ? top.name : top.name.split('@')[0];
  document.getElementById('top-scorer-score').textContent = `${top.score} pts`;
}
function updateProgressUI() {
  const score = getUserScore(getActiveUser() || 'guest');
  document.getElementById('progress-score').textContent = `${score} points`;
  const percent = Math.min(100, score % 100);
  document.getElementById('progress-bar').style.width = `${percent}%`;
  document.getElementById('progress-caption').textContent = score ? `${percent}% of the way to your next 100-point milestone.` : 'Take a quiz to start tracking your progress.';
}
function openProfile() {
  const email = getActiveUser(); const name = localStorage.getItem(APP_PREFIX + 'display_name') || (email ? email.split('@')[0] : 'Guest');
  alert(`Student Profile\nName: ${name}\nEmail: ${email || 'Not logged in'}\nSelected level: ${currentLevel}\nTotal score: ${getUserScore(email || 'guest')} points`);
}
function openCertificate() {
  const email = getActiveUser(); const name = localStorage.getItem(APP_PREFIX + 'display_name') || (email ? email.split('@')[0] : 'Student');
  document.getElementById('cert-student-name').textContent = name;
  document.getElementById('cert-course-level').textContent = currentLevel;
  document.getElementById('cert-score').textContent = `Score: ${getUserScore(email || 'guest')} points`;
  document.getElementById('cert-date-str').textContent = new Intl.DateTimeFormat('en-US', {dateStyle:'long'}).format(new Date());
  document.getElementById('certificate-modal').classList.add('visible');
}
function closeCertificate() { document.getElementById('certificate-modal').classList.remove('visible'); }
function downloadPDF() { window.print(); }
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('certificate-modal').addEventListener('click', event => { if(event.target.id === 'certificate-modal') closeCertificate(); });
document.addEventListener('keydown', event => { if(event.key === 'Escape') closeCertificate(); });
