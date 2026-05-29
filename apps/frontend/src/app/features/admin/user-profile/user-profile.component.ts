import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { RoleTranslatePipe } from '@shared/pipes/role-translate.pipe';
import { AdminUsersService } from '@core/services/admin-users/admin-users.service';
import { IAdminUserProfile } from '@eduno/shared';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, RoleTranslatePipe],
  templateUrl: './user-profile.component.html',
})
export class UserProfileComponent implements OnInit {
  route = inject(ActivatedRoute);
  adminUsersService = inject(AdminUsersService);

  userId = signal<string>('');
  profileData = signal<IAdminUserProfile | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') || '';
      this.userId.set(id);
      if (id) {
        this.fetchProfile(id);
      } else {
        this.isLoading.set(false);
        this.errorMessage.set('ID de usuario no proporcionado en la ruta.');
      }
    });
  }

  fetchProfile(id: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminUsersService.getUserProfile(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profileData.set(res.data);
        } else {
          this.errorMessage.set(res.message || 'No se pudo cargar el perfil del usuario.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set(
          err.error?.error || 'Error de conexión con el servidor al cargar perfil.',
        );
        this.isLoading.set(false);
      },
    });
  }

  toggleBanStatus() {
    const id = this.userId();
    if (!id || !this.profileData()) return;

    const currentUser = this.profileData()!.user;
    const actionText = currentUser.isBanned ? 'habilitar' : 'suspender';

    toast.promise(firstValueFrom(this.adminUsersService.toggleBan(id)), {
      loading: `Procesando acción para ${actionText} usuario...`,
      success: (res: any) => {
        if (res.success && res.data) {
          // Actualizar reactivamente el estado en la UI
          this.profileData.update((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              user: {
                ...prev.user,
                isBanned: res.data.isBanned,
              },
              // Si el usuario es baneado, revocamos todas las sesiones locales de forma reactiva
              sessions: res.data.isBanned ? [] : prev.sessions,
            };
          });

          return res.data.isBanned
            ? `El usuario ${currentUser.name} ha sido suspendido temporalmente.`
            : `El acceso de ${currentUser.name} ha sido reactivado.`;
        }
        throw new Error(res.message || 'Error al cambiar estado.');
      },
      error: (err: any) => err?.message || err?.error?.error || 'Error al procesar la solicitud.',
    });
  }

  terminateSession(sessionId: string) {
    const id = this.userId();
    if (!id || !sessionId) return;

    toast.promise(firstValueFrom(this.adminUsersService.revokeSession(id, sessionId)), {
      loading: 'Revocando sesión activa...',
      success: (res: any) => {
        if (res.success) {
          // Filtrar la sesión eliminada reactivamente
          this.profileData.update((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              sessions: prev.sessions.filter((s) => s.id !== sessionId),
            };
          });
          return 'La sesión ha sido revocada de forma exitosa.';
        }
        throw new Error(res.message || 'Error al revocar la sesión.');
      },
      error: (err: any) => err?.message || err?.error?.error || 'No se pudo revocar la sesión.',
    });
  }

  /**
   * Helper sofisticado para parsear el User Agent y devolver información útil y premium
   */
  getDeviceDetails(userAgent: string): { browser: string; os: string; icon: string } {
    const ua = userAgent.toLowerCase();
    let browser = 'Navegador Genérico';
    let os = 'Dispositivo Desconocido';
    let icon = 'monitor'; // Default icon representation

    // Parsear Navegador
    if (ua.includes('firefox')) {
      browser = 'Mozilla Firefox';
    } else if (ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('edge')) {
      browser = 'Google Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')) {
      browser = 'Apple Safari';
    } else if (ua.includes('edg/')) {
      browser = 'Microsoft Edge';
    } else if (ua.includes('opera') || ua.includes('opr/')) {
      browser = 'Opera';
    }

    // Parsear Sistema Operativo e Icono
    if (ua.includes('windows')) {
      os = 'Windows PC';
      icon = 'windows';
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
      os = 'Apple macOS';
      icon = 'mac';
    } else if (ua.includes('linux') && !ua.includes('android')) {
      os = 'Linux PC';
      icon = 'linux';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'Apple iOS Device';
      icon = 'mobile';
    } else if (ua.includes('android')) {
      os = 'Android Device';
      icon = 'mobile';
    }

    return { browser, os, icon };
  }

  /**
   * Helper para copiar datos sensibles como el ID o Email al portapapeles de forma elegante
   */
  copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.info(`${label} copiado al portapapeles.`);
    });
  }
}
