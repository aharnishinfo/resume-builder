const form = document.getElementById("resumeForm");
const resumeSheet = document.getElementById("resumeSheet");
const pageStatus = document.getElementById("pageStatus");
const downloadPdfButton = document.getElementById("downloadPdf");
const downloadPngButton = document.getElementById("downloadPng");
let resumeOverflowsPage = false;

const fields = {
  fullName: document.getElementById("fullName"),
  jobRole: document.getElementById("jobRole"),
  phone: document.getElementById("phone"),
  email: document.getElementById("email"),
  location: document.getElementById("location"),
  linkedin: document.getElementById("linkedin"),
  github: document.getElementById("github"),
  hackerrank: document.getElementById("hackerrank"),
  summary: document.getElementById("summary"),
  education: document.getElementById("education"),
  projects: document.getElementById("projects"),
  experience: document.getElementById("experience"),
  skills: document.getElementById("skills"),
  certifications: document.getElementById("certifications"),
  languages: document.getElementById("languages"),
};

const preview = {
  name: document.getElementById("previewName"),
  role: document.getElementById("previewRole"),
  phone: document.getElementById("previewPhone"),
  phoneLink: document.getElementById("previewPhoneLink"),
  email: document.getElementById("previewEmail"),
  emailLink: document.getElementById("previewEmailLink"),
  location: document.getElementById("previewLocation"),
  linkedin: document.getElementById("previewLinkedin"),
  summary: document.getElementById("previewSummary"),
  education: document.getElementById("previewEducation"),
  projects: document.getElementById("previewProjects"),
  experience: document.getElementById("previewExperience"),
  skills: document.getElementById("previewSkills"),
  certifications: document.getElementById("previewCertifications"),
  onlineLinks: document.getElementById("previewOnlineLinks"),
  languages: document.getElementById("previewLanguages"),
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanUrl(url) {
  const value = url.trim();
  if (!value) return "#";

  try {
    const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "#";
  } catch {
    return "#";
  }
}

function shortLink(url) {
  try {
    return cleanUrl(url).replace(/^https?:\/\//, "").replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

function lines(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildEducationEntries(raw) {
  return lines(raw)
    .map((line) => {
      const [degree = "", school = "", dates = "", location = "", marks = ""] = line.split("|");
      const safeDates = escapeHtml(dates.trim());
      const safeLocation = escapeHtml(location.trim());

      return `
        <article class="entry">
          <div class="entry-title">${escapeHtml(degree.trim())}</div>
          ${school ? `<div class="entry-subtitle">${escapeHtml(school.trim())}</div>` : ""}
          ${
            safeDates || safeLocation
              ? `<div class="entry-meta">${safeDates}${safeDates && safeLocation ? ` <span>&bull;</span> ` : ""}${safeLocation}</div>`
              : ""
          }
          ${marks ? `<div class="entry-marks">&bull; ${escapeHtml(marks.trim())}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function buildProjectEntries(raw) {
  return raw
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const blockLines = lines(block);
      const [title = "", ...points] = blockLines;
      const bullets = points
        .map((point) => point.replace(/^[\u2022\-*o]\s*/, "").trim())
        .filter(Boolean)
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join("");

      return `
        <article class="entry project-entry">
          <div class="entry-title project-title">${escapeHtml(title)}</div>
          ${bullets ? `<ul class="bullet-list project-bullets">${bullets}</ul>` : ""}
        </article>
      `;
    })
    .join("");
}

function buildExperienceEntries(raw) {
  return lines(raw)
    .map((line) => {
      const [title = "", company = "", dates = "", location = "", ...points] = line.split("|");
      const bullets = points
        .map((point) => point.trim())
        .filter(Boolean)
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join("");

      return `
        <article class="entry">
          <div class="entry-title">${escapeHtml(title.trim())}</div>
          ${company ? `<div class="entry-subtitle">${escapeHtml(company.trim())}</div>` : ""}
          ${
            dates || location
              ? `<div class="entry-meta">${escapeHtml(dates.trim())}${dates && location ? ` <span>&bull;</span> ` : ""}${escapeHtml(location.trim())}</div>`
              : ""
          }
          ${bullets ? `<ul class="bullet-list">${bullets}</ul>` : ""}
        </article>
      `;
    })
    .join("");
}

function buildCertificationEntries(raw) {
  return lines(raw)
    .map((line) => {
      const [title = "", issuer = ""] = line.split("|");
      return `
        <article class="entry certification-entry">
          <div class="entry-title certification-title">${escapeHtml(title.trim())}</div>
          ${issuer ? `<div class="entry-source certification-source">${escapeHtml(issuer.trim())}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function buildSkills(raw) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((skill) => `<span class="skill-chip">${escapeHtml(skill)}</span>`)
    .join("");
}

function buildLanguages(raw) {
  const languageItems = raw.includes("\n")
    ? raw.split("\n")
    : raw.split(",");

  return languageItems
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [language = "", level = ""] = item.split("|").map((part) => part.trim());

      return `
        <div class="language-item">
          <span class="language-name">${escapeHtml(language)}</span>
          ${level ? `<span class="language-level">${escapeHtml(level)}</span>` : ""}
        </div>
      `;
    })
    .join("");
}

function buildOnlineLink(label, url) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return "";
  }

  const iconKey = label.toLowerCase();
  const icons = {
    linkedin: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.48 8.25h4V24h-4V8.25Zm7.55 0h3.83v2.15h.05c.53-1 1.83-2.35 3.77-2.35 4.03 0 4.77 2.65 4.77 6.1V24h-4v-8.73c0-2.08-.04-4.76-2.9-4.76-2.9 0-3.35 2.27-3.35 4.61V24h-4V8.25Z"/>
      </svg>
    `,
    github: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .5a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.08 1.83 2.82 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.79c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"/>
      </svg>
    `,
    hackerrank: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1.4 21.2 6.7v10.6L12 22.6 2.8 17.3V6.7L12 1.4Zm-3.5 6v9.2h2.2v-3.5h2.6v3.5h2.2V7.4h-2.2v3.4h-2.6V7.4H8.5Z"/>
      </svg>
    `,
  };

  return `
    <a class="profile-link" href="${cleanUrl(trimmedUrl)}" target="_blank" rel="noreferrer">
      <span class="profile-icon profile-icon-${iconKey}" aria-hidden="true">${icons[iconKey] || ""}</span>
      <span class="profile-text">
        <span class="profile-name">${escapeHtml(label)}</span>
        <span class="profile-url">${escapeHtml(shortLink(trimmedUrl))}</span>
      </span>
    </a>
  `;
}

function checkPageFit() {
  const overflowBuffer = 1;
  const heightDifference = resumeSheet.clientHeight - resumeSheet.scrollHeight;
  const widthDifference = resumeSheet.clientWidth - resumeSheet.scrollWidth;
  resumeOverflowsPage =
    heightDifference < -overflowBuffer || widthDifference < -overflowBuffer;

  resumeSheet.classList.toggle("is-overflowing", resumeOverflowsPage);
  downloadPdfButton.disabled = resumeOverflowsPage;
  downloadPngButton.disabled = resumeOverflowsPage;
  pageStatus.classList.toggle("is-warning", resumeOverflowsPage);

  if (resumeOverflowsPage) {
    const overflowAmount = Math.max(
      Math.abs(Math.min(heightDifference, 0)),
      Math.abs(Math.min(widthDifference, 0))
    );
    pageStatus.textContent = `A4 page overflow: remove about ${Math.ceil(overflowAmount)} px of content before downloading.`;
    return;
  }

  pageStatus.textContent = `A4 page ready: about ${Math.max(0, Math.floor(heightDifference))} px vertical space left.`;
}

function updatePreview() {
  preview.name.textContent = fields.fullName.value.trim() || "YOUR NAME";
  preview.role.textContent = fields.jobRole.value.trim() || "Your Role";
  preview.phone.textContent = fields.phone.value.trim();
  preview.phoneLink.href = fields.phone.value.trim()
    ? `tel:${fields.phone.value.replace(/[^+\d]/g, "")}`
    : "#";
  preview.email.textContent = fields.email.value.trim();
  preview.emailLink.href = fields.email.value.trim()
    ? `mailto:${fields.email.value.trim()}`
    : "#";
  preview.location.textContent = fields.location.value.trim();
  preview.summary.textContent = fields.summary.value.trim();

  preview.linkedin.href = cleanUrl(fields.linkedin.value.trim());
  preview.linkedin.lastElementChild.textContent = shortLink(fields.linkedin.value.trim());

  preview.education.innerHTML = buildEducationEntries(fields.education.value);
  preview.projects.innerHTML = buildProjectEntries(fields.projects.value);
  preview.experience.innerHTML = buildExperienceEntries(fields.experience.value);
  preview.skills.innerHTML = buildSkills(fields.skills.value);
  preview.certifications.innerHTML = buildCertificationEntries(fields.certifications.value);
  preview.onlineLinks.innerHTML = [
    buildOnlineLink("LinkedIn", fields.linkedin.value),
    buildOnlineLink("GitHub", fields.github.value),
    buildOnlineLink("HackerRank", fields.hackerrank.value),
  ].filter(Boolean).join("");
  preview.languages.innerHTML = buildLanguages(fields.languages.value);
  requestAnimationFrame(checkPageFit);
}

async function generateCanvas() {
  checkPageFit();

  if (resumeOverflowsPage) {
    throw new Error("Resume content exceeds one A4 page.");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  checkPageFit();

  if (resumeOverflowsPage) {
    throw new Error("Resume content exceeds one A4 page.");
  }

  resumeSheet.classList.add("export-mode");

  try {
    return await html2canvas(resumeSheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: resumeSheet.clientWidth,
      height: resumeSheet.clientHeight,
      windowWidth: resumeSheet.clientWidth,
      windowHeight: resumeSheet.clientHeight,
    });
  } finally {
    resumeSheet.classList.remove("export-mode");
  }
}

async function downloadPNG() {
  if (resumeOverflowsPage) {
    checkPageFit();
    return;
  }

  const canvas = await generateCanvas();
  const link = document.createElement("a");
  link.download = `${(fields.fullName.value.trim() || "resume").replace(/\s+/g, "_")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function downloadPDF() {
  if (resumeOverflowsPage) {
    checkPageFit();
    return;
  }

  const canvas = await generateCanvas();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageData = canvas.toDataURL("image/png");

  pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);

  // The visual resume is rendered as an image. Add a real, invisible text layer
  // so PDF readers and ATS parsers can select and extract the resume content.
  const atsSections = [
    fields.fullName.value.trim(),
    fields.jobRole.value.trim(),
    [fields.phone.value, fields.email.value, fields.location.value].filter(Boolean).join(" | "),
    [fields.linkedin.value, fields.github.value, fields.hackerrank.value].filter(Boolean).join(" | "),
    "PROFESSIONAL SUMMARY",
    fields.summary.value.trim(),
    "EXPERIENCE",
    fields.experience.value.replaceAll("|", " | ").trim(),
    "EDUCATION",
    fields.education.value.replaceAll("|", " | ").trim(),
    "PROJECTS",
    fields.projects.value.trim(),
    "SKILLS",
    fields.skills.value.trim(),
    "CERTIFICATIONS",
    fields.certifications.value.replaceAll("|", " | ").trim(),
    "LANGUAGES",
    fields.languages.value.replaceAll("|", " | ").trim(),
  ].filter(Boolean);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(atsSections.join("\n"), 8, 8, {
    maxWidth: pageWidth - 16,
    renderingMode: "invisible",
  });

  // html2canvas cannot preserve anchors, so recreate every link as a PDF
  // annotation at the same location as its visible counterpart.
  const sheetRect = resumeSheet.getBoundingClientRect();
  const scaleX = pageWidth / sheetRect.width;
  const scaleY = pageHeight / sheetRect.height;

  resumeSheet.querySelectorAll("a[href]").forEach((anchor) => {
    const url = anchor.href;
    if (!url || url.endsWith("#")) return;

    const rect = anchor.getBoundingClientRect();
    pdf.link(
      (rect.left - sheetRect.left) * scaleX,
      (rect.top - sheetRect.top) * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      { url }
    );
  });

  pdf.save(`${(fields.fullName.value.trim() || "resume").replace(/\s+/g, "_")}.pdf`);
}

form.addEventListener("input", updatePreview);
window.addEventListener("resize", checkPageFit);
downloadPngButton.addEventListener("click", downloadPNG);
downloadPdfButton.addEventListener("click", downloadPDF);

updatePreview();
