import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="px-2 lg:px-6">
      <h2 class="text-2xl font-bold text-oxford-navy-900 mb-6">Resumen Diagóstico</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Stat Card 1 -->
        <div
          class="bg-white p-6 rounded-2xl border border-cerulean-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
        >
          <div
            class="absolute -right-10 -top-10 w-32 h-32 bg-cerulean-50 rounded-full group-hover:bg-cerulean-100/50 transition-colors z-0"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Alumnos</p>
                <p class="text-4xl font-black text-oxford-navy-800 mt-2">1,245</p>
              </div>
              <div
                class="p-4 bg-linear-to-br from-cerulean-400 to-cerulean-600 rounded-2xl text-white shadow-md shadow-cerulean-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <div
              class="mt-6 flex items-center text-sm bg-honeydew-50 text-honeydew-700 px-3 py-1.5 rounded-lg w-fit border border-honeydew-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span class="font-bold">+12%</span>
              <span class="ml-1 text-honeydew-600">este mes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
