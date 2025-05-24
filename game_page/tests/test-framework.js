// Simple Test Framework for Sky City
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * 定义测试用例
     * @param {string} description - 测试描述
     * @param {Function} testFunction - 测试函数
     */
    test(description, testFunction) {
        this.tests.push({
            description,
            testFunction
        });
    }

    /**
     * 断言函数
     */
    assert = {
        equals: (actual, expected, message = '') => {
            if (actual !== expected) {
                throw new Error(`${message} Expected: ${expected}, Actual: ${actual}`);
            }
        },
        
        true: (value, message = '') => {
            if (value !== true) {
                throw new Error(`${message} Expected: true, Actual: ${value}`);
            }
        },
        
        false: (value, message = '') => {
            if (value !== false) {
                throw new Error(`${message} Expected: false, Actual: ${value}`);
            }
        },
        
        notNull: (value, message = '') => {
            if (value === null || value === undefined) {
                throw new Error(`${message} Expected value to not be null/undefined`);
            }
        },
        
        throws: (fn, message = '') => {
            let threw = false;
            try {
                fn();
            } catch (e) {
                threw = true;
            }
            if (!threw) {
                throw new Error(`${message} Expected function to throw an error`);
            }
        },
        
        arrayEquals: (actual, expected, message = '') => {
            if (!Array.isArray(actual) || !Array.isArray(expected)) {
                throw new Error(`${message} Both values must be arrays`);
            }
            if (actual.length !== expected.length) {
                throw new Error(`${message} Array lengths differ. Expected: ${expected.length}, Actual: ${actual.length}`);
            }
            for (let i = 0; i < actual.length; i++) {
                if (actual[i] !== expected[i]) {
                    throw new Error(`${message} Arrays differ at index ${i}. Expected: ${expected[i]}, Actual: ${actual[i]}`);
                }
            }
        }
    };

    /**
     * 运行所有测试
     */
    async runTests() {
        console.log('🧪 Running Sky City Tests...\n');
        
        this.results = { passed: 0, failed: 0, total: this.tests.length };
        
        for (const test of this.tests) {
            try {
                await test.testFunction();
                console.log(`✅ ${test.description}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${test.description}`);
                console.log(`   Error: ${error.message}\n`);
                this.results.failed++;
            }
        }
        
        this.printResults();
    }

    /**
     * 打印测试结果
     */
    printResults() {
        console.log('\n📊 Test Results:');
        console.log(`Total: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️ Some tests failed. Please check the errors above.');
        }
    }
}

// 创建全局测试实例
const testFramework = new TestFramework();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestFramework;
}
