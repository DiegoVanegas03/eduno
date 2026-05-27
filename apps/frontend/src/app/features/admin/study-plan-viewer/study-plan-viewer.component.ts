import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminCareersService } from '@core/services/admin-careers/admin-careers.service';
import { IStudyPlan, ICareer } from '@eduno/shared';
import { StudyPlanMallaComponent } from '@shared/components/study-plan-malla/study-plan-malla.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-study-plan-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, StudyPlanMallaComponent],
  templateUrl: './study-plan-viewer.component.html',
  styleUrl: './study-plan-viewer.component.css'
})
export class StudyPlanViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminCareersService = inject(AdminCareersService);

  // Data signals
  studyPlan = signal<IStudyPlan | null>(null);
  career = signal<ICareer | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchStudyPlan(id);
      } else {
        this.isLoading.set(false);
        toast.error('ID de plan de estudios no válido');
      }
    });
  }

  private async fetchStudyPlan(id: string) {
    this.isLoading.set(true);
    try {
      this.adminCareersService.getStudyPlanById(id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.studyPlan.set(res.data);

            // Fetch the career name
            const careerId = res.data.career;
            if (careerId) {
              this.adminCareersService.getCareerById(careerId).subscribe({
                next: (careerRes) => {
                  if (careerRes.success) {
                    this.career.set(careerRes.data || null);
                  }
                }
              });
            }
          } else {
            toast.error('No se pudo cargar el plan de estudios');
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          toast.error('Error al cargar el plan de estudios');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error(error);
      toast.error('Error inesperado al cargar los datos');
      this.isLoading.set(false);
    }
  }
}
