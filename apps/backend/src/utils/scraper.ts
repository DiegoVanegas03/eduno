import { chromium } from "playwright";

export interface ScheduleRow {
  grupo: string;
  tip: string;
  materia: string;
  horario: string;
  dias: number[];
  profesor: string;
  docencia: string;
  salon: string;
  ocupacion: string;
}

interface ScraperResult {
  area: string;
  total: number;
  horarios: ScheduleRow[];
}

const URL = "https://inscripciones.ing.uaslp.mx/imat_v6/horarios/horarios.php";

function cleanText(text: string | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export async function scrapeHorarios(areaCode: number = 2): Promise<ScraperResult> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(URL, { waitUntil: "networkidle" });

    await page.selectOption("#cmbArea", String(areaCode));

    await page.waitForFunction(
      `document.querySelector("#tabla_horarios") && document.querySelector("#tabla_horarios").children.length > 0`,
      { timeout: 15000 },
    );

    const areaLabel = cleanText(
      await page.evaluate(
        `document.querySelector('#cmbArea option[value="${areaCode}"]')?.textContent ?? ""`,
      ),
    );

    const rawRows: string[][] = await page.evaluate(`
      Array.from(document.querySelectorAll("#tabla_horarios tr")).map(function (tr) {
        var tds = tr.querySelectorAll("td");
        return [
          (tds[0]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[1]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[2]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[3]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[4]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[5]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[6]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[7]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[8]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[9]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          tds[10]?.getAttribute("title") ?? "",
          (tds[11]?.textContent ?? "").replace(/\\s+/g, " ").trim(),
          (tds[12]?.textContent ?? "").replace(/\\s+/g, " ").trim()
        ];
      })
    `);

    const horarios: ScheduleRow[] = rawRows.map((r) => {
      const diasRaw = [r[3], r[4], r[5], r[6], r[7], r[8]];
      const dias = diasRaw.map((d) => (d ? 1 : 0));
      const horario = diasRaw.find((d) => d !== "") ?? "";
      const grupoRaw = r[0].split(" ");
      return {
        materia: grupoRaw[0] ?? "",
        grupo: grupoRaw[1] ?? "",
        tip: r[1],
        horario,
        dias,
        profesor: r[9],
        docencia: r[10],
        salon: r[11],
        ocupacion: r[12],
      };
    });

    return {
      area: areaLabel,
      total: horarios.length,
      horarios,
    };
  } finally {
    await browser.close();
  }
}
