/**
 * 摺疊面板控制器
 */
export class AccordionController {
  private sections: NodeListOf<Element>;

  constructor() {
    this.sections = document.querySelectorAll('.accordion-section');
    this.init();
  }

  private init(): void {
    // 綁定點擊事件
    this.sections.forEach(section => {
      const header = section.querySelector('.accordion-header');
      if (header) {
        header.addEventListener('click', () => {
          this.toggleSection(section);
        });
      }
    });

    this.bindMenuToggle();

    // 所有區塊初始狀態為收合
  }

  private bindMenuToggle(): void {
    const toggle = document.getElementById('menuToggle') as HTMLButtonElement | null;
    const container = document.querySelector('.container');

    if (!toggle || !container) return;

    const label = toggle.querySelector('.menu-toggle-label');

    const syncLabel = (): void => {
      const isCollapsed = container.classList.contains('controls-collapsed');
      const actionText = isCollapsed ? '開啟設定' : '收合設定';
      toggle.setAttribute('aria-expanded', String(!isCollapsed));
      toggle.setAttribute('aria-label', actionText);
      toggle.title = actionText;
      if (label) label.textContent = actionText;
    };

    toggle.addEventListener('click', () => {
      container.classList.toggle('controls-collapsed');
      syncLabel();
    });

    syncLabel();
  }

  private toggleSection(targetSection: Element): void {
    const isActive = targetSection.classList.contains('active');
    
    if (isActive) {
      // 收合當前區塊
      targetSection.classList.remove('active');
    } else {
      // 展開目標區塊
      targetSection.classList.add('active');
    }
  }

  // 移除預設展開邏輯，所有區塊初始皆為收合狀態

  // 程式化控制方法
  public expandSection(sectionName: string): void {
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) {
      section.classList.add('active');
    }
  }

  public collapseSection(sectionName: string): void {
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) {
      section.classList.remove('active');
    }
  }
}
