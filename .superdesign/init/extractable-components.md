# Extractable Components

## AppShell
- Source: `index.html`
- Category: layout
- Description: Header, collapsible settings panel, poster workspace, and floating download action.
- Extractable props: isControlsCollapsed (boolean, default: false)
- Hardcoded: app title, developer credit, accordion sections, canvas id, download label.

## ControlPanelAccordion
- Source: `index.html`, `src/interface/accordionController.ts`
- Category: layout
- Description: Repeated settings groups with icon, title, chevron, and collapsible content.
- Extractable props: activeSection (string, default: "basic")
- Hardcoded: section icons, field labels, CSS classes.

## UpdateNotice
- Source: `index.html`, `src/interface/updateNoticeController.ts`
- Category: basic
- Description: Dismissible recent-update summary card.
- Extractable props: isExpanded (boolean, default: false), isVisible (boolean, default: true)
- Hardcoded: current release text, update icon, button labels.

## TemplateActions
- Source: `src/interface/templateController.ts`
- Category: basic
- Description: Save and load controls for local JSON templates.
- Extractable props: none
- Hardcoded: button icons, labels, accepted file type.

## FloatingDownloadAction
- Source: `index.html`
- Category: basic
- Description: Sticky gradient pill button centered below the poster.
- Extractable props: none
- Hardcoded: download icon, label, gradient and positioning.
