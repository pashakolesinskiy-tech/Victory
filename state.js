// ---------- ХРАНИЛИЩЕ МЕДИА (IndexedDB) ----------
const mediaDB = (() => {
    const DB_NAME = 'svoya_media_db';
    const STORE_NAME = 'media';
    let db = null;

    function open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    function ensureDB() {
        if (db) return Promise.resolve(db);
        return open();
    }

    async function saveMedia(id, blob) {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const record = { id, blob };
            const request = store.put(record);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function getMedia(id) {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            request.onsuccess = () => {
                resolve(request.result ? request.result.blob : null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function deleteMedia(id) {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    return { saveMedia, getMedia, deleteMedia, open };
})();

// ---------- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ----------
let quizzes = [];
let currentQuizId = null;
let currentTeams = [];
let currentTeamIndex = 0;
let activeQuestionData = null;
let timerInterval = null;
let timerSecondsLeft = 0;
let hostMode = false;
let shuffleEnabled = false;
let timerDuration = 30;

const STORAGE_QUIZZES = "svoya_quizzes";
const STORAGE_SESSION = "svoya_session";
const STORAGE_SETTINGS = "svoya_settings";

function saveSettings() {
    try {
        localStorage.setItem(STORAGE_SETTINGS, JSON.stringify({ timerDuration, hostMode }));
    } catch (e) {}
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_SETTINGS);
        if (raw) {
            const s = JSON.parse(raw);
            if (s.timerDuration) timerDuration = s.timerDuration;
            if (s.hostMode !== undefined) hostMode = s.hostMode;
        }
    } catch (e) {}
}

function saveQuizzesToLocal() {
    try {
        localStorage.setItem(STORAGE_QUIZZES, JSON.stringify(quizzes));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.toString().includes('quota')) {
            customAlert('Недостаточно места в хранилище браузера. Попробуйте удалить неиспользуемые медиафайлы или старые викторины.', 'Ошибка сохранения');
        } else {
            customAlert('Ошибка сохранения данных: ' + e.message, 'Ошибка');
        }
    }
}

function loadQuizzes() {
    const data = localStorage.getItem(STORAGE_QUIZZES);
    if(data) {
        try {
            quizzes = JSON.parse(data);
        } catch (e) {
            quizzes = [createDemoQuiz()];
        }
    } else {
        quizzes = [createDemoQuiz()];
    }
}

function saveSession() {
    if(!currentQuizId) return;
    const quiz = quizzes.find(q => q.id === currentQuizId);
    if(!quiz) return;
    const usedStates = quiz.categories.map(cat => cat.questions.map(q => q.isUsed));
    const sessionData = { currentQuizId, teams: currentTeams, currentTeamIndex, usedStates };
    try {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(sessionData));
    } catch (e) {
        console.warn('Could not save session', e);
    }
}

function loadSession() {
    const sessRaw = localStorage.getItem(STORAGE_SESSION);
    if(sessRaw) {
        try {
            const sess = JSON.parse(sessRaw);
            if(quizzes.some(q=>q.id===sess.currentQuizId) && sess.teams?.length) {
                currentQuizId = sess.currentQuizId;
                currentTeams = sess.teams;
                currentTeamIndex = sess.currentTeamIndex;
                const quiz = quizzes.find(q=>q.id===currentQuizId);
                if(quiz && sess.usedStates) {
                    for(let ci=0; ci<quiz.categories.length && ci<sess.usedStates.length; ci++) {
                        for(let qi=0; qi<quiz.categories[ci].questions.length && qi<sess.usedStates[ci].length; qi++) {
                            quiz.categories[ci].questions[qi].isUsed = sess.usedStates[ci][qi];
                        }
                    }
                }
                return true;
            }
        } catch(e) {}
    }
    return false;
}
