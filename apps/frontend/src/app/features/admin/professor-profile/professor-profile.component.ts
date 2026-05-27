import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfessorAdminService } from '@core/services/professor-admin/professor-admin.service';
import { IProfessor, ISchedule } from '@eduno/shared';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-professor-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './professor-profile.component.html',
})
export class ProfessorProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private professorAdminService = inject(ProfessorAdminService);

  professorId = signal<string>('');
  professorData = signal<IProfessor | null>(null);
  schedules = signal<ISchedule[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // COMPUTED REACTIVE STATISTICS FOR THE ACADEMIC DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  
  // Total unique subjects
  uniqueSubjectsCount = computed(() => {
    const list = this.schedules();
    const codes = new Set(list.map((s) => s.courseCode).filter(Boolean));
    return codes.size;
  });

  // Total unique groups taught
  totalGroupsCount = computed(() => {
    const list = this.schedules();
    const combinations = new Set(list.map((s) => `${s.courseCode}-${s.group}`));
    return combinations.size;
  });

  // List of unique classrooms
  uniqueClassrooms = computed(() => {
    const list = this.schedules();
    const classrooms = new Set(
      list.map((s) => {
        const classroom = s.classroom?.trim();
        const building = s.building?.trim();
        if (classroom && building) return `${building} - ${classroom}`;
        return classroom || building || 'Aula por asignar';
      })
    );
    return Array.from(classrooms);
  });

  // Total sessions per week (blocks of active hours)
  totalWeeklySessions = computed(() => {
    return this.schedules().length;
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') || '';
      this.professorId.set(id);
      if (id) {
        this.fetchProfessorDetail(id);
      } else {
        this.isLoading.set(false);
        this.errorMessage.set('Identificador de profesor no válido.');
      }
    });
  }

  fetchProfessorDetail(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.professorAdminService.getProfessorById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const { schedules, ...profData } = res.data;
          this.professorData.set(profData);
          this.schedules.set(schedules || []);
        } else {
          this.errorMessage.set(res.message || 'No se pudo cargar el expediente del docente.');
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage.set(
          err.error?.error || 'Error de comunicación con el servidor al cargar perfil docente.',
        );
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Helper to format active days as nice inline labels
   */
  getDayInitials(daysArray: number[]): { name: string; active: boolean }[] {
    const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return shortNames.map((name, index) => ({
      name,
      active: daysArray[index] === 1,
    }));
  }

  /**
   * Copy specific text to clipboard with feedback
   */
  copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.info(`${label} copiado al portapapeles.`);
    });
  }
}
