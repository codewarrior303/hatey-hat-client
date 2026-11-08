import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ParticipantItem {
  _id: string;
  userName: string;
  userEmail: string;
  joinedAt: string | Date;
}

export interface EventRosterMeta {
  _id: string;
  title: string;
  eventType: string;
  eventDate: string | Date;
  location: string;
  creatorName: string;
  creatorEmail: string;
}

export function generateEventParticipantsPDF(
  event: EventRosterMeta,
  participants: ParticipantItem[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. BRAND HEADER
  doc.setFillColor(17, 24, 39); // #111827 deep charcoal
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("HATEY HAT", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(209, 213, 219);
  doc.text("Community-Driven Social Events & Disaster Relief Platform", margin, 18);
  doc.text("Hatey Hat, ekshathe poth chola", margin, 23);

  // Right-aligned header badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL PARTICIPANT ROSTER", pageWidth - margin, 12, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(209, 213, 219);
  const genDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${genDate}`, pageWidth - margin, 18, { align: "right" });
  doc.text(`Event ID: ${String(event._id).slice(-8).toUpperCase()}`, pageWidth - margin, 23, {
    align: "right",
  });

  // 2. EVENT DETAILS SUMMARY CARD
  const cardTop = 34;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cardTop, pageWidth - margin * 2, 38, 2, 2, "FD");

  // Event Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleText = doc.splitTextToSize(event.title, pageWidth - margin * 2 - 12);
  doc.text(titleText[0] || event.title, margin + 6, cardTop + 8);

  // Metadata Grid
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Category:", margin + 6, cardTop + 16);
  doc.text("Date & Time:", margin + 6, cardTop + 22);
  doc.text("Location:", margin + 6, cardTop + 28);
  doc.text("Organizer:", margin + 6, cardTop + 34);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(event.eventType, margin + 28, cardTop + 16);
  const eventDateStr = new Date(event.eventDate).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(eventDateStr, margin + 28, cardTop + 22);
  doc.text(event.location, margin + 28, cardTop + 28);
  doc.text(`${event.creatorName} (${event.creatorEmail})`, margin + 28, cardTop + 34);

  // Total count pill (right side of card)
  const pillX = pageWidth - margin - 50;
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(pillX, cardTop + 12, 44, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text(String(participants.length), pillX + 22, cardTop + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(79, 70, 229);
  doc.text("Total Volunteers", pillX + 22, cardTop + 26, { align: "center" });

  // 3. TABLE OF PARTICIPANTS
  const tableData = participants.map((p, index) => {
    const joinDate = new Date(p.joinedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      String(index + 1),
      p.userName || "Anonymous",
      p.userEmail,
      joinDate,
      "Confirmed",
    ];
  });

  autoTable(doc, {
    startY: cardTop + 43,
    head: [["#", "Volunteer Name", "Email Address", "Registration Date", "Status"]],
    body: tableData,
    margin: { left: margin, right: margin, bottom: 20 },
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // #1e293b
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 54 },
      2: { cellWidth: 62 },
      3: { cellWidth: 34 },
      4: { cellWidth: 20, halign: "center", fontStyle: "bold", textColor: [16, 185, 129] },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // 4. FOOTER ON EVERY A4 PAGE
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "One community, One Bangladesh.",
        margin,
        pageHeight - 7
      );

      doc.text(
        `Page ${currentPage} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: "right" }
      );
    },
  });

  // Sanitize filename
  const cleanTitle = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 35);
  doc.save(`hatey-hat-volunteers-${cleanTitle}.pdf`);
}
