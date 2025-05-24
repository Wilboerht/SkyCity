// Unit Tests for GameUtils
(function() {
    'use strict';

    // Test GameUtils.formatTime
    testFramework.test('GameUtils.formatTime should format seconds correctly', () => {
        testFramework.assert.equals(GameUtils.formatTime(0), '0:00');
        testFramework.assert.equals(GameUtils.formatTime(30), '0:30');
        testFramework.assert.equals(GameUtils.formatTime(60), '1:00');
        testFramework.assert.equals(GameUtils.formatTime(90), '1:30');
        testFramework.assert.equals(GameUtils.formatTime(3661), '61:01');
    });

    // Test GameUtils.formatScore
    testFramework.test('GameUtils.formatScore should format numbers with locale', () => {
        testFramework.assert.equals(GameUtils.formatScore(0), '0');
        testFramework.assert.equals(GameUtils.formatScore(100), '100');
        testFramework.assert.equals(GameUtils.formatScore(1000), '1,000');
        testFramework.assert.equals(GameUtils.formatScore(1234567), '1,234,567');
    });

    // Test GameUtils.generateId
    testFramework.test('GameUtils.generateId should generate unique IDs', () => {
        const id1 = GameUtils.generateId();
        const id2 = GameUtils.generateId();
        
        testFramework.assert.notNull(id1);
        testFramework.assert.notNull(id2);
        testFramework.assert.true(id1 !== id2, 'IDs should be unique');
        testFramework.assert.true(typeof id1 === 'string', 'ID should be string');
        testFramework.assert.true(id1.length > 0, 'ID should not be empty');
    });

    // Test GameUtils.deepClone
    testFramework.test('GameUtils.deepClone should create deep copy', () => {
        const original = {
            name: 'test',
            score: 100,
            nested: {
                value: 42,
                array: [1, 2, 3]
            }
        };
        
        const cloned = GameUtils.deepClone(original);
        
        // Should be equal but not same reference
        testFramework.assert.equals(cloned.name, original.name);
        testFramework.assert.equals(cloned.score, original.score);
        testFramework.assert.equals(cloned.nested.value, original.nested.value);
        testFramework.assert.arrayEquals(cloned.nested.array, original.nested.array);
        
        // Should not be same reference
        testFramework.assert.true(cloned !== original, 'Should not be same reference');
        testFramework.assert.true(cloned.nested !== original.nested, 'Nested objects should not be same reference');
        
        // Modifying clone should not affect original
        cloned.name = 'modified';
        cloned.nested.value = 999;
        testFramework.assert.equals(original.name, 'test');
        testFramework.assert.equals(original.nested.value, 42);
    });

    // Test GameUtils.coordsEqual
    testFramework.test('GameUtils.coordsEqual should compare coordinates correctly', () => {
        testFramework.assert.true(GameUtils.coordsEqual({x: 0, y: 0}, {x: 0, y: 0}));
        testFramework.assert.true(GameUtils.coordsEqual({x: 5, y: 10}, {x: 5, y: 10}));
        testFramework.assert.false(GameUtils.coordsEqual({x: 0, y: 0}, {x: 1, y: 0}));
        testFramework.assert.false(GameUtils.coordsEqual({x: 0, y: 0}, {x: 0, y: 1}));
        testFramework.assert.false(GameUtils.coordsEqual({x: 1, y: 2}, {x: 2, y: 1}));
    });

    // Test GameUtils.distance
    testFramework.test('GameUtils.distance should calculate distance correctly', () => {
        testFramework.assert.equals(GameUtils.distance({x: 0, y: 0}, {x: 0, y: 0}), 0);
        testFramework.assert.equals(GameUtils.distance({x: 0, y: 0}, {x: 3, y: 4}), 5);
        testFramework.assert.equals(GameUtils.distance({x: 1, y: 1}, {x: 4, y: 5}), 5);
        testFramework.assert.equals(GameUtils.distance({x: -1, y: -1}, {x: 2, y: 3}), 5);
    });

    // Test GameUtils.isValidCoordinate
    testFramework.test('GameUtils.isValidCoordinate should validate coordinates', () => {
        // Valid coordinates
        testFramework.assert.true(GameUtils.isValidCoordinate(0, 0));
        testFramework.assert.true(GameUtils.isValidCoordinate(10, 10));
        testFramework.assert.true(GameUtils.isValidCoordinate(19, 14)); // Max valid coordinates
        
        // Invalid coordinates
        testFramework.assert.false(GameUtils.isValidCoordinate(-1, 0));
        testFramework.assert.false(GameUtils.isValidCoordinate(0, -1));
        testFramework.assert.false(GameUtils.isValidCoordinate(20, 0)); // Out of bounds
        testFramework.assert.false(GameUtils.isValidCoordinate(0, 15)); // Out of bounds
        testFramework.assert.false(GameUtils.isValidCoordinate(20, 15)); // Both out of bounds
    });

    // Test GameUtils.getAdjacentCoordinates
    testFramework.test('GameUtils.getAdjacentCoordinates should return valid adjacent coordinates', () => {
        // Center coordinate
        const adjacent = GameUtils.getAdjacentCoordinates(5, 5);
        testFramework.assert.equals(adjacent.length, 4);
        testFramework.assert.true(adjacent.some(coord => coord.x === 5 && coord.y === 4)); // Up
        testFramework.assert.true(adjacent.some(coord => coord.x === 6 && coord.y === 5)); // Right
        testFramework.assert.true(adjacent.some(coord => coord.x === 5 && coord.y === 6)); // Down
        testFramework.assert.true(adjacent.some(coord => coord.x === 4 && coord.y === 5)); // Left
        
        // Corner coordinate (0,0)
        const cornerAdjacent = GameUtils.getAdjacentCoordinates(0, 0);
        testFramework.assert.equals(cornerAdjacent.length, 2);
        testFramework.assert.true(cornerAdjacent.some(coord => coord.x === 1 && coord.y === 0)); // Right
        testFramework.assert.true(cornerAdjacent.some(coord => coord.x === 0 && coord.y === 1)); // Down
        
        // Edge coordinate
        const edgeAdjacent = GameUtils.getAdjacentCoordinates(19, 14); // Max coordinates
        testFramework.assert.equals(edgeAdjacent.length, 2);
        testFramework.assert.true(edgeAdjacent.some(coord => coord.x === 19 && coord.y === 13)); // Up
        testFramework.assert.true(edgeAdjacent.some(coord => coord.x === 18 && coord.y === 14)); // Left
    });

    // Test GameUtils.debounce
    testFramework.test('GameUtils.debounce should delay function execution', (done) => {
        let callCount = 0;
        const debouncedFn = GameUtils.debounce(() => {
            callCount++;
        }, 100);
        
        // Call multiple times quickly
        debouncedFn();
        debouncedFn();
        debouncedFn();
        
        // Should not have been called yet
        testFramework.assert.equals(callCount, 0);
        
        // Wait for debounce delay
        setTimeout(() => {
            testFramework.assert.equals(callCount, 1, 'Should be called only once after delay');
            if (done) done();
        }, 150);
    });

    // Test GameUtils.throttle
    testFramework.test('GameUtils.throttle should limit function calls', (done) => {
        let callCount = 0;
        const throttledFn = GameUtils.throttle(() => {
            callCount++;
        }, 100);
        
        // Call immediately
        throttledFn();
        testFramework.assert.equals(callCount, 1, 'Should be called immediately');
        
        // Call again quickly - should be throttled
        throttledFn();
        throttledFn();
        testFramework.assert.equals(callCount, 1, 'Should still be 1 due to throttling');
        
        // Wait for throttle period
        setTimeout(() => {
            throttledFn();
            testFramework.assert.equals(callCount, 2, 'Should be called again after throttle period');
            if (done) done();
        }, 150);
    });

})();
