export function parseHTMLTemplate(htmlContent, name, description) {
  let parsedHtml = htmlContent;
  const sections = [];

  // Replace monthly title: e.g. "📅 May 2026" or "📅 April 2026"
  parsedHtml = parsedHtml.replace(/📅\s+[A-Za-z]+\s+\d{4}/g, '📅 {{monthYear}}');
  
  // Replace Headline: e.g. "Big month. Bigger wins. 🚀"
  parsedHtml = parsedHtml.replace(/Big month\. Bigger wins\. 🚀/g, '{{title}}');

  // Replace subhead / intro text
  const subheadText = 'Azure migration landed flawlessly, Cosmos keeps accelerating, and the team continues to deliver — here\'s the full story.';
  parsedHtml = parsedHtml.replace(subheadText, '{{intro}}');

  // Find indices for comment tags
  const platformIndex = htmlContent.indexOf('<!-- Platform & Billing -->');
  const cosmosIndex = htmlContent.indexOf('<!-- Cosmos -->');
  const presalesIndex = htmlContent.indexOf('<!-- Pre-Sales & Nexus -->');
  const gworkspaceIndex = htmlContent.indexOf('<!-- Google Workspace -->');
  const storesIndex = htmlContent.indexOf('<!-- Stores Azure -->');
  const qaIndex = htmlContent.indexOf('<!-- QA -->');
  const businessHeaderIndex = htmlContent.indexOf('<!-- ─── BUSINESS SECTION HEADER ─── -->');
  const awardsHeaderIndex = htmlContent.indexOf('<!-- ─── AWARDS SECTION HEADER ─── -->');
  const spotlightHeaderIndex = htmlContent.indexOf('<!-- ─── SPOTLIGHT SECTION HEADER ─── -->');
  const birthdaysHeaderIndex = htmlContent.indexOf('<!-- ─── BIRTHDAYS SECTION HEADER ─── -->');
  const eventsHeaderIndex = htmlContent.indexOf('<!-- ─── EVENTS SECTION HEADER ─── -->');
  const footerIndex = htmlContent.indexOf('<!-- ═══ FOOTER ═══ -->');

  const replaceUl = (startIndex, endIndex, sectionId, title, color, order) => {
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const sub = htmlContent.substring(startIndex, endIndex);
      const ulStart = sub.indexOf('<ul');
      const ulEnd = sub.lastIndexOf('</ul>');
      if (ulStart !== -1 && ulEnd !== -1) {
        const targetUl = sub.substring(ulStart, ulEnd + 5);
        parsedHtml = parsedHtml.replace(targetUl, `{{${sectionId}}}`);
        sections.push({ id: sectionId, title, enabled: true, color, order });
      }
    }
  };

  // Replace engineering section contents
  replaceUl(platformIndex, cosmosIndex, 'platform', 'Platform & Billing', '#0057b8', 1);
  replaceUl(cosmosIndex, presalesIndex !== -1 ? presalesIndex : htmlContent.indexOf('<!-- Engineering Cards Row 2 -->'), 'cosmos', 'Cosmos', '#6d28d9', 2);
  replaceUl(presalesIndex, gworkspaceIndex, 'presales', 'Pre-Sales & Nexus', '#059669', 3);
  replaceUl(gworkspaceIndex, storesIndex !== -1 ? storesIndex : htmlContent.indexOf('<!-- Engineering Cards Row 3 -->'), 'enterprise', 'Google Workspace', '#ea580c', 4);
  replaceUl(storesIndex, qaIndex, 'sre', 'Stores — Azure Migration', '#dc2626', 5);
  replaceUl(qaIndex, businessHeaderIndex, 'qa', 'QA Highlights', '#0284c7', 6);

  // Replace Team Activities (between Business Update and Awards Update)
  if (businessHeaderIndex !== -1 && awardsHeaderIndex !== -1) {
    const sub = htmlContent.substring(businessHeaderIndex, awardsHeaderIndex);
    const firstTableEnd = sub.indexOf('</table>');
    if (firstTableEnd !== -1) {
      const remainingSub = sub.substring(firstTableEnd + 8);
      const secondTableStart = remainingSub.indexOf('<table');
      const secondTableEnd = remainingSub.lastIndexOf('</table>');
      if (secondTableStart !== -1 && secondTableEnd !== -1) {
        const targetBlock = remainingSub.substring(secondTableStart, secondTableEnd + 8);
        parsedHtml = parsedHtml.replace(targetBlock, '{{activities}}');
        sections.push({ id: 'activities', title: 'Team Activities & Business', enabled: true, color: '#f97316', order: 7 });
      }
    }
  }

  // Replace Awards cards
  if (awardsHeaderIndex !== -1 && spotlightHeaderIndex !== -1) {
    const sub = htmlContent.substring(awardsHeaderIndex, spotlightHeaderIndex);
    const firstTableEnd = sub.indexOf('</table>');
    if (firstTableEnd !== -1) {
      const remainingSub = sub.substring(firstTableEnd + 8);
      const secondTableStart = remainingSub.indexOf('<table');
      const secondTableEnd = remainingSub.lastIndexOf('</table>');
      if (secondTableStart !== -1 && secondTableEnd !== -1) {
        const targetBlock = remainingSub.substring(secondTableStart, secondTableEnd + 8);
        parsedHtml = parsedHtml.replace(targetBlock, '{{awards}}');
        sections.push({ id: 'awards', title: 'Awards & Recognition', enabled: true, color: '#f59e0b', order: 8, headingOnly: true });
      }
    }
  }

  // Replace Spotlight
  if (spotlightHeaderIndex !== -1 && birthdaysHeaderIndex !== -1) {
    const sub = htmlContent.substring(spotlightHeaderIndex, birthdaysHeaderIndex);
    const firstTableEnd = sub.indexOf('</table>');
    if (firstTableEnd !== -1) {
      const remainingSub = sub.substring(firstTableEnd + 8);
      const secondTableStart = remainingSub.indexOf('<table');
      const secondTableEnd = remainingSub.lastIndexOf('</table>');
      if (secondTableStart !== -1 && secondTableEnd !== -1) {
        const targetBlock = remainingSub.substring(secondTableStart, secondTableEnd + 8);
        parsedHtml = parsedHtml.replace(targetBlock, '{{spotlight}}');
        sections.push({ id: 'spotlight', title: 'Monthly Spotlight', enabled: true, color: '#7c3aed', order: 9, headingOnly: true });
      }
    }
  }

  // Replace Birthdays (Only content table, keep header)
  if (birthdaysHeaderIndex !== -1 && eventsHeaderIndex !== -1) {
    const sub = htmlContent.substring(birthdaysHeaderIndex, eventsHeaderIndex);
    const firstTableEnd = sub.indexOf('</table>');
    if (firstTableEnd !== -1) {
      const remainingSub = sub.substring(firstTableEnd + 8);
      const secondTableStart = remainingSub.indexOf('<table');
      const secondTableEnd = remainingSub.lastIndexOf('</table>');
      if (secondTableStart !== -1 && secondTableEnd !== -1) {
        const targetBlock = remainingSub.substring(secondTableStart, secondTableEnd + 8);
        parsedHtml = parsedHtml.replace(targetBlock, '{{birthdays}}');
        sections.push({ id: 'birthdays', title: 'Birthdays', enabled: true, color: '#ec4899', order: 10, headingOnly: true });
      }
    }
    // Make month/year in header table dynamic
    parsedHtml = parsedHtml.replace(/Birthdays\s+—\s+[A-Za-z]+\s+\d{4}/g, 'Birthdays — {{monthYear}}');
  }

  // Replace Events (Only content table, keep header)
  if (eventsHeaderIndex !== -1 && footerIndex !== -1) {
    const sub = htmlContent.substring(eventsHeaderIndex, footerIndex);
    const firstTableEnd = sub.indexOf('</table>');
    if (firstTableEnd !== -1) {
      const remainingSub = sub.substring(firstTableEnd + 8);
      const secondTableStart = remainingSub.indexOf('<table');
      const secondTableEnd = remainingSub.lastIndexOf('</table>');
      if (secondTableStart !== -1 && secondTableEnd !== -1) {
        const targetBlock = remainingSub.substring(secondTableStart, secondTableEnd + 8);
        parsedHtml = parsedHtml.replace(targetBlock, '{{events}}');
        sections.push({ id: 'events', title: 'Upcoming Events', enabled: true, color: '#16a34a', order: 11, headingOnly: true });
      }
    }
    // Make month/year in header table dynamic
    parsedHtml = parsedHtml.replace(/Upcoming Events\s+—\s+[A-Za-z]+\s+\d{4}/g, 'Upcoming Events — {{monthYear}}');
  }

  return {
    name,
    description,
    sections,
    html: parsedHtml
  };
}
