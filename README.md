# Sky City Game

A web-based city building game where players must connect buildings with roads to guide citizens to their destinations.

## Project Structure

The project is divided into two modules:

1. **Module A (01_module_a)**: Contains the style guide and page layouts
   - StyleGuide: Contains the design documentation
   - Main Page: The entry point of the game
   - Level Selection Page: For choosing difficulty level
   - Game Page: The main gameplay area
   - Ranking Page: Displays player scores

2. **Module B (01_module_b)**: Contains the functional implementation
   - Backend API for ranking system
   - Implementation of game logic
   - Integration of all components

## Game Overview

Sky City is a strategic city-building game where:

- Players build roads to connect birth points with destination buildings (Sun, Moon, and Star Houses)
- Citizens spawn at birth points and need to reach their designated buildings
- Players can place special tools like navigators and rebirth gates to help citizens find their way
- The game has three difficulty levels: Easy, Normal, and Hard
- Players earn points when citizens reach their correct destinations

## Game Features

- Interactive map with grid-based construction
- Four tools: Road Paver, Rebirth Gate, Navigator, and Remove Tool
- Real-time citizen movement with pathfinding
- Save/Load game functionality
- Ranking system to track high scores
- Multiple difficulty levels with increasing challenges

## How to Play

1. **Start a New Game**: Enter your nickname and begin a new game
2. **Select Difficulty**: Choose between Easy, Normal, or Hard modes
3. **Build Mode**: 
   - Place roads connecting buildings
   - Add navigators at intersections to guide citizens
   - Add rebirth gates to redirect lost citizens
4. **Operation Mode**: 
   - Launch the simulation by clicking the Launch button
   - Watch citizens navigate through your road network
   - Score increases when citizens reach correct destinations
5. **Win/Lose Conditions**:
   - Win: All citizens reach their correct destinations with a positive score
   - Lose: Time runs out or score drops below zero

## Technical Details

- Built with HTML5, CSS3, and JavaScript
- Uses localStorage for saving game data and rankings
- RESTful API design for ranking system
- Responsive design for different screen sizes

## Credits

- All game assets included in the project directories
- Developed as a demonstration project for a web game competition 