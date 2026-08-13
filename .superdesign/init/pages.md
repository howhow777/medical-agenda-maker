# Pages

## / — Medical Agenda Maker
Entry: `index.html`

Dependencies:
- `styles.css`
- `src/main.ts`
  - `src/interface/uiController.ts`
    - `src/interface/canvasInteractions.ts`
      - `src/logic/overlayManager.ts`
        - `src/logic/overlay-processor.ts`
    - `src/interface/formControls.ts`
      - `src/logic/templates.ts`
      - `src/logic/overlayManager.ts`
    - `src/interface/templateController.ts`
      - `src/logic/templateManager.ts`
        - `src/logic/dataManager.ts`
    - `src/interface/cropController-fixed.ts`
    - `src/interface/feedbackController.ts`
    - `src/logic/posterRenderer.ts`
      - `src/logic/colorSchemes.ts`
      - `src/logic/templates.ts`
      - `src/logic/canvas-utils.ts`
      - `src/logic/overlay-processor.ts`
    - `src/logic/dataConverter.ts`
    - `src/logic/dataManager.ts`
    - `src/assets/types.ts`
    - `src/assets/agendaTypes.ts`
  - `src/interface/fileUploader.ts`
    - `src/logic/excelParser.ts`
  - `src/interface/accordionController.ts`
  - `src/interface/updateNoticeController.ts`
  - `src/interface/touchDebugController.ts`
- `src/assets/feedback-modal.css`
- SheetJS CDN used by the Excel importer

Rendered structure:
- Purple top header with hamburger control and developer credit.
- Scrollable left configuration panel containing update notice and accordion sections for import, meeting information, agenda editing, visual settings, and PNG layers.
- Right workspace containing the generated poster canvas and sticky download action.
- Responsive stacked layout below 1200px.
