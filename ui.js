// ---------- КАСТОМНЫЕ МОДАЛЬНЫЕ ДИАЛОГИ ----------
function customAlert(msg, title = "Сообщение") {
    return new Promise((resolve) => {
        const modal = document.getElementById("customAlertModal");
        document.getElementById("alertTitle").innerText = title;
        document.getElementById("alertMessage").innerText = msg;
        modal.style.display = "flex";
        const okBtn = document.getElementById("alertOkBtn");
        const handler = () => { modal.style.display = "none"; okBtn.removeEventListener("click", handler); resolve(); };
        okBtn.addEventListener("click", handler);
    });
}

function customPrompt(question, defaultValue = "", placeholder = "") {
    return new Promise((resolve) => {
        const modal = document.getElementById("customPromptModal");
        document.getElementById("promptTitle").innerText = question;
        const input = document.getElementById("promptInput");
        input.value = defaultValue;
        input.placeholder = placeholder;
        input.style.display = "";
        modal.style.display = "flex";
        input.focus();
        const okBtn = document.getElementById("promptOkBtn");
        const cancelBtn = document.getElementById("promptCancelBtn");
        const onOk = () => { modal.style.display = "none"; okBtn.removeEventListener("click", onOk); cancelBtn.removeEventListener("click", onCancel); resolve(input.value); };
        const onCancel = () => { modal.style.display = "none"; okBtn.removeEventListener("click", onOk); cancelBtn.removeEventListener("click", onCancel); resolve(null); };
        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
    });
}

function customConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById("customPromptModal");
        document.getElementById("promptTitle").innerText = message;
        const input = document.getElementById("promptInput");
        input.style.display = "none";
        modal.style.display = "flex";
        const okBtn = document.getElementById("promptOkBtn");
        const cancelBtn = document.getElementById("promptCancelBtn");
        const onOk = () => { modal.style.display = "none"; input.style.display = ""; okBtn.removeEventListener("click", onOk); cancelBtn.removeEventListener("click", onCancel); resolve(true); };
        const onCancel = () => { modal.style.display = "none"; input.style.display = ""; okBtn.removeEventListener("click", onOk); cancelBtn.removeEventListener("click", onCancel); resolve(false); };
        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
    });
}

// ---------- ОТРИСОВКА UI ----------
function renderAll() {
    if(!currentQuizId) return;
    const quiz = quizzes.find(q=>q.id===currentQuizId);
    if(quiz) {
        document.getElementById("currentQuizNameBadge").innerText = quiz.name;
        renderTeamsPanel();
        renderGameGrid(quiz);
    }
}

function highlightActiveTeam() {
    const cards = document.querySelectorAll(".team-card");
    cards.forEach((card, i) => { if(i === currentTeamIndex) { card.classList.remove("turn-highlight"); void card.offsetWidth; card.classList.add("turn-highlight"); } });
}

function renderTeamsPanel() {
    const container = document.getElementById("teamsContainer");
    container.innerHTML = "";
    currentTeams.forEach((team, idx) => {
        const card = document.createElement("div");
        card.className = `team-card ${idx===currentTeamIndex?'active':''}`;
        card.dataset.teamIdx = idx;

        const nameEl = document.createElement("div");
        nameEl.className = "team-name";
        nameEl.textContent = team.name;
        card.appendChild(nameEl);

        const scoreEl = document.createElement("div");
        scoreEl.className = "team-score";
        scoreEl.textContent = team.score;
        card.appendChild(scoreEl);

        card.addEventListener("click", () => openTeamActionsModal(idx));
        container.appendChild(card);
    });

    const addCard = document.createElement("div");
    addCard.className = "team-card team-add-card";
    addCard.textContent = "+ Добавить";
    addCard.addEventListener("click", () => addTeam());
    container.appendChild(addCard);
}

function openTeamActionsModal(idx) {
    const team = currentTeams[idx];
    if (!team) return;
    document.getElementById("teamActionsName").textContent = team.name;
    document.getElementById("teamActionsScore").textContent = team.score;
    const modal = document.getElementById("teamActionsModal");
    modal.style.display = "flex";

    const setCurrentBtn = document.getElementById("teamActionSetCurrent");
    const changeScoreBtn = document.getElementById("teamActionChangeScore");
    const renameBtn = document.getElementById("teamActionRename");
    const removeBtn = document.getElementById("teamActionRemove");
    const closeBtn = document.getElementById("teamActionsClose");

    const cleanup = () => { modal.style.display = "none"; setCurrentBtn.onclick = null; changeScoreBtn.onclick = null; renameBtn.onclick = null; removeBtn.onclick = null; closeBtn.onclick = null; };

    setCurrentBtn.onclick = () => { currentTeamIndex = idx; saveSession(); renderAll(); highlightActiveTeam(); cleanup(); };
    changeScoreBtn.onclick = async () => {
        const delta = await customPrompt("Изменить очки (+200 / -100)", "0", "+200 или -100");
        if (delta !== null) { const val = parseInt(delta); if (!isNaN(val) && val !== 0) { adjustTeamScore(idx, val); saveSession(); renderAll(); } }
        cleanup();
    };
    renameBtn.onclick = async () => {
        const newName = await customPrompt("Название команды", team.name, "Введите название");
        if (newName && newName.trim()) { team.name = newName.trim(); saveSession(); renderAll(); }
        cleanup();
    };
    removeBtn.onclick = async () => {
        if (currentTeams.length <= 1) { await customAlert("Должна быть минимум одна команда"); cleanup(); return; }
        const ok = await customConfirm(`Удалить команду «${team.name}»?`);
        if (ok) { removeTeamFromGame(idx); saveSession(); renderAll(); }
        cleanup();
    };
    closeBtn.onclick = cleanup;
}

function renderGameGrid(quiz) {
    const thead = document.getElementById("tableHeader");
    const tbody = document.getElementById("tableBody");
    thead.innerHTML = ""; tbody.innerHTML = "";
    const cats = quiz.categories;
    if(!cats.length) return;
    const headerRow = document.createElement("tr");
    cats.forEach(cat=>{ const th=document.createElement("th"); th.innerText=cat.name; headerRow.appendChild(th); });
    thead.appendChild(headerRow);
    const maxRows = Math.max(...cats.map(c=>c.questions.length),0);
    for(let row=0; row<maxRows; row++){
        const tr=document.createElement("tr");
        for(let col=0; col<cats.length; col++){
            const td=document.createElement("td");
            const q=cats[col].questions[row];
            if(q){
                td.innerText=q.value;
                if(q.isUsed){ td.classList.add("used"); td.innerText="✔"; }
                else{ td.addEventListener("click",(()=>openQuestion(col,row,q.value))); }
            } else { td.innerText="—"; td.classList.add("used"); }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

function renderQuizSelectMenu() {
    const select=document.getElementById("quizSelectMenu");
    select.innerHTML="";
    quizzes.forEach(q=>{ const opt=document.createElement("option"); opt.value=q.id; opt.innerText=q.name; if(currentQuizId===q.id) opt.selected=true; select.appendChild(opt); });
}

// ---------- РЕДАКТОР UI (аккордеон) ----------
let openEditorCategories = new Set();

function openEditor(quizId) {
    const quiz = quizzes.find(q=>q.id===quizId);
    if(!quiz) return;
    editingQuizId=quizId;
    document.getElementById("editQuizName").value=quiz.name;
    const container=document.getElementById("categoriesEditorContainer");
    const prevOpen = new Set(container.querySelectorAll(".editor-category-body.open")).size;
    container.querySelectorAll(".editor-category").forEach((el,i)=>{ if(el.querySelector(".editor-category-body.open")) openEditorCategories.add(i); });
    container.innerHTML="";

    quiz.categories.forEach((cat,idx)=>{
        const catDiv=document.createElement("div");
        catDiv.className="editor-category";

        const header=document.createElement("div");
        header.className="editor-category-header";

        const arrow=document.createElement("span");
        arrow.className="editor-category-arrow";
        arrow.textContent="▶";
        header.appendChild(arrow);

        const nameSpan=document.createElement("span");
        nameSpan.className="editor-category-name";
        nameSpan.textContent=cat.name;
        nameSpan.addEventListener("click",(e)=>{
            e.stopPropagation();
            const inp=document.createElement("input");
            inp.type="text"; inp.value=cat.name; inp.className="cat-name-input";
            inp.dataset.catidx=idx;
            inp.style.cssText="flex:1;padding:2px 6px;font-size:0.9rem;border:1px solid var(--primary);border-radius:var(--radius-sm);";
            const save=()=>{ cat.name=inp.value.trim()||cat.name; nameSpan.textContent=cat.name; inp.replaceWith(nameSpan); };
            inp.addEventListener("blur",save);
            inp.addEventListener("keydown",(ke)=>{ if(ke.key==="Enter") save(); if(ke.key==="Escape"){ inp.value=cat.name; inp.replaceWith(nameSpan); } });
            nameSpan.replaceWith(inp); inp.focus(); inp.select();
        });
        header.appendChild(nameSpan);

        const countSpan=document.createElement("span");
        countSpan.className="editor-category-count";
        countSpan.textContent=`${cat.questions.length} вопросов`;
        header.appendChild(countSpan);

        const delCatBtn=document.createElement("button");
        delCatBtn.className="danger";
        delCatBtn.textContent="🗑";
        delCatBtn.style.padding="4px 8px";
        delCatBtn.style.fontSize="0.75rem";
        delCatBtn.addEventListener("click",(e)=>{ e.stopPropagation(); if(quiz.categories.length>1){ removeCategory(quiz.id, idx); openEditor(quiz.id); } else customAlert("Нужна хотя бы одна категория"); });
        header.appendChild(delCatBtn);

        const body=document.createElement("div");
        body.className="editor-category-body";

        cat.questions.forEach((q,qidx)=>{
            const qDiv=document.createElement("div");
            qDiv.className="question-row";

            let mediaDisplay = q.media;
            if (mediaDisplay && mediaDisplay.startsWith("db:")) mediaDisplay = "[Файл]";

            const valInput = document.createElement("input");
            valInput.type = "number"; valInput.className = "q-value-input"; valInput.value = q.value; valInput.step = "100";
            valInput.dataset.cat = idx; valInput.dataset.qidx = qidx;
            qDiv.appendChild(valInput);

            const textInput = document.createElement("input");
            textInput.type = "text"; textInput.className = "q-text";
            textInput.value = q.text; textInput.placeholder = "Вопрос";
            textInput.dataset.cat = idx; textInput.dataset.qidx = qidx;
            qDiv.appendChild(textInput);

            const ansInput = document.createElement("input");
            ansInput.type = "text"; ansInput.className = "q-answer";
            ansInput.value = q.answer; ansInput.placeholder = "Ответ";
            ansInput.dataset.cat = idx; ansInput.dataset.qidx = qidx;
            qDiv.appendChild(ansInput);

            const mediaInput = document.createElement("input");
            mediaInput.type = "text"; mediaInput.className = "q-media";
            mediaInput.value = mediaDisplay; mediaInput.placeholder = "Медиа (ссылка)";
            mediaInput.dataset.cat = idx; mediaInput.dataset.qidx = qidx;
            qDiv.appendChild(mediaInput);

            const uploadBtn = document.createElement("button");
            uploadBtn.className = "uploadMediaBtn";
            uploadBtn.dataset.cat = idx; uploadBtn.dataset.qidx = qidx;
            uploadBtn.textContent = "📁";
            uploadBtn.style.padding = "6px 8px";
            qDiv.appendChild(uploadBtn);

            const delBtn = document.createElement("button");
            delBtn.className = "delQuestionBtn";
            delBtn.dataset.cat = idx; delBtn.dataset.qidx = qidx;
            delBtn.textContent = "✕";
            delBtn.style.padding = "6px 8px";
            delBtn.style.background = "var(--danger)";
            delBtn.style.color = "white";
            delBtn.style.border = "none";
            qDiv.appendChild(delBtn);

            body.appendChild(qDiv);
        });

        const addQBtn = document.createElement("button");
        addQBtn.textContent = "+ Добавить вопрос";
        addQBtn.style.marginTop = "8px";
        addQBtn.style.fontSize = "0.8rem";
        addQBtn.addEventListener("click", () => {
            cat.questions.push({value:100, text:"Новый вопрос", answer:"", media:"", isUsed:false});
            openEditor(quiz.id);
        });
        body.appendChild(addQBtn);

        header.addEventListener("click", () => {
            body.classList.toggle("open");
            arrow.classList.toggle("open");
            if(body.classList.contains("open")) openEditorCategories.add(idx); else openEditorCategories.delete(idx);
        });

        catDiv.appendChild(header);
        catDiv.appendChild(body);
        if(openEditorCategories.has(idx)) { body.classList.add("open"); arrow.classList.add("open"); }
        container.appendChild(catDiv);
    });

    attachEditorEvents(quiz);
    document.getElementById("editorModal").style.display="flex";
}

function customMediaUpload(currentValue) {
    return new Promise((resolve) => {
        const modal = document.getElementById("mediaUploadModal");
        const urlInput = document.getElementById("mediaUrlInput");
        urlInput.value = currentValue && !currentValue.startsWith("db:") ? currentValue : "";
        modal.style.display = "flex";
        urlInput.focus();

        const onOk = () => {
            const val = urlInput.value.trim();
            cleanup();
            resolve(val ? { type: "url", value: val } : null);
        };
        const onBrowse = () => {
            cleanup();
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*,video/*,audio/*";
            fileInput.onchange = (ev) => {
                const file = ev.target.files[0];
                if (file) resolve({ type: "file", file });
                else resolve(null);
            };
            fileInput.click();
        };
        const onCancel = () => { cleanup(); resolve(null); };
        const cleanup = () => {
            modal.style.display = "none";
            document.getElementById("mediaUploadOk").removeEventListener("click", onOk);
            document.getElementById("mediaUploadBrowse").removeEventListener("click", onBrowse);
            document.getElementById("mediaUploadCancel").removeEventListener("click", onCancel);
        };
        document.getElementById("mediaUploadOk").addEventListener("click", onOk);
        document.getElementById("mediaUploadBrowse").addEventListener("click", onBrowse);
        document.getElementById("mediaUploadCancel").addEventListener("click", onCancel);
        modal.onclick = (e) => { if (e.target === e.currentTarget) onCancel(); };
    });
}

function attachEditorEvents(quiz) {
    document.querySelectorAll(".delQuestionBtn").forEach(btn=>btn.addEventListener("click",()=>{ const ci=parseInt(btn.dataset.cat), qi=parseInt(btn.dataset.qidx); removeQuestion(quiz.id, ci, qi); openEditor(quiz.id); }));
    document.querySelectorAll(".uploadMediaBtn").forEach(btn=>btn.addEventListener("click",async()=>{
        const ci=parseInt(btn.dataset.cat), qi=parseInt(btn.dataset.qidx);
        const question=quiz.categories[ci].questions[qi];
        const result = await customMediaUpload(question.media);
        if (!result) return;
        if (result.type === "url") {
            if (question.media && question.media.startsWith("db:")) await mediaDB.deleteMedia(question.media).catch(()=>{});
            question.media = result.value;
            openEditor(quiz.id);
        } else {
            const file = result.file;
            if(file.size > 100 * 1024 * 1024){ await customAlert("Файл слишком большой (>100 МБ)."); return; }
            if (question.media && question.media.startsWith("db:")) await mediaDB.deleteMedia(question.media).catch(()=>{});
            let prefix;
            const fileName = file.name.toLowerCase();
            if (file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi)$/i.test(fileName)) prefix = 'db:v_';
            else if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac)$/i.test(fileName)) prefix = 'db:a_';
            else prefix = 'db:i_';
            const mediaId = prefix + Date.now() + '_' + Math.random().toString(36);
            try { await mediaDB.saveMedia(mediaId, file); question.media = mediaId; openEditor(quiz.id); }
            catch (e) { await customAlert('Ошибка: ' + e.message); }
        }
    }));
}
