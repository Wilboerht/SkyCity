// Sky City Game Utilities
class GameUtils {
    /**
     * 格式化时间显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 格式化分数显示
     * @param {number} score - 分数
     * @returns {string} 格式化的分数字符串
     */
    static formatScore(score) {
        return score.toLocaleString();
    }
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * 检查两个坐标是否相等
     * @param {Object} coord1 - 坐标1 {x, y}
     * @param {Object} coord2 - 坐标2 {x, y}
     * @returns {boolean} 是否相等
     */
    static coordsEqual(coord1, coord2) {
        return coord1.x === coord2.x && coord1.y === coord2.y;
    }
    
    /**
     * 计算两点之间的距离
     * @param {Object} point1 - 点1 {x, y}
     * @param {Object} point2 - 点2 {x, y}
     * @returns {number} 距离
     */
    static distance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 检查坐标是否在网格范围内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否在范围内
     */
    static isValidCoordinate(x, y) {
        return x >= 0 && x < CONFIG.GAME.GRID_WIDTH && 
               y >= 0 && y < CONFIG.GAME.GRID_HEIGHT;
    }
    
    /**
     * 获取相邻坐标
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Array} 相邻坐标数组
     */
    static getAdjacentCoordinates(x, y) {
        const adjacent = [];
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }  // 左
        ];
        
        directions.forEach(dir => {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            if (this.isValidCoordinate(newX, newY)) {
                adjacent.push({ x: newX, y: newY });
            }
        });
        
        return adjacent;
    }
    
    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'warning', 'info')
     * @param {number} duration - 显示时长（毫秒）
     */
    static showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '5px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // 设置背景色
        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            warning: '#ed8936',
            info: '#4299e1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUtils;
}
