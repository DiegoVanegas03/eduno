import { ProfesorDetalle } from '../../models/profesor.model';

export const PROFESORES_MOCK: ProfesorDetalle[] = [
  {
    id: 1,
    nombre: 'Roberto Martinez',
    titulo: 'Doctor',
    inicial: 'M',
    materiaPrincipal: 'Álgebra Lineal',
    calificacion: 4.8,
    numResenas: 12,
    descripcionAbreviada:
      '"Explica muy bien y los exámenes vienen exactamente de lo que se ve en clase. Es muy accesible para resolver dudas."',
    materias: [
      {
        id: 1,
        nombre: 'Álgebra Lineal',
        gruposCount: 2,
        grupos: [
          {
            id: 1,
            nombre: '01',
            horario: 'Lunes, Miércoles y Viernes',
            recursos: [
              {
                id: 1,
                nombre: 'Guia_Parcial_1.pdf',
                subidoPor: 'Anon_Ing',
                tamano: '2.4 MB',
                isPdf: true,
                fecha: '2023-10-15T10:00:00Z',
              },
              {
                id: 2,
                nombre: 'Probl_M1_resueltos.zip',
                subidoPor: 'Admin',
                tamano: '5.1 MB',
                isPdf: false,
                fecha: '2023-09-01T12:30:00Z',
              },
              {
                id: 3,
                nombre: 'Apuntes_Clase_1.pdf',
                subidoPor: 'Admin',
                tamano: '5.1 MB',
                isPdf: true,
                fecha: '2023-11-20T14:15:00Z',
              },
              {
                id: 4,
                nombre: 'Ejercicios_Practica.zip',
                subidoPor: 'Admin',
                tamano: '5.1 MB',
                isPdf: false,
                fecha: '2023-08-05T09:45:00Z',
              },
              {
                id: 5,
                nombre: 'Resumen_Final.pdf',
                subidoPor: 'Admin',
                tamano: '5.1 MB',
                isPdf: true,
                fecha: '2023-12-10T11:20:00Z',
              },
              {
                id: 6,
                nombre: 'Formulario_Algebra.pdf',
                subidoPor: 'Admin',
                tamano: '5.1 MB',
                isPdf: true,
                fecha: '2023-10-25T16:00:00Z',
              },
            ],
          },
          {
            id: 2,
            nombre: '04',
            horario: 'Martes y Jueves',
            recursos: [], // Empty to show empty state
          },
        ],
      },
      {
        id: 2,
        nombre: 'Geometría Analítica',
        gruposCount: 1,
        grupos: [
          {
            id: 3,
            nombre: '02',
            horario: 'Lunes a Jueves',
            recursos: [],
          },
        ],
      },
    ],
    resenas: [
      {
        id: 1,
        autor: 'Anon_Ing',
        tiempoAgo: 'Hace 2 meses',
        rating: 5,
        comentario:
          'Excelente profesor, explica muy claro y sus ejemplos en clase son justos los que vienen en el examen. Muy recomendado subir sus apuntes, siempre sirven.',
        materia: 'Álgebra Lineal',
      },
      {
        id: 2,
        autor: 'JuanPerez99',
        tiempoAgo: 'Hace 5 meses',
        rating: 4,
        comentario:
          'A veces asume que ya sabemos ciertas cosas y va un poco rápido. Pero si le preguntas en hora de asesorías, tiene mucha paciencia.',
        materia: 'Geometría Analítica',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Juana Sánchez',
    titulo: 'Maestra',
    inicial: 'S',
    materiaPrincipal: 'Programación I',
    calificacion: 4.2,
    numResenas: 8,
    descripcionAbreviada:
      '"Deja muchos proyectos, pero si haces las prácticas pasas sin problema. Califica rudo pero justo."',
    materias: [
      {
        id: 3,
        nombre: 'Programación I',
        gruposCount: 1,
        grupos: [
          {
            id: 4,
            nombre: '03',
            horario: 'Martes y Jueves',
            recursos: [
              {
                id: 7,
                nombre: 'Practica_01.pdf',
                subidoPor: 'DevStudent',
                tamano: '1.2 MB',
                isPdf: true,
                fecha: '2024-01-15T08:00:00Z',
              },
            ],
          },
        ],
      },
    ],
    resenas: [
      {
        id: 3,
        autor: 'DevStudent',
        tiempoAgo: 'Hace 1 semana',
        rating: 4,
        comentario:
          'La clase está interesante, aprendes mucho de fundamentos, pero prepárate para desvelarte programando.',
        materia: 'Programación I',
      },
    ],
  },
];
