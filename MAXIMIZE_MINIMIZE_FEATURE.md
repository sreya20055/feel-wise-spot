# Video Avatar Maximize/Minimize Feature

## Overview
Added maximize and minimize controls to the Tavus video avatar in the AI Companion interface, allowing users to expand the video to fullscreen or collapse it to just the header bar.

## Features Added

### 🔲 Minimize Button
- **Icon**: Minimize icon (when expanded) / Maximize icon (when minimized)
- **Behavior**: Collapses the video area, showing only the header
- **Purpose**: Saves screen space while keeping the video controls accessible

### 🔳 Maximize Button  
- **Icon**: Maximize icon (when normal) / X icon (when maximized)
- **Behavior**: Expands video to fullscreen overlay with backdrop
- **Purpose**: Provides immersive video experience for better interaction

## User Interface

### Button Location
- Located in the video avatar card header, top-right corner
- Small, unobtrusive ghost buttons with hover effects

### Visual States

#### Normal State
- Standard video avatar in sidebar (320px width on large screens)
- Both minimize and maximize buttons available

#### Minimized State
- Only shows the card header with title and controls
- Video content area is hidden
- Minimize button shows restore icon
- Maximize button still available

#### Maximized State
- Fullscreen overlay with semi-transparent backdrop
- Video takes up most of the screen (max 90vh height)
- X button in header to close
- Backdrop click to close
- ESC key to close
- Help text showing keyboard shortcut

## Technical Implementation

### State Variables Added
```typescript
const [isVideoMaximized, setIsVideoMaximized] = useState(false);
const [isVideoMinimized, setIsVideoMinimized] = useState(false);
```

### Key Components

#### Control Buttons
```jsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    setIsVideoMinimized(!isVideoMinimized);
    if (isVideoMaximized) setIsVideoMaximized(false);
  }}
  title={isVideoMinimized ? "Restore video" : "Minimize video"}
>
  {isVideoMinimized ? <Maximize /> : <Minimize />}
</Button>
```

#### Conditional Rendering
- Video content only renders when `!isVideoMinimized`
- Container classes change based on maximize/minimize states
- Fullscreen overlay uses fixed positioning with z-index 50

#### Keyboard Support
- ESC key closes maximized video
- Event listeners added/removed based on maximized state

#### Backdrop Interaction
- Click outside video in maximized mode closes it
- Uses event target checking to prevent bubbling

## Responsive Design

### Desktop (lg screens and up)
- Normal: 320px width sidebar
- Minimized: Header only
- Maximized: Fullscreen overlay

### Mobile/Tablet
- All states work responsively
- Fullscreen mode particularly useful on smaller screens

## User Experience Improvements

### Accessibility
- Proper ARIA labels and titles on all buttons
- Keyboard navigation support
- Visual indicators for current state

### Visual Feedback
- Smooth state transitions
- Clear iconography
- Helpful tooltips
- Context-aware help text

### Interaction Patterns
- Mutually exclusive states (can't be both minimized and maximized)
- Multiple ways to exit fullscreen (button, backdrop, ESC key)
- Intuitive icon changes based on current state

## Preserved Functionality

### Existing Features Maintained
- ✅ All original video loading states
- ✅ Error handling and retry functionality
- ✅ Tavus iframe integration
- ✅ Audio/video toggles in header
- ✅ Connection testing and cleanup
- ✅ Responsive layout
- ✅ All existing event handlers
- ✅ Toast notifications
- ✅ Debug and cleanup utilities

### No Breaking Changes
- All existing props and state remain unchanged
- Original layout preserved when not using new features
- Backward compatible with all existing functionality

## Usage Instructions

### For Users
1. **To minimize**: Click the minimize button (─) in the video header
2. **To restore from minimized**: Click the maximize button (□) in the minimized header
3. **To maximize**: Click the maximize button (□) in the video header
4. **To exit fullscreen**: 
   - Click the X button in the header
   - Click anywhere on the dark backdrop
   - Press the ESC key

### For Developers
- States are managed independently with mutual exclusivity
- All existing video functionality works in any state
- Easy to extend with additional view modes if needed
- Clean separation of concerns with conditional rendering

## Future Enhancements Possible
- Picture-in-picture mode
- Custom positioning for minimized state
- Animation transitions between states
- Remember user's preferred state in localStorage
- Resizable video window in maximized mode

## Testing
- ✅ TypeScript compilation successful
- ✅ All existing functionality preserved
- ✅ Responsive design maintained
- ✅ No breaking changes introduced

The feature is ready for use and provides an enhanced video viewing experience while maintaining all existing functionality!