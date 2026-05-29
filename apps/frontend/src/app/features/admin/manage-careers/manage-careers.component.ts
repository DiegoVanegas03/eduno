import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminCareersService } from '@core/services/admin-careers/admin-careers.service';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { ICareer, IStudyPlan } from '@eduno/shared';
import { ACADEMIC_AREAS, getAcademicAreaName } from '@eduno/shared';

@Component({
  selector: 'app-manage-careers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manage-careers.component.html',
  styleUrl: './manage-careers.component.css',
})
export class ManageCareersComponent implements OnInit {
  adminCareersService = inject(AdminCareersService);

  // Core Data Signals
  careers = signal<ICareer[]>([]);
  studyPlans = signal<IStudyPlan[]>([]);
  isLoadingCareers = signal<boolean>(true);
  isLoadingPlans = signal<boolean>(false);
  isScraping = signal<boolean>(false);

  // Selection & Details Signals
  selectedCareer = signal<ICareer | null>(null);

  // Search & Filter Signals
  searchQuery = signal<string>('');
  selectedAreaFilter = signal<string>('Todos');

  // Academic Area definitions
  academicAreas = ACADEMIC_AREAS;
  areaCodes = Object.keys(ACADEMIC_AREAS).map(Number);

  getAreaName(code?: number): string {
    if (code === undefined || code === null) return 'No Asignada';
    return getAcademicAreaName(code);
  }

  // Modals Visibility
  isCareerModalOpen = signal(false);
  isCareerEditMode = signal(false);
  isPlanModalOpen = signal(false);

  // Career Form Fields
  careerFormId = '';
  careerFormName = '';
  careerFormAreaCode: number | undefined = undefined;
  careerFormSemesters = 9;
  careerFormIsActive = true;

  // StudyPlan Form Fields
  planFormName = '';
  planFormUrl = '';
  planFormIsLatest = false;

  ngOnInit() {
    this.loadCareers();
  }

  loadCareers() {
    this.isLoadingCareers.set(true);
    this.adminCareersService.getCareers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.careers.set(res.data);
        } else {
          toast.error('Error al cargar carreras');
        }
        this.isLoadingCareers.set(false);
      },
      error: (err) => {
        console.error(err);
        toast.error(err.error?.error || 'Error de conexión al cargar carreras');
        this.isLoadingCareers.set(false);
      },
    });
  }

  loadPlansForCareer(careerId: string) {
    this.isLoadingPlans.set(true);
    this.adminCareersService.getStudyPlans({ career: careerId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.studyPlans.set(res.data);
        } else {
          toast.error('Error al cargar planes de estudio');
        }
        this.isLoadingPlans.set(false);
      },
      error: (err) => {
        console.error(err);
        toast.error(err.error?.error || 'Error al cargar planes de estudio');
        this.isLoadingPlans.set(false);
      },
    });
  }

  // Computed signals
  filteredCareers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const areaFilter = this.selectedAreaFilter();

    return this.careers().filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(query);
      let matchesArea = true;
      if (areaFilter !== 'Todos') {
        matchesArea = c.areaCode === Number(areaFilter);
      }
      return matchesSearch && matchesArea;
    });
  });

  // KPIs
  totalCareers = computed(() => this.careers().length);
  activeCareersCount = computed(() => this.careers().filter((c) => c.isActive).length);
  inactiveCareersCount = computed(() => this.careers().filter((c) => !c.isActive).length);
  totalStudyPlansCount = computed(() => this.studyPlans().length);

  activeCareersRatio = computed(() => {
    const total = this.totalCareers();
    return total > 0 ? Math.round((this.activeCareersCount() / total) * 100) : 0;
  });

  inactiveCareersRatio = computed(() => {
    const total = this.totalCareers();
    return total > 0 ? Math.round((this.inactiveCareersCount() / total) * 100) : 0;
  });

  // Selection Handler
  selectCareer(career: ICareer) {
    this.selectedCareer.set(career);
    this.loadPlansForCareer(career.id);
  }

  // Career Modals Trigger
  openCreateCareerModal() {
    this.isCareerEditMode.set(false);
    this.careerFormName = '';
    this.careerFormAreaCode = undefined;
    this.careerFormSemesters = 9;
    this.careerFormIsActive = true;
    this.isCareerModalOpen.set(true);
  }

  openEditCareerModal(career: ICareer, event: MouseEvent) {
    event.stopPropagation(); // Avoid selecting career in row
    this.isCareerEditMode.set(true);
    this.careerFormId = career.id;
    this.careerFormName = career.name;
    this.careerFormAreaCode = career.areaCode;
    this.careerFormSemesters = career.semesters;
    this.careerFormIsActive = career.isActive;
    this.isCareerModalOpen.set(true);
  }

  saveCareer() {
    if (!this.careerFormName.trim()) {
      toast.error('El nombre de la carrera es obligatorio');
      return;
    }

    const payload = {
      name: this.careerFormName,
      areaCode:
        this.careerFormAreaCode !== undefined && this.careerFormAreaCode !== null
          ? Number(this.careerFormAreaCode)
          : undefined,
      semesters: Number(this.careerFormSemesters),
      isActive: this.careerFormIsActive,
    };

    if (this.isCareerEditMode()) {
      toast.promise(
        firstValueFrom(this.adminCareersService.updateCareer(this.careerFormId, payload)),
        {
          loading: 'Actualizando carrera...',
          success: (res: any) => {
            this.careers.update((list) =>
              list.map((c) => (c.id === this.careerFormId ? res.data : c)),
            );
            if (this.selectedCareer()?.id === this.careerFormId) {
              this.selectedCareer.set(res.data);
            }
            this.isCareerModalOpen.set(false);
            return 'Carrera actualizada correctamente';
          },
          error: (err: any) => err.error?.error || 'No se pudo actualizar la carrera',
        },
      );
    } else {
      toast.promise(firstValueFrom(this.adminCareersService.createCareer(payload)), {
        loading: 'Creando carrera...',
        success: (res: any) => {
          this.careers.update((list) => [...list, res.data]);
          this.isCareerModalOpen.set(false);
          return 'Carrera creada correctamente';
        },
        error: (err: any) => err.error?.error || 'No se pudo crear la carrera',
      });
    }
  }

  toggleCareerStatus(career: ICareer, event: MouseEvent) {
    event.stopPropagation();
    const updatedStatus = !career.isActive;

    toast.promise(
      firstValueFrom(this.adminCareersService.updateCareer(career.id, { isActive: updatedStatus })),
      {
        loading: 'Cambiando estado de carrera...',
        success: (res: any) => {
          this.careers.update((list) => list.map((c) => (c.id === career.id ? res.data : c)));
          if (this.selectedCareer()?.id === career.id) {
            this.selectedCareer.set(res.data);
          }
          return updatedStatus
            ? 'Carrera activada correctamente'
            : 'Carrera desactivada correctamente';
        },
        error: (err: any) => err.error?.error || 'Error al cambiar estado',
      },
    );
  }

  // Study Plan Modals Trigger
  openCreatePlanModal() {
    this.planFormName = '';
    this.planFormUrl = '';
    this.planFormIsLatest = false;
    this.isPlanModalOpen.set(true);
  }

  createStudyPlan() {
    const career = this.selectedCareer();
    if (!career) return;

    if (!this.planFormName.trim()) {
      toast.error('El nombre del plan de estudio es obligatorio');
      return;
    }

    const payload = {
      name: this.planFormName,
      career: career.id,
      url: this.planFormUrl || undefined,
      isActive: true,
      isLatest: this.planFormIsLatest,
    };

    toast.promise(firstValueFrom(this.adminCareersService.createStudyPlan(payload)), {
      loading: 'Creando plan de estudio...',
      success: (res: any) => {
        this.loadPlansForCareer(career.id);
        this.isPlanModalOpen.set(false);
        return 'Plan de estudio creado correctamente';
      },
      error: (err: any) => err.error?.error || 'No se pudo crear el plan de estudio',
    });
  }

  togglePlanLatest(plan: IStudyPlan) {
    toast.promise(
      firstValueFrom(this.adminCareersService.updateStudyPlan(plan.id, { isLatest: true })),
      {
        loading: 'Marcando como plan actualizado...',
        success: () => {
          const career = this.selectedCareer();
          if (career) this.loadPlansForCareer(career.id);
          return 'Plan de estudios marcado como el oficial actualizado';
        },
        error: (err: any) => err.error?.error || 'Error al actualizar el plan oficial',
      },
    );
  }


  triggerScrape(plan: IStudyPlan) {
    if (!plan.url) {
      toast.error('Este plan de estudios no tiene una URL configurada para realizar el scrape');
      return;
    }

    this.isScraping.set(true);
    toast.promise(firstValueFrom(this.adminCareersService.scrapeStudyPlan(plan.id)), {
      loading: 'Ejecutando scraper automatizado Playwright (esto puede demorar unos segundos)...',
      success: (res: any) => {
        this.isScraping.set(false);
        const career = this.selectedCareer();
        if (career) this.loadPlansForCareer(career.id);
        return 'Scraping completado y materias guardadas correctamente';
      },
      error: (err: any) => {
        this.isScraping.set(false);
        return err.error?.error || 'Error de ejecución en el Scraper';
      },
    });
  }
}
