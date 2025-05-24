# Sky City 单元测试和错误处理系统

## 概述

本项目为Sky City游戏添加了完整的单元测试框架和错误处理系统，确保代码质量和用户体验。

## 文件结构

```
tests/
├── README.md                 # 本文档
├── test-framework.js         # 轻量级测试框架
├── test-runner.html          # 测试运行器界面
├── config.test.js           # 配置模块测试
├── utils.test.js            # 工具函数测试
├── api.test.js              # API模块测试
└── error-handler.test.js    # 错误处理测试

js/
├── config.js                # 游戏配置管理
├── utils.js                 # 通用工具函数
├── api.js                   # API调用封装
├── error-handler.js         # 错误处理系统
└── game-state-manager.js    # 游戏状态管理
```

## 功能特性

### 1. 单元测试框架
- **轻量级设计**：无需外部依赖，专为项目定制
- **断言支持**：提供常用断言方法（equals, true, false, notNull等）
- **异步测试**：支持Promise和async/await测试
- **详细报告**：提供测试结果统计和错误详情

### 2. 错误处理系统
- **全局错误捕获**：自动捕获JavaScript错误、Promise拒绝、资源加载错误
- **用户友好提示**：将技术错误转换为用户可理解的消息
- **错误分类**：按类型分类错误（网络、API、游戏状态等）
- **错误记录**：本地存储错误历史，便于调试
- **自动恢复**：提供错误恢复机制

### 3. 游戏状态管理
- **状态保存**：自动保存游戏状态，支持手动快照
- **状态恢复**：从错误中恢复到之前的稳定状态
- **历史管理**：维护状态历史，支持回滚操作
- **数据验证**：确保游戏状态数据的完整性

## 使用方法

### 运行测试

1. **在浏览器中打开测试运行器**：
   ```
   打开 tests/test-runner.html
   ```

2. **点击"运行所有测试"按钮**

3. **查看测试结果**：
   - 绿色：测试通过
   - 红色：测试失败
   - 统计信息显示总体测试情况

### 编写新测试

```javascript
// 在相应的 .test.js 文件中添加测试
testFramework.test('测试描述', () => {
    // 测试代码
    testFramework.assert.equals(actual, expected);
    testFramework.assert.true(condition);
    testFramework.assert.notNull(value);
});

// 异步测试
testFramework.test('异步测试', async () => {
    const result = await someAsyncFunction();
    testFramework.assert.equals(result, expectedValue);
});
```

### 错误处理使用

```javascript
// 手动创建错误
errorHandler.createError('Custom Error', '错误描述', { detail: 'info' });

// 处理网络错误
try {
    await fetch('/api/endpoint');
} catch (error) {
    errorHandler.handleNetworkError(error, '/api/endpoint');
}

// 处理API错误
try {
    const response = await api.call();
} catch (error) {
    errorHandler.handleAPIError(error, 'endpoint', requestData);
}

// 处理游戏状态错误
if (!isValidGameState(state)) {
    errorHandler.handleGameStateError('Invalid state', state);
}
```

### 游戏状态管理

```javascript
// 保存游戏状态
const stateId = gameStateManager.saveState(currentGameState, '关卡完成');

// 加载游戏状态
const gameState = gameStateManager.loadState(stateId);

// 启动自动保存
gameStateManager.startAutoSave(() => getCurrentGameState());

// 恢复到上一个状态
const previousState = gameStateManager.restorePreviousState();

// 创建恢复快照
gameStateManager.createRecoverySnapshot(currentGameState);
```

## API参考

### TestFramework

#### 方法
- `test(description, testFunction)` - 定义测试用例
- `runTests()` - 运行所有测试
- `assert.equals(actual, expected, message)` - 断言相等
- `assert.true(value, message)` - 断言为真
- `assert.false(value, message)` - 断言为假
- `assert.notNull(value, message)` - 断言非空
- `assert.throws(fn, message)` - 断言抛出异常
- `assert.arrayEquals(actual, expected, message)` - 断言数组相等

### ErrorHandler

#### 方法
- `createError(type, message, details)` - 创建错误
- `handleNetworkError(error, url)` - 处理网络错误
- `handleAPIError(error, endpoint, requestData)` - 处理API错误
- `handleGameStateError(message, gameState)` - 处理游戏状态错误
- `handleSaveLoadError(error, operation)` - 处理保存/加载错误
- `getErrorHistory()` - 获取错误历史
- `clearErrorHistory()` - 清空错误历史
- `getErrorStats()` - 获取错误统计

### GameStateManager

#### 方法
- `saveState(gameState, description)` - 保存状态
- `loadState(stateId)` - 加载状态
- `getStateHistory()` - 获取状态历史
- `deleteState(stateId)` - 删除状态
- `clearAllStates()` - 清空所有状态
- `startAutoSave(getGameState)` - 启动自动保存
- `stopAutoSave()` - 停止自动保存
- `restorePreviousState()` - 恢复上一状态
- `createRecoverySnapshot(gameState)` - 创建恢复快照

### GameUtils

#### 方法
- `formatTime(seconds)` - 格式化时间
- `formatScore(score)` - 格式化分数
- `generateId()` - 生成唯一ID
- `deepClone(obj)` - 深拷贝对象
- `debounce(func, wait)` - 防抖函数
- `throttle(func, limit)` - 节流函数
- `coordsEqual(coord1, coord2)` - 坐标比较
- `distance(point1, point2)` - 计算距离
- `isValidCoordinate(x, y)` - 验证坐标
- `getAdjacentCoordinates(x, y)` - 获取相邻坐标
- `showNotification(message, type, duration)` - 显示通知

### SkyAPI

#### 方法
- `submitScore(scoreData)` - 提交分数
- `getRankings()` - 获取排行榜
- `checkHealth()` - 检查API健康状态
- `submitScoreWithRetry(scoreData)` - 带重试的提交分数
- `getRankingsWithRetry()` - 带重试的获取排行榜
- `validateScoreData(scoreData)` - 验证分数数据

## 最佳实践

### 测试编写
1. **测试命名**：使用描述性的测试名称
2. **单一职责**：每个测试只验证一个功能点
3. **边界测试**：测试边界条件和异常情况
4. **模拟依赖**：使用mock对象隔离外部依赖

### 错误处理
1. **分类处理**：根据错误类型提供不同的处理策略
2. **用户友好**：向用户显示易懂的错误消息
3. **日志记录**：记录详细的错误信息用于调试
4. **优雅降级**：在错误发生时提供备选方案

### 状态管理
1. **定期保存**：在关键操作前后保存状态
2. **数据验证**：保存前验证状态数据的完整性
3. **历史限制**：限制状态历史数量避免内存泄漏
4. **自动恢复**：在检测到错误时自动恢复到稳定状态

## 故障排除

### 常见问题

1. **测试失败**
   - 检查依赖文件是否正确加载
   - 确认测试环境与实际环境一致
   - 查看浏览器控制台错误信息

2. **错误处理不生效**
   - 确认错误处理器已正确初始化
   - 检查错误类型是否正确分类
   - 验证localStorage是否可用

3. **状态保存失败**
   - 检查localStorage空间是否充足
   - 确认游戏状态数据格式正确
   - 验证状态验证逻辑

### 调试技巧

1. **使用浏览器开发者工具**
2. **查看错误历史记录**
3. **启用详细日志输出**
4. **使用测试运行器的导出功能**

## 贡献指南

1. **添加新功能时同时编写测试**
2. **确保所有测试通过**
3. **更新相关文档**
4. **遵循现有代码风格**

## 许可证

本项目遵循与Sky City游戏相同的许可证。
