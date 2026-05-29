import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

interface Classroom {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
}

@Component({
  selector: 'app-croquis',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  template: `
    <div class="min-h-screen bg-cerulean-50 pt-24 pb-16">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Breadcrumb -->
        <app-breadcrumb [items]="[
          { label: 'Inicio', link: '/' },
          { label: 'Croquis Interactivo' }
        ]">
          <a routerLink="/" class="flex items-center gap-2 text-punch-red-500 hover:text-punch-red-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver al inicio
          </a>  
        </app-breadcrumb>

        <!-- Header -->
        <div class="bg-white rounded-b-4xl p-8 shadow-md border border-cerulean-100 mb-8 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-cerulean-400 to-punch-red-400"></div>
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl md:text-4xl font-extrabold text-oxford-navy-900 tracking-tight">Croquis Interactivo de Aulas</h1>
              <p class="text-oxford-navy-600 mt-2">Localiza tu salón de clase de manera interactiva en el mapa de la universidad.</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="px-3 py-1.5 rounded-lg bg-cerulean-100 text-cerulean-800 text-xs font-bold border border-cerulean-200">
                Edificio seleccionado: Edificio {{ selectedBuilding() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main Interactive Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Building & Floor Selector -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Buildings Selector -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-cerulean-100">
              <h2 class="text-lg font-bold text-oxford-navy-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-cerulean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                Seleccionar Edificio
              </h2>
              <div class="grid grid-cols-2 gap-3">
                @for (bld of buildings; track bld) {
                  <button 
                    (click)="selectBuilding(bld)"
                    class="py-3 px-4 rounded-2xl font-bold text-sm border transition-all text-center cursor-pointer shadow-2xs"
                    [class.bg-cerulean-600]="selectedBuilding() === bld"
                    [class.border-cerulean-600]="selectedBuilding() === bld"
                    [class.text-white]="selectedBuilding() === bld"
                    [class.bg-white]="selectedBuilding() !== bld"
                    [class.border-cerulean-150]="selectedBuilding() !== bld"
                    [class.text-oxford-navy-800]="selectedBuilding() !== bld"
                    [class.hover:bg-cerulean-50]="selectedBuilding() !== bld"
                  >
                    Edificio {{ bld }}
                  </button>
                }
              </div>
            </div>

            <!-- Floor Selector -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-cerulean-100">
              <h2 class="text-lg font-bold text-oxford-navy-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-cerulean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l4-4m0 0l4 4m-4-4v18"></path></svg>
                Piso
              </h2>
              <div class="flex gap-2">
                @for (flr of floors; track flr) {
                  <button 
                    (click)="selectedFloor.set(flr)"
                    class="flex-1 py-3 rounded-2xl font-bold text-sm border transition-all text-center cursor-pointer"
                    [class.bg-punch-red-500]="selectedFloor() === flr"
                    [class.border-punch-red-500]="selectedFloor() === flr"
                    [class.text-white]="selectedFloor() === flr"
                    [class.bg-white]="selectedFloor() !== flr"
                    [class.border-cerulean-150]="selectedFloor() !== flr"
                    [class.text-oxford-navy-800]="selectedFloor() !== flr"
                    [class.hover:bg-cerulean-50]="selectedFloor() !== flr"
                  >
                    Piso {{ flr }}
                  </button>
                }
              </div>
            </div>

            <!-- Classroom details -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-cerulean-100">
              <h2 class="text-lg font-bold text-oxford-navy-900 mb-4">Información del Aula</h2>
              @if (activeClassroom(); as room) {
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-2xl font-black text-oxford-navy-900">Salón {{ room.name }}</span>
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full uppercase"
                      [class.bg-green-100]="room.status === 'available'"
                      [class.text-green-700]="room.status === 'available'"
                      [class.bg-amber-100]="room.status === 'occupied'"
                      [class.text-amber-700]="room.status === 'occupied'"
                    >
                      {{ room.status === 'available' ? 'Disponible' : 'En Clase' }}
                    </span>
                  </div>
                  
                  <div class="border-t border-cerulean-50 pt-4 space-y-2 text-sm text-oxford-navy-600">
                    <div class="flex justify-between">
                      <span>Edificio:</span>
                      <span class="font-bold text-oxford-navy-900">{{ room.building }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Piso / Nivel:</span>
                      <span class="font-bold text-oxford-navy-900">Piso {{ room.floor }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Tipo de Aula:</span>
                      <span class="font-bold text-oxford-navy-900">{{ room.type }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Capacidad máxima:</span>
                      <span class="font-bold text-oxford-navy-900">{{ room.capacity }} estudiantes</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="text-center py-6 text-oxford-navy-450 italic">
                  Selecciona una aula en el plano interactivo para ver sus detalles.
                </div>
              }
            </div>
          </div>

          <!-- Classroom Map Visualisation -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-cerulean-100 h-full flex flex-col">
              <h2 class="text-xl font-bold text-oxford-navy-900 mb-6 flex items-center justify-between">
                <span>Plano de Distribución</span>
                <span class="text-xs text-oxford-navy-400 font-medium">Haga clic en un aula para interactuar</span>
              </h2>

              <!-- The Classroom Grid Layout Visual Representation -->
              <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-[400px] bg-cerulean-50/50 p-6 rounded-2xl border border-dashed border-cerulean-200">
                @for (room of filteredClassrooms(); track room.id) {
                  <div 
                    (click)="activeClassroomId.set(room.id)"
                    class="group relative rounded-2xl p-6 border-2 transition-all flex flex-col justify-between items-center text-center cursor-pointer shadow-xs select-none"
                    [class.bg-white]="activeClassroomId() !== room.id"
                    [class.border-cerulean-100]="activeClassroomId() !== room.id"
                    [class.hover:border-cerulean-400]="activeClassroomId() !== room.id"
                    [class.scale-[1.02]]="activeClassroomId() === room.id"
                    [class.bg-linear-to-br]="activeClassroomId() === room.id"
                    [class.from-cerulean-500]="activeClassroomId() === room.id"
                    [class.to-cerulean-600]="activeClassroomId() === room.id"
                    [class.border-cerulean-600]="activeClassroomId() === room.id"
                    [class.text-white]="activeClassroomId() === room.id"
                  >
                    <!-- Small Room Indicator -->
                    <div class="absolute top-3 left-3 flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full"
                        [class.bg-green-500]="room.status === 'available'"
                        [class.bg-amber-500]="room.status === 'occupied'"
                      ></span>
                    </div>

                    <!-- Room icon -->
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      [class.bg-cerulean-50]="activeClassroomId() !== room.id"
                      [class.text-cerulean-600]="activeClassroomId() !== room.id"
                      [class.bg-white/20]="activeClassroomId() === room.id"
                      [class.text-white]="activeClassroomId() === room.id"
                    >
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                    </div>

                    <div>
                      <h3 class="text-lg font-black leading-tight"
                        [class.text-oxford-navy-900]="activeClassroomId() !== room.id"
                        [class.text-white]="activeClassroomId() === room.id"
                      >
                        Aula {{ room.name }}
                      </h3>
                      <p class="text-xs mt-1"
                        [class.text-oxford-navy-500]="activeClassroomId() !== room.id"
                        [class.text-cerulean-100]="activeClassroomId() === room.id"
                      >
                        {{ room.type }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class CroquisComponent implements OnInit {
  private route = inject(ActivatedRoute);

  buildings = ['I', 'J', 'K', 'L', 'M'];
  floors = [1, 2, 3];

  selectedBuilding = signal<string>('I');
  selectedFloor = signal<number>(1);
  activeClassroomId = signal<string | null>(null);

  classrooms: Classroom[] = [];

  ngOnInit() {
    this.generateMockClassrooms();

    // Read initial queries or params
    this.route.queryParams.subscribe(params => {
      const bld = params['building'];
      const salon = params['salon'];
      
      if (bld && this.buildings.includes(bld)) {
        this.selectedBuilding.set(bld);
      }
      
      if (salon) {
        const found = this.classrooms.find(c => c.name.toLowerCase() === salon.toString().toLowerCase());
        if (found) {
          this.selectedBuilding.set(found.building);
          this.selectedFloor.set(found.floor);
          this.activeClassroomId.set(found.id);
        }
      }
    });
  }

  selectBuilding(bld: string) {
    this.selectedBuilding.set(bld);
    // Auto select first classroom in building
    const rooms = this.filteredClassrooms();
    if (rooms.length > 0) {
      this.activeClassroomId.set(rooms[0].id);
    }
  }

  activeClassroom = signal<Classroom | null>(null);

  constructor() {
    // Sync active classroom details automatically
    import('@angular/core').then(({ effect }) => {
      effect(() => {
        const activeId = this.activeClassroomId();
        const rooms = this.classrooms;
        const found = rooms.find(r => r.id === activeId);
        if (found) {
          this.activeClassroom.set(found);
        } else {
          this.activeClassroom.set(null);
        }
      }, { allowSignalWrites: true });
    });
  }

  filteredClassrooms() {
    return this.classrooms.filter(
      (c) => c.building === this.selectedBuilding() && c.floor === this.selectedFloor()
    );
  }

  private generateMockClassrooms() {
    const list: Classroom[] = [];
    this.buildings.forEach((bld) => {
      this.floors.forEach((flr) => {
        const roomsCount = 6;
        for (let i = 1; i <= roomsCount; i++) {
          const roomNumber = `${bld}-${flr.toString().padStart(2, '0')}${i}`;
          list.push({
            id: `${bld}-${flr}-${i}`,
            name: roomNumber,
            building: bld,
            floor: flr,
            type: i % 3 === 0 ? 'Laboratorio' : 'Teoría',
            capacity: i % 2 === 0 ? 40 : 35,
            status: (i + flr) % 2 === 0 ? 'available' : 'occupied',
          });
        }
      });
    });
    this.classrooms = list;
    
    // Set default active classroom
    const defaultRooms = list.filter(c => c.building === 'I' && c.floor === 1);
    if (defaultRooms.length > 0) {
      this.activeClassroomId.set(defaultRooms[0].id);
    }
  }
}
