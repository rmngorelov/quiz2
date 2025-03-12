// app.js
document.addEventListener("DOMContentLoaded", async () => {
  const quiz = new Quiz();

  // Check if we have a saved state before loading
  const hasSavedState = localStorage.getItem(quiz.storageKey) != null;

  await quiz.loadQuestions();

  const questionText = document.getElementById("question-text");
  const choicesContainer = document.getElementById("choices-container");
  const feedbackContainer = document.getElementById("feedback-container");
  const feedbackText = document.getElementById("feedback-text");
  const streakText = document.getElementById("streak-text");
  const progressText = document.getElementById("progress-text");
  const masteryText = document.getElementById("mastery-text");
  const sessionSummary = document.getElementById("session-summary");
  const summaryStats = document.getElementById("summary-stats");
  const continueBtn = document.getElementById("continue-btn");
  const resetBtn = document.getElementById("reset-btn");
  const clearDataBtn = document.getElementById("clear-data-btn");

  // Show clear data button if we restored from saved state
  if (hasSavedState) {
    clearDataBtn.style.display = "block";
  }

  function updateProgress() {
    const stats = quiz.getSessionStats();
    const progressBar = document.getElementById("progress-bar");

    if (quiz.isInChallengeMode) {
      progressText.textContent = `Challenge Progress: ${stats.completed}/${stats.total}`;
      masteryText.textContent = `Remaining: ${stats.remaining}`;

      // Update progress bar for challenge mode
      const challengePercent =
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      progressBar.style.width = `${challengePercent}%`;

      // Change color based on progress
      if (challengePercent > 75) {
        progressBar.style.backgroundColor = "#48bb78"; // green
      } else if (challengePercent > 50) {
        progressBar.style.backgroundColor = "#4299e1"; // blue
      } else if (challengePercent > 25) {
        progressBar.style.backgroundColor = "#ecc94b"; // yellow
      } else {
        progressBar.style.backgroundColor = "#f56565"; // red
      }
    } else {
      const masteryPercent =
        stats.totalQuestions > 0
          ? Math.round((stats.masteredQuestions / stats.totalQuestions) * 100)
          : 0;

      progressText.textContent = `Question Progress: ${stats.masteredQuestions}/${stats.totalQuestions}`;
      masteryText.textContent = `Mastered: ${masteryPercent}%`;

      // Update progress bar for normal mode
      progressBar.style.width = `${masteryPercent}%`;

      // Change color based on mastery percentage
      if (masteryPercent > 75) {
        progressBar.style.backgroundColor = "#48bb78"; // green
      } else if (masteryPercent > 50) {
        progressBar.style.backgroundColor = "#4299e1"; // blue
      } else if (masteryPercent > 25) {
        progressBar.style.backgroundColor = "#ecc94b"; // yellow
      } else {
        progressBar.style.backgroundColor = "#f56565"; // red
      }
    }
  }

  function displayQuestion() {
    if (quiz.isInChallengeMode && quiz.isChallengeCompleted()) {
      showChallengeComplete();
      return;
    }

    const question = quiz.getNextQuestion();
    if (!question) {
      showSessionSummary();
      return;
    }

    questionText.textContent = question.text;
    choicesContainer.innerHTML = "";

    question.shuffledChoices.forEach((choice) => {
      const button = document.createElement("button");
      button.className = "choice-btn";
      button.textContent = choice;
      button.addEventListener("click", () => handleAnswer(choice));
      choicesContainer.appendChild(button);
    });

    feedbackContainer.style.display = "none";
    updateProgress();

    // Save state when displaying a question
    quiz.saveState();
  }

  function playSound(isCorrect) {
    const sound = document.getElementById(
      isCorrect ? "correct-sound" : "incorrect-sound",
    );
    sound.currentTime = 0; // Reset sound to beginning
    sound.play().catch((error) => {
      console.error("Error playing sound:", error);
    });
  }

  function handleAnswer(selectedAnswer) {
    const result = quiz.processAnswer(selectedAnswer);

    feedbackText.textContent = result.isCorrect ? "Correct!" : "Incorrect!";
    streakText.textContent = `Current streak: ${result.streak}`;
    feedbackContainer.style.display = "block";

    // Play sound feedback
    playSound(result.isCorrect);

    const buttons = choicesContainer.getElementsByClassName("choice-btn");
    Array.from(buttons).forEach((button) => {
      if (button.textContent === quiz.currentQuestion.correctAnswer) {
        button.classList.add("correct");
      } else if (button.textContent === selectedAnswer && !result.isCorrect) {
        button.classList.add("incorrect");
      }
      button.disabled = true;
    });

    setTimeout(() => {
      displayQuestion();
    }, 5000);
  }

  function showChallengeComplete() {
    sessionSummary.style.display = "block";
    summaryStats.innerHTML = `
            <h3>Challenge Mode Completed!</h3>
            <p>You have successfully re-mastered all challenging questions.</p>
            <p>Would you like to:</p>
        `;

    continueBtn.style.display = "none";
    resetBtn.textContent = "Start New Session";

    const exitBtn = document.createElement("button");
    exitBtn.textContent = "Exit Challenge Mode";
    exitBtn.addEventListener("click", () => {
      quiz.exitChallengeMode();
      resetBtn.textContent = "Reset Session";
      showSessionSummary();
    });
    summaryStats.appendChild(exitBtn);
  }

  function showSessionSummary() {
    const stats = quiz.getSessionStats();
    if (!quiz.isInChallengeMode) {
      summaryStats.innerHTML = `
                <p>Total Questions: ${stats.totalQuestions}</p>
                <p>Questions Mastered: ${stats.masteredQuestions}</p>
                <p>Mastery Rate: ${Math.round((stats.masteredQuestions / stats.totalQuestions) * 100)}%</p>
                <p>Challenging Questions: ${stats.challengedQuestions}</p>
            `;

      continueBtn.style.display =
        stats.challengedQuestions > 0 ? "inline-block" : "none";
      continueBtn.textContent = "Practice Challenging Questions";
    }

    sessionSummary.style.display = "block";
    questionText.textContent = "";
    choicesContainer.innerHTML = "";
    feedbackContainer.style.display = "none";
  }

  continueBtn.addEventListener("click", () => {
    quiz.startChallengeMode();
    sessionSummary.style.display = "none";
    displayQuestion();
  });

  resetBtn.addEventListener("click", () => {
    quiz.resetSession();
    sessionSummary.style.display = "none";
    displayQuestion();
  });

  clearDataBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all saved progress? This cannot be undone.",
      )
    ) {
      quiz.clearSavedState();
      quiz.resetSession();
      sessionSummary.style.display = "none";
      clearDataBtn.style.display = "none";
      displayQuestion();
    }
  });

  displayQuestion();
});
