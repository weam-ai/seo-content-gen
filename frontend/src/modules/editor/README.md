# Editor Module

A complete editor module built with BlockNote library, featuring a collapsible sidebar, rich text editing, and comprehensive document management tools.

## Features

### Left Sidebar (Collapsible)
- Article details and metadata
- Word count and reading time
- Author information
- Tags and status

### Main Editor
- BlockNote rich text editor
- Fixed width layout
- Integrated toolbar
- Focus mode support

### Right Mini Sidebar
- Profile menu (User Settings, Notifications, Logout)
- Document checks (Grammar, Brevity, Clichés, etc.)
- Time logging and history
- Settings (Theme, Focus mode, Typography, AI settings)
- Share options (Collaborators, Download, Copy to clipboard)

## Installation

Install the required dependencies:

```bash
npm install @blocknote/core @blocknote/react @radix-ui/react-slider @radix-ui/react-progress @radix-ui/react-switch
```

## Usage

```tsx
import { Editor } from '@/modules/editor';

function App() {
  return <Editor />;
}
```

## Components Structure

```
src/modules/editor/
├── components/
│   ├── Editor.tsx              # Main editor component
│   ├── LeftSidebar.tsx         # Article details sidebar
│   ├── EditorContent.tsx       # BlockNote editor wrapper
│   ├── MiniSidebar.tsx         # Right mini sidebar
│   ├── RightSidebar.tsx        # Right sidebar container
│   └── sections/               # Right sidebar sections
│       ├── ChecklistSection.tsx
│       ├── TimeSection.tsx
│       ├── SettingsSection.tsx
│       └── ShareSection.tsx
├── hooks/
│   └── useEditor.ts            # Editor state management
├── types/
│   └── index.ts                # TypeScript definitions
└── index.ts                    # Module exports
```

## Features Detail

### Checklist Section
- Grammar checking
- Brevity analysis
- Clarity assessment
- Cliché detection
- Tone analysis
- Readability scoring

### Time Section
- Session tracking
- Time statistics
- Activity breakdown
- History logging

### Settings Section
- Theme switching (Light/Dark)
- Focus mode toggle
- Typography customization
- AI model configuration
- Temperature and language settings

### Share Section
- Collaborator management
- Role-based permissions
- Share link generation
- Multiple export formats (PDF, Markdown, Word, HTML)
- Copy to clipboard functionality

## Customization

The editor is highly customizable through the settings interface and can be extended with additional features as needed.