// Sky City Error Handling System
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // 最大错误记录数
        this.setupGlobalErrorHandling();
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // 捕获JavaScript运行时错误
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: new Date().toISOString()
            });
        });

        // 捕获Promise未处理的拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise Rejection',
                message: event.reason ? event.reason.toString() : 'Unknown promise rejection',
                stack: event.reason ? event.reason.stack : null,
                timestamp: new Date().toISOString()
            });
        });

        // 捕获资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'Resource Load Error',
                    message: `Failed to load: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    timestamp: new Date().toISOString()
                });
            }
        }, true);
    }

    /**
     * 处理错误
     * @param {Object} error - 错误对象
     */
    handleError(error) {
        // 记录错误
        this.logError(error);
        
        // 显示用户友好的错误消息
        this.showUserError(error);
        
        // 发送错误报告（如果需要）
        this.reportError(error);
    }

    /**
     * 记录错误到本地存储
     * @param {Object} error - 错误对象
     */
    logError(error) {
        this.errors.push(error);
        
        // 限制错误记录数量
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // 保存到localStorage
        try {
            localStorage.setItem('skyCity_errors', JSON.stringify(this.errors));
        } catch (e) {
            console.warn('Failed to save errors to localStorage:', e);
        }
        
        // 控制台输出
        console.error('Sky City Error:', error);
    }

    /**
     * 显示用户友好的错误消息
     * @param {Object} error - 错误对象
     */
    showUserError(error) {
        let userMessage = '';
        let type = 'error';

        switch (error.type) {
            case 'Network Error':
                userMessage = '网络连接出现问题，请检查您的网络连接后重试。';
                break;
            case 'API Error':
                userMessage = '服务器暂时无法响应，请稍后重试。';
                break;
            case 'Game State Error':
                userMessage = '游戏状态出现异常，正在尝试恢复...';
                type = 'warning';
                break;
            case 'Save/Load Error':
                userMessage = '保存或加载游戏数据时出现问题。';
                break;
            case 'Resource Load Error':
                userMessage = '游戏资源加载失败，请刷新页面重试。';
                break;
            default:
                userMessage = '出现了一个意外错误，我们正在努力修复。';
        }

        // 使用GameUtils显示通知
        if (typeof GameUtils !== 'undefined' && GameUtils.showNotification) {
            GameUtils.showNotification(userMessage, type, 5000);
        } else {
            // 备用通知方式
            alert(userMessage);
        }
    }

    /**
     * 发送错误报告
     * @param {Object} error - 错误对象
     */
    reportError(error) {
        // 这里可以实现错误报告功能，比如发送到服务器
        // 目前只是记录到控制台
        if (error.type !== 'Resource Load Error') { // 避免资源错误过多
            console.log('Error reported:', {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: error.timestamp,
                error: error
            });
        }
    }

    /**
     * 创建特定类型的错误
     * @param {string} type - 错误类型
     * @param {string} message - 错误消息
     * @param {Object} details - 错误详情
     */
    createError(type, message, details = {}) {
        const error = {
            type,
            message,
            details,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        };
        
        this.handleError(error);
        return error;
    }

    /**
     * 网络错误处理
     * @param {Error} error - 网络错误
     * @param {string} url - 请求URL
     */
    handleNetworkError(error, url) {
        this.createError('Network Error', `Network request failed: ${url}`, {
            originalError: error.message,
            url: url
        });
    }

    /**
     * API错误处理
     * @param {Error} error - API错误
     * @param {string} endpoint - API端点
     * @param {Object} requestData - 请求数据
     */
    handleAPIError(error, endpoint, requestData = {}) {
        this.createError('API Error', `API request failed: ${endpoint}`, {
            originalError: error.message,
            endpoint: endpoint,
            requestData: requestData
        });
    }

    /**
     * 游戏状态错误处理
     * @param {string} message - 错误消息
     * @param {Object} gameState - 游戏状态
     */
    handleGameStateError(message, gameState = {}) {
        this.createError('Game State Error', message, {
            gameState: gameState
        });
    }

    /**
     * 保存/加载错误处理
     * @param {Error} error - 错误对象
     * @param {string} operation - 操作类型 ('save' 或 'load')
     */
    handleSaveLoadError(error, operation) {
        this.createError('Save/Load Error', `${operation} operation failed`, {
            operation: operation,
            originalError: error.message
        });
    }

    /**
     * 获取错误历史
     * @returns {Array} 错误历史数组
     */
    getErrorHistory() {
        return [...this.errors];
    }

    /**
     * 清除错误历史
     */
    clearErrorHistory() {
        this.errors = [];
        try {
            localStorage.removeItem('skyCity_errors');
        } catch (e) {
            console.warn('Failed to clear errors from localStorage:', e);
        }
    }

    /**
     * 从localStorage恢复错误历史
     */
    loadErrorHistory() {
        try {
            const savedErrors = localStorage.getItem('skyCity_errors');
            if (savedErrors) {
                this.errors = JSON.parse(savedErrors);
            }
        } catch (e) {
            console.warn('Failed to load error history from localStorage:', e);
            this.errors = [];
        }
    }

    /**
     * 获取错误统计
     * @returns {Object} 错误统计信息
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: 0 // 最近1小时的错误
        };

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        this.errors.forEach(error => {
            // 按类型统计
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // 最近错误统计
            if (new Date(error.timestamp) > oneHourAgo) {
                stats.recent++;
            }
        });

        return stats;
    }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler();

// 页面加载时恢复错误历史
document.addEventListener('DOMContentLoaded', () => {
    errorHandler.loadErrorHistory();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
