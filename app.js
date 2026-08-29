/* ── 質問データ ── */
const QUESTIONS = [
  {
    id: 'visit_type',
    category: '基本情報',
    text: '本日のご来店は\nはじめてですか？',
    type: 'single',
    choices: ['はじめてのご来店', '2〜3回目のご来店', '定期的にご利用中']
  },
  {
    id: 'today_condition',
    category: '本日のご体調',
    text: '本日のお体の\n状態はいかがですか？',
    type: 'single',
    choices: ['すこぶる良好', 'まあまあ普通', 'やや疲れを感じている', 'かなり疲れている']
  },
  {
    id: 'tension',
    category: '本日のご体調',
    text: '頭・首・肩まわりの\nこわばりはありますか？',
    type: 'single',
    choices: ['あまり感じない', 'すこし感じる', 'かなり張っている', 'ひどく痛みがある']
  },
  {
    id: 'purpose',
    category: '施術のご希望',
    text: '今日はどんな時間を\n過ごしたいですか？',
    sub: '複数お選びいただけます',
    type: 'multi',
    choices: ['とにかくリラックスしたい', '頭のスッキリ感がほしい', '眼精疲労をほぐしたい', '首・肩の疲れを流したい', 'ぐっすり眠れるようにしたい']
  },
  {
    id: 'pressure',
    category: '施術のご希望',
    text: '圧の強さの\nご希望はありますか？',
    type: 'single',
    choices: ['優しめが好き', 'ふつうでお任せ', 'しっかり強めが好き', '当日の状態に合わせてほしい']
  },
  {
    id: 'focus_area',
    category: '施術のご希望',
    text: '特に念入りに\nほぐしてほしい部位は？',
    sub: '複数お選びいただけます',
    type: 'multi',
    choices: ['頭全体', 'こめかみ・側頭部', '首の後ろ・うなじ', '肩・僧帽筋まわり', '目まわり・おでこ', 'おまかせ']
  },
  {
    id: 'caution',
    category: 'ご確認事項',
    text: '以下に当てはまる\nことはありますか？',
    sub: '安全な施術のためにお伺いしています',
    type: 'single',
    choices: ['とくにない', '頭・首に痛みや違和感がある', '最近、頭部にケガや手術をした', 'マッサージ後に好転反応が強く出たことがある', '妊娠中または産後まもない', 'その他、気になることがある']
  },
  {
    id: 'message',
    category: 'セラピストへ',
    text: 'セラピストへひとこと\nあればどうぞ',
    sub: 'なければ「おまかせします」をどうぞ',
    type: 'single',
    choices: ['おまかせします', '静かにゆっくり過ごしたい', '会話しながらリラックスしたい', '気になることを直接伝えます']
  }
];

/* ── カテゴリグループ（サマリー表示用） ── */
const CATEGORY_ORDER = ['基本情報', '本日のご体調', '施術のご希望', 'ご確認事項', 'セラピストへ'];

/* ── 状態 ── */
let currentIndex = 0;
let answers = {};
let multiTemp = [];

/* ── DOM ── */
const screenStart    = document.getElementById('screenStart');
const screenQuestion = document.getElementById('screenQuestion');
const screenSummary  = document.getElementById('screenSummary');
const progressArea   = document.getElementById('progressArea');
const progressFill   = document.getElementById('progressFill');
const progressStep   = document.getElementById('progressStep');
const progressLabel  = document.getElementById('progressLabel');
const leafRow        = document.getElementById('leafRow');
const questionCard   = document.getElementById('questionCard');
const questionCategory = document.getElementById('questionCategory');
const questionText   = document.getElementById('questionText');
const questionSub    = document.getElementById('questionSub');
const choices        = document.getElementById('choices');
const summaryBody    = document.getElementById('summaryBody');

/* ── ボタン ── */
document.getElementById('btnStart').addEventListener('click', startQuiz);
document.getElementById('btnBack').addEventListener('click', goBack);
document.getElementById('btnRestart').addEventListener('click', restart);

/* ── 葉マーカーを生成 ── */
function buildLeafMarkers() {
  leafRow.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const pct = ((i + 1) / QUESTIONS.length) * 100;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 14 14');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('class', 'leaf-marker pending');
    svg.setAttribute('id', `leaf-${i}`);
    svg.style.left = `calc(${pct}% - 7px)`;
    // 葉のパス
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M7 13C7 13 2 9 2 5.5C2 3.02 4.24 1 7 1C9.76 1 12 3.02 12 5.5C12 9 7 13 7 13Z');
    path.setAttribute('fill', '#52B788');
    svg.appendChild(path);
    leafRow.appendChild(svg);
  });
}

/* ── プログレス更新 ── */
function updateProgress(index) {
  const pct = (index / QUESTIONS.length) * 100;
  progressFill.style.width = pct + '%';
  progressStep.textContent = `${index + 1} / ${QUESTIONS.length}`;
  progressLabel.textContent = QUESTIONS[index].category;

  // 葉マーカーの塗り分け
  QUESTIONS.forEach((_, i) => {
    const leaf = document.getElementById(`leaf-${i}`);
    if (!leaf) return;
    if (i < index) {
      leaf.classList.remove('pending');
      leaf.classList.add('done');
    } else {
      leaf.classList.remove('done');
      leaf.classList.add('pending');
    }
  });
}

/* ── 画面切り替え ── */
function showScreen(id) {
  [screenStart, screenQuestion, screenSummary].forEach(s => {
    s.classList.remove('active');
  });
  const target = document.getElementById(id);
  void target.offsetWidth; // アニメーション再トリガー
  target.classList.add('active');
}

/* ── クイズ開始 ── */
function startQuiz() {
  currentIndex = 0;
  answers = {};
  multiTemp = [];
  buildLeafMarkers();
  progressArea.style.display = 'block';
  showScreen('screenQuestion');
  renderQuestion(0);
}

/* ── 質問レンダリング ── */
function renderQuestion(index) {
  const q = QUESTIONS[index];
  updateProgress(index);

  // テキスト設定（改行対応）
  questionCategory.textContent = q.category;
  questionText.textContent = q.text;
  questionSub.textContent = q.sub || '';
  questionSub.style.display = q.sub ? 'block' : 'none';

  // カードアニメーション
  questionCard.style.animation = 'none';
  void questionCard.offsetWidth;
  questionCard.style.animation = '';

  // 選択肢エリアをリセット
  choices.innerHTML = '';
  choices.className = 'choices';

  if (q.type === 'single') {
    renderSingle(q, index);
  } else {
    renderMulti(q, index);
  }

  // 戻るボタン
  document.getElementById('btnBack').style.visibility = index > 0 ? 'visible' : 'hidden';
}

function renderSingle(q, index) {
  const prev = answers[q.id];
  q.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn' + (prev === c ? ' selected' : '');
    btn.textContent = c;
    btn.addEventListener('click', () => {
      answers[q.id] = c;
      nextQuestion();
    });
    choices.appendChild(btn);
  });
}

function renderMulti(q, index) {
  choices.classList.add('multi');
  const prev = answers[q.id] ? [...answers[q.id]] : [];
  multiTemp = [...prev];

  const hint = document.createElement('p');
  hint.className = 'choice-hint';
  hint.textContent = 'あてはまるものをすべて選んでください';
  choices.appendChild(hint);

  q.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn' + (multiTemp.includes(c) ? ' selected' : '');
    btn.textContent = c;
    btn.addEventListener('click', () => {
      if (multiTemp.includes(c)) {
        multiTemp = multiTemp.filter(x => x !== c);
        btn.classList.remove('selected');
      } else {
        multiTemp.push(c);
        btn.classList.add('selected');
      }
      nextBtn.className = 'btn-next-multi' + (multiTemp.length > 0 ? ' visible' : '');
    });
    choices.appendChild(btn);
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-next-multi' + (multiTemp.length > 0 ? ' visible' : '');
  nextBtn.textContent = '次へ進む';
  nextBtn.addEventListener('click', () => {
    if (multiTemp.length === 0) return;
    answers[q.id] = [...multiTemp];
    nextQuestion();
  });
  choices.appendChild(nextBtn);
}

/* ── 次の質問 / 完了 ── */
function nextQuestion() {
  if (currentIndex < QUESTIONS.length - 1) {
    currentIndex++;
    renderQuestion(currentIndex);
  } else {
    showSummary();
  }
}

/* ── 戻る ── */
function goBack() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion(currentIndex);
  }
}

/* ── サマリー表示 ── */
function showSummary() {
  progressFill.style.width = '100%';
  QUESTIONS.forEach((_, i) => {
    const leaf = document.getElementById(`leaf-${i}`);
    if (leaf) { leaf.classList.remove('pending'); leaf.classList.add('done'); }
  });

  summaryBody.innerHTML = '';
  const groups = {};
  QUESTIONS.forEach(q => {
    if (!groups[q.category]) groups[q.category] = [];
    groups[q.category].push(q);
  });

  CATEGORY_ORDER.forEach(cat => {
    if (!groups[cat]) return;
    const group = document.createElement('div');
    group.className = 'summary-group';

    const title = document.createElement('div');
    title.className = 'summary-group-title';
    title.textContent = cat;
    group.appendChild(title);

    groups[cat].forEach(q => {
      const row = document.createElement('div');
      row.className = 'summary-row';

      const qLabel = document.createElement('div');
      qLabel.className = 'summary-q';
      qLabel.textContent = q.text.replace(/\n/g, '');
      row.appendChild(qLabel);

      const ans = answers[q.id];
      if (Array.isArray(ans)) {
        const tagList = document.createElement('div');
        tagList.className = 'tag-list';
        ans.forEach(a => {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = a;
          tagList.appendChild(tag);
        });
        row.appendChild(tagList);
      } else {
        const aLabel = document.createElement('div');
        aLabel.className = 'summary-a';
        aLabel.textContent = ans || '未回答';
        row.appendChild(aLabel);
      }
      group.appendChild(row);
    });

    summaryBody.appendChild(group);
  });

  progressArea.style.display = 'none';
  showScreen('screenSummary');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── 最初からやり直す ── */
function restart() {
  progressArea.style.display = 'none';
  showScreen('screenStart');
}
