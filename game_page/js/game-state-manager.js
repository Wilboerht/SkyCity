// Sky City Game State Manager with Error Recovery
class GameStateManager {
    constructor() {
        this.currentState = null;
        this.stateHistory = [];
        this.maxHistorySize = 10;
        this.autoSaveInterval = 30000; // 30秒自动保存
        this.autoSaveTimer = null;
        
        this.setupAutoSave();
        this.setupBeforeUnload();
    }

    /**
     * 保存游戏状态
     * @param {Object} gameState - 游戏状态对象
     * @param {string} description - 状态描述
     */
    saveState(gameState, description = '') {
        try {
            // 验证游戏状态
            if (!this.validateGameState(gameState)) {
                throw new Error('Invalid game state provided');
            }

            const stateSnapshot = {
                id: GameUtils.generateId(),
                timestamp: new Date().toISOString(),
                description: description,
                state: GameUtils.deepClone(gameState),
                version: '1.0'
            };

            // 添加到历史记录
            this.stateHistory.push(stateSnapshot);
            
            // 限制历史记录大小
            if (this.stateHistory.length > this.maxHistorySize) {
                this.stateHistory.shift();
            }

            // 更新当前状态
            this.currentState = stateSnapshot;

            // 保存到localStorage
            this.saveToLocalStorage();

            console.log(`Game state saved: ${description}`, stateSnapshot.id);
            return stateSnapshot.id;

        } catch (error) {
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleSaveLoadError(error, 'save');
            }
            throw error;
        }
    }

    /**
     * 加载游戏状态
     * @param {string} stateId - 状态ID，如果为空则加载最新状态
     * @returns {Object} 游戏状态
     */
    loadState(stateId = null) {
        try {
            let targetState = null;

            if (stateId) {
                // 加载指定状态
                targetState = this.stateHistory.find(state => state.id === stateId);
                if (!targetState) {
                    throw new Error(`State with ID ${stateId} not found`);
                }
            } else {
                // 加载最新状态
                targetState = this.currentState || this.getLatestState();
            }

            if (!targetState) {
                throw new Error('No saved state available');
            }

            // 验证状态完整性
            if (!this.validateGameState(targetState.state)) {
                throw new Error('Corrupted game state detected');
            }

            console.log(`Game state loaded: ${targetState.description}`, targetState.id);
            return GameUtils.deepClone(targetState.state);

        } catch (error) {
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleSaveLoadError(error, 'load');
            }
            throw error;
        }
    }

    /**
     * 获取最新的游戏状态
     * @returns {Object|null} 最新的游戏状态
     */
    getLatestState() {
        if (this.stateHistory.length === 0) {
            return null;
        }
        return this.stateHistory[this.stateHistory.length - 1];
    }

    /**
     * 获取状态历史列表
     * @returns {Array} 状态历史数组
     */
    getStateHistory() {
        return this.stateHistory.map(state => ({
            id: state.id,
            timestamp: state.timestamp,
            description: state.description
        }));
    }

    /**
     * 删除指定状态
     * @param {string} stateId - 状态ID
     */
    deleteState(stateId) {
        const index = this.stateHistory.findIndex(state => state.id === stateId);
        if (index !== -1) {
            this.stateHistory.splice(index, 1);
            this.saveToLocalStorage();
            console.log(`Game state deleted: ${stateId}`);
        }
    }

    /**
     * 清空所有状态
     */
    clearAllStates() {
        this.stateHistory = [];
        this.currentState = null;
        this.clearLocalStorage();
        console.log('All game states cleared');
    }

    /**
     * 验证游戏状态的完整性
     * @param {Object} gameState - 游戏状态
     * @returns {boolean} 是否有效
     */
    validateGameState(gameState) {
        if (!gameState || typeof gameState !== 'object') {
            return false;
        }

        // 检查必需的字段
        const requiredFields = ['level', 'score', 'coins', 'timer'];
        for (const field of requiredFields) {
            if (!(field in gameState)) {
                console.warn(`Missing required field: ${field}`);
                return false;
            }
        }

        // 检查数据类型
        if (typeof gameState.score !== 'number' || gameState.score < 0) {
            console.warn('Invalid score value');
            return false;
        }

        if (typeof gameState.coins !== 'number' || gameState.coins < 0) {
            console.warn('Invalid coins value');
            return false;
        }

        if (typeof gameState.timer !== 'number' || gameState.timer < 0) {
            console.warn('Invalid timer value');
            return false;
        }

        return true;
    }

    /**
     * 保存到localStorage
     */
    saveToLocalStorage() {
        try {
            const data = {
                currentState: this.currentState,
                stateHistory: this.stateHistory,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('skyCity_gameStates', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save game states to localStorage:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleSaveLoadError(error, 'save');
            }
        }
    }

    /**
     * 从localStorage加载
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('skyCity_gameStates');
            if (data) {
                const parsed = JSON.parse(data);
                this.currentState = parsed.currentState;
                this.stateHistory = parsed.stateHistory || [];
                console.log('Game states loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load game states from localStorage:', error);
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleSaveLoadError(error, 'load');
            }
            // 重置状态
            this.stateHistory = [];
            this.currentState = null;
        }
    }

    /**
     * 清空localStorage
     */
    clearLocalStorage() {
        try {
            localStorage.removeItem('skyCity_gameStates');
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
        // 页面加载时恢复状态
        this.loadFromLocalStorage();
    }

    /**
     * 启动自动保存定时器
     * @param {Function} getGameState - 获取当前游戏状态的函数
     */
    startAutoSave(getGameState) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            try {
                const currentGameState = getGameState();
                if (currentGameState) {
                    this.saveState(currentGameState, 'Auto Save');
                }
            } catch (error) {
                console.warn('Auto save failed:', error);
            }
        }, this.autoSaveInterval);

        console.log('Auto save started');
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('Auto save stopped');
        }
    }

    /**
     * 设置页面卸载前的保存
     */
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            // 页面卸载前保存当前状态
            this.saveToLocalStorage();
        });
    }

    /**
     * 恢复到上一个状态
     * @returns {Object|null} 上一个状态，如果没有则返回null
     */
    restorePreviousState() {
        if (this.stateHistory.length < 2) {
            return null;
        }

        // 移除当前状态，返回上一个状态
        this.stateHistory.pop();
        const previousState = this.stateHistory[this.stateHistory.length - 1];
        this.currentState = previousState;
        this.saveToLocalStorage();

        console.log('Restored to previous state:', previousState.id);
        return GameUtils.deepClone(previousState.state);
    }

    /**
     * 创建状态快照用于错误恢复
     * @param {Object} gameState - 当前游戏状态
     */
    createRecoverySnapshot(gameState) {
        try {
            this.saveState(gameState, 'Recovery Snapshot');
        } catch (error) {
            console.warn('Failed to create recovery snapshot:', error);
        }
    }

    /**
     * 获取统计信息
     * @returns {Object} 状态管理统计信息
     */
    getStats() {
        return {
            totalStates: this.stateHistory.length,
            currentStateId: this.currentState ? this.currentState.id : null,
            oldestState: this.stateHistory.length > 0 ? this.stateHistory[0].timestamp : null,
            newestState: this.stateHistory.length > 0 ? this.stateHistory[this.stateHistory.length - 1].timestamp : null,
            autoSaveEnabled: this.autoSaveTimer !== null
        };
    }
}

// 创建全局游戏状态管理器实例
const gameStateManager = new GameStateManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}
