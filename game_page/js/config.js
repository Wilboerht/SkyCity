// Sky City Game Configuration
const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: '', // 使用相对路径，部署时自动适配
        ENDPOINTS: {
            RANKING: 'backend/api/v1/rank.php'
        }
    },
    
    // Game Configuration
    GAME: {
        CELL_SIZE: 40,
        GRID_WIDTH: 20,
        GRID_HEIGHT: 15,
        TIMER_START: 100,
        
        // Tool Costs
        COSTS: {
            ROAD: 50,
            REBIRTH_GATE: 1000,
            NAVIGATOR: 500
        },
        
        // Score Values
        SCORES: {
            CORRECT_DESTINATION: 100,
            WRONG_DESTINATION: -100,
            COIN_REWARD: 100
        },
        
        // Level Configuration
        LEVELS: {
            easy: {
                coins: 3000,
                birthPoints: 1,
                buildings: 3
            },
            normal: {
                coins: 5000,
                birthPoints: 2,
                buildings: 4
            },
            hard: {
                coins: 8000,
                birthPoints: 3,
                buildings: 6
            }
        }
    },
    
    // UI Configuration
    UI: {
        ANIMATION_DURATION: 500,
        CITIZEN_MOVE_SPEED: 500
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
