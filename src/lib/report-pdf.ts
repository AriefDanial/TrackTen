import PDFDocument from "pdfkit";

type RowStaff = { name: string; email: string; department: string };

export type ReportPdfAttendance = {
  timestamp: Date;
  type: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  staff: RowStaff;
};

export type ReportPdfApplication = {
  startDate: Date;
  endDate: Date;
  type: string;
  status: string;
  reason: string | null;
  createdAt: Date;
  staff: RowStaff;
};

const MARGIN = 40;
const ROW = 11;
const PAGE_BOTTOM = 800;

function trunc(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function buildReportPdf(params: {
  fromStr: string;
  toStr: string;
  generatedAt: string;
  staffCount: number;
  attendance: ReportPdfAttendance[];
  applications: ReportPdfApplication[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: MARGIN, size: "A4" });
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = MARGIN;

    doc.fontSize(16).font("Helvetica-Bold").text("TrackTen report", MARGIN, y, { align: "center", width: doc.page.width - 2 * MARGIN });
    y += 28;

    doc.fontSize(9).font("Helvetica");
    doc.text(`Period: ${params.fromStr} to ${params.toStr}`, MARGIN, y);
    y += ROW;
    doc.text(`Generated (UTC): ${params.generatedAt}`, MARGIN, y);
    y += ROW + 6;

    doc.text(`Total staff: ${params.staffCount}`, MARGIN, y);
    y += ROW;
    doc.text(`Attendance records (in range): ${params.attendance.length}`, MARGIN, y);
    y += ROW;
    doc.text(`Leave / MC applications (overlapping range): ${params.applications.length}`, MARGIN, y);
    y += ROW + 12;

    const drawAttendanceHeader = () => {
      doc.fontSize(10).font("Helvetica-Bold").text("Attendance", MARGIN, y);
      y += ROW + 2;
      doc.fontSize(7).font("Helvetica-Bold");
      doc.text("Date", MARGIN, y);
      doc.text("Staff", MARGIN + 52, y);
      doc.text("Dept", MARGIN + 132, y);
      doc.text("Type", MARGIN + 162, y);
      doc.text("Time (UTC)", MARGIN + 200, y);
      doc.text("Location / notes", MARGIN + 288, y);
      y += ROW + 2;
      doc.font("Helvetica");
    };

    const drawApplicationsHeader = () => {
      doc.fontSize(10).font("Helvetica-Bold").text("Leave / MC applications", MARGIN, y);
      y += ROW + 2;
      doc.fontSize(7).font("Helvetica-Bold");
      doc.text("Staff", MARGIN, y);
      doc.text("Dept", MARGIN + 100, y);
      doc.text("Type", MARGIN + 132, y);
      doc.text("Start", MARGIN + 162, y);
      doc.text("End", MARGIN + 232, y);
      doc.text("Status", MARGIN + 302, y);
      doc.text("Reason", MARGIN + 342, y);
      y += ROW + 2;
      doc.font("Helvetica");
    };

    drawAttendanceHeader();

    for (const a of params.attendance) {
      if (y + ROW > PAGE_BOTTOM) {
        doc.addPage();
        y = MARGIN;
        drawAttendanceHeader();
      }
      const ts = a.timestamp.toISOString().replace("T", " ").slice(0, 19);
      const loc =
        a.address?.trim() ||
        (a.latitude != null && a.longitude != null
          ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`
          : "—");
      const day = a.timestamp.toISOString().slice(0, 10);
      doc.fontSize(7);
      doc.text(trunc(day, 12), MARGIN, y);
      doc.text(trunc(a.staff.name, 18), MARGIN + 52, y);
      doc.text(trunc(a.staff.department, 6), MARGIN + 132, y);
      doc.text(a.type === "check_in" ? "in" : "out", MARGIN + 162, y);
      doc.text(trunc(ts, 22), MARGIN + 200, y);
      doc.text(trunc(loc, 42), MARGIN + 288, y);
      y += ROW;
    }

    y += 10;
    if (y + ROW * 3 > PAGE_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }

    drawApplicationsHeader();

    for (const app of params.applications) {
      if (y + ROW > PAGE_BOTTOM) {
        doc.addPage();
        y = MARGIN;
        drawApplicationsHeader();
      }
      const sStart = app.startDate.toISOString().slice(0, 10);
      const sEnd = app.endDate.toISOString().slice(0, 10);
      doc.fontSize(7);
      doc.text(trunc(app.staff.name, 22), MARGIN, y);
      doc.text(trunc(app.staff.department, 6), MARGIN + 100, y);
      doc.text(app.type === "mc" ? "MC" : "Leave", MARGIN + 132, y);
      doc.text(sStart, MARGIN + 162, y);
      doc.text(sEnd, MARGIN + 232, y);
      doc.text(trunc(app.status, 10), MARGIN + 302, y);
      doc.text(trunc(app.reason ?? "—", 38), MARGIN + 342, y);
      y += ROW;
    }

    doc.end();
  });
}
