import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { SecurityService, ActiveSession } from '@core/services/auth/security.service';
import { AuthService } from '@core/services/auth/auth.service';

/** Cross-field validator: newPassword === confirmPassword */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const np = group.get('newPassword')?.value;
  const cp = group.get('confirmPassword')?.value;
  return np && cp && np !== cp ? { mismatch: true } : null;
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './security.component.html',
})
export class SecurityComponent implements OnInit {
  private securityService = inject(SecurityService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // ─── Password change form ─────────────────────────────────────────────────
  passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  showPassword = signal(false);
  isSubmitting = signal(false);

  // Getters para acceso rápido en el template
  get currentPasswordCtrl() {
    return this.passwordForm.get('currentPassword')!;
  }
  get newPasswordCtrl() {
    return this.passwordForm.get('newPassword')!;
  }
  get confirmPasswordCtrl() {
    return this.passwordForm.get('confirmPassword')!;
  }

  // Writable signal to drive reactive password strength signals
  newPasswordVal = signal('');

  hasMinLength = computed(() => this.newPasswordVal().length >= 8);
  hasUpperAndLowerCase = computed(() => {
    const v = this.newPasswordVal();
    return /[a-z]/.test(v) && /[A-Z]/.test(v);
  });
  hasNumbers = computed(() => /[0-9]/.test(this.newPasswordVal()));
  hasSpecialChars = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.newPasswordVal()));

  passwordStrength = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUpperAndLowerCase()) score++;
    if (this.hasNumbers()) score++;
    if (this.hasSpecialChars()) score++;
    return score; // 0–4
  });

  // ─── Sessions ──────────────────────────────────────────────────────────────
  sessions = signal<ActiveSession[]>([]);
  sessionsLoading = signal(true);
  sessionsError = signal(false);

  // ─── Delete account modal ─────────────────────────────────────────────────
  isDeleteModalOpen = signal(false);
  confirmDeletePassword = signal('');
  showDeletePassword = signal(false);

  // ─── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadSessions();

    // Sync form control changes with the newPasswordVal signal to trigger computed signals
    this.newPasswordCtrl.valueChanges.subscribe((val) => {
      this.newPasswordVal.set(val ?? '');
    });
  }

  // ─── Password submit ───────────────────────────────────────────────────────
  submitPasswordChange(): void {
    if (this.passwordForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const payload = this.passwordForm.getRawValue() as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    this.securityService.updatePassword(payload).subscribe({
      next: (res) => {
        toast.success(res.message ?? 'Contraseña actualizada correctamente.');
        this.passwordForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        toast.error(err?.error?.error ?? 'Error al actualizar la contraseña.');
        this.isSubmitting.set(false);
      },
    });
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────
  loadSessions(): void {
    this.sessionsLoading.set(true);
    this.sessionsError.set(false);

    const currentSessionId = this.authService.currentSessionId();

    this.securityService.listSessions().subscribe({
      next: (raw) => {
        const normalized = raw.map((s) => this.securityService.normalize(s, currentSessionId));
        normalized.sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
        this.sessions.set(normalized);
        this.sessionsLoading.set(false);
      },
      error: () => {
        this.sessionsError.set(true);
        this.sessionsLoading.set(false);
        toast.error('No se pudieron cargar las sesiones activas.');
      },
    });
  }

  revokeSession(sessionId: string): void {
    const target = this.sessions().find((s) => s.id === sessionId);
    if (!target) return;

    this.securityService.revokeSession(target.token).subscribe({
      next: () => {
        this.sessions.update((list) => list.filter((s) => s.id !== sessionId));
        toast.success('Sesión cerrada correctamente.');
      },
      error: () => toast.error('No se pudo cerrar la sesión. Intenta de nuevo.'),
    });
  }

  revokeAllSessions(): void {
    this.securityService.revokeOtherSessions().subscribe({
      next: () => {
        this.sessions.update((list) => list.filter((s) => s.isCurrent));
        toast.success('Todas las demás sesiones han sido cerradas.');
      },
      error: () => toast.error('No se pudieron cerrar las sesiones. Intenta de nuevo.'),
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  // ─── Delete account modal ─────────────────────────────────────────────────
  openDeleteModal(): void {
    this.confirmDeletePassword.set('');
    this.showDeletePassword.set(false);
    this.isDeleteModalOpen.set(true);
    document.body.classList.add('overflow-hidden');
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    document.body.classList.remove('overflow-hidden');
  }

  isDeletingAccount = signal(false);

  confirmDeleteAccount(): void {
    const password = this.confirmDeletePassword();
    if (!password || this.isDeletingAccount()) return;

    this.isDeletingAccount.set(true);

    this.securityService.deleteAccount(password).subscribe({
      next: (res) => {
        toast.success(res.message ?? 'Tu cuenta ha sido eliminada.');
        this.closeDeleteModal();
        // Log out and redirect — session no longer exists
        this.authService.logout();
      },
      error: (err) => {
        toast.error(err?.error?.error ?? 'Error al eliminar la cuenta. Verifica tu contraseña.');
        this.isDeletingAccount.set(false);
      },
    });
  }
}
