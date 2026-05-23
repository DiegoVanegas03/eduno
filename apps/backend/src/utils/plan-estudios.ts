import { chromium } from "playwright";

export interface MateriaPlan {
  clave: string;
  nombre: string;
  ht: string;
  hp: string;
  creditos: string;
  cacei: string;
  prerequisitos: string[];
  tipo: string;
}

export interface SemestrePlan {
  semestre: number;
  materias: MateriaPlan[];
  canInscribeEnfasis: boolean;
}

export interface AreaEnfasis {
  nombre: string;
  materias: MateriaPlan[];
}

export interface PlanEstudios {
  carrera: string;
  url: string;
  semestres: SemestrePlan[];
  areasEnfasis: AreaEnfasis[];
}

const PLANS: { carrera: string; url: string }[] = [
  {
    carrera: "Sistemas Inteligentes",
    url: "https://infocomp.ingenieria.uaslp.mx/cominf/public/principal/sistemasinteligentes/pe",
  },
  {
    carrera: "Ingeniería en Computación",
    url: "https://infocomp.ingenieria.uaslp.mx/cominf/public/principal/icomputacion/pe",
  },
];

export async function scrapePlanEstudios(
  planUrl?: string,
  planCarrera?: string,
): Promise<PlanEstudios> {
  const target = planUrl
    ? { carrera: planCarrera ?? "", url: planUrl }
    : PLANS[0];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(target.url, { waitUntil: "networkidle" });

    interface RawPlanData {
      semestres: Omit<SemestrePlan, "canInscribeEnfasis">[];
      areasEnfasis: AreaEnfasis[];
    }

    const planData = (await page.evaluate(`
      (function () {
        var trim = function (s) {
          return (s ?? "").replace(/\\s+/g, " ").trim();
        };

        var parseBadge = function (el) {
          return trim(el?.textContent);
        };

        var semestres = [];
        var areasEnfasis = [];

        var semTables = document.querySelectorAll("table.plan");
        var semRows = semTables[0]?.querySelectorAll("tbody tr");
        if (semRows) {
          semRows.forEach(function (tr) {
            var tds = tr.querySelectorAll("td");
            var semTd = tds[0];
            if (!semTd || !semTd.classList.contains("semestre")) return;
            var num = parseInt(trim(semTd.textContent), 10);
            if (isNaN(num)) return;
            var materias = [];
            for (var i = 1; i < tds.length; i++) {
              var materiaDiv = tds[i].querySelector(".materia");
              if (!materiaDiv) continue;

              var nombreMat = materiaDiv.querySelector(".nombre_mat");
              if (!nombreMat) continue;
              var nombre = trim(nombreMat.textContent);

              var tipo = "carrera";
              if (nombreMat.classList.contains("comun")) tipo = "comun";
              else if (nombreMat.classList.contains("dui")) tipo = "dui";

              var preDiv = materiaDiv.querySelector(".prerequisito");
              var prerequisitos = [];
              if (preDiv) {
                var badges = preDiv.querySelectorAll(".badge");
                badges.forEach(function (b) {
                  var code = parseBadge(b);
                  if (code) prerequisitos.push(code);
                });
              }

              var datosTds = materiaDiv.querySelectorAll("table.datos td");
              var ht = trim(datosTds[0]?.textContent);
              var hp = trim(datosTds[1]?.textContent);
              var creditos = trim(datosTds[2]?.textContent);
              var clave = trim(datosTds[3]?.textContent);
              var caceiClass = datosTds[4]?.className ?? "";
              var cacei = "";
              var m = caceiClass.match(/cacei_(\\w+)/);
              if (m) cacei = m[1].toUpperCase();

              materias.push({
                clave: clave,
                nombre: nombre,
                ht: ht,
                hp: hp,
                creditos: creditos,
                cacei: cacei,
                prerequisitos: prerequisitos,
                tipo: tipo
              });
            }
            semestres.push({
              semestre: num,
              materias: materias
            });
          });
        }

        var enfasisSection = document.querySelector("div.row.mb-4");
        if (enfasisSection) {
          var areas = enfasisSection.querySelectorAll(".col-md-6, .col-lg-3");
          areas.forEach(function (area) {
            var titulo = trim(area.querySelector("h4")?.textContent);
            var materias = [];
            var filas = area.querySelectorAll("table.plan tbody tr");
            filas.forEach(function (tr) {
              var tds = tr.querySelectorAll("td");
              for (var j = 0; j < tds.length; j++) {
                var materiaDiv = tds[j].querySelector(".materia");
                if (!materiaDiv) continue;

                var nombreMat = materiaDiv.querySelector(".nombre_mat");
                if (!nombreMat) continue;
                var nombre = trim(nombreMat.textContent);

                var tipo = "carrera";
                if (nombreMat.classList.contains("comun")) tipo = "comun";
                else if (nombreMat.classList.contains("dui")) tipo = "dui";

                var preDiv = materiaDiv.querySelector(".prerequisito");
                var prerequisitos = [];
                if (preDiv) {
                  var badges = preDiv.querySelectorAll(".badge");
                  badges.forEach(function (b) {
                    var code = parseBadge(b);
                    if (code) prerequisitos.push(code);
                  });
                }

                var datosTds = materiaDiv.querySelectorAll("table.datos td");
                var ht = trim(datosTds[0]?.textContent);
                var hp = trim(datosTds[1]?.textContent);
                var creditos = trim(datosTds[2]?.textContent);
                var clave = trim(datosTds[3]?.textContent);
                var caceiClass = datosTds[4]?.className ?? "";
                var cacei = "";
                var m2 = caceiClass.match(/cacei_(\\w+)/);
                if (m2) cacei = m2[1].toUpperCase();

                materias.push({
                  clave: clave,
                  nombre: nombre,
                  ht: ht,
                  hp: hp,
                  creditos: creditos,
                  cacei: cacei,
                  prerequisitos: prerequisitos,
                  tipo: tipo
                });
              }
            });
            areasEnfasis.push({
              nombre: titulo,
              materias: materias
            });
          });
        }

        return { semestres: semestres, areasEnfasis: areasEnfasis };
      })()
    `)) as RawPlanData;

    let enfasisIndex = -1;
    for (let i = 0; i < planData.semestres.length; i++) {
      const sem = planData.semestres[i];
      const hasEnfasis = sem.materias.some(
        (m) =>
          m.nombre
            .toLowerCase()
            .includes("área de énfasis") ||
          m.nombre
            .toLowerCase()
            .includes("area de enfasis") ||
          m.nombre
            .toLowerCase()
            .includes("electivas de"),
      );
      if (hasEnfasis && enfasisIndex === -1) {
        enfasisIndex = i;
      }
    }

    const semestres: SemestrePlan[] = planData.semestres.map((sem, i) => ({
      ...sem,
      canInscribeEnfasis: enfasisIndex >= 0 && i >= enfasisIndex,
    }));

    return {
      carrera: target.carrera,
      url: target.url,
      semestres,
      areasEnfasis: planData.areasEnfasis,
    };
  } finally {
    await browser.close();
  }
}

export async function scrapeAllPlans(): Promise<PlanEstudios[]> {
  const results: PlanEstudios[] = [];
  for (const plan of PLANS) {
    results.push(await scrapePlanEstudios(plan.url, plan.carrera));
  }
  return results;
}
