import { Component, signal, computed, inject, effect, OnInit } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSchedulesService } from '@core/services/admin-schedules/admin-schedules.service';
import { AdminCareersService } from '@core/services/admin-careers/admin-careers.service';
import { toast } from 'ngx-sonner';
import { firstValueFrom, debounceTime, distinctUntilChanged, combineLatest } from 'rxjs';
import { ISchedule, ICareer, IStudyPlan, getAcademicAreaName, ACADEMIC_AREAS } from '@eduno/shared';

@Component({
  selector: 'app-manage-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-schedules.component.html',
  styleUrl: './manage-schedules.component.css',
})
export class ManageSchedulesComponent implements OnInit {
  private adminSchedulesService = inject(AdminSchedulesService);
  private adminCareersService = inject(AdminCareersService);

  // Lists & State Signals
  schedules = signal<ISchedule[]>([]);
  careers = signal<ICareer[]>([]);
  periods = signal<string[]>([]);
  isLoading = signal<boolean>(true);
  isSyncing = signal<boolean>(false);

  // Filters Toggles
  selectedPeriodFilter = signal<string>('');
  selectedAreaFilter = signal<string>(''); // Matches area code as string
  searchProfessor = signal<string>('');
  searchCourseName = signal<string>('');

  // Pagination State Signals
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalItems = signal<number>(0);
  totalPages = signal<number>(0);

  // Modals Visibility
  isCreateModalOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);
  isSyncModalOpen = signal<boolean>(false);

  // Selected schedule for editing/details
  selectedSchedule = signal<ISchedule | null>(null);

  // Form Fields (Common)
  formCareerId = '';
  formCourseCode = '';
  formGroup = 1;
  formType = 'T';
  formTimeBlock = '07:00-09:00';
  formDays: boolean[] = [false, false, false, false, false, false]; // Mon to Sat
  formProfessor = '';
  formBuilding = 'I';
  formClassroom = '';
  formOccupancy = 0;
  formPeriod = '';

  // Form helper: courses in the active plan of the selected career
  formCourses = signal<{ code: string; name: string }[]>([]);
  isLoadingCourses = signal<boolean>(false);

  // Sync Form Fields
  syncAreaCode = 2;
  syncPeriod = '2026-I';

  // Get all available academic areas
  availableAreas = computed<{ code: number; name: string }[]>(() => {
    return Object.entries(ACADEMIC_AREAS).map(([code, name]) => ({
      code: Number(code),
      name: name as string,
    }));
  });

  // Area Code computation for queries
  selectedAreaCodeFilter = computed<number | undefined>(() => {
    const areaCodeStr = this.selectedAreaFilter();
    if (!areaCodeStr) return undefined;
    return Number(areaCodeStr);
  });

  // Dynamic sliding window of page numbers with ellipsis (...) - highly compact
  paginationItems = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    // If total pages is small (e.g., <= 5), just show all page numbers
    if (total <= 5) {
      const pages = [];
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    const items: (number | string)[] = [];

    // If current page is near the start
    if (current <= 3) {
      items.push(1, 2, 3, 4, '...', total);
    }
    // If current page is near the end
    else if (current >= total - 2) {
      items.push(1, '...', total - 3, total - 2, total - 1, total);
    }
    // If current page is in the middle
    else {
      items.push(1, '...', current - 1, current, current + 1, '...', total);
    }

    return items;
  });

  constructor() {
    // Reset page to 1 when period or areaCode filters change
    effect(() => {
      this.selectedPeriodFilter();
      this.selectedAreaFilter();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });

    // Combine filter signals to reactively load schedules with debounce on search inputs
    const period$ = toObservable(this.selectedPeriodFilter);
    const areaCode$ = toObservable(this.selectedAreaCodeFilter);
    const page$ = toObservable(this.currentPage);
    const limit$ = toObservable(this.itemsPerPage);

    const debouncedCourseName$ = toObservable(this.searchCourseName).pipe(
      debounceTime(350),
      distinctUntilChanged()
    );
    const debouncedProfessor$ = toObservable(this.searchProfessor).pipe(
      debounceTime(350),
      distinctUntilChanged()
    );

    combineLatest([
      period$,
      areaCode$,
      debouncedCourseName$,
      debouncedProfessor$,
      page$,
      limit$
    ]).subscribe(([period, areaCode, courseName, professor, page, limit]) => {
      this.loadSchedulesFromBackend({ period, areaCode, courseName, professor, page, limit });
    });
  }

  ngOnInit() {
    this.loadCareers();
    this.loadPeriods();
  }

  loadCareers() {
    this.adminCareersService.getCareers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.careers.set(res.data);
        }
      },
      error: (err) => console.error('Error al cargar carreras:', err),
    });
  }

  loadPeriods() {
    this.adminSchedulesService.getPeriods().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.periods.set(res.data);
          // Auto-select latest period if empty
          if (res.data.length > 0 && !this.selectedPeriodFilter()) {
            this.selectedPeriodFilter.set(res.data[0]);
          }
        }
      },
      error: (err) => console.error('Error al cargar periodos:', err),
    });
  }

  loadSchedulesFromBackend(filters: {
    period?: string;
    areaCode?: number;
    courseName?: string;
    professor?: string;
    page?: number;
    limit?: number;
  }) {
    if (filters.areaCode === undefined) {
      this.schedules.set([]);
      this.totalItems.set(0);
      this.totalPages.set(0);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.adminSchedulesService.getSchedules(filters as any).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.schedules.set(res.data);
          if (res.pagination) {
            this.totalItems.set(res.pagination.totalItems);
            this.totalPages.set(res.pagination.totalPages);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        toast.error(err.error?.error || 'Error al obtener horarios del servidor');
        this.isLoading.set(false);
      },
    });
  }

  // Load courses from the selected career's active study plan
  onFormCareerChange(careerId: string) {
    if (!careerId) {
      this.formCourses.set([]);
      this.formCourseCode = '';
      return;
    }

    this.isLoadingCourses.set(true);
    this.adminCareersService.getStudyPlans({ career: careerId, isActive: true }).subscribe({
      next: (res) => {
        const coursesList: { code: string; name: string }[] = [];
        if (res.success && res.data && res.data.length > 0) {
          const activePlan = res.data.find((p) => p.isLatest) || res.data[0];
          if (activePlan?.structure) {
            // Traverse structure semesters
            if (Array.isArray(activePlan.structure.semesters)) {
              for (const sem of activePlan.structure.semesters) {
                if (Array.isArray(sem.courses)) {
                  for (const course of sem.courses) {
                    if (course && course.code && course.name) {
                      coursesList.push({ code: course.code, name: course.name });
                    }
                  }
                }
              }
            }
            // Traverse structure emphasis areas
            if (Array.isArray(activePlan.structure.emphasisAreas)) {
              for (const area of activePlan.structure.emphasisAreas) {
                if (Array.isArray(area.courses)) {
                  for (const course of area.courses) {
                    if (course && course.code && course.name) {
                      coursesList.push({ code: course.code, name: course.name });
                    }
                  }
                }
              }
            }
          }
        }

        this.formCourses.set(coursesList);
        this.isLoadingCourses.set(false);

        // Auto-select first course if current selected is invalid
        if (coursesList.length > 0) {
          const exists = coursesList.some((c) => c.code === this.formCourseCode);
          if (!exists) this.formCourseCode = coursesList[0].code;
        } else {
          this.formCourseCode = '';
          toast.warning('Esta carrera no posee un plan de estudios oficial configurado.');
        }
      },
      error: (err) => {
        console.error(err);
        this.formCourses.set([]);
        this.formCourseCode = '';
        this.isLoadingCourses.set(false);
      },
    });
  }

  // Toggles active state for a day in the formDays array
  toggleDay(index: number) {
    this.formDays[index] = !this.formDays[index];
  }

  openCreateModal() {
    const selectedArea = this.selectedAreaCodeFilter();
    const careerInArea = this.careers().find((c) => c.areaCode === selectedArea);
    this.formCareerId = careerInArea
      ? careerInArea.id
      : this.careers().length > 0
        ? this.careers()[0].id
        : '';
    this.formCourseCode = '';
    this.formGroup = 1;
    this.formType = 'T';
    this.formTimeBlock = '07:00-09:00';
    this.formDays = [false, false, false, false, false, false];
    this.formProfessor = '';
    this.formBuilding = 'I';
    this.formClassroom = '';
    this.formOccupancy = 0;
    this.formPeriod =
      this.selectedPeriodFilter() || (this.periods().length > 0 ? this.periods()[0] : '2026-I');

    // Populate course list
    this.onFormCareerChange(this.formCareerId);
    this.isCreateModalOpen.set(true);
  }

  createSchedule() {
    if (!this.formCourseCode || !this.formProfessor.trim() || !this.formClassroom.trim()) {
      toast.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    const career = this.careers().find((c) => c.id === this.formCareerId);
    if (!career) return;

    if (career.areaCode === undefined) {
      toast.error(
        'La carrera seleccionada no tiene un código de área válido para registrar horarios.',
      );
      return;
    }

    // Convert formDays array to binary numbers array
    const days = this.formDays.map((val) => (val ? 1 : 0));

    const payload = {
      courseCode: this.formCourseCode,
      group: Number(this.formGroup),
      type: this.formType,
      timeBlock: this.formTimeBlock,
      days,
      professor: this.formProfessor.trim(),
      building: this.formBuilding.trim(),
      classroom: this.formClassroom.trim(),
      occupancy: Number(this.formOccupancy),
      areaCode: career.areaCode,
      period: this.formPeriod,
    };

    toast.promise(firstValueFrom(this.adminSchedulesService.createSchedule(payload)), {
      loading: 'Guardando horario en la base de datos...',
      success: (res: any) => {
        if (res.success && res.data) {
          // Re-load schedules to apply filters and dynamic name resolution
          const period = this.selectedPeriodFilter();
          const areaCode = this.selectedAreaCodeFilter();
          this.loadSchedulesFromBackend({ period, areaCode });
          this.isCreateModalOpen.set(false);
          return 'Horario creado exitosamente';
        }
        throw new Error(res.message || 'Error al guardar');
      },
      error: (err: any) => err?.message || err?.error?.error || 'No se pudo crear el horario.',
    });
  }

  openEditModal(schedule: ISchedule) {
    this.selectedSchedule.set(schedule);

    // Find career by areaCode matching the schedule
    const career = this.careers().find((c) => c.areaCode === schedule.areaCode);
    this.formCareerId = career ? career.id : '';

    this.formCourseCode = schedule.courseCode;
    this.formGroup = schedule.group;
    this.formType = schedule.type;
    this.formTimeBlock = schedule.timeBlock;

    // Set formDays from binary array
    this.formDays = schedule.days.map((val) => val === 1);

    this.formProfessor = schedule.professor;
    this.formBuilding = schedule.building;
    this.formClassroom = schedule.classroom;
    this.formOccupancy = schedule.occupancy;
    this.formPeriod = schedule.period;

    // Populate course list
    if (this.formCareerId) {
      this.onFormCareerChange(this.formCareerId);
    }

    this.isEditModalOpen.set(true);
  }

  saveScheduleEdit() {
    const currentId = this.selectedSchedule()?.id;
    if (!currentId) return;

    if (!this.formCourseCode || !this.formProfessor.trim() || !this.formClassroom.trim()) {
      toast.error('Por favor, completa todos los campos requeridos.');
      return;
    }

    const career = this.careers().find((c) => c.id === this.formCareerId);
    if (!career) return;

    if (career.areaCode === undefined) {
      toast.error('La carrera seleccionada no tiene un código de área válido.');
      return;
    }

    const days = this.formDays.map((val) => (val ? 1 : 0));

    const payload = {
      courseCode: this.formCourseCode,
      group: Number(this.formGroup),
      type: this.formType,
      timeBlock: this.formTimeBlock,
      days,
      professor: this.formProfessor.trim(),
      building: this.formBuilding.trim(),
      classroom: this.formClassroom.trim(),
      occupancy: Number(this.formOccupancy),
      areaCode: career.areaCode,
      period: this.formPeriod,
    };

    toast.promise(firstValueFrom(this.adminSchedulesService.updateSchedule(currentId, payload)), {
      loading: 'Actualizando datos del horario...',
      success: (res: any) => {
        if (res.success && res.data) {
          const period = this.selectedPeriodFilter();
          const areaCode = this.selectedAreaCodeFilter();
          this.loadSchedulesFromBackend({ period, areaCode });
          this.isEditModalOpen.set(false);
          return 'Horario actualizado correctamente';
        }
        throw new Error(res.message || 'Error al actualizar');
      },
      error: (err: any) => err?.message || err?.error?.error || 'No se pudo actualizar el horario.',
    });
  }

  deleteSchedule(schedule: ISchedule) {
    if (!schedule.id) return;

    toast.promise(firstValueFrom(this.adminSchedulesService.deleteSchedule(schedule.id)), {
      loading: 'Eliminando horario permanentemente...',
      success: () => {
        this.schedules.update((list) => list.filter((s) => s.id !== schedule.id));
        return 'Horario eliminado correctamente';
      },
      error: (err: any) => err?.error?.error || 'Error al eliminar el horario.',
    });
  }

  openSyncModal() {
    const selectedArea = this.selectedAreaCodeFilter();
    this.syncAreaCode = selectedArea !== undefined ? selectedArea : 2;
    this.syncPeriod =
      this.selectedPeriodFilter() || (this.periods().length > 0 ? this.periods()[0] : '2026-I');
    this.isSyncModalOpen.set(true);
  }

  triggerScrapeSync() {
    if (this.syncAreaCode === 8) {
      toast.error(
        'El Departamento Universitario de Inglés no está disponible para sincronizar aún.',
      );
      return;
    }

    this.isSyncing.set(true);
    toast.promise(
      firstValueFrom(
        this.adminSchedulesService.scrapeSchedules(this.syncPeriod, this.syncAreaCode),
      ),
      {
        loading: 'Ejecutando Scraper automatizado Playwright (puede demorar unos segundos)...',
        success: (res: any) => {
          this.isSyncing.set(false);
          this.isSyncModalOpen.set(false);
          // Refresh lists and filter
          this.selectedPeriodFilter.set(this.syncPeriod);
          this.selectedAreaFilter.set(String(this.syncAreaCode));
          this.loadPeriods();
          return `Sincronización completada. Se importaron ${res.data.totalInserted} horarios.`;
        },
        error: (err: any) => {
          this.isSyncing.set(false);
          return err.error?.error || 'Error durante la ejecución del scraper.';
        },
      },
    );
  }

  goToPage(page: number | string) {
    const pageNum = Number(page);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.totalPages()) {
      this.currentPage.set(pageNum);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }
}
