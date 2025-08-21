/**
 * 摺疊面板控制器
 */
export class AccordionController {
    constructor() {
        this.sections = document.querySelectorAll('.accordion-section');
        this.init();
    }
    init() {
        // 綁定點擊事件
        this.sections.forEach(section => {
            const header = section.querySelector('.accordion-header');
            if (header) {
                header.addEventListener('click', () => {
                    this.toggleSection(section);
                });
            }
        });
        // 確保第一個區塊預設展開
        this.ensureDefaultState();
    }
    toggleSection(targetSection) {
        const isActive = targetSection.classList.contains('active');
        if (isActive) {
            // 收合當前區塊
            targetSection.classList.remove('active');
        }
        else {
            // 展開目標區塊
            targetSection.classList.add('active');
        }
    }
    ensureDefaultState() {
        // 確保第一個區塊（快速開始）預設展開
        const firstSection = this.sections[0];
        if (firstSection && !firstSection.classList.contains('active')) {
            firstSection.classList.add('active');
        }
    }
    // 程式化控制方法
    expandSection(sectionName) {
        const section = document.querySelector(`[data-section="${sectionName}"]`);
        if (section) {
            section.classList.add('active');
        }
    }
    collapseSection(sectionName) {
        const section = document.querySelector(`[data-section="${sectionName}"]`);
        if (section) {
            section.classList.remove('active');
        }
    }
}
//# sourceMappingURL=accordionController.js.map