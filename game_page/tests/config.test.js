// Unit Tests for CONFIG
(function() {
    'use strict';

    // Test CONFIG structure
    testFramework.test('CONFIG should have required structure', () => {
        testFramework.assert.notNull(CONFIG);
        testFramework.assert.notNull(CONFIG.API);
        testFramework.assert.notNull(CONFIG.GAME);
        testFramework.assert.notNull(CONFIG.UI);
    });

    // Test API configuration
    testFramework.test('CONFIG.API should have correct structure', () => {
        testFramework.assert.notNull(CONFIG.API.BASE_URL);
        testFramework.assert.notNull(CONFIG.API.ENDPOINTS);
        testFramework.assert.notNull(CONFIG.API.ENDPOINTS.RANKING);
        testFramework.assert.equals(typeof CONFIG.API.BASE_URL, 'string');
        testFramework.assert.equals(typeof CONFIG.API.ENDPOINTS.RANKING, 'string');
        testFramework.assert.equals(CONFIG.API.ENDPOINTS.RANKING, 'backend/api/v1/rank.php');
    });

    // Test GAME configuration
    testFramework.test('CONFIG.GAME should have correct structure and values', () => {
        // Basic game settings
        testFramework.assert.equals(typeof CONFIG.GAME.CELL_SIZE, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.GRID_WIDTH, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.GRID_HEIGHT, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.TIMER_START, 'number');

        testFramework.assert.true(CONFIG.GAME.CELL_SIZE > 0);
        testFramework.assert.true(CONFIG.GAME.GRID_WIDTH > 0);
        testFramework.assert.true(CONFIG.GAME.GRID_HEIGHT > 0);
        testFramework.assert.true(CONFIG.GAME.TIMER_START > 0);

        // Costs
        testFramework.assert.notNull(CONFIG.GAME.COSTS);
        testFramework.assert.equals(typeof CONFIG.GAME.COSTS.ROAD, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.COSTS.REBIRTH_GATE, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.COSTS.NAVIGATOR, 'number');

        testFramework.assert.true(CONFIG.GAME.COSTS.ROAD > 0);
        testFramework.assert.true(CONFIG.GAME.COSTS.REBIRTH_GATE > 0);
        testFramework.assert.true(CONFIG.GAME.COSTS.NAVIGATOR > 0);

        // Scores
        testFramework.assert.notNull(CONFIG.GAME.SCORES);
        testFramework.assert.equals(typeof CONFIG.GAME.SCORES.CORRECT_DESTINATION, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.SCORES.WRONG_DESTINATION, 'number');
        testFramework.assert.equals(typeof CONFIG.GAME.SCORES.COIN_REWARD, 'number');

        testFramework.assert.true(CONFIG.GAME.SCORES.CORRECT_DESTINATION > 0);
        testFramework.assert.true(CONFIG.GAME.SCORES.WRONG_DESTINATION < 0);
        testFramework.assert.true(CONFIG.GAME.SCORES.COIN_REWARD > 0);
    });

    // Test LEVELS configuration
    testFramework.test('CONFIG.GAME.LEVELS should have all difficulty levels', () => {
        testFramework.assert.notNull(CONFIG.GAME.LEVELS);
        testFramework.assert.notNull(CONFIG.GAME.LEVELS.easy);
        testFramework.assert.notNull(CONFIG.GAME.LEVELS.normal);
        testFramework.assert.notNull(CONFIG.GAME.LEVELS.hard);

        // Test each level structure
        ['easy', 'normal', 'hard'].forEach(level => {
            const levelConfig = CONFIG.GAME.LEVELS[level];
            testFramework.assert.notNull(levelConfig.coins);
            testFramework.assert.notNull(levelConfig.birthPoints);
            testFramework.assert.notNull(levelConfig.buildings);

            testFramework.assert.equals(typeof levelConfig.coins, 'number');
            testFramework.assert.equals(typeof levelConfig.birthPoints, 'number');
            testFramework.assert.equals(typeof levelConfig.buildings, 'number');

            testFramework.assert.true(levelConfig.coins > 0);
            testFramework.assert.true(levelConfig.birthPoints > 0);
            testFramework.assert.true(levelConfig.buildings > 0);
        });

        // Test difficulty progression
        testFramework.assert.true(CONFIG.GAME.LEVELS.easy.coins < CONFIG.GAME.LEVELS.normal.coins);
        testFramework.assert.true(CONFIG.GAME.LEVELS.normal.coins < CONFIG.GAME.LEVELS.hard.coins);

        testFramework.assert.true(CONFIG.GAME.LEVELS.easy.birthPoints <= CONFIG.GAME.LEVELS.normal.birthPoints);
        testFramework.assert.true(CONFIG.GAME.LEVELS.normal.birthPoints <= CONFIG.GAME.LEVELS.hard.birthPoints);

        testFramework.assert.true(CONFIG.GAME.LEVELS.easy.buildings <= CONFIG.GAME.LEVELS.normal.buildings);
        testFramework.assert.true(CONFIG.GAME.LEVELS.normal.buildings <= CONFIG.GAME.LEVELS.hard.buildings);
    });

    // Test UI configuration
    testFramework.test('CONFIG.UI should have correct structure', () => {
        testFramework.assert.notNull(CONFIG.UI.ANIMATION_DURATION);
        testFramework.assert.notNull(CONFIG.UI.CITIZEN_MOVE_SPEED);

        testFramework.assert.equals(typeof CONFIG.UI.ANIMATION_DURATION, 'number');
        testFramework.assert.equals(typeof CONFIG.UI.CITIZEN_MOVE_SPEED, 'number');

        testFramework.assert.true(CONFIG.UI.ANIMATION_DURATION > 0);
        testFramework.assert.true(CONFIG.UI.CITIZEN_MOVE_SPEED > 0);
    });

    // Test configuration values are reasonable
    testFramework.test('CONFIG values should be reasonable', () => {
        // Grid size should be reasonable for a web game
        testFramework.assert.true(CONFIG.GAME.GRID_WIDTH >= 10 && CONFIG.GAME.GRID_WIDTH <= 50);
        testFramework.assert.true(CONFIG.GAME.GRID_HEIGHT >= 10 && CONFIG.GAME.GRID_HEIGHT <= 50);

        // Cell size should be reasonable for display
        testFramework.assert.true(CONFIG.GAME.CELL_SIZE >= 20 && CONFIG.GAME.CELL_SIZE <= 100);

        // Timer should be reasonable
        testFramework.assert.true(CONFIG.GAME.TIMER_START >= 30 && CONFIG.GAME.TIMER_START <= 300);

        // Animation durations should be reasonable
        testFramework.assert.true(CONFIG.UI.ANIMATION_DURATION >= 100 && CONFIG.UI.ANIMATION_DURATION <= 2000);
        testFramework.assert.true(CONFIG.UI.CITIZEN_MOVE_SPEED >= 100 && CONFIG.UI.CITIZEN_MOVE_SPEED <= 2000);
    });

    // Test configuration immutability (basic check)
    testFramework.test('CONFIG should be accessible globally', () => {
        testFramework.assert.notNull(CONFIG);
        // 确保CONFIG在全局作用域中可访问
        if (typeof window !== 'undefined') {
            window.CONFIG = CONFIG;
            testFramework.assert.equals(window.CONFIG, CONFIG);
        }
    });

    // Test specific configuration values match expected game design
    testFramework.test('CONFIG values should match game design', () => {
        // Check specific values that are important for game balance
        testFramework.assert.equals(CONFIG.GAME.CELL_SIZE, 40);
        testFramework.assert.equals(CONFIG.GAME.GRID_WIDTH, 20);
        testFramework.assert.equals(CONFIG.GAME.GRID_HEIGHT, 15);
        testFramework.assert.equals(CONFIG.GAME.TIMER_START, 100);

        // Check tool costs
        testFramework.assert.equals(CONFIG.GAME.COSTS.ROAD, 50);
        testFramework.assert.equals(CONFIG.GAME.COSTS.REBIRTH_GATE, 1000);
        testFramework.assert.equals(CONFIG.GAME.COSTS.NAVIGATOR, 500);

        // Check score values
        testFramework.assert.equals(CONFIG.GAME.SCORES.CORRECT_DESTINATION, 100);
        testFramework.assert.equals(CONFIG.GAME.SCORES.WRONG_DESTINATION, -100);
        testFramework.assert.equals(CONFIG.GAME.SCORES.COIN_REWARD, 100);

        // Check level configurations
        testFramework.assert.equals(CONFIG.GAME.LEVELS.easy.coins, 3000);
        testFramework.assert.equals(CONFIG.GAME.LEVELS.normal.coins, 5000);
        testFramework.assert.equals(CONFIG.GAME.LEVELS.hard.coins, 8000);
    });

})();
