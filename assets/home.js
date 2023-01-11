var data = [], dataCpy = [], eula = false, questionNum, quizMode, currentQuestionIndex, totalTime, correctQ, wrongQ, startTime;

//#region Page Setup

switchCodeTheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", switchCodeTheme);
window.matchMedia("only screen and (max-device-width: 750px)").addEventListener("change", adjustContent);
refreshRadios();
loadQuestions();

function switchCodeTheme() {
    document.getElementById("codeTheme").setAttribute("href", (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "./assets/themes/light.css" : "./assets/themes/dark.css"));
}

function adjustContent() {
    if (document.getElementById("questionPage").style.display == "flex") {
        if (window.matchMedia("only screen and (max-device-width: 750px)").matches)
            document.getElementById("card").removeAttribute("style");
        else
            document.getElementById("card").style.width = "720px";
    }
}

function refreshRadios() {
    document.querySelectorAll(".radio").forEach((elm) => {
        elm.removeEventListener("click", radioButtonClick);
        elm.addEventListener("click", radioButtonClick);
    });

    function radioButtonClick(e) {
        if (!e.currentTarget.hasAttribute("disabled")) {
            let radioElm = e.currentTarget.querySelector("input[type=\"radio\"]");
            radioElm.checked = true;
            document.querySelector("input[name=\"" + radioElm.name + "\"][type=\"radio\"]").dispatchEvent(new Event("change"));

            document.querySelectorAll(".radio").forEach((elm) => {
                if (elm.querySelector("input[type=\"radio\"]").checked)
                    elm.setAttribute("checked", "");
                else
                    elm.removeAttribute("checked");
            });
        }
    }
}

async function loadQuestions() {
    let dataFetch = await fetch(window.location.origin + "/assets/data.json");
    data = (await dataFetch.json()).questions;

    document.getElementById("questionQtd").innerText = data.length;
    document.getElementById("mainPageButton").disabled = false;
}

//#endregion

//#region Main and Setup pages

document.getElementById("mainPageButton").addEventListener("click", async () => {
    document.getElementById("mainPage").style.opacity = "0";
    await sleep(400);
    document.getElementById("mainPage").style.display = "none";
    document.getElementById(!eula ? "eulaPage" : "setupPage").style.display = "flex";
    await sleep(50);
    document.getElementById(!eula ? "eulaPage" : "setupPage").style.opacity = "1";
});

document.getElementById("eulaPageButton").addEventListener("click", async () => {
    eula = true;
    document.getElementById("eulaPage").style.opacity = "0";
    await sleep(400);
    document.getElementById("eulaPage").style.display = "none";
    document.getElementById("setupPage").style.display = "flex";
    await sleep(50);
    document.getElementById("setupPage").style.opacity = "1";
});

document.getElementById("setupBackButton").addEventListener("click", async () => {
    document.getElementById("setupPage").style.opacity = "0";
    await sleep(400);
    document.getElementById("setupPage").removeAttribute("style");
    document.getElementById("mainPage").style.display = "flex";
    await sleep(50);
    document.getElementById("mainPage").removeAttribute("style");
});

document.querySelector("input[name=\"quizType\"]").addEventListener("change", () => {
    if (document.querySelector("input[name=\"quizType\"]:checked") != null)
        document.getElementById("setupStartButton").disabled = false;
    else
        document.getElementById("setupStartButton").disabled = true;
});

document.getElementById("setupStartButton").addEventListener("click", async () => {
    document.getElementById("setupPage").style.opacity = "0";
    await sleep(400);
    document.getElementById("setupPage").removeAttribute("style");

    quizMode = Number(document.querySelector("input[name=\"quizType\"]:checked").value);

    if (!window.matchMedia("only screen and (max-device-width: 750px)").matches) {
        document.getElementById("card").style.width = "720px";
        await sleep(800);
    }
    startQuiz();
});

//#endregion

//#region Quiz Manager

function startQuiz() {
    dataCpy = [...data];
    questionNum = 0;
    totalTime = 0;
    correctQ = 0;
    wrongQ = 0;

    nextQuestion();
}

async function nextQuestion() {
    if (dataCpy.length == 0 || (quizMode == 0 && questionNum == 10))
        return endQuiz();

    currentQuestionIndex = Math.floor(Math.random() * dataCpy.length);

    document.getElementById("questionTitle").innerText = "Pergunta " + ++questionNum;
    document.getElementById("questionContent").replaceChildren();
    for (const item of dataCpy[currentQuestionIndex].question) {
        if (typeof item == "string") {
            let sentense = document.createElement("p");
            sentense.innerText = item;
            document.getElementById("questionContent").appendChild(sentense);
        }
        else if (typeof item == "object") {
            let code = document.createElement("pre");
            code.classList.add("language-" + item.language);
            code.textContent = item.code;
            document.getElementById("questionContent").appendChild(code);
            hljs.highlightElement(code);
        }
    }

    document.getElementById("answerDiv").replaceChildren();
    let answersCpy = [...dataCpy[currentQuestionIndex].answers];
    for (let i = 0; i < dataCpy[currentQuestionIndex].answers.length; i++) {
        let randomIdx = Math.floor(Math.random() * answersCpy.length);
        let choiceDiv = document.createElement("div"), radioDiv = document.createElement("div"), radioInput = document.createElement("input"), radioText = document.createElement("h3");
        
        radioInput.id = "questionAnswer";
        radioInput.type = "radio";
        radioInput.name = "questionAnswer";
        radioInput.value = randomIdx;
        radioInput.addEventListener("change", answerChoiceChange);
        radioDiv.classList.add("radio");
        radioDiv.appendChild(radioInput);
        radioText.innerHTML = answersCpy[randomIdx].replace(/\n/g, "<br>");
        choiceDiv.classList.add("choice");
        choiceDiv.appendChild(radioDiv);
        choiceDiv.appendChild(radioText);

        document.getElementById("answerDiv").appendChild(choiceDiv);
        answersCpy.splice(randomIdx, 1);
    }

    document.getElementById("questionPage").style.display = "flex";
    await sleep(50);
    document.getElementById("questionPage").style.opacity = "1";
    startTime = Date.now();

    refreshRadios();

    function answerChoiceChange() {
        if (document.querySelector("#questionAnswer:checked") != null)
            document.getElementById("questionVerifyNext").disabled = false;
        else
            document.getElementById("questionVerifyNext").disabled = true;
    }
}

document.getElementById("questionVerifyNext").addEventListener("click", async () => {
    if (document.getElementById("questionVerifyNext").innerText == "Verificar" && document.querySelector("#questionAnswer:checked") != null) {
        totalTime += Date.now() - startTime;

        if (dataCpy[currentQuestionIndex].answers.find((elm) => elm == document.querySelector("#questionAnswer:checked").parentElement.parentElement.querySelector("h3").innerText) == dataCpy[currentQuestionIndex].answers[0]) {
            document.querySelector("#questionAnswer:checked").parentElement.parentElement.classList.add("correct");
            correctQ++;
        }
        else {
            for (const child of document.getElementById("answerDiv").children) {
                if (child.querySelector("h3").innerText == dataCpy[currentQuestionIndex].answers[0])
                    child.classList.add("correct");
                else if (child == document.querySelector("#questionAnswer:checked").parentElement.parentElement)
                    child.classList.add("wrong");
            }
            wrongQ++;
        }

        dataCpy.splice(currentQuestionIndex, 1);

        for (const child of document.getElementById("answerDiv").children) {
            child.querySelector(".radio").removeAttribute("checked");
            child.querySelector(".radio").setAttribute("disabled", "");
        }
            
        document.getElementById("questionVerifyNext").innerText = "Próximo";
    }
    else if (document.getElementById("questionVerifyNext").innerText == "Próximo") {
        document.getElementById("questionVerifyNext").disabled = true;
        document.getElementById("questionPage").style.opacity = "0";
        await sleep(400);
        nextQuestion();
        document.getElementById("questionVerifyNext").innerText = "Verificar";
    }
});

async function endQuiz() {
    let maxQ = data.length;

    if (quizMode == 0)
        maxQ = 10;

    document.getElementById("scoreValue").innerText = (correctQ * 20 / maxQ).toFixed(1);
    if (correctQ * 20 / maxQ >= 14)
        document.getElementById("scoreValue").setAttribute("class", "great");
    else if (correctQ * 20 / maxQ >= 8)
        document.getElementById("scoreValue").setAttribute("class", "okay");
    else
        document.getElementById("scoreValue").setAttribute("class", "bad");

    let secondsTime = Math.floor(totalTime / 1000), minutesTime = 0, hoursTime = 0;
    while (secondsTime >= 60) {
        secondsTime -= 60;
        minutesTime++;
    }
    while (minutesTime >= 60) {
        minutesTime -= 60;
        hoursTime++;
    }
    document.getElementById("finishTime").innerText = (hoursTime == 0 ? (minutesTime == 0 ? `${secondsTime} segundos` : `${minutesTime.toLocaleString("pt-PT", { minimumIntegerDigits: 2 })}:${secondsTime.toLocaleString("pt-PT", { minimumIntegerDigits: 2 })}`) : `${hoursTime.toLocaleString("pt-PT", { minimumIntegerDigits: 2 })}:${minutesTime.toLocaleString("pt-PT", { minimumIntegerDigits: 2 })}:${secondsTime.toLocaleString("pt-PT", { minimumIntegerDigits: 2 })}`);
    document.getElementById("finishCorrect").innerText = correctQ;
    document.getElementById("finishWrong").innerText = wrongQ;

    document.querySelectorAll(".radio").forEach((elm) => {
        elm.removeAttribute("checked");
        elm.querySelector("input[type=\"radio\"]").checked = false;
        document.querySelector("input[name=\"" + elm.querySelector("input[type=\"radio\"]").name + "\"][type=\"radio\"]").dispatchEvent(new Event("change"));
    });

    document.getElementById("questionPage").removeAttribute("style");
    document.getElementById("finishPage").style.display = "flex";
    await sleep(50);
    document.getElementById("finishPage").style.opacity = "1";
}

document.getElementById("finishButton").addEventListener("click", async () => {
    document.getElementById("finishPage").style.opacity = "0";
    await sleep(400);
    document.getElementById("finishPage").removeAttribute("style");

    if (!window.matchMedia("only screen and (max-device-width: 750px)").matches) {
        document.getElementById("card").removeAttribute("style");
        await sleep(800);
    }
    document.getElementById("mainPage").style.display = "flex";
    await sleep(50);
    document.getElementById("mainPage").removeAttribute("style");
});

//#endregion

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}