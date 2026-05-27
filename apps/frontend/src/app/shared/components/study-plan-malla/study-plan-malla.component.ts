import { Component, signal, computed, HostListener, AfterViewChecked, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IStudyPlan, ICoursePlan, ICareer } from '@eduno/shared';

interface DependencyLine {
  path: string;
  prereqCode: string;
  depCode: string;
  isHovered: boolean;
  isPinned: boolean;
  color: string;
}

@Component({
  selector: 'app-study-plan-malla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './study-plan-malla.component.html',
  styleUrl: './study-plan-malla.component.css'
})
export class StudyPlanMallaComponent implements AfterViewChecked {
  // Signal inputs (Angular 17+)
  studyPlan = input<IStudyPlan | null>(null);
  career = input<ICareer | null>(null);
  isLoading = input<boolean>(false);

  // Interaction signals
  hoveredCourse = signal<string | null>(null);
  pinnedCourses = signal<Set<string>>(new Set<string>());
  activeLines = signal<DependencyLine[]>([]);

  private domChanged = false;

  constructor() {
    // Recalculate lines automatically when input studyPlan changes
    effect(() => {
      if (this.studyPlan()) {
        this.domChanged = true;
      }
    });
  }

  ngAfterViewChecked() {
    if (this.domChanged) {
      this.domChanged = false;
      setTimeout(() => this.calculateLines(), 50);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateLines();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.calculateLines();
  }

  // Course classification colors for borders and type badges
  getCourseTypeInfo(type: string): { bg: string; text: string; border: string; badgeBg: string; name: string } {
    const cleanType = (type || '').trim().toUpperCase();
    switch (cleanType) {
      case 'CB':
        return {
          bg: 'bg-purple-50/75',
          text: 'text-purple-700',
          border: 'border-purple-200 hover:border-purple-500',
          badgeBg: 'bg-purple-100 border-purple-200 text-purple-700',
          name: 'Ciencias Básicas'
        };
      case 'CI':
        return {
          bg: 'bg-blue-50/75',
          text: 'text-blue-700',
          border: 'border-blue-200 hover:border-blue-500',
          badgeBg: 'bg-blue-100 border-blue-200 text-blue-700',
          name: 'Ciencias de la Ingeniería'
        };
      case 'IA':
        return {
          bg: 'bg-red-50/75',
          text: 'text-red-700',
          border: 'border-red-200 hover:border-red-500',
          badgeBg: 'bg-red-100 border-red-200 text-red-700',
          name: 'Ingeniería Aplicada'
        };
      case 'CS':
        return {
          bg: 'bg-amber-50/75',
          text: 'text-amber-800',
          border: 'border-amber-200 hover:border-amber-500',
          badgeBg: 'bg-amber-100 border-amber-200 text-amber-800',
          name: 'Ciencias Sociales y Hum.'
        };
      case 'CC':
        return {
          bg: 'bg-gray-50/75',
          text: 'text-gray-600',
          border: 'border-gray-200 hover:border-gray-500',
          badgeBg: 'bg-gray-100 border-gray-200 text-gray-700',
          name: 'Cursos Complementarios'
        };
      default:
        return {
          bg: 'bg-gray-50/50',
          text: 'text-gray-550',
          border: 'border-gray-200 hover:border-gray-400',
          badgeBg: 'bg-gray-100 border-gray-200 text-gray-600',
          name: type || 'Carrera / Otros'
        };
    }
  }

  isCourseHighlighted(code: string): boolean {
    const hovered = this.hoveredCourse();
    if (!hovered) {
      const pinned = this.pinnedCourses();
      if (pinned.size === 0) return false;

      if (pinned.has(code)) return true;
      
      const structure = this.studyPlan()?.structure;
      if (!structure) return false;

      let match = false;
      pinned.forEach(pinnedCode => {
        const pinnedCourse = this.findCourseByCode(pinnedCode);
        if (pinnedCourse?.prerequisites.includes(code)) {
          match = true;
        }
        const thisCourse = this.findCourseByCode(code);
        if (thisCourse?.prerequisites.includes(pinnedCode)) {
          match = true;
        }
      });
      return match;
    }

    if (hovered === code) return true;

    const hoveredCourseObj = this.findCourseByCode(hovered);
    if (hoveredCourseObj?.prerequisites.includes(code)) return true;

    const thisCourseObj = this.findCourseByCode(code);
    if (thisCourseObj?.prerequisites.includes(hovered)) return true;

    return false;
  }

  isPrerequisiteOfActive(code: string): boolean {
    const activeCode = this.hoveredCourse();
    if (activeCode) {
      const activeObj = this.findCourseByCode(activeCode);
      return !!activeObj?.prerequisites.includes(code);
    }
    
    let isPrereq = false;
    this.pinnedCourses().forEach(pinnedCode => {
      const activeObj = this.findCourseByCode(pinnedCode);
      if (activeObj?.prerequisites.includes(code)) {
        isPrereq = true;
      }
    });
    return isPrereq;
  }

  isDependentOfActive(code: string): boolean {
    const activeCode = this.hoveredCourse();
    if (activeCode) {
      const thisObj = this.findCourseByCode(code);
      return !!thisObj?.prerequisites.includes(activeCode);
    }

    let isDep = false;
    this.pinnedCourses().forEach(pinnedCode => {
      const thisObj = this.findCourseByCode(code);
      if (thisObj?.prerequisites.includes(pinnedCode)) {
        isDep = true;
      }
    });
    return isDep;
  }

  private findCourseByCode(code: string): ICoursePlan | null {
    const structure = this.studyPlan()?.structure;
    if (!structure) return null;

    for (const sem of structure.semesters) {
      const course = sem.courses.find(c => c.code === code);
      if (course) return course;
    }

    for (const area of structure.emphasisAreas) {
      const course = area.courses.find(c => c.code === code);
      if (course) return course;
    }

    return null;
  }

  onCourseMouseEnter(code: string) {
    this.hoveredCourse.set(code);
    this.calculateLines();
  }

  onCourseMouseLeave() {
    this.hoveredCourse.set(null);
    this.calculateLines();
  }

  togglePinCourse(code: string) {
    const current = new Set(this.pinnedCourses());
    if (current.has(code)) {
      current.delete(code);
    } else {
      current.add(code);
    }
    this.pinnedCourses.set(current);
    this.calculateLines();
  }

  clearPins() {
    this.pinnedCourses.set(new Set<string>());
    this.calculateLines();
  }

  calculateLines() {
    const boardEl = document.getElementById('curriculum-board');
    const structure = this.studyPlan()?.structure;

    if (!boardEl || !structure) {
      this.activeLines.set([]);
      return;
    }

    const boardRect = boardEl.getBoundingClientRect();
    const lines: DependencyLine[] = [];
    const hovered = this.hoveredCourse();
    const pinned = this.pinnedCourses();

    const activeSet = new Set<string>();
    if (hovered) activeSet.add(hovered);
    pinned.forEach(c => activeSet.add(c));

    if (activeSet.size === 0) {
      this.activeLines.set([]);
      return;
    }

    const allCourses: ICoursePlan[] = [];
    structure.semesters.forEach(s => allCourses.push(...s.courses));
    structure.emphasisAreas.forEach(a => allCourses.push(...a.courses));

    activeSet.forEach(activeCode => {
      const activeCourse = this.findCourseByCode(activeCode);
      if (!activeCourse) return;

      const isActiveHovered = hovered === activeCode;
      const isActivePinned = pinned.has(activeCode);

      activeCourse.prerequisites.forEach(prereqCode => {
        const prereqCourse = this.findCourseByCode(prereqCode);
        if (!prereqCourse) return;

        const path = this.getPathBetweenCourses(prereqCode, activeCode, boardRect, boardEl);
        if (path) {
          lines.push({
            path,
            prereqCode,
            depCode: activeCode,
            isHovered: isActiveHovered,
            isPinned: isActivePinned,
            color: 'stroke-blue-500 shadow-md'
          });
        }
      });

      allCourses.forEach(otherCourse => {
        if (otherCourse.prerequisites.includes(activeCode)) {
          const path = this.getPathBetweenCourses(activeCode, otherCourse.code, boardRect, boardEl);
          if (path) {
            lines.push({
              path,
              prereqCode: activeCode,
              depCode: otherCourse.code,
              isHovered: isActiveHovered,
              isPinned: isActivePinned,
              color: 'stroke-teal-500 shadow-md'
            });
          }
        }
      });
    });

    this.activeLines.set(lines);
  }

  private getPathBetweenCourses(
    fromCode: string,
    toCode: string,
    boardRect: DOMRect,
    boardEl: HTMLElement
  ): string | null {
    const fromEl = document.getElementById(`course-${fromCode}`);
    const toEl = document.getElementById(`course-${toCode}`);

    if (!fromEl || !toEl) return null;

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const scrollLeft = boardEl.scrollLeft;
    const scrollTop = boardEl.scrollTop;

    const x1 = fromRect.right - boardRect.left + scrollLeft;
    const y1 = fromRect.top - boardRect.top + scrollTop + fromRect.height / 2;

    const x2 = toRect.left - boardRect.left + scrollLeft;
    const y2 = toRect.top - boardRect.top + scrollTop + toRect.height / 2;

    const ctrlDist = Math.max(40, Math.abs(x2 - x1) * 0.5);

    return `M ${x1} ${y1} C ${x1 + ctrlDist} ${y1}, ${x2 - ctrlDist} ${y2}, ${x2} ${y2}`;
  }

  getTotalCredits = computed(() => {
    const structure = this.studyPlan()?.structure;
    if (!structure) return 0;
    let total = 0;
    structure.semesters.forEach(s => {
      s.courses.forEach(c => {
        const credits = parseFloat(c.credits || '0');
        if (!isNaN(credits)) total += credits;
      });
    });
    return total;
  });

  getTotalCourses = computed(() => {
    const structure = this.studyPlan()?.structure;
    if (!structure) return 0;
    let total = 0;
    structure.semesters.forEach(s => {
      total += s.courses.length;
    });
    return total;
  });
}
