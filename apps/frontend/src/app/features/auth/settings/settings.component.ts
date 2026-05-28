import { Component, signal, computed, HostListener, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EditableFieldComponent } from '@shared/components/editable-field/editable-field.component';
import {
  DownloadStatusComponent,
  DownloadStatusState,
} from '@core/components/download-status/download-status.component';
import { MyAccountService, ProfileData } from '@core/services/auth/my-account.service';
import { ModalService } from '@shared/services/modal.service';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { USER_ROLES, ICareer } from '@eduno/shared';
import { AuthService } from '@core/services/auth/auth.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { AdminCareersService } from '@core/services/admin-careers/admin-careers.service';
import { ProfessorAdminService } from '@core/services/professor-admin/professor-admin.service';
import { UserFilesService } from '@core/services/user-files/user-files.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    EditableFieldComponent,
    DownloadStatusComponent,
    AvatarComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private myAccountService = inject(MyAccountService);
  private modalService = inject(ModalService);
  private authService = inject(AuthService);
  private adminCareersService = inject(AdminCareersService);
  private professorAdminService = inject(ProfessorAdminService);
  private userFilesService = inject(UserFilesService);

  initialData: ProfileData | null = null;
  isLoading = signal(true);

  careers = signal<ICareer[]>([]);
  careerOptions = computed<{ label: string; value: string }[]>(() => {
    return this.careers().map((c) => ({
      label: c.name,
      value: c.name,
    }));
  });

  profileData = signal<ProfileData>({
    id: '',
    name: '',
    email: '',
    role: USER_ROLES.ALUMNO,
    emailVerified: false,
    career: '',
    semester: '',
    description: '',
    downloadsLeft: 0,
    maxDownloads: 5,
    lastDownloadDate: null,
    totalUploads: 0,
    image: null,
    initialLetter: '',
    connectedAccounts: [],
    createdAt: new Date(),
  });

  semesterOptions = signal<{ label: string; value: string }[]>([]);
  editModes = signal<{ [key: string]: boolean }>({});

  hasChanges = computed(() => {
    if (!this.initialData) return false;
    return JSON.stringify(this.profileData()) !== JSON.stringify(this.initialData);
  });

  accountState = computed<DownloadStatusState>(() => {
    const data = this.profileData();
    if (data.totalUploads === 0) return 'first-time';
    if (data.downloadsLeft === 0) return 'empty';
    return 'available';
  });

  constructor() {
    // Cargar carreras desde la base de datos
    this.adminCareersService.getCareers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.careers.set(res.data);
        }
      },
      error: (err) => console.error('Error al cargar carreras en settings:', err),
    });

    // Escucha cambios en la carrera para actualizar los semestres disponibles basándose en la base de datos real
    effect(() => {
      const careerName = this.profileData().career;
      const careersList = this.careers();
      if (careersList.length > 0) {
        const selectedCareer = careersList.find(
          (c) => c.name.toLowerCase() === careerName.toLowerCase(),
        );
        const maxSemesters = selectedCareer ? selectedCareer.semesters : 10;

        const options = Array.from({ length: maxSemesters }, (_, i) => ({
          label: `${i + 1}° Semestre`,
          value: String(i + 1),
        }));
        this.semesterOptions.set(options);

        // Si el semestre actual excede el límite de la carrera seleccionada, se resetea a vacío
        const currentSem = parseInt(this.profileData().semester, 10);
        if (!isNaN(currentSem) && currentSem > maxSemesters) {
          this.updateField('semester', '');
        }
      } else if (careerName) {
        // Fallback temporal mientras cargan las carreras
        const options = Array.from({ length: 10 }, (_, i) => ({
          label: `${i + 1}° Semestre`,
          value: String(i + 1),
        }));
        this.semesterOptions.set(options);
      }
    });

    // Sincroniza los datos del usuario con los campos locales
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        const fullData: ProfileData = {
          ...user,
          initialLetter: user.initialLetter || '',
          career: user.career || '',
          semester: user.semester || '',
          description: user.description || '',
          downloadsLeft: this.profileData()?.id === user.id ? this.profileData().downloadsLeft : 0,
          maxDownloads: this.profileData()?.id === user.id ? this.profileData().maxDownloads : 5,
          lastDownloadDate: this.profileData()?.id === user.id ? this.profileData().lastDownloadDate : null,
          totalUploads: this.profileData()?.id === user.id ? this.profileData().totalUploads : 0,
          connectedAccounts: this.profileData()?.id === user.id ? this.profileData().connectedAccounts : [],
        };

        if (!this.initialData || this.initialData.id !== user.id) {
          this.initialData = { ...fullData };
        }

        if (this.isLoading()) {
          this.profileData.set({ ...fullData });
          this.isLoading.set(false);
        }
      }
    });

    // Consulta de estadísticas reales de descargas
    this.userFilesService.getDownloadStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const stats = res.data;
          this.profileData.update((data) => ({
            ...data,
            downloadsLeft: stats.downloadsLeft,
            maxDownloads: stats.maxDownloads,
            totalUploads: stats.totalUploads,
            lastDownloadDate: stats.lastDownloadDate
              ? new Date(stats.lastDownloadDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : null,
          }));
          if (this.initialData) {
            this.initialData.downloadsLeft = stats.downloadsLeft;
            this.initialData.maxDownloads = stats.maxDownloads;
            this.initialData.totalUploads = stats.totalUploads;
            this.initialData.lastDownloadDate = stats.lastDownloadDate ? String(stats.lastDownloadDate) : null;
          }
        }
      },
      error: (err) => console.error('Error al cargar estadísticas de descargas:', err),
    });

    // Consulta de cuentas vinculadas reales
    this.authService.listAccounts().subscribe({
      next: (accounts) => {
        const providers = accounts.map((a) => a.provider);
        const connectedAccounts: { provider: 'google' | 'microsoft'; connected: boolean }[] = [
          { provider: 'google', connected: providers.includes('google') },
          { provider: 'microsoft', connected: providers.includes('microsoft') },
        ];

        this.profileData.update((data) => ({
          ...data,
          connectedAccounts,
        }));

        if (this.initialData) {
          this.initialData.connectedAccounts = connectedAccounts;
        }
      },
      error: (err) => console.error('Error cargando cuentas vinculadas', err),
    });
  }

  toggleEdit(field: string) {
    this.editModes.update((modes) => ({
      ...modes,
      [field]: !modes[field],
    }));
  }

  updateField(field: string, value: any) {
    this.profileData.update((data) => ({
      ...data,
      [field]: value,
    }));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.hasChanges()) {
      $event.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
    }
  }

  imageFile: File | null = null;

  save() {
    const changes: Record<string, { old: any; new: any }> = {};
    const currentData = this.profileData();

    if (this.initialData) {
      Object.keys(currentData).forEach((key) => {
        const typedKey = key as keyof ProfileData;
        if (currentData[typedKey] !== this.initialData![typedKey]) {
          changes[key] = {
            old: this.initialData![typedKey],
            new: currentData[typedKey],
          };
        }
      });
    }

    if (Object.keys(changes).length === 0) {
      this.editModes.set({});
      return;
    }

    this.modalService.open({
      title: 'Confirmar Cambios',
      content: '¿Estás seguro de que quieres guardar los siguientes cambios en tu perfil?',
      changes,
      confirmText: 'Guardar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        const formData = new FormData();

        Object.keys(changes).forEach((key) => {
          if (key === 'image' && this.imageFile) {
            formData.append('image', this.imageFile);
          } else {
            formData.append(key, changes[key].new);
          }
        });

        this.myAccountService.updateProfile(formData).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.modalService.close();
              this.initialData = null;
              const updatedUser = response.data;
              this.authService.updateCurrentUser(updatedUser);
              this.editModes.set({});
              this.imageFile = null;
              toast.success(response.message || 'Perfil actualizado');
            }
          },
          error: (err) => {
            toast.error('Error al actualizar el perfil');
            console.error(err);
          },
        });
      },
    });
  }

  openImageUpload() {
    this.modalService.open({
      title: 'Actualizar foto de perfil',
      content: 'Selecciona una nueva imagen para tu cuenta.',
      isImageUpload: true,
      cancelText: 'Cancelar',
      onImageSelected: (file: File) => {
        this.imageFile = file;
        const imageUrl = URL.createObjectURL(file);
        this.updateField('image', imageUrl);
        this.editModes.update((modes) => ({ ...modes, image: true }));
        toast.success('Foto seleccionada temporalmente. Guarda los cambios para confirmar.');
      },
    });
  }

  cancel() {
    if (this.initialData) {
      this.profileData.set({ ...this.initialData });
    }
    this.editModes.set({});
    this.imageFile = null;
  }

  // Professor Verification Modal & Autocomplete State Signals
  isVerifyTeacherModalOpen = signal(false);
  teacherSearchQuery = signal('');
  scrapedProfessorsList = signal<any[]>([]);
  selectedProfessorIdForLink = signal<string>('');
  isVerifyingTeacher = signal(false);

  openTeacherVerificationModal() {
    this.teacherSearchQuery.set('');
    this.scrapedProfessorsList.set([]);
    this.selectedProfessorIdForLink.set('');
    this.isVerifyTeacherModalOpen.set(true);
  }

  searchScrapedProfessors() {
    const q = this.teacherSearchQuery().trim();
    if (!q || q.length < 3) {
      this.scrapedProfessorsList.set([]);
      return;
    }
    this.professorAdminService.getProfessors({ search: q, limit: 10 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.scrapedProfessorsList.set(res.data);
        }
      },
      error: (err) => console.error('Error al buscar profesores:', err),
    });
  }

  selectProfessorForLink(prof: any) {
    this.selectedProfessorIdForLink.set(prof.id);
    this.teacherSearchQuery.set(prof.name);
    // Clear list to close dropdown
    this.scrapedProfessorsList.set([]);
  }

  // Selected comprobante file state
  selectedComprobanteFile = signal<File | null>(null);

  onComprobanteFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecciona un archivo de imagen válido (JPEG, PNG).');
        return;
      }
      this.selectedComprobanteFile.set(file);
      toast.success(`Archivo comprobante "${file.name}" cargado.`);
    }
  }

  submitTeacherVerification() {
    const professorId = this.selectedProfessorIdForLink();
    const file = this.selectedComprobanteFile();

    if (!professorId) {
      toast.error('Por favor, busca y selecciona tu perfil de profesor de la lista de resultados.');
      return;
    }

    if (!file) {
      toast.error('Por favor, selecciona un comprobante o documento de identidad en formato de imagen.');
      return;
    }

    const formData = new FormData();
    formData.append('professorId', professorId);
    formData.append('documento', file);

    this.isVerifyingTeacher.set(true);
    toast.promise(firstValueFrom(this.professorAdminService.requestTeacherVerification(formData)), {
      loading: 'Enviando tu comprobante e iniciando solicitud de verificación docente...',
      success: (res: any) => {
        this.isVerifyingTeacher.set(false);
        this.isVerifyTeacherModalOpen.set(false);
        this.selectedComprobanteFile.set(null);
        return '¡Solicitud enviada! Un administrador revisará tu comprobante pronto.';
      },
      error: (err: any) => {
        this.isVerifyingTeacher.set(false);
        return err.error?.error || err.error?.message || 'No se pudo enviar la solicitud de verificación.';
      },
    });
  }
}
