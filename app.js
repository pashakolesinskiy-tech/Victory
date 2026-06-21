// ---------- УПРАВЛЕНИЕ ВИКТОРИНАМИ ----------
async function newQuiz() {
    const name = await customPrompt("Название викторины", "Моя викторина", "Введите название");
    if(!name || !name.trim()) { if(name !== null) await customAlert("Название не может быть пустым"); return; }
    currentQuizId = createQuiz(name.trim());
    currentTeams = createDefaultTeams();
    currentTeamIndex = 0;
    saveQuizzesToLocal(); saveSession();
    renderQuizSelectMenu(); renderAll();
}

async function deleteCurrentQuiz() {
    if(!currentQuizId) return;
    if(quizzes.length<=1){ await customAlert("Нельзя удалить последнюю викторину"); return; }
    const confirmed = await customConfirm("Удалить текущую викторину?");
    if(!confirmed) return;
    const quizToDelete = quizzes.find(q=>q.id===currentQuizId);
    if (quizToDelete) {
        for (const cat of quizToDelete.categories) {
            for (const q of cat.questions) {
                if (q.media && q.media.startsWith("db:")) await mediaDB.deleteMedia(q.media).catch(()=>{});
            }
        }
    }
    deleteQuiz(currentQuizId);
    saveQuizzesToLocal(); saveSession();
    renderQuizSelectMenu(); renderAll();
}

function backupAll() {
    customAlert("Экспорт сохранит структуру викторины. Локальные файлы не включаются.", "Экспорт").then(()=>{
        const blob=new Blob([exportQuizzes()],{type:"application/json"});
        const a=document.createElement("a");
        a.href=URL.createObjectURL(blob);
        a.download=`svoya_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click(); URL.revokeObjectURL(a.href);
    });
}

function restoreFromFile(file) {
    const reader=new FileReader();
    reader.onload= async (e)=>{
        try{
            const restored=JSON.parse(e.target.result);
            if(importQuizzes(restored)){ saveQuizzesToLocal(); saveSession(); renderQuizSelectMenu(); renderAll(); await customAlert("Восстановление успешно!"); }
            else await customAlert("Неверный формат файла");
        } catch(err){ await customAlert("Ошибка чтения файла"); }
    };
    reader.readAsText(file);
}

function resetGameProgress() { resetProgress(); saveSession(); renderAll(); customAlert("Прогресс сброшен"); }

async function addTeam() {
    const newName = await customPrompt("Название команды", "", "Введите название");
    if(newName && newName.trim()) { addTeamToGame(newName.trim()); renderAll(); saveSession(); }
    else if(newName !== null) { await customAlert("Введите название команды"); }
}

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
async function init() {
    try { await mediaDB.open(); } catch (e) { console.warn('IndexedDB не доступна', e); }
    loadQuizzes();
    const sessionLoaded=loadSession();
    if(!sessionLoaded || !currentQuizId){ currentQuizId=quizzes[0]?.id||null; if(currentQuizId) currentTeams=createDefaultTeams(); currentTeamIndex=0; saveSession(); }
    renderQuizSelectMenu(); renderAll();

    if(hostMode) {
        document.getElementById("hostModeToggle").classList.add("active");
        document.getElementById("hostModeIndicator").style.display = "inline";
        document.getElementById("showAnswerBtn").style.display = "inline-block";
        document.getElementById("correctAnswerBtn").style.display = "inline-block";
        document.getElementById("wrongAnswerBtn").style.display = "inline-block";
    }

    document.getElementById("openMenuBtn").onclick=()=>document.getElementById("menuModal").style.display="flex";
    document.getElementById("closeMenuBtn").onclick=()=>document.getElementById("menuModal").style.display="none";
    document.getElementById("menuModal").onclick=(e)=>{ if(e.target===e.currentTarget) e.currentTarget.style.display="none"; };
    document.getElementById("quizSelectMenu").addEventListener("change",(e)=>{ currentQuizId=parseInt(e.target.value); currentTeams=createDefaultTeams(); currentTeamIndex=0; const quiz=quizzes.find(q=>q.id===currentQuizId); if(quiz) quiz.categories.forEach(c=>c.questions.forEach(q=>q.isUsed=false)); saveSession(); renderAll(); document.getElementById("menuModal").style.display="none"; });
    document.getElementById("newQuizMenuBtn").onclick=()=>{ newQuiz(); document.getElementById("menuModal").style.display="none"; };
    document.getElementById("editQuizMenuBtn").onclick=()=>{ if(currentQuizId) openEditor(currentQuizId); document.getElementById("menuModal").style.display="none"; };
    document.getElementById("deleteQuizMenuBtn").onclick=()=>{ deleteCurrentQuiz(); document.getElementById("menuModal").style.display="none"; };
    document.getElementById("backupMenuBtn").onclick=()=>{ backupAll(); document.getElementById("menuModal").style.display="none"; };
    document.getElementById("restoreMenuBtn").onclick=()=>{ document.getElementById("restoreFileInput").click(); document.getElementById("menuModal").style.display="none"; };
    document.getElementById("restoreFileInput").onchange=(e)=>{ if(e.target.files.length) restoreFromFile(e.target.files[0]); e.target.value=''; };

    // Shuffle toggle
    document.getElementById("shuffleToggle").onclick=(e)=>{
        shuffleEnabled=!shuffleEnabled;
        e.currentTarget.classList.toggle("active", shuffleEnabled);
        if(shuffleEnabled) shuffleCurrentQuiz(); else sortCurrentQuizByValue();
        saveQuizzesToLocal(); saveSession(); renderAll();
    };

    document.getElementById("printQuizBtn").onclick=()=>{ document.getElementById("menuModal").style.display="none"; window.print(); };

    // Host mode toggle
    document.getElementById("hostModeToggle").onclick=(e)=>{
        hostMode=!hostMode;
        e.currentTarget.classList.toggle("active", hostMode);
        document.getElementById("hostModeIndicator").style.display=hostMode?"inline":"none";
        document.getElementById("answerReveal").style.display="none";
        document.getElementById("showAnswerBtn").style.display=hostMode?"inline-block":"none";
        document.getElementById("correctAnswerBtn").style.display=hostMode?"inline-block":"none";
        document.getElementById("wrongAnswerBtn").style.display=hostMode?"inline-block":"none";
        saveSession();
    };

    document.getElementById("globalTimerSecMenu").addEventListener("change", ()=>saveSession());

    document.getElementById("resetGameProgressBtn").onclick=()=>resetGameProgress();

    // Team actions modal - close
    document.getElementById("teamActionsClose").onclick=()=>document.getElementById("teamActionsModal").style.display="none";
    document.getElementById("teamActionsModal").onclick=(e)=>{ if(e.target===e.currentTarget) e.currentTarget.style.display="none"; };

    // Question modal
    document.getElementById("startTimerBtn").onclick=startTimerModal;
    document.getElementById("pauseTimerBtn").onclick=pauseTimer;
    document.getElementById("showAnswerBtn").onclick=()=>document.getElementById("answerReveal").style.display="block";
    document.getElementById("correctAnswerBtn").onclick=answerCorrect;
    document.getElementById("wrongAnswerBtn").onclick=answerWrong;
    document.getElementById("closeModalBtn").onclick=closeModalAndRefresh;
    document.getElementById("questionModal").onclick=(e)=>{ if(e.target===e.currentTarget) closeModalAndRefresh(); };

    // Editor
    document.getElementById("saveQuizBtn").onclick=saveCurrentEditor;
    document.getElementById("closeEditorBtn").onclick=closeEditor;
    document.getElementById("addCategoryEditorBtn").onclick=addCategoryInEditor;
    document.getElementById("editorModal").onclick=(e)=>{ if(e.target===e.currentTarget) closeEditor(); };

    // Prompt/Alert - close on backdrop
    document.getElementById("customPromptModal").onclick=(e)=>{ if(e.target===e.currentTarget){ document.getElementById("promptCancelBtn").click(); } };
    document.getElementById("customAlertModal").onclick=(e)=>{ if(e.target===e.currentTarget){ document.getElementById("alertOkBtn").click(); } };

    // ESC to close modals
    document.addEventListener("keydown",(e)=>{ if(e.key==="Escape"){ ["menuModal","questionModal","editorModal","teamActionsModal","customPromptModal","customAlertModal"].forEach(id=>{ const m=document.getElementById(id); if(m && m.style.display==="flex"){ m.style.display="none"; } }); } });

    // Save session before page unload
    window.addEventListener("beforeunload", saveSession);
}
init();
