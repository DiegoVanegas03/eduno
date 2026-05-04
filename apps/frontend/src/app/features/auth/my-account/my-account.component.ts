import { Component, signal, computed, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './my-account.component.html',
  styleUrl: './my-account.component.css',
})
export class MyAccountComponent {
  // Datos iniciales (en una app real vendrían de un servicio)
  initialData = {
    nombre: 'Diego Emiliano Vanegas Cerda',
    correo: 'eduno+gamesonfn@gmail.com',
    carrera: 'Ingeniería en computación',
    semestre: 'Tercer Semestre',
  };

  // Señal para los datos actuales (editables)
  profileData = signal({ ...this.initialData });

  // Estado de edición por campo
  editModes = signal<{ [key: string]: boolean }>({});

  // Detectar si hay cambios sin guardar
  hasChanges = computed(() => {
    return JSON.stringify(this.profileData()) !== JSON.stringify(this.initialData);
  });

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

  save() {
    // Simulación de guardado
    console.log('Guardando datos:', this.profileData());
    this.initialData = { ...this.profileData() };
    this.editModes.set({});
    // Aquí se llamaría al servicio de backend
  }

  cancel() {
    this.profileData.set({ ...this.initialData });
    this.editModes.set({});
  }
}
