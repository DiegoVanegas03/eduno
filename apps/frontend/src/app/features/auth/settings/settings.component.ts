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
import { USER_ROLES } from '@eduno/shared';
import { AuthService } from '@core/services/auth/auth.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

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

  initialData: ProfileData | null = null;
  isLoading = signal(true);

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
    // Escucha cambios en la carrera para actualizar los semestres disponibles
    effect(() => {
      const career = this.profileData().career;
      if (career) {
        this.myAccountService.getSemesterOptions(career).subscribe((options) => {
          this.semesterOptions.set(options);
        });
      }
    });

    // Sincroniza los datos del usuario con los campos locales y los mocks
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        const fullData: ProfileData = {
          ...user,
          initialLetter: user.initialLetter || '',
          career: user.career || '',
          semester: user.semester || '',
          description: user.description || '',
          // Mocks locales para lo que aún no está en el backend
          downloadsLeft: 4,
          maxDownloads: 5,
          lastDownloadDate: '21 de abril del 2026',
          totalUploads: 1,
          connectedAccounts: [], // Se llenará desde el endpoint
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
}
