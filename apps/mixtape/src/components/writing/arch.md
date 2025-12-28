```
src/components/write/
├── WriteComposer.tsx                    # Main orchestrator (200-300 lines max)
├── composer/                            # Core composer components
│   ├── TitleInput.tsx                   # Title input field
│   ├── MainEditor.tsx                   # TipTap editor wrapper
│   ├── SummarySection.tsx               # Summary textarea & controls
│   ├── StatusBar.tsx                    # Save status & action buttons
│   └── PublishSection.tsx               # Publish panel wrapper
├── copydesk/                            # Copy desk components
│   ├── CopyDesk.tsx                     # Right sidebar container
│   ├── CopyDeskHeader.tsx               # Header with collapse controls
│   ├── agents/                          # Individual agents
│   │   ├── AISummaryAgent.tsx           # AI Summary accordion item
│   │   ├── ResearchAgent.tsx            # Research accordion item  
│   │   ├── WordAgent.tsx                # Word agent accordion item
│   │   └── StatisticsAgent.tsx          # Statistics accordion item
│   └── shared/                          # Shared copy desk components
│       ├── AgentContainer.tsx           # Reusable accordion item wrapper
│       ├── AgentStatus.tsx              # Status indicators (loading, ready, error)
│       └── AgentHeader.tsx              # Consistent agent header layout
├── modals/                              # Modal components
│   └── SummaryReplaceModal.tsx          # Summary replacement confirmation
├── controls/                            # Reusable controls
│   ├── BackToTopButton.tsx              # Floating back-to-top
│   └── WorkspaceToggle.tsx              # Workspace open/close button
└── hooks/                               # Write-specific hooks
    ├── useTextSelection.ts              # NEW: Text selection detection
    ├── useWorkspaceState.ts             # Workspace open/close state
    └── useWriterLayout.ts               # Layout calculations & responsive
```