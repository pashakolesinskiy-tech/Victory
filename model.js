// ---------- МОДЕЛЬ: чистая бизнес-логика (без DOM) ----------

// --- Команды ---
function createDefaultTeams() { return [{ name: "Команда 1", score: 0 }, { name: "Команда 2", score: 0 }]; }

function addTeamToGame(name) { currentTeams.push({ name, score: 0 }); }

function removeTeamFromGame(index) {
    if (currentTeams.length <= 1) return false;
    currentTeams.splice(index, 1);
    if (currentTeamIndex >= currentTeams.length) currentTeamIndex = currentTeams.length - 1;
    if (currentTeamIndex < 0) currentTeamIndex = 0;
    return true;
}

function adjustTeamScore(index, delta) { currentTeams[index].score += delta; }

// --- Игра ---
function nextTeam() {
    if (currentTeams.length === 0) return;
    currentTeamIndex = (currentTeamIndex + 1) % currentTeams.length;
}

function markQuestionUsed(quizId, catIdx, qIdx) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) {
        const q = quiz.categories[catIdx]?.questions[qIdx];
        if (q && !q.isUsed) q.isUsed = true;
    }
}

function awardPoints(teamIndex, value) {
    if (currentTeams[teamIndex]) currentTeams[teamIndex].score += value;
}

function resetProgress() {
    if (!currentQuizId) return;
    const quiz = quizzes.find(q => q.id === currentQuizId);
    if (quiz) quiz.categories.forEach(c => c.questions.forEach(q => q.isUsed = false));
    currentTeams = currentTeams.map(t => ({ ...t, score: 0 }));
    currentTeamIndex = 0;
}

// --- Викторины ---
function createDemoQuiz() {
    return {
        id: Date.now(),
        name: "🏆 Классическая",
        categories: [
            { name: "Кино", questions: [
                { value: 100, text: "Какой фильм собрал больше всего 'Оскаров'?", answer: "Бен-Гур / Титаник / Властелин колец (11)", media: "", isUsed: false },
                { value: 200, text: "Кто сыграл Джокера в 'Тёмном рыцаре'?", answer: "Хит Леджер", media: "", isUsed: false },
                { value: 300, text: "Название корабля из 'Титаника'", answer: "Титаник", media: "", isUsed: false },
            ]},
            { name: "География", questions: [
                { value: 100, text: "Самая длинная река в мире?", answer: "Нил", media: "", isUsed: false },
                { value: 200, text: "Столица Японии", answer: "Токио", media: "", isUsed: false },
                { value: 300, text: "Самая высокая гора вне Азии", answer: "Аконкагуа", media: "", isUsed: false },
            ]}
        ]
    };
}

function createQuiz(name) {
    const newId = Date.now();
    quizzes.push({
        id: newId, name,
        categories: [
            { name: "Категория 1", questions: [
                { value: 100, text: "Вопрос 100", answer: "Ответ 1", media: "", isUsed: false },
                { value: 200, text: "Вопрос 200", answer: "Ответ 2", media: "", isUsed: false },
            ]},
            { name: "Категория 2", questions: [
                { value: 100, text: "Вопрос 100", answer: "Ответ 1", media: "", isUsed: false },
            ]}
        ]
    });
    return newId;
}

function deleteQuiz(quizId) {
    quizzes = quizzes.filter(q => q.id !== quizId);
    currentQuizId = quizzes[0]?.id || null;
    currentTeams = createDefaultTeams();
    currentTeamIndex = 0;
}

function updateQuizName(quizId, name) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) quiz.name = name;
}

function updateCategoryName(quizId, catIdx, name) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz?.categories[catIdx]) quiz.categories[catIdx].name = name;
}

function updateQuestion(quizId, catIdx, qIdx, data) {
    const quiz = quizzes.find(q => q.id === quizId);
    const q = quiz?.categories[catIdx]?.questions[qIdx];
    if (!q) return;
    if (data.value !== undefined) q.value = data.value;
    if (data.text !== undefined) q.text = data.text;
    if (data.answer !== undefined) q.answer = data.answer;
    if (data.media !== undefined) q.media = data.media;
}

function addCategoryToQuiz(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) quiz.categories.push({ name: "Новая категория", questions: [{ value: 100, text: "Пример", answer: "Ответ", media: "", isUsed: false }] });
}

function addRowToAllCategories(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) quiz.categories.forEach(cat => cat.questions.push({ value: 100, text: "Новый вопрос", answer: "Ответ", media: "", isUsed: false }));
}

function removeLastRowFromAllCategories(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) quiz.categories.forEach(cat => cat.questions.pop());
}

function removeCategory(quizId, catIdx) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz && quiz.categories.length > 1) quiz.categories.splice(catIdx, 1);
}

function removeQuestion(quizId, catIdx, qIdx) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz?.categories[catIdx]) quiz.categories[catIdx].questions.splice(qIdx, 1);
}

function getRowCount(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    return quiz ? Math.max(...quiz.categories.map(c => c.questions.length), 0) : 0;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function shuffleCurrentQuiz() {
    const quiz = quizzes.find(q => q.id === currentQuizId);
    if (!quiz) return;
    quiz.categories = shuffleArray([...quiz.categories]);
    quiz.categories.forEach(cat => {
        cat.questions = shuffleArray([...cat.questions]);
    });
}

function sortCurrentQuizByValue() {
    const quiz = quizzes.find(q => q.id === currentQuizId);
    if (!quiz) return;
    quiz.categories.forEach(cat => {
        cat.questions.sort((a, b) => a.value - b.value);
    });
}

function exportQuizzes() { return JSON.stringify(quizzes, null, 2); }

function validateQuiz(q) {
    if (!q || typeof q.id !== "number" || typeof q.name !== "string") return false;
    if (!Array.isArray(q.categories) || !q.categories.length) return false;
    for (const cat of q.categories) {
        if (typeof cat.name !== "string") return false;
        if (!Array.isArray(cat.questions)) return false;
        for (const qst of cat.questions) {
            if (typeof qst.value !== "number" || typeof qst.text !== "string" || typeof qst.answer !== "string") return false;
            if (typeof qst.media !== "string") return false;
            if (typeof qst.isUsed !== "boolean") return false;
        }
    }
    return true;
}

function importQuizzes(data) {
    if (!Array.isArray(data) || !data.length) return false;
    for (const q of data) { if (!validateQuiz(q)) return false; }
    quizzes = data.map(q => ({
        id: Number(q.id) || Date.now(),
        name: String(q.name).slice(0, 200),
        categories: q.categories.map(cat => ({
            name: String(cat.name).slice(0, 100),
            questions: cat.questions.map(qst => ({
                value: Math.max(0, Math.min(10000, Number(qst.value) || 0)),
                text: String(qst.text).slice(0, 1000),
                answer: String(qst.answer).slice(0, 500),
                media: String(qst.media).slice(0, 500),
                isUsed: !!qst.isUsed
            }))
        }))
    }));
    if (!quizzes.some(q => q.id === currentQuizId)) currentQuizId = quizzes[0].id;
    currentTeams = createDefaultTeams();
    currentTeamIndex = 0;
    return true;
}
