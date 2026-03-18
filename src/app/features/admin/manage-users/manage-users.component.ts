import { Component } from '@angular/core';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [],
  template: `
    <div class="px-2 lg:px-6">
      <div
        class="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-cerulean-100"
      >
        <div>
          <h2 class="text-2xl font-bold text-oxford-navy-900">Administrar Usuarios</h2>
          <p class="text-sm text-gray-500 mt-1">
            Controla los accesos y roles de toda la plataforma.
          </p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-cerulean-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex justify-end">
          <input
            type="text"
            placeholder="Buscar usuario..."
            class="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cerulean-400 w-full md:w-64 transition-shadow"
          />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead class="bg-cerulean-50/50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-oxford-navy-500 uppercase tracking-wider"
                >
                  Usuario
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-oxford-navy-500 uppercase tracking-wider"
                >
                  Rol
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-oxford-navy-500 uppercase tracking-wider"
                >
                  Fecha Registro
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-right text-xs font-bold text-oxford-navy-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr class="hover:bg-cerulean-50/30 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="h-10 w-10 shrink-0 bg-linear-to-br from-cerulean-400 to-cerulean-600 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    >
                      JL
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-semibold text-oxford-navy-900">Juan López</div>
                      <div class="text-xs text-gray-400">juanl@example.com</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-cerulean-100 text-cerulean-800 border border-cerulean-200"
                    >Alumno</span
                  >
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">01/03/2026</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    class="text-oxford-navy-500 hover:text-cerulean-600 mr-4 transition-colors p-2 hover:bg-cerulean-50 rounded-lg"
                  >
                    <span class="sr-only">Editar</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="text-punch-red-400 hover:text-punch-red-600 transition-colors p-2 hover:bg-punch-red-50 rounded-lg"
                  >
                    <span class="sr-only">Banear</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      ></path>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-500"
        >
          <span>Mostrando 1 de 1 usuarios</span>
          <div class="flex gap-2">
            <button class="px-3 py-1 rounded bg-white border border-gray-200 disabled:opacity-50">
              Anterior
            </button>
            <button class="px-3 py-1 rounded bg-white border border-gray-200 disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ManageUsersComponent {}
