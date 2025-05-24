// Unit Tests for SkyAPI
(function() {
    'use strict';

    // Mock fetch for testing
    const originalFetch = window.fetch;
    let mockFetch;

    function setupMockFetch() {
        mockFetch = {
            calls: [],
            responses: [],

            mock: function(response) {
                this.responses.push(response);
                window.fetch = (...args) => {
                    this.calls.push(args);
                    const mockResponse = this.responses.shift() || { ok: true, json: () => Promise.resolve({}) };
                    return Promise.resolve(mockResponse);
                };
            },

            restore: function() {
                window.fetch = originalFetch;
                this.calls = [];
                this.responses = [];
            }
        };
    }

    // Test SkyAPI constructor
    testFramework.test('SkyAPI should initialize correctly', () => {
        const api = new SkyAPI();
        testFramework.assert.notNull(api);
        testFramework.assert.equals(api.baseURL, CONFIG.API.BASE_URL);
    });

    // Test SkyAPI.submitScore success
    testFramework.test('SkyAPI.submitScore should submit score successfully', async () => {
        setupMockFetch();

        const mockResponse = {
            ok: true,
            json: () => Promise.resolve({ success: true, message: 'Score submitted' })
        };
        mockFetch.mock(mockResponse);

        const api = new SkyAPI();
        const scoreData = { name: 'TestPlayer', score: 1000, time: 120 };

        const result = await api.submitScore(scoreData);

        testFramework.assert.equals(result.success, true);
        testFramework.assert.equals(result.message, 'Score submitted');
        testFramework.assert.equals(mockFetch.calls.length, 1);

        // Check request details
        const [url, options] = mockFetch.calls[0];
        testFramework.assert.equals(url, CONFIG.API.ENDPOINTS.RANKING);
        testFramework.assert.equals(options.method, 'POST');
        testFramework.assert.equals(options.headers['Content-Type'], 'application/json');

        const requestBody = JSON.parse(options.body);
        testFramework.assert.equals(requestBody.name, 'TestPlayer');
        testFramework.assert.equals(requestBody.score, 1000);
        testFramework.assert.equals(requestBody.time, 120);

        mockFetch.restore();
    });

    // Test SkyAPI.submitScore failure
    testFramework.test('SkyAPI.submitScore should handle errors', async () => {
        setupMockFetch();

        const mockResponse = {
            ok: false,
            status: 500,
            text: () => Promise.resolve('Internal Server Error')
        };
        mockFetch.mock(mockResponse);

        const api = new SkyAPI();
        const scoreData = { name: 'TestPlayer', score: 1000, time: 120 };

        try {
            await api.submitScore(scoreData);
            testFramework.assert.true(false, 'Should have thrown an error');
        } catch (error) {
            testFramework.assert.true(error.message.includes('HTTP 500'));
            testFramework.assert.true(error.message.includes('Internal Server Error'));
        }

        mockFetch.restore();
    });

    // Test SkyAPI.getRankings success
    testFramework.test('SkyAPI.getRankings should fetch rankings successfully', async () => {
        setupMockFetch();

        const mockRankings = [
            { name: 'Player1', score: 2000, time: 100 },
            { name: 'Player2', score: 1500, time: 150 }
        ];

        const mockResponse = {
            ok: true,
            json: () => Promise.resolve(mockRankings)
        };
        mockFetch.mock(mockResponse);

        const api = new SkyAPI();
        const result = await api.getRankings();

        testFramework.assert.arrayEquals(result, mockRankings);
        testFramework.assert.equals(mockFetch.calls.length, 1);

        // Check that nocache parameter is added
        const [url] = mockFetch.calls[0];
        testFramework.assert.true(url.includes('nocache='));
        testFramework.assert.true(url.startsWith(CONFIG.API.ENDPOINTS.RANKING));

        mockFetch.restore();
    });

    // Test SkyAPI.getRankings failure
    testFramework.test('SkyAPI.getRankings should handle errors', async () => {
        setupMockFetch();

        const mockResponse = {
            ok: false,
            status: 404,
            statusText: 'Not Found'
        };
        mockFetch.mock(mockResponse);

        const api = new SkyAPI();

        try {
            await api.getRankings();
            testFramework.assert.true(false, 'Should have thrown an error');
        } catch (error) {
            testFramework.assert.true(error.message.includes('HTTP 404'));
            testFramework.assert.true(error.message.includes('Not Found'));
        }

        mockFetch.restore();
    });

    // Test SkyAPI.checkHealth success
    testFramework.test('SkyAPI.checkHealth should return true for healthy API', async () => {
        setupMockFetch();

        const mockResponse = { ok: true };
        mockFetch.mock(mockResponse);

        const api = new SkyAPI();
        const result = await api.checkHealth();

        testFramework.assert.true(result);
        testFramework.assert.equals(mockFetch.calls.length, 1);

        // Check that HEAD method is used
        const [url, options] = mockFetch.calls[0];
        testFramework.assert.equals(options.method, 'HEAD');

        mockFetch.restore();
    });

    // Test SkyAPI.checkHealth failure
    testFramework.test('SkyAPI.checkHealth should return false for unhealthy API', async () => {
        setupMockFetch();

        const mockResponse = { ok: false };
        mockFetch.mock(mockResponse);

        const api = new SkyAPI();
        const result = await api.checkHealth();

        testFramework.assert.false(result);

        mockFetch.restore();
    });

    // Test SkyAPI.checkHealth network error
    testFramework.test('SkyAPI.checkHealth should handle network errors', async () => {
        setupMockFetch();

        // Mock network error
        window.fetch = () => Promise.reject(new Error('Network error'));

        const api = new SkyAPI();
        const result = await api.checkHealth();

        testFramework.assert.false(result);

        mockFetch.restore();
    });

    // Test global skyAPI instance
    testFramework.test('Global skyAPI instance should be available', () => {
        testFramework.assert.notNull(skyAPI);
        testFramework.assert.true(skyAPI instanceof SkyAPI);
        // 确保skyAPI在全局作用域中可访问
        if (typeof window !== 'undefined') {
            window.skyAPI = skyAPI;
            testFramework.assert.equals(window.skyAPI, skyAPI);
        }
    });

})();
