// quiz.js
class Quiz {
    constructor() {
        this.questions = [];
        this.activeQuestions = [];
        this.masteredQuestions = [];
        this.challengedQuestions = [];
        this.currentQuestion = null;
        this.targetStreak = 3;
        this.challengeThreshold = 5;
        this.isInChallengeMode = false;
        this.challengeModeProgress = new Map(); // Maps questionId -> {remastered: boolean, streak: number}
        this.storageKey = 'quizState';
    }

    async loadQuestions() {
        try {
            const response = await fetch('data/questions.json');
            const data = await response.json();
            this.questions = data.questions.map((q, index) => ({
                ...q,
                id: `question-${index}`, // Add unique ID to each question
                stats: {
                    currentStreak: 0,
                    totalAttempts: 0,
                    attemptsBeforeMastery: 0,
                    correctAttempts: 0,
                    isMastered: false,
                    isChallenger: false
                }
            }));
            
            
            // Try to load saved state
            const savedState = await this.loadState();
            if (savedState) {
                this.restoreState(savedState);
            } else {
                this.activeQuestions = [...this.questions];
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            // Alert the user about loading error
            alert('Failed to load questions. Please refresh the page.');
        }
    }
    
    saveState() {
        // Convert Map to array for JSON serialization
        const challengeModeProgressArray = Array.from(this.challengeModeProgress.entries())
            .map(([key, value]) => ({ key, value }));
            
        const state = {
            activeQuestionIds: this.activeQuestions.map(q => q.id),
            masteredQuestionIds: this.masteredQuestions.map(q => q.id),
            challengedQuestionIds: this.challengedQuestions.map(q => q.id),
            currentQuestionId: this.currentQuestion?.id,
            isInChallengeMode: this.isInChallengeMode,
            challengeModeProgress: challengeModeProgressArray,
            questions: this.questions.map(q => ({
                id: q.id,
                stats: q.stats
            }))
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(state));
        return true;
    }
    
    loadState() {
        const savedState = localStorage.getItem(this.storageKey);
        if (!savedState) return null;
        
        try {
            return JSON.parse(savedState);
        } catch (error) {
            console.error('Error parsing saved quiz state:', error);
            return null;
        }
    }
    
    restoreState(state) {
        // First update question stats
        if (state.questions && Array.isArray(state.questions)) {
            state.questions.forEach(savedQuestion => {
                const question = this.questions.find(q => q.id === savedQuestion.id);
                if (question) {
                    question.stats = savedQuestion.stats;
                }
            });
        }
        
        // Restore question pools
        this.activeQuestions = state.activeQuestionIds
            ? state.activeQuestionIds.map(id => this.questions.find(q => q.id === id)).filter(Boolean)
            : [];
            
        this.masteredQuestions = state.masteredQuestionIds
            ? state.masteredQuestionIds.map(id => this.questions.find(q => q.id === id)).filter(Boolean)
            : [];
            
        this.challengedQuestions = state.challengedQuestionIds
            ? state.challengedQuestionIds.map(id => this.questions.find(q => q.id === id)).filter(Boolean)
            : [];
            
        // Restore current question if there was one
        if (state.currentQuestionId) {
            this.currentQuestion = this.questions.find(q => q.id === state.currentQuestionId);
        }
        
        // Restore challenge mode state
        this.isInChallengeMode = state.isInChallengeMode || false;
        
        // Restore challenge mode progress map
        this.challengeModeProgress = new Map();
        if (state.challengeModeProgress && Array.isArray(state.challengeModeProgress)) {
            state.challengeModeProgress.forEach(item => {
                this.challengeModeProgress.set(item.key, item.value);
            });
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getNextQuestion() {
        const currentPool = this.isInChallengeMode ?
            this.challengedQuestions : this.activeQuestions;

        if (currentPool.length === 0) {
            return null;
        }

        // Filter out already re-mastered questions in challenge mode
        let availableQuestions = currentPool;
        if (this.isInChallengeMode) {
            availableQuestions = currentPool.filter(question => {
                const progress = this.challengeModeProgress.get(question.id);
                return !progress?.remastered;
            });

            if (availableQuestions.length === 0) {
                return null;
            }
        }

        this.currentQuestion = availableQuestions[
            Math.floor(Math.random() * availableQuestions.length)
        ];
        this.currentQuestion.shuffledChoices = this.shuffleArray([...this.currentQuestion.choices]);
        return this.currentQuestion;
    }

    startChallengeMode() {
        this.isInChallengeMode = true;
        this.challengeModeProgress.clear();
        this.challengedQuestions.forEach(q => {
            q.stats.currentStreak = 0;
            this.challengeModeProgress.set(q.id, {
                remastered: false,
                streak: 0
            });
        });
        this.saveState();
    }

    exitChallengeMode() {
        this.isInChallengeMode = false;
        this.challengeModeProgress.clear();
        this.saveState();
    }

    processAnswer(selectedAnswer) {
        const question = this.currentQuestion;
        question.stats.totalAttempts++;

        if (!question.stats.isMastered) {
            question.stats.attemptsBeforeMastery++;
        }

        const isCorrect = selectedAnswer === question.correctAnswer;
        
        if (isCorrect) {
            question.stats.correctAttempts++;
            question.stats.currentStreak++;

            if (!this.isInChallengeMode) {
                if (question.stats.currentStreak >= this.targetStreak && !question.stats.isMastered) {
                    question.stats.isMastered = true;
                    if (question.stats.attemptsBeforeMastery >= this.challengeThreshold) {
                        question.stats.isChallenger = true;
                        this.challengedQuestions.push(question);
                    }
                    this.masteredQuestions.push(question);
                    this.activeQuestions = this.activeQuestions.filter(q => q !== question);
                }
            } else {
                // Update progress in challenge mode
                const progress = this.challengeModeProgress.get(question.id);
                if (progress) {
                    progress.streak++;
                    if (progress.streak >= this.targetStreak) {
                        progress.remastered = true;
                    }
                }
            }
        } else {
            question.stats.currentStreak = 0;
            
            // In challenge mode, reset the streak in challengeModeProgress
            if (this.isInChallengeMode) {
                const progress = this.challengeModeProgress.get(question.id);
                if (progress) {
                    progress.streak = 0;
                }
            }
        }

        // Save state after processing answer
        this.saveState();

        return {
            isCorrect,
            streak: this.isInChallengeMode ? 
                this.challengeModeProgress.get(question.id)?.streak : 
                question.stats.currentStreak,
            isMastered: question.stats.isMastered,
            attempts: question.stats.attemptsBeforeMastery
        };
    }

    isChallengeCompleted() {
        if (!this.isInChallengeMode) return false;
        
        return Array.from(this.challengeModeProgress.values())
            .every(progress => progress.remastered === true);
    }

    getChallengeStats() {
        const total = this.challengedQuestions.length;
        const completed = Array.from(this.challengeModeProgress.values())
            .filter(progress => progress.remastered).length;
        return {
            total,
            completed,
            remaining: total - completed
        };
    }

    getSessionStats() {
        const baseStats = {
            totalQuestions: this.questions.length,
            masteredQuestions: this.masteredQuestions.length,
            remainingQuestions: this.activeQuestions.length,
            challengedQuestions: this.challengedQuestions.length,
        };
        
        if (this.isInChallengeMode) {
            const challengeStats = this.getChallengeStats();
            return {
                ...baseStats,
                ...challengeStats,
                isInChallengeMode: true
            };
        }
        
        return {
            ...baseStats,
            isInChallengeMode: false
        };
    }

    resetSession() {
        this.exitChallengeMode(); // Explicitly call exitChallengeMode
        this.activeQuestions = [...this.questions];
        this.masteredQuestions = [];
        this.challengedQuestions = [];
        this.questions.forEach(q => {
            q.stats = {
                currentStreak: 0,
                totalAttempts: 0,
                attemptsBeforeMastery: 0,
                correctAttempts: 0,
                isMastered: false,
                isChallenger: false
            };
        });
        this.saveState();
    }
    
    clearSavedState() {
        localStorage.removeItem(this.storageKey);
    }
}
