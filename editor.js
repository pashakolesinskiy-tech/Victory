// ---------- ЛОГИКА РЕДАКТОРА ----------
let editingQuizId=null;

function syncEditorToModel() {
    if(!editingQuizId) return;
    const quiz=quizzes.find(q=>q.id===editingQuizId);
    if(!quiz) return;
    updateQuizName(editingQuizId, document.getElementById("editQuizName").value);
    document.querySelectorAll(".cat-name-input").forEach(inp=>{ const ci=parseInt(inp.dataset.catidx); updateCategoryName(editingQuizId, ci, inp.value); });
    document.querySelectorAll(".q-value-input").forEach(inp=>{ const ci=parseInt(inp.dataset.cat), qi=parseInt(inp.dataset.qidx); updateQuestion(editingQuizId, ci, qi, {value:parseInt(inp.value)||100}); });
    document.querySelectorAll(".q-text").forEach(inp=>{ const ci=parseInt(inp.dataset.cat), qi=parseInt(inp.dataset.qidx); updateQuestion(editingQuizId, ci, qi, {text:inp.value}); });
    document.querySelectorAll(".q-answer").forEach(inp=>{ const ci=parseInt(inp.dataset.cat), qi=parseInt(inp.dataset.qidx); updateQuestion(editingQuizId, ci, qi, {answer:inp.value}); });
    document.querySelectorAll(".q-media").forEach(inp=>{
        const ci=parseInt(inp.dataset.cat), qi=parseInt(inp.dataset.qidx);
        if(quiz.categories[ci]?.questions[qi]) {
            const newMedia = inp.value.trim();
            const oldMedia = quiz.categories[ci].questions[qi].media;
            if (oldMedia && oldMedia.startsWith("db:") && oldMedia !== newMedia && newMedia !== "[Файл]") {
                mediaDB.deleteMedia(oldMedia).catch(()=>{});
            }
            if (newMedia === "" && oldMedia && oldMedia.startsWith("db:")) {
                updateQuestion(editingQuizId, ci, qi, {media:""});
            } else if (newMedia !== "[Файл]") {
                updateQuestion(editingQuizId, ci, qi, {media:newMedia});
            }
        }
    });
}

function saveCurrentEditor() {
    syncEditorToModel();
    saveQuizzesToLocal();
    if(currentQuizId===editingQuizId) renderAll();
    closeEditor();
}

function closeEditor() { document.getElementById("editorModal").style.display="none"; editingQuizId=null; }
function addCategoryInEditor() { syncEditorToModel(); addCategoryToQuiz(editingQuizId); openEditor(editingQuizId); }
