// Sky City API Utilities
class SkyAPI {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
    }

    /**
     * 提交分数到排行榜
     * @param {Object} scoreData - 分数数据 {name, score, time}
     * @returns {Promise} API响应
     */
    async submitScore(scoreData) {
        // 验证输入数据
        if (!this.validateScoreData(scoreData)) {
            const error = new Error('Invalid score data provided');
            if (typeof errorHandler !== 'undefined') {
                errorHandler.handleAPIError(error, 'submitScore', scoreData);
            }
            throw error;
        }

        try {
            const response = await fetch(CONFIG.API.ENDPOINTS.RANKING, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scoreData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                const error = new Error(`HTTP ${response.status}: ${errorText || 'Failed to submit score'}`);
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.handleAPIError(error, CONFIG.API.ENDPOINTS.RANKING, scoreData);
                }
                throw error;
            }

            const data = await response.json();
            console.log('Score submitted successfully:', data);

            // 显示成功通知
            if (typeof GameUtils !== 'undefined' && GameUtils.showNotification) {
                GameUtils.showNotification('分数提交成功！', 'success', 3000);
            }

            return data;
        } catch (error) {
            // 网络错误处理
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.handleNetworkError(error, CONFIG.API.ENDPOINTS.RANKING);
                }
            }

            console.error('Error submitting score:', error);
            throw error;
        }
    }

    /**
     * 获取排行榜数据
     * @returns {Promise<Array>} 排行榜数据数组
     */
    async getRankings() {
        try {
            const url = `${CONFIG.API.ENDPOINTS.RANKING}?nocache=${new Date().getTime()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.handleAPIError(error, CONFIG.API.ENDPOINTS.RANKING);
                }
                throw error;
            }

            const data = await response.json();

            // 验证返回数据格式
            if (!Array.isArray(data)) {
                const error = new Error('Invalid rankings data format received');
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.handleAPIError(error, CONFIG.API.ENDPOINTS.RANKING, { receivedData: data });
                }
                throw error;
            }

            console.log('Rankings fetched successfully:', data);
            return data;
        } catch (error) {
            // 网络错误处理
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                if (typeof errorHandler !== 'undefined') {
                    errorHandler.handleNetworkError(error, CONFIG.API.ENDPOINTS.RANKING);
                }
            }

            console.error('Error fetching rankings:', error);
            throw error;
        }
    }

    /**
     * 检查API健康状态
     * @returns {Promise<boolean>} API是否可用
     */
    async checkHealth() {
        try {
            const response = await fetch(CONFIG.API.ENDPOINTS.RANKING, {
                method: 'HEAD'
            });
            return response.ok;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }

    /**
     * 验证分数数据
     * @param {Object} scoreData - 分数数据
     * @returns {boolean} 数据是否有效
     */
    validateScoreData(scoreData) {
        if (!scoreData || typeof scoreData !== 'object') {
            return false;
        }

        // 检查必需字段
        if (!scoreData.name || typeof scoreData.name !== 'string' || scoreData.name.trim().length === 0) {
            return false;
        }

        if (typeof scoreData.score !== 'number' || scoreData.score < 0) {
            return false;
        }

        if (typeof scoreData.time !== 'number' || scoreData.time < 0) {
            return false;
        }

        // 检查字段长度和范围
        if (scoreData.name.length > 50) {
            return false;
        }

        if (scoreData.score > 999999999) { // 最大分数限制
            return false;
        }

        if (scoreData.time > 86400) { // 最大时间限制（24小时）
            return false;
        }

        return true;
    }

    /**
     * 重试机制包装器
     * @param {Function} fn - 要重试的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试延迟（毫秒）
     * @returns {Promise} 函数执行结果
     */
    async withRetry(fn, maxRetries = 3, delay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    break;
                }

                // 只对网络错误进行重试
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.log(`API request failed, retrying... (${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay * attempt));
                } else {
                    // 非网络错误直接抛出
                    throw error;
                }
            }
        }

        throw lastError;
    }

    /**
     * 带重试的提交分数
     * @param {Object} scoreData - 分数数据
     * @returns {Promise} API响应
     */
    async submitScoreWithRetry(scoreData) {
        return this.withRetry(() => this.submitScore(scoreData));
    }

    /**
     * 带重试的获取排行榜
     * @returns {Promise<Array>} 排行榜数据
     */
    async getRankingsWithRetry() {
        return this.withRetry(() => this.getRankings());
    }
}

// 创建全局API实例
const skyAPI = new SkyAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkyAPI;
}
