# Dashboard Design Specification

## Overview

A comprehensive dashboard for generating platform-ready image prompts, captions, and images for TikTok and Instagram with multi-scene management, reference image handling, and project versioning.

## Layout Structure

### Left Sidebar (Fixed Width: ~280px)

- **Header Section**
  - Logo/Brand
  - Account menu (email, subscription status, sign out)
- **Navigation Section**
  - Home/Dashboard (active state)
  - Projects
  - Saved Images
  - Settings
- **Footer Section**
  - Plan info (Plan type, Credits remaining/total)
  - Upgrade button (if not subscribed)
  - Footer links

### Main Dashboard Area (Scrollable)

#### 1. Summary Metrics Bar (Top)

- Credits remaining (Free/Paid)
- References count
- Scenes count
- Resolution setting

#### 2. Reference Images Section

- Upload area with drag & drop
- Reference library button
- Grid of uploaded reference images
- Per-scene reference assignment option
- Global vs per-scene toggle

#### 3. Scene Prompts Section

- Numbered list of scenes (one prompt per scene)
- Add Scene button
- Each scene card shows:
  - Scene number
  - Prompt text (editable)
  - Reorder controls (up/down arrows)
  - Delete button
  - Associated reference images (if per-scene)
- Empty state when no scenes

#### 4. Platform Rules Section

- Tab switcher: TikTok | Instagram
- TikTok rules:
  - Slightly long captions
  - Line breaks
  - Natural brand mention
  - Exactly 5 approved hashtags
- Instagram rules:
  - Longer captions
  - Educational tone
  - Natural brand mention
  - More hashtags allowed
  - No #apps/#iphoneapps
  - Hashtags at bottom
- Rule-locked generation toggle

#### 5. Custom Guidelines Section

- Text area for user-defined guidelines
- Character counter
- Save guidelines button

#### 6. Image Generation Section

- Generate button (disabled if no references/scenes)
- Progress indicator during generation
- Generated images grid:
  - One image per scene prompt
  - Image preview
  - Regenerate button (independent per image)
  - Download button
  - Scene number label

#### 7. Captions Section

- Tab switcher: TikTok | Instagram
- Generated captions display:
  - Platform-specific formatting
  - Copy button
  - Edit button
  - Regenerate button

#### 8. Project Management Section

- Save Project button
- Project name input
- Version History:
  - List of saved versions
  - Timestamp
  - Restore version button
  - Delete version button

## Key Features

### Image Prompt Generation Rules

- Single numbered list output
- Medium-detail prompts
- One person per prompt
- One concrete moment per prompt
- One clear environment per prompt
- One visible emotion per prompt
- Varied scenes
- Transparent background only for title slides
- No style/camera/color mentions

### Reference Image Handling

- Global references: Apply to all scenes
- Per-scene references: Apply to specific scenes only
- Visual consistency enforcement
- Subject consistency enforcement

### Multi-Scene Management

- Add/remove scenes
- Reorder scenes
- Edit scene prompts independently
- Scene-specific reference assignment

### Platform-Specific Output

- TikTok captions: Slightly long, line breaks, 5 hashtags
- Instagram captions: Longer, educational, hashtags at bottom
- Platform-specific image sizing (if applicable)

### Project Saving & Versioning

- Save project with name
- Version history with timestamps
- Restore previous versions
- Delete old versions

## UI/UX Considerations

### Visual Hierarchy

- Clear section separation
- Consistent card-based layout
- Prominent action buttons
- Subtle inactive states

### Responsive Design

- Sidebar collapses on mobile
- Main content adapts to screen size
- Touch-friendly controls

### Loading States

- Skeleton loaders for async content
- Progress indicators for generation
- Disabled states during operations

### Error Handling

- Validation messages
- Error toasts/notifications
- Retry mechanisms

### Accessibility

- Keyboard navigation
- ARIA labels
- Focus indicators
- Screen reader support

## Technical Implementation Notes

### State Management

- Scene prompts array
- Reference images array
- Platform selection (TikTok/Instagram)
- Custom guidelines text
- Generated images array
- Captions object (TikTok/Instagram)
- Project versions array
- Current project state

### Data Flow

1. User uploads reference images
2. User adds scene prompts
3. User sets platform rules and custom guidelines
4. User clicks Generate
5. System generates numbered prompt list
6. System generates images per prompt
7. System generates platform-specific captions
8. User can regenerate individual images
9. User can save project
10. User can restore from version history

### API Integration Points

- Image generation API
- Caption generation API
- Project save/load API
- Version history API
- Reference image storage
- User authentication
