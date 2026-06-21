// ---------- ИГРОВАЯ ЛОГИКА ----------
let timerAudioCtx = null;
function playTick() {
    try {
        if (!timerAudioCtx) timerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = timerAudioCtx.createOscillator();
        const gain = timerAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(timerAudioCtx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, timerAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, timerAudioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(timerAudioCtx.currentTime + 0.1);
    } catch(e) {}
}
async function openQuestion(catIdx,qIdx,value) {
    if(timerInterval) clearInterval(timerInterval);
    const quiz = quizzes.find(q=>q.id===currentQuizId);
    if(!quiz) return;
    const question = quiz.categories[catIdx]?.questions[qIdx];
    if(!question||question.isUsed) return;
    activeQuestionData = {catIdx,qIdx,value,quizId:currentQuizId};
    document.getElementById("modalCatName").textContent = `${quiz.categories[catIdx].name} — ${value} баллов`;
    document.getElementById("modalQuestionText").innerText = question.text;
    const mediaDiv = document.getElementById("modalMedia");
    mediaDiv.innerHTML = "";

    if(question.media && question.media.trim()){
        const mediaValue = question.media.trim();
        if (mediaValue.startsWith("db:")) {
            try {
                const blob = await mediaDB.getMedia(mediaValue);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    let mediaType = 'image';
                    if (blob.type) {
                        if (blob.type.startsWith('video/')) mediaType = 'video';
                        else if (blob.type.startsWith('audio/')) mediaType = 'audio';
                    } else if (mediaValue.startsWith('db:v_')) mediaType = 'video';
                    else if (mediaValue.startsWith('db:a_')) mediaType = 'audio';
                    else {
                        const header = await blob.slice(0, 12).text().catch(()=>'');
                        if (header.includes('ftyp') || header.includes('webm') || header.includes('RIFF')) mediaType = 'video';
                        else if (header.includes('ID3') || header.includes('OggS')) mediaType = 'audio';
                    }
                    if (mediaType === 'video') {
                        const video = document.createElement('video');
                        video.src = url; video.controls = true; video.preload = "auto"; video.style.maxWidth = "100%";
                        video.onerror = () => { video.style.display="none"; const p=document.createElement("p"); p.style.color="var(--danger)"; p.textContent="Видео не загружено."; mediaDiv.appendChild(p); };
                        video.load(); mediaDiv.appendChild(video);
                    } else if (mediaType === 'audio') {
                        const audio = document.createElement('audio');
                        audio.src = url; audio.controls = true; audio.preload = "auto"; audio.style.width = "100%";
                        audio.onerror = () => { audio.style.display="none"; const p=document.createElement("p"); p.style.color="var(--danger)"; p.textContent="Аудио не загружено."; mediaDiv.appendChild(p); };
                        audio.load(); mediaDiv.appendChild(audio);
                    } else {
                        const img = document.createElement('img');
                        img.src = url; img.alt = "Медиа";
                        img.onerror = () => { img.style.display="none"; const p=document.createElement("p"); p.style.color="var(--warning)"; p.textContent="Изображение не загружено"; mediaDiv.appendChild(p); };
                        mediaDiv.appendChild(img);
                    }
                } else {
                    question.media = ""; saveQuizzesToLocal();
                    const p=document.createElement("p"); p.style.color="var(--warning)"; p.textContent="Медиафайл удалён. Загрузите заново."; mediaDiv.appendChild(p);
                }
            } catch (e) {
                question.media = ""; saveQuizzesToLocal();
                const p=document.createElement("p"); p.style.color="var(--danger)"; p.textContent="Ошибка загрузки медиа."; mediaDiv.appendChild(p);
            }
        } else {
            const url = mediaValue;
            if(url.includes("youtube.com/watch")||url.includes("youtu.be")||url.includes("youtube.com/shorts/")||url.includes("youtube.com/live/")){
                let videoId="";
                if(url.includes("youtu.be")) videoId=url.split("/").pop().split("?")[0];
                else if(url.includes("v=")) videoId=url.split("v=")[1].split("&")[0];
                else if(url.includes("/shorts/")) videoId=url.split("/shorts/")[1].split("?")[0];
                else if(url.includes("/live/")) videoId=url.split("/live/")[1].split("?")[0];
                if(videoId){
                    const iframe=document.createElement("iframe");
                    iframe.src=`https://www.youtube.com/embed/${videoId}`;
                    iframe.width="100%"; iframe.height="250";
                    iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                    iframe.allowFullscreen=true;
                    iframe.referrerPolicy="no-referrer";
                    mediaDiv.appendChild(iframe);
                } else { const p=document.createElement("p"); p.style.color="var(--warning)"; p.textContent="Не удалось распознать YouTube"; mediaDiv.appendChild(p); }
            } else if(url.match(/\.(mp4|webm|ogg|mov|avi)(\?|#|$)/i)||url.startsWith("data:video/")){
                const video=document.createElement("video");
                video.src=url; video.controls=true; video.preload="auto"; video.style.maxWidth="100%";
                video.onerror=()=>{ video.style.display="none"; const p=document.createElement("p"); p.style.color="var(--danger)"; p.textContent="Видео не загружено."; mediaDiv.appendChild(p); };
                video.load(); mediaDiv.appendChild(video);
            } else if(url.match(/\.(mp3|wav|ogg|m4a|aac|flac)(\?|#|$)/i)||url.startsWith("data:audio/")){
                const audio=document.createElement("audio");
                audio.src=url; audio.controls=true; audio.preload="auto"; audio.style.width="100%";
                audio.onerror=()=>{ audio.style.display="none"; const p=document.createElement("p"); p.style.color="var(--danger)"; p.textContent="Аудио не загружено."; mediaDiv.appendChild(p); };
                audio.load(); mediaDiv.appendChild(audio);
            } else {
                const img=document.createElement("img");
                img.src=url; img.alt="Медиа";
                img.onerror=()=>{ img.style.display="none"; const p=document.createElement("p"); p.style.color="var(--warning)"; p.textContent="Изображение не загружено"; mediaDiv.appendChild(p); };
                mediaDiv.appendChild(img);
            }
        }
    }

    document.getElementById("answerText").innerText = question.answer;
    document.getElementById("answerReveal").style.display = "none";
    document.getElementById("showAnswerBtn").style.display = hostMode ? "inline-block" : "none";
    document.getElementById("correctAnswerBtn").style.display = hostMode ? "inline-block" : "none";
    document.getElementById("wrongAnswerBtn").style.display = hostMode ? "inline-block" : "none";

    const timerSec = parseInt(document.getElementById("globalTimerSecMenu").value)||30;
    document.getElementById("timerDisplay").innerText = timerSec;
    timerSecondsLeft = timerSec;
    if(timerInterval) clearInterval(timerInterval);

    const timerBar = document.getElementById("timerBar");
    timerBar.classList.remove("running");
    timerBar.style.transition = "none";
    timerBar.style.width = "100%";
    timerBar.style.backgroundColor = "#22c55e";
    void timerBar.offsetWidth;

    document.getElementById("correctAnswerBtn").disabled = false;
    document.getElementById("wrongAnswerBtn").disabled = false;
    document.getElementById("startTimerBtn").style.display = "inline-block";
    document.getElementById("startTimerBtn").textContent = "▶️ Старт";
    document.getElementById("pauseTimerBtn").style.display = "none";
    document.getElementById("questionModal").style.display = "flex";
}

function startTimerModal() {
    if(timerInterval) clearInterval(timerInterval);
    if(timerSecondsLeft<=0) return;
    const totalSec = timerSecondsLeft;

    const timerBar = document.getElementById("timerBar");
    timerBar.classList.add("running");
    void timerBar.offsetWidth;
    timerBar.style.transition = "width " + timerSecondsLeft + "s linear";
    timerBar.style.width = "0%";

    function updateBarColor() {
        const pct = timerSecondsLeft / totalSec;
        const hue = Math.round(pct * 120);
        timerBar.style.backgroundColor = "hsl(" + hue + ", 80%, 45%)";
    }
    updateBarColor();

    document.getElementById("startTimerBtn").style.display = "none";
    document.getElementById("pauseTimerBtn").style.display = "inline-block";

    timerInterval=setInterval(()=>{
        if(timerSecondsLeft<=1){
            clearInterval(timerInterval); timerInterval=null;
            document.getElementById("timerDisplay").innerText="0";
            document.getElementById("pauseTimerBtn").style.display = "none";
            if(activeQuestionData){
                customAlert("Время вышло! Вопрос снимается.");
                markQuestionUsed(activeQuestionData.quizId, activeQuestionData.catIdx, activeQuestionData.qIdx);
                nextTeam(); saveSession(); closeModalAndRefresh();
            }
        } else { timerSecondsLeft--; document.getElementById("timerDisplay").innerText=timerSecondsLeft; updateBarColor(); if(timerSecondsLeft<=5) playTick(); }
    },1000);
}

function pauseTimer() {
    if(!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;

    const timerBar = document.getElementById("timerBar");
    timerBar.classList.remove("running");
    const computed = getComputedStyle(timerBar);
    timerBar.style.transition = "none";
    timerBar.style.width = computed.width;

    document.getElementById("startTimerBtn").style.display = "inline-block";
    document.getElementById("startTimerBtn").textContent = "▶️ Продолжить";
    document.getElementById("pauseTimerBtn").style.display = "none";
}

function closeModalAndRefresh() {
    if(timerInterval) clearInterval(timerInterval);
    const mediaDiv = document.getElementById("modalMedia");
    mediaDiv.querySelectorAll("video, audio").forEach(el => { el.pause(); el.src = ""; el.load(); });
    document.getElementById("questionModal").style.display="none";
    document.getElementById("timerBar").style.width = "0%";
    document.getElementById("timerBar").classList.remove("running");
    activeQuestionData=null;
    renderAll(); saveSession(); highlightActiveTeam();
}

function answerCorrect() {
    if(activeQuestionData){
        awardPoints(currentTeamIndex, activeQuestionData.value);
        markQuestionUsed(activeQuestionData.quizId, activeQuestionData.catIdx, activeQuestionData.qIdx);
        nextTeam(); saveSession(); closeModalAndRefresh();
    }
}

function answerWrong() {
    if(activeQuestionData){
        markQuestionUsed(activeQuestionData.quizId, activeQuestionData.catIdx, activeQuestionData.qIdx);
        nextTeam(); saveSession(); closeModalAndRefresh();
    }
}
