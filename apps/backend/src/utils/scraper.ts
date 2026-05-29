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

    // Helper to evaluate and extract rows from the table
    const getTableRows = async (): Promise<string[][]> => {
      return page.evaluate(`
        Array.from(document.querySelectorAll("#tabla_horarios tr")).map(function (tr) {
          var tds = tr.querySelectorAll("td");
          if (tds.length === 0) return [];
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
        }).filter(row => row.length > 0);
      `);
    };

    // Scrape Theory (default load)
    const rawTheoryRows = await getTableRows();

    // Scrape Laboratories
    let rawLabRows: string[][] = [];
    try {
      // Select Laboratories option ('L')
      await page.selectOption("#cmbHor", "L");
      
      // Wait for network and DOM update
      try {
        await page.waitForLoadState("networkidle", { timeout: 4000 });
      } catch (e) {
        // Ignore if timeout occurs
      }
      await page.waitForTimeout(1500);

      // Scrape Laboratories
      rawLabRows = await getTableRows();
    } catch (err) {
      console.warn("Error scraping laboratories, continuing with theory rows only:", err);
    }

    // Merge rows
    const allRawRows = [...rawTheoryRows, ...rawLabRows];

    const horarios: ScheduleRow[] = allRawRows.map((r) => {
      const diasRaw = [r[3], r[4], r[5], r[6], r[7], r[8]];
      const dias = diasRaw.map((d) => (d ? 1 : 0));
      const horario = diasRaw.find((d) => d !== "") ?? "";
      const grupoRaw = r[0].split(" ");

      const rawProf = r[9] ? r[9].trim() : "";
      // Handle unassigned professor naming robustly by returning an empty string
      const isUnassigned = 
        rawProf === "" || 
        rawProf === "-" || 
        rawProf === "." || 
        rawProf === "--- POR DEFINIR ---" ||
        rawProf.toLowerCase() === "sin asignar" ||
        rawProf.toLowerCase().includes("por definir");

      const profesor = isUnassigned ? "" : rawProf;

      return {
        materia: grupoRaw[0] ?? "",
        grupo: grupoRaw[1] ?? "",
        tip: r[1] === "L" ? "LAB" : r[1],
        horario,
        dias,
        profesor,
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
