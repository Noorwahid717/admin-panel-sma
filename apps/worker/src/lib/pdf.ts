export interface ReportSubjectComponent {
  id: string;
  name: string;
  weight: number;
  score: number;
}

export interface ReportSubjectSummary {
  id: string;
  name: string;
  averageScore: number | null;
  components: ReportSubjectComponent[];
}

export interface ReportPdfPayload {
  jobId: string;
  student: {
    id: string;
    name: string;
    nis: string;
    guardian?: string | null;
  };
  class: {
    id: string;
    name: string;
    level: number;
  };
  term: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
  subjects: ReportSubjectSummary[];
}

function renderSubjectRows(subjects: ReportSubjectSummary[]): string {
  return subjects
    .map((subject) => {
      const componentRows = subject.components
        .map(
          (component) => `
            <tr>
              <td>${component.name}</td>
              <td class="number">${component.weight}%</td>
              <td class="number">${component.score.toFixed(2)}</td>
            </tr>
          `
        )
        .join("");

      const averageText = subject.averageScore === null ? "-" : subject.averageScore.toFixed(2);

      return `
        <section class="subject">
          <h3>${subject.name}</h3>
          <table>
            <thead>
              <tr>
                <th>Komponen</th>
                <th class="number">Bobot</th>
                <th class="number">Nilai</th>
              </tr>
            </thead>
            <tbody>
              ${componentRows || '<tr><td colspan="3">Belum ada nilai</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Rata-rata</td>
                <td class="number">${averageText}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      `;
    })
    .join("");
}

export async function generateReportPdf(data: ReportPdfPayload): Promise<Buffer> {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Raport ${data.student.name}</title>
    <style>
      body { font-family: "Inter", "Segoe UI", Arial, sans-serif; margin: 40px; color: #111827; }
      header { margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
      h1 { font-size: 28px; margin: 0 0 8px; }
      h2 { font-size: 20px; margin: 24px 0 16px; }
      h3 { font-size: 18px; margin: 16px 0 12px; }
      dl { display: grid; grid-template-columns: 160px 1fr; row-gap: 8px; column-gap: 16px; margin: 0; }
      dt { font-weight: 600; color: #4b5563; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
      th { background: #f9fafb; font-weight: 600; }
      td.number, th.number { text-align: right; font-variant-numeric: tabular-nums; }
      tfoot td { font-weight: 600; background: #f9fafb; }
      section.subject { margin-bottom: 24px; }
      footer { margin-top: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    </style>
  </head>
  <body>
    <header>
      <h1>Rapor Semester</h1>
      <dl>
        <dt>Nama Siswa</dt>
        <dd>${data.student.name}</dd>
        <dt>NIS</dt>
        <dd>${data.student.nis}</dd>
        <dt>Wali</dt>
        <dd>${data.student.guardian ?? "-"}</dd>
        <dt>Kelas</dt>
        <dd>${data.class.name} (Level ${data.class.level})</dd>
        <dt>Periode</dt>
        <dd>${new Date(data.term.startDate).toLocaleDateString("id-ID")} - ${new Date(data.term.endDate).toLocaleDateString("id-ID")}</dd>
        <dt>Dibuat Pada</dt>
        <dd>${new Date(data.generatedAt).toLocaleString("id-ID")}</dd>
      </dl>
    </header>

    <section>
      <h2>Rekap Nilai</h2>
      ${renderSubjectRows(data.subjects)}
    </section>

    <footer>
      <p>Job ID: ${data.jobId}</p>
    </footer>
  </body>
</html>`;

  // TODO: swap out with real HTML -> PDF engine (e.g., Playwright/Puppeteer)
  return Buffer.from(html, "utf-8");
}
