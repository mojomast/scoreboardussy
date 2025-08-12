# Changelog

All notable changes to the ImproV Scoreboard project will be documented in this file.

## [0.5.7] - 2025-08-12

### 🎯 Major Features Added

#### **Audience Voting System**
- **Session-based voting** - Each person can vote once with ability to switch votes until session ends
- **Live vote count display** - Real-time vote tallies shown prominently on scoreboard display
- **QR code integration** - Large, scannable QR codes appear automatically during voting
- **Beautiful voting page** - Mobile-friendly interface with actual team names and colors
- **Auto-award functionality** - Winner can automatically receive scoreboard points
- **Professional UI** - Enhanced voting interface with visual feedback and animations

#### **Enhanced Display Features**
- **Large central QR codes** (280x280px) for easy audience scanning
- **Live vote count overlay** at top of display showing team names and current tallies
- **Team-branded voting** - Buttons and interface use actual team colors and names
- **Real-time updates** - Vote counts refresh every 2 seconds during active sessions

### 🎨 User Interface Improvements
- **Dynamic team integration** - Voting page fetches and displays actual team names and colors
- **Improved QR positioning** - Moved from corner to center for maximum visibility
- **Professional styling** - Clean white QR containers with borders and shadows
- **Enhanced mobile experience** - Responsive design optimized for phone voting
- **Visual feedback** - Color-coded team buttons with hover and selection states

### 🔧 Technical Enhancements
- **Session management** - UUID-based session tracking for vote integrity
- **Vote switching** - Users can change their vote multiple times before session ends
- **QR code generation** - Server-side QR generation with proper error handling
- **API improvements** - Enhanced `/api/voting/state` endpoint with team information
- **Hash navigation fixes** - Fixed URL hash preservation during token cleanup

### 🛠 Backend Improvements
- **New dependencies added**:
  - `qrcode@^1.5.3` - QR code generation
  - `@types/qrcode@^1.5.5` - TypeScript definitions
- **Enhanced voting API** with comprehensive session management
- **Improved state management** for voting sessions and team data
- **Better error handling** and logging for voting operations

### 📚 Documentation Updates
- **New `docs/Voting.md`** - Complete voting system documentation
- **Session-based voting** examples and API documentation
- **Enhanced UI integration** documentation with screenshots and flows
- **Control panel integration** guide with button explanations
- **QR code access** documentation for direct image and voting page URLs

### 🏗 Development Features
- **Enhanced build process** - Docker support for new voting features
- **TypeScript improvements** - Better type safety for voting APIs
- **Testing enhancements** - Comprehensive voting flow testing capabilities

### 🔒 Security & Reliability
- **Session-based integrity** - Prevents duplicate voting while allowing vote changes
- **Input validation** - Proper validation of voting requests and team IDs
- **Error boundaries** - Graceful error handling in voting components
- **State synchronization** - Reliable real-time updates between control and display

---

## Previous Versions

### [0.3.0] - Previous Release
- Basic scoreboard functionality
- Team management
- Round system
- Socket.io real-time updates
- Multi-language support
