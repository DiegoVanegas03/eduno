import { Component, signal, computed, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { AdminUsersService } from '@core/services/admin-users/admin-users.service';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { IUserResponse, UserRole, IUserDashboardStats } from '@eduno/shared';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, RouterLink],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css',
})
export class ManageUsersComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  adminUsersService = inject(AdminUsersService);

  users = signal<IUserResponse[]>([]);
  isLoading = signal<boolean>(true);
  stats = signal<IUserDashboardStats | null>(null);

  constructor() {
    // Read and normalize initial query params from the URL on component creation
    this.route.queryParams.subscribe((params) => {
      if (params['search'] !== undefined) this.searchQuery.set(params['search']);

      if (params['role'] !== undefined) {
        const matchedRole = this.roleFilters.find(
          (r) => r.toLowerCase() === params['role'].toLowerCase(),
        );
        this.selectedRoleFilter.set(matchedRole || 'Todos');
      }

      if (params['status'] !== undefined) {
        const val = params['status'].toLowerCase();
        if (val === 'activo') this.selectedStatusFilter.set('Activo');
        else if (val === 'baneado') this.selectedStatusFilter.set('Baneado');
        else this.selectedStatusFilter.set('Todos');
      }

      if (params['period'] !== undefined) {
        const val = params['period'];
        if (val === '2026' || val === '2025') this.selectedPeriodFilter.set(val as '2026' | '2025');
        else this.selectedPeriodFilter.set('Todos');
      }

      if (params['sort'] !== undefined) {
        const val = params['sort'].toLowerCase();
        if (val === 'asc') this.dateSortDirection.set('asc');
        else if (val === 'desc') this.dateSortDirection.set('desc');
        else this.dateSortDirection.set(null);
      }
    });

    // Reactively sync changes back to URL query parameters
    effect(() => {
      const search = this.searchQuery();
      const role = this.selectedRoleFilter();
      const status = this.selectedStatusFilter();
      const period = this.selectedPeriodFilter();
      const sort = this.dateSortDirection();

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: search || null,
          role: role !== 'Todos' ? role : null,
          status: status !== 'Todos' ? status : null,
          period: period !== 'Todos' ? period : null,
          sort: sort || null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  ngOnInit() {
    this.loadUsersFromBackend();
    this.loadStatsFromBackend();
  }

  loadUsersFromBackend() {
    this.isLoading.set(true);
    this.adminUsersService.getUsers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users.set(res.data);
        } else {
          toast.error(res.message || 'Error al obtener usuarios de la base de datos.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        toast.error(err.error?.error || 'Error de conexión con el servidor al cargar usuarios.');
        this.isLoading.set(false);
      },
    });
  }

  loadStatsFromBackend() {
    this.adminUsersService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      },
    });
  }

  // UI labels for roles
  roleLabels: Record<string, string> = {
    alumno: 'Alumno',
    profesor: 'Profesor',
    moderador: 'Moderador',
    admin: 'Administrador',
  };

  roleFilters = ['Todos', 'Admin', 'Profesor', 'Alumno', 'Moderador'];

  // Search & Filter Signals
  searchQuery = signal<string>('');
  selectedRoleFilter = signal<string>('Todos');
  selectedStatusFilter = signal<'Todos' | 'Activo' | 'Baneado'>('Todos');
  selectedPeriodFilter = signal<'Todos' | '2026' | '2025'>('Todos');
  dateSortDirection = signal<'asc' | 'desc' | null>('desc');

  // Computed signals for live search & filtering
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedRoleFilter();
    const statusFilter = this.selectedStatusFilter();
    const periodFilter = this.selectedPeriodFilter();
    const sortDir = this.dateSortDirection();

    let result = this.users().filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
      const matchesRole = filter === 'Todos' || u.role === filter.toLowerCase();
      const userStatus = u.isBanned ? 'Baneado' : 'Activo';
      const matchesStatus = statusFilter === 'Todos' || userStatus === statusFilter;

      let matchesPeriod = true;
      if (periodFilter !== 'Todos') {
        const year = new Date(u.createdAt).toISOString().split('-')[0];
        matchesPeriod = year === periodFilter;
      }

      return matchesSearch && matchesRole && matchesStatus && matchesPeriod;
    });

    if (sortDir) {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  });

  toggleDateSort() {
    const current = this.dateSortDirection();
    if (current === 'desc') {
      this.dateSortDirection.set('asc');
    } else if (current === 'asc') {
      this.dateSortDirection.set(null);
    } else {
      this.dateSortDirection.set('desc');
    }
  }

  // Dynamic Metrics computed reactively via Signals (using backend stats payload)!
  totalUsers = computed(() => this.stats()?.totalUsers ?? 0);
  activeUsers = computed(() => this.stats()?.activeUsers ?? 0);
  profesoresCount = computed(() => this.stats()?.profesoresCount ?? 0);
  bannedUsers = computed(() => this.stats()?.bannedUsers ?? 0);
  monthlyGrowth = computed(() => this.stats()?.monthlyGrowth ?? 0);

  activeRatio = computed(() => {
    const total = this.totalUsers();
    return total > 0 ? Math.round((this.activeUsers() / total) * 100) : 0;
  });
  profesoresRatio = computed(() => {
    const total = this.totalUsers();
    return total > 0 ? Math.round((this.profesoresCount() / total) * 100) : 0;
  });
  bannedRatio = computed(() => {
    const total = this.totalUsers();
    return total > 0 ? Math.round((this.bannedUsers() / total) * 100) : 0;
  });

  // Modals visibility state
  isEditModalOpen = signal(false);
  isCreateModalOpen = signal(false);

  // Selected User for Editing
  selectedUser = signal<IUserResponse | null>(null);

  // Edit Form Fields
  editName = '';
  editEmail = '';
  editRole: UserRole = 'alumno';
  editCareer = '';
  editSemester = '';
  editDescription = '';

  // Create Form Fields
  createName = '';
  createEmail = '';
  createRole: UserRole = 'alumno';
  createPassword = '';
  createCareer = '';
  createSemester = '';
  createDescription = '';

  generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.createPassword = password;
  }

  openEditModal(user: IUserResponse) {
    this.selectedUser.set(user);
    this.editName = user.name;
    this.editEmail = user.email;
    this.editRole = user.role;
    this.editCareer = user.career || '';
    this.editSemester = user.semester || '';
    this.editDescription = user.description || '';
    this.isEditModalOpen.set(true);
  }

  saveUserEdit() {
    if (!this.editName.trim() || !this.editEmail.trim()) {
      toast.error('Por favor, completa todos los campos del usuario.');
      return;
    }

    const currentId = this.selectedUser()?.id;
    if (!currentId) return;

    toast.promise(
      firstValueFrom(
        this.adminUsersService.updateUser(currentId, {
          name: this.editName,
          email: this.editEmail,
          role: this.editRole,
          career: this.editCareer,
          semester: this.editSemester,
          description: this.editDescription,
        }),
      ),
      {
        loading: 'Actualizando usuario en el servidor...',
        success: (res: any) => {
          if (res.success && res.data) {
            this.users.update((list) => list.map((u) => (u.id === currentId ? res.data : u)));
            this.loadStatsFromBackend();
            this.isEditModalOpen.set(false);
            return 'Usuario actualizado correctamente';
          }
          throw new Error(res.message || 'Error al actualizar.');
        },
        error: (err: any) =>
          err?.message || err?.error?.error || 'No se pudo actualizar el usuario.',
      },
    );
  }

  openCreateModal() {
    this.createName = '';
    this.createEmail = '';
    this.createRole = 'alumno';
    this.createCareer = '';
    this.createSemester = '';
    this.createDescription = '';
    this.generateRandomPassword();
    this.isCreateModalOpen.set(true);
  }

  createUser() {
    if (!this.createName.trim() || !this.createEmail.trim() || !this.createPassword.trim()) {
      toast.error('Por favor, completa todos los campos obligatorios del usuario.');
      return;
    }

    toast.promise(
      firstValueFrom(
        this.adminUsersService.createUser({
          name: this.createName,
          email: this.createEmail,
          role: this.createRole,
          password: this.createPassword,
          career: this.createCareer,
          semester: this.createSemester,
          description: this.createDescription,
        }),
      ),
      {
        loading: 'Registrando usuario en el servidor...',
        success: (res: any) => {
          if (res.success && res.data) {
            this.users.update((list) => [res.data, ...list]);
            this.loadStatsFromBackend();
            this.isCreateModalOpen.set(false);
            return `Usuario ${res.data.name} registrado con éxito`;
          }
          throw new Error(res.message || 'Error al registrar.');
        },
        error: (err: any) => err?.message || err?.error?.error || 'No se pudo crear el usuario.',
      },
    );
  }

  toggleUserStatus(user: IUserResponse) {
    toast.promise(firstValueFrom(this.adminUsersService.toggleBan(user.id)), {
      loading: 'Actualizando acceso del usuario...',
      success: (res: any) => {
        if (res.success && res.data) {
          this.users.update((list) =>
            list.map((u) => (u.id === user.id ? { ...u, isBanned: res.data.isBanned } : u)),
          );
          this.loadStatsFromBackend();
          return res.data.isBanned
            ? `El usuario ${user.name} ha sido suspendido.`
            : `El acceso de ${user.name} ha sido habilitado.`;
        }
        throw new Error(res.message || 'Error al cambiar estado.');
      },
      error: (err: any) => err?.message || err?.error?.error || 'Error al procesar la solicitud.',
    });
  }

  resendVerificationMail(user: IUserResponse) {
    toast.promise(firstValueFrom(this.adminUsersService.resendVerification(user.id)), {
      loading: 'Reenviando correo de verificación...',
      success: () => `Correo de verificación reenviado con éxito a ${user.email}.`,
      error: (err: any) =>
        err?.message || err?.error?.error || 'No se pudo reenviar el correo de verificación.',
    });
  }
}
