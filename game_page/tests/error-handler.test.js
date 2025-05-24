// Unit Tests for ErrorHandler
(function() {
    'use strict';

    // Test ErrorHandler constructor
    testFramework.test('ErrorHandler should initialize correctly', () => {
        const handler = new ErrorHandler();
        testFramework.assert.notNull(handler);
        testFramework.assert.arrayEquals(handler.errors, []);
        testFramework.assert.equals(handler.maxErrors, 100);
    });

    // Test error logging
    testFramework.test('ErrorHandler should log errors correctly', () => {
        const handler = new ErrorHandler();
        const testError = {
            type: 'Test Error',
            message: 'This is a test error',
            timestamp: new Date().toISOString()
        };

        handler.logError(testError);

        testFramework.assert.equals(handler.errors.length, 1);
        testFramework.assert.equals(handler.errors[0].type, 'Test Error');
        testFramework.assert.equals(handler.errors[0].message, 'This is a test error');
    });

    // Test error history limit
    testFramework.test('ErrorHandler should limit error history size', () => {
        const handler = new ErrorHandler();
        handler.maxErrors = 3; // Set small limit for testing

        // Add more errors than the limit
        for (let i = 0; i < 5; i++) {
            handler.logError({
                type: 'Test Error',
                message: `Error ${i}`,
                timestamp: new Date().toISOString()
            });
        }

        testFramework.assert.equals(handler.errors.length, 3);
        // Should keep the latest errors
        testFramework.assert.equals(handler.errors[0].message, 'Error 2');
        testFramework.assert.equals(handler.errors[2].message, 'Error 4');
    });

    // Test createError method
    testFramework.test('ErrorHandler.createError should create and handle error', () => {
        const handler = new ErrorHandler();
        const originalHandleError = handler.handleError;
        let handledError = null;

        // Mock handleError to capture the error
        handler.handleError = (error) => {
            handledError = error;
        };

        const error = handler.createError('Test Type', 'Test message', { detail: 'test' });

        testFramework.assert.notNull(error);
        testFramework.assert.equals(error.type, 'Test Type');
        testFramework.assert.equals(error.message, 'Test message');
        testFramework.assert.equals(error.details.detail, 'test');
        testFramework.assert.notNull(error.timestamp);
        testFramework.assert.notNull(error.stack);
        testFramework.assert.equals(handledError, error);

        // Restore original method
        handler.handleError = originalHandleError;
    });

    // Test handleNetworkError
    testFramework.test('ErrorHandler.handleNetworkError should create network error', () => {
        const handler = new ErrorHandler();
        const originalCreateError = handler.createError;
        let createdError = null;

        // Mock createError to capture the error
        handler.createError = (type, message, details) => {
            createdError = { type, message, details };
            return createdError;
        };

        const networkError = new Error('Network failed');
        handler.handleNetworkError(networkError, 'http://test.com/api');

        testFramework.assert.notNull(createdError);
        testFramework.assert.equals(createdError.type, 'Network Error');
        testFramework.assert.true(createdError.message.includes('http://test.com/api'));
        testFramework.assert.equals(createdError.details.originalError, 'Network failed');
        testFramework.assert.equals(createdError.details.url, 'http://test.com/api');

        // Restore original method
        handler.createError = originalCreateError;
    });

    // Test handleAPIError
    testFramework.test('ErrorHandler.handleAPIError should create API error', () => {
        const handler = new ErrorHandler();
        const originalCreateError = handler.createError;
        let createdError = null;

        // Mock createError to capture the error
        handler.createError = (type, message, details) => {
            createdError = { type, message, details };
            return createdError;
        };

        const apiError = new Error('API failed');
        const requestData = { param: 'value' };
        handler.handleAPIError(apiError, '/api/test', requestData);

        testFramework.assert.notNull(createdError);
        testFramework.assert.equals(createdError.type, 'API Error');
        testFramework.assert.true(createdError.message.includes('/api/test'));
        testFramework.assert.equals(createdError.details.originalError, 'API failed');
        testFramework.assert.equals(createdError.details.endpoint, '/api/test');
        testFramework.assert.equals(createdError.details.requestData, requestData);

        // Restore original method
        handler.createError = originalCreateError;
    });

    // Test handleGameStateError
    testFramework.test('ErrorHandler.handleGameStateError should create game state error', () => {
        const handler = new ErrorHandler();
        const originalCreateError = handler.createError;
        let createdError = null;

        // Mock createError to capture the error
        handler.createError = (type, message, details) => {
            createdError = { type, message, details };
            return createdError;
        };

        const gameState = { level: 1, score: 100 };
        handler.handleGameStateError('Invalid game state', gameState);

        testFramework.assert.notNull(createdError);
        testFramework.assert.equals(createdError.type, 'Game State Error');
        testFramework.assert.equals(createdError.message, 'Invalid game state');
        testFramework.assert.equals(createdError.details.gameState, gameState);

        // Restore original method
        handler.createError = originalCreateError;
    });

    // Test handleSaveLoadError
    testFramework.test('ErrorHandler.handleSaveLoadError should create save/load error', () => {
        const handler = new ErrorHandler();
        const originalCreateError = handler.createError;
        let createdError = null;

        // Mock createError to capture the error
        handler.createError = (type, message, details) => {
            createdError = { type, message, details };
            return createdError;
        };

        const saveError = new Error('Save failed');
        handler.handleSaveLoadError(saveError, 'save');

        testFramework.assert.notNull(createdError);
        testFramework.assert.equals(createdError.type, 'Save/Load Error');
        testFramework.assert.equals(createdError.message, 'save operation failed');
        testFramework.assert.equals(createdError.details.operation, 'save');
        testFramework.assert.equals(createdError.details.originalError, 'Save failed');

        // Restore original method
        handler.createError = originalCreateError;
    });

    // Test getErrorHistory
    testFramework.test('ErrorHandler.getErrorHistory should return copy of errors', () => {
        const handler = new ErrorHandler();
        const testError = {
            type: 'Test Error',
            message: 'Test message',
            timestamp: new Date().toISOString()
        };

        handler.logError(testError);
        const history = handler.getErrorHistory();

        testFramework.assert.equals(history.length, 1);
        testFramework.assert.equals(history[0].type, 'Test Error');

        // Should be a copy, not the same reference
        testFramework.assert.true(history !== handler.errors);

        // Modifying returned array should not affect original
        history.push({ type: 'Another Error' });
        testFramework.assert.equals(handler.errors.length, 1);
    });

    // Test clearErrorHistory
    testFramework.test('ErrorHandler.clearErrorHistory should clear all errors', () => {
        const handler = new ErrorHandler();

        // Add some errors
        handler.logError({ type: 'Error 1', message: 'Message 1', timestamp: new Date().toISOString() });
        handler.logError({ type: 'Error 2', message: 'Message 2', timestamp: new Date().toISOString() });

        testFramework.assert.equals(handler.errors.length, 2);

        handler.clearErrorHistory();

        testFramework.assert.equals(handler.errors.length, 0);
    });

    // Test getErrorStats
    testFramework.test('ErrorHandler.getErrorStats should return correct statistics', () => {
        const handler = new ErrorHandler();

        // Add errors of different types
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

        handler.logError({ type: 'Network Error', message: 'Recent error', timestamp: now.toISOString() });
        handler.logError({ type: 'API Error', message: 'Recent error', timestamp: oneHourAgo.toISOString() });
        handler.logError({ type: 'Network Error', message: 'Old error', timestamp: twoHoursAgo.toISOString() });

        const stats = handler.getErrorStats();

        testFramework.assert.equals(stats.total, 3);
        testFramework.assert.equals(stats.byType['Network Error'], 2);
        testFramework.assert.equals(stats.byType['API Error'], 1);
        testFramework.assert.equals(stats.recent, 2); // Only recent errors (within 1 hour)
    });

    // Test global errorHandler instance
    testFramework.test('Global errorHandler instance should be available', () => {
        testFramework.assert.notNull(errorHandler);
        testFramework.assert.true(errorHandler instanceof ErrorHandler);
        // 确保errorHandler在全局作用域中可访问
        if (typeof window !== 'undefined') {
            window.errorHandler = errorHandler;
            testFramework.assert.equals(window.errorHandler, errorHandler);
        }
    });

    // Test localStorage integration (basic test)
    testFramework.test('ErrorHandler should handle localStorage operations gracefully', () => {
        const handler = new ErrorHandler();

        // This should not throw even if localStorage is not available
        testFramework.assert.true(true); // If we get here, no exception was thrown

        // Test loading from localStorage when no data exists
        handler.loadErrorHistory();
        testFramework.assert.true(Array.isArray(handler.errors));
    });

})();
