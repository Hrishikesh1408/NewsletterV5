export function compileNewsletterHTML(templateHtml, newsletter) {
  let compiledHtml = templateHtml;

  const getFieldContent = (key) => {
    if (newsletter.dynamicContent && newsletter.dynamicContent[key] !== undefined) {
      return newsletter.dynamicContent[key];
    }
    return newsletter[key] || '';
  };

  // Replace global fields
  compiledHtml = compiledHtml.replace(/\{\{title\}\}/g, newsletter.title || 'Newsletter');
  compiledHtml = compiledHtml.replace(/\{\{intro\}\}/g, getFieldContent('intro') || getFieldContent('mainContent') || '');
  
  // Compile Upcoming Events List
  let eventsContent = '';
  const upcomingEvents = newsletter.upcomingEventsList || [];
  if (upcomingEvents.length > 0) {
    const eventGradients = [
      { bg: 'linear-gradient(135deg, #14532d, #166534)' }, // Dark Green
      { bg: 'linear-gradient(135deg, #0c4a6e, #075985)' }, // Blue/Teal
      { bg: 'linear-gradient(135deg, #4c1d95, #5b21b6)' }, // Purple
      { bg: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }, // Dark Red
    ];
    
    eventsContent = upcomingEvents.map((event, index) => {
      const style = eventGradients[index % eventGradients.length];
      const isFullWidth = index === upcomingEvents.length - 1 && upcomingEvents.length % 2 !== 0;
      return `
        <td width="${isFullWidth ? '100%' : '50%'}" style="padding:${isFullWidth ? '16px 20px 24px 20px' : (index % 2 !== 0 ? '16px 20px 24px 8px' : '16px 8px 24px 20px')}; display:inline-block; vertical-align:top; box-sizing: border-box;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: ${style.bg}; border-radius:10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr><td style="padding:18px;">
              <p style="margin:0 0 6px 0; font-size:22px;">${event.icon || '📅'}</p>
              <p style="margin:0 0 4px 0; font-size:13px; font-weight:700; color:#ffffff;">${event.title}</p>
              <p style="margin:0; font-size:11px; color:rgba(255,255,255,0.7); font-weight:600; text-transform:uppercase; letter-spacing:.5px;">${event.date}</p>
            </td></tr>
          </table>
        </td>
      `;
    }).join('');
    
    eventsContent = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          ${eventsContent}
        </tr>
      </table>
    `;
  } else {
    // Fallback to legacy string field if no list is present
    let legacyEvents = getFieldContent('events') || '';
    if (legacyEvents) {
      eventsContent = `
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:16px 20px 24px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #14532d, #166534); border-radius:10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding:20px 24px; color: #ffffff; font-size: 14px; line-height: 1.6;">
                    ${legacyEvents}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;
    }
  }
  
  if (eventsContent) {
    compiledHtml = compiledHtml.replace(/\{\{events\}\}/g, eventsContent);
  } else {
    compiledHtml = compiledHtml.replace(/<!-- ─── EVENTS SECTION HEADER ─── -->[\s\S]*?\{\{events\}\}/i, '');
    compiledHtml = compiledHtml.replace(/\{\{events\}\}/g, '');
  }

  let notesContent = getFieldContent('notes') || getFieldContent('ownerNotes') || '';
  if (notesContent) {
    compiledHtml = compiledHtml.replace(/\{\{notes\}\}/g, notesContent);
  } else {
    compiledHtml = compiledHtml.replace(/<!-- ─── NOTES SECTION HEADER ─── -->[\s\S]*?\{\{notes\}\}/i, '');
    compiledHtml = compiledHtml.replace(/\{\{notes\}\}/g, '');
  }
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  compiledHtml = compiledHtml.replace(/\{\{monthYear\}\}/g, monthYear);

  // Dynamically compile Engineering Cards to prevent empty boxes from showing
  const engStartMarker = '<!-- Engineering Cards Row 1 -->';
  const engEndMarker = '<!-- ─── BUSINESS SECTION HEADER ─── -->';
  const engStartIdx = compiledHtml.indexOf(engStartMarker);
  const engEndIdx = compiledHtml.indexOf(engEndMarker);

  if (engStartIdx !== -1 && engEndIdx !== -1) {
    const activeDepts = [
      { id: 'platform', title: '🧱 Platform & Billing', gradient: 'linear-gradient(135deg, #0057b8, #0080d4)', borderColor: '#e2ecf8', bgCell: '#fafcff' },
      { id: 'cosmos', title: '🤖 Cosmos', gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', borderColor: '#e8e2f8', bgCell: '#fdfaff' },
      { id: 'presales', title: '🛍️ Pre-Sales & Nexus', gradient: 'linear-gradient(135deg, #059669, #10b981)', borderColor: '#e2f5e2', bgCell: '#f7fdf9' },
      { id: 'enterprise', title: '🌈 Google Workspace', gradient: 'linear-gradient(135deg, #ea580c, #f97316)', borderColor: '#fce8d5', bgCell: '#fffaf7' },
      { id: 'sre', title: '🏬 Stores — Azure Migration', gradient: 'linear-gradient(135deg, #dc2626, #f43f5e)', borderColor: '#fce2e2', bgCell: '#fff8f8' },
      { id: 'qa', title: '🧪 QA Highlights', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)', borderColor: '#e2f0fc', bgCell: '#f7fbff' }
    ].map(dept => ({ ...dept, content: getFieldContent(dept.id) || '' })).filter(dept => dept.content.trim() !== '');

    if (activeDepts.length === 0) {
      const headerMarker = '<!-- ─── ENGINEERING SECTION HEADER ─── -->';
      const headerIdx = compiledHtml.indexOf(headerMarker);
      if (headerIdx !== -1) {
        compiledHtml = compiledHtml.substring(0, headerIdx) + compiledHtml.substring(engEndIdx);
      } else {
        compiledHtml = compiledHtml.substring(0, engStartIdx) + '\n            ' + compiledHtml.substring(engEndIdx);
      }
    } else {
      let dynamicEngHtml = '';
      for (let i = 0; i < activeDepts.length; i += 2) {
        const card1 = activeDepts[i];
        const card2 = activeDepts[i + 1];
        dynamicEngHtml += `
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr valign="top">
                <td class="column-50" width="50%" style="padding:16px 8px 8px 20px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-radius:10px; overflow:hidden; border:1px solid ${card1.borderColor};">
                    <tr><td style="background: ${card1.gradient}; padding:12px 16px;">
                      <p style="margin:0; font-size:13px; font-weight:700; color:#ffffff;">${card1.title}</p>
                    </td></tr>
                    <tr><td style="padding:14px 16px; background:${card1.bgCell};">
                      <div style="margin:0; color:#374151; font-size:12px; line-height:1.75;">
                        ${card1.content}
                      </div>
                    </td></tr>
                  </table>
                </td>
        `;
        if (card2) {
          dynamicEngHtml += `
                <td class="column-50" width="50%" style="padding:16px 20px 8px 8px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-radius:10px; overflow:hidden; border:1px solid ${card2.borderColor};">
                    <tr><td style="background: ${card2.gradient}; padding:12px 16px;">
                      <p style="margin:0; font-size:13px; font-weight:700; color:#ffffff;">${card2.title}</p>
                    </td></tr>
                    <tr><td style="padding:14px 16px; background:${card2.bgCell};">
                      <div style="margin:0; color:#374151; font-size:12px; line-height:1.75;">
                        ${card2.content}
                      </div>
                    </td></tr>
                  </table>
                </td>
          `;
        } else {
          dynamicEngHtml += `
                <td class="column-50" width="50%" style="padding:16px 20px 8px 8px;"></td>
          `;
        }
        dynamicEngHtml += `
              </tr>
            </table>
        `;
      }
      
      // Replace the static grid block with our new dynamically flowing block
      compiledHtml = compiledHtml.substring(0, engStartIdx) + dynamicEngHtml + '\n            ' + compiledHtml.substring(engEndIdx);
    }
  }

  // Replace standard updates fields
  const standardFields = ['platform', 'cosmos', 'presales', 'qa', 'sre', 'enterprise', 'activities'];
  standardFields.forEach(field => {
    let content = getFieldContent(field) || '';
    
    // Compile Business Topics if this is the activities section
    if (field === 'activities') {
      let businessTopicsHtml = '';
      const bTopics = newsletter.businessTopics || [];
      if (bTopics.length > 0) {
        const cardGradients = [
          { bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', icon: '🚀' },
          { bg: 'linear-gradient(135deg, #064e3b, #065f46)', icon: '💳' },
          { bg: 'linear-gradient(135deg, #7c2d12, #9a3412)', icon: '📍' },
          { bg: 'linear-gradient(135deg, #4c1d95, #6d28d9)', icon: '✨' },
        ];
        
        businessTopicsHtml = bTopics.map((topic, index) => {
          const style = cardGradients[index % cardGradients.length];
          const isFullWidth = index === 0;
          return `
            <table border="0" cellpadding="0" cellspacing="0" width="${isFullWidth ? '100%' : '50%'}" style="display:inline-block; vertical-align:top;">
              <tr>
                <td style="padding:${isFullWidth ? '16px 20px 8px 20px' : (index % 2 !== 0 ? '8px 8px 16px 20px' : '8px 20px 16px 8px')}; box-sizing: border-box; width: 100%;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: ${style.bg}; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding:20px 24px; color: #ffffff; font-size: 14px; line-height: 1.6;">
                        <p style="margin:0 0 4px 0; font-size:10px; font-weight:700; color:rgba(255,255,255,0.7); letter-spacing:2px; text-transform:uppercase;">${topic.icon || style.icon} ${topic.category || 'BUSINESS TOPIC'}</p>
                        ${topic.title ? `<p style="margin:0 0 14px 0; font-size:18px; font-weight:800; color:#ffffff;">${topic.title}</p>` : ''}
                        <div style="font-size: 13px;">${topic.content}</div>
                        ${topic.link ? `<p style="margin:14px 0 0 0; font-size:12px;"><a href="${topic.link}" style="color:#818cf8;">Read More &rarr;</a></p>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `;
        }).join('');
        
        // Wrap all topics in a container
        businessTopicsHtml = `
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td>
              ${businessTopicsHtml}
            </td></tr>
          </table>
        `;
      }
      
      // Render team activities below business topics
      let activitiesHtml = '';
      if (content) {
        activitiesHtml = `
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:16px 20px 8px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #be123c, #e11d48); border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding:20px 24px; color: #ffffff; font-size: 14px; line-height: 1.6;">
                      <p style="margin:0 0 4px 0; font-size:10px; font-weight:700; color:rgba(255,255,255,0.7); letter-spacing:2px; text-transform:uppercase;">🎯 TEAM ACTIVITIES</p>
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `;
      }
      
      content = businessTopicsHtml + activitiesHtml;
    }
    
    if (content) {
      const regex = new RegExp(`\\{\\{${field}\\}\\}`, 'g');
      compiledHtml = compiledHtml.replace(regex, content);
    } else {
      if (field === 'activities') {
        compiledHtml = compiledHtml.replace(/<!-- ─── BUSINESS SECTION HEADER ─── -->[\s\S]*?\{\{activities\}\}/i, '');
      }
      const regex = new RegExp(`\\{\\{${field}\\}\\}`, 'g');
      compiledHtml = compiledHtml.replace(regex, '');
    }
  });

  // Replace Dashboard Metrics
  const metricsDefaults = {
    storefrontDowntime: '0',
    globalComponents: '90%',
    ecpFunctionality: '80%',
    productionReleases: '4+'
  };
  Object.keys(metricsDefaults).forEach(metric => {
    const regex = new RegExp(`\\{\\{${metric}\\}\\}`, 'g');
    compiledHtml = compiledHtml.replace(regex, getFieldContent(metric) || metricsDefaults[metric]);
  });

  // Compile Awards
  if (compiledHtml.includes('{{awards}}')) {
    let awardsHtml = '';
    const awardsList = newsletter.awards || [];
    if (awardsList.length > 0) {
      awardsHtml = awardsList.map(award => `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #fbfbfb;">
          <tr>
            <td style="padding: 15px; text-align: center;">
              <img src="${award.photo || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="${award.name}" width="100" height="100" style="border-radius: 50%; display: block; margin: 0 auto 10px; object-fit: cover;" />
              <h4 style="margin: 10px 0 5px;">${award.name}</h4>
              <p style="margin: 0; color: #555;"><em>${award.role}</em></p>
              <p style="margin: 5px 0; font-size: 15px; color: #0039A7;"><strong>🏅 ${award.type}</strong></p>
              <div style="font-size: 14px; text-align: justify; padding-top: 10px;">${award.description}</div>
            </td>
          </tr>
        </table>
      `).join('');
    } else if (newsletter.dynamicContent && newsletter.dynamicContent.awards) {
      awardsHtml = newsletter.dynamicContent.awards;
    }
    if (awardsHtml) {
      compiledHtml = compiledHtml.replace(/\{\{awards\}\}/g, awardsHtml);
    } else {
      compiledHtml = compiledHtml.replace(/<!-- ─── AWARDS SECTION HEADER ─── -->[\s\S]*?\{\{awards\}\}/i, '');
      compiledHtml = compiledHtml.replace(/\{\{awards\}\}/g, '');
    }
  }

  // Compile Spotlight
  if (compiledHtml.includes('{{spotlight}}')) {
    let spotlightHtml = '';
    const spotlightList = newsletter.spotlight || [];
    if (spotlightList.length > 0) {
      spotlightHtml = spotlightList.map(person => `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; margin-bottom: 30px;">
          <tr>
            <td align="center" style="padding-bottom: 15px;">
              <img src="${person.photo || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="${person.name}" style="width: 200px; height: 200px; border-radius: 8px; object-fit: cover;" />
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top;">
              <h3 style="margin: 5px 0;">Meet ${person.name}</h3>
              <p style="margin: 4px 0;"><strong style="color: #0039A7;">Role:</strong> ${person.role}</p>
              <p style="margin: 4px 0;"><strong style="color: #0039A7;">Tenure:</strong> ${person.tenure}</p>
              <p style="margin: 4px 0;"><strong style="color: #0039A7;">Key Project:</strong> ${person.project}</p>
              <p style="margin: 4px 0;"><strong style="color: #0039A7;">Tech Stack:</strong> ${person.tech}</p>
              ${person.quote ? `
                <div style="margin: 15px 0; padding: 15px; background-color: #f5f7fc; border-left: 4px solid #0039A7; font-style: italic;">
                  "${person.quote}"
                </div>
              ` : ''}
              ${person.growth ? `
                <p style="margin: 10px 0;"><strong style="color: #0039A7;">Growth Story:</strong></p>
                <div style="font-size: 13px; line-height: 1.4;">${person.growth}</div>
              ` : ''}
              ${person.reason ? `
                <p style="margin: 10px 0;"><strong style="color: #0039A7;">Reason for Spotlight:</strong></p>
                <div style="font-size: 13px; line-height: 1.4;">${person.reason}</div>
              ` : ''}
            </td>
          </tr>
        </table>
      `).join('');
    } else if (newsletter.dynamicContent && newsletter.dynamicContent.spotlight) {
      spotlightHtml = newsletter.dynamicContent.spotlight;
    }
    if (spotlightHtml) {
      compiledHtml = compiledHtml.replace(/\{\{spotlight\}\}/g, spotlightHtml);
    } else {
      compiledHtml = compiledHtml.replace(/<!-- ─── SPOTLIGHT SECTION HEADER ─── -->[\s\S]*?\{\{spotlight\}\}/i, '');
      compiledHtml = compiledHtml.replace(/\{\{spotlight\}\}/g, '');
    }
  }

  // Compile Birthdays
  if (compiledHtml.includes('{{birthdays}}')) {
    let birthdaysHtml = '';
    const birthdaysList = newsletter.birthdays || [];
    if (birthdaysList.length > 0) {
      birthdaysHtml = `
        <table width="100%" cellpadding="10" cellspacing="0" border="0">
          ${birthdaysList.map(b => `
          <tr>
            <td style="padding: 10px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right: 15px;"><img src="${b.image || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="${b.name}" width="60" height="60" style="border-radius: 50%; object-fit: cover;" /></td>
                  <td valign="top" style="font-size: 14px;">
                    <strong>${b.name}</strong> ${b.date ? `– ${new Date(b.date).toLocaleDateString()}` : ''}<br />
                    <div style="font-size: 13px; color: #555; padding-top: 3px;">${b.wishes || 'Wishing you an amazing year ahead! 🎉'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join('')}
        </table>
      `;
    } else if (newsletter.dynamicContent && newsletter.dynamicContent.birthdays) {
      birthdaysHtml = newsletter.dynamicContent.birthdays;
    }
    if (birthdaysHtml) {
      compiledHtml = compiledHtml.replace(/\{\{birthdays\}\}/g, birthdaysHtml);
    } else {
      compiledHtml = compiledHtml.replace(/<!-- ─── BIRTHDAYS SECTION HEADER ─── -->[\s\S]*?\{\{birthdays\}\}/i, '');
      compiledHtml = compiledHtml.replace(/\{\{birthdays\}\}/g, '');
    }
  }

  // Compile Joiners
  if (compiledHtml.includes('{{joiners}}')) {
    let joinersHtml = '';
    const joinersList = newsletter.joiners || [];
    if (joinersList.length > 0) {
      joinersHtml = `
        <table width="100%" cellpadding="10" cellspacing="0" border="0">
          <tr>
            ${joinersList.map(j => `
            <td valign="top" style="text-align: center; width: 33%;">
              <img src="${j.image || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" alt="${j.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
              <p style="margin: 10px 0 0;">
                <strong>${j.name}</strong><br>
                <span style="font-size: 12px; color: #666;">${j.role}</span>
              </p>
            </td>
            `).join('')}
          </tr>
        </table>
      `;
    } else if (newsletter.dynamicContent && newsletter.dynamicContent.joiners) {
      joinersHtml = newsletter.dynamicContent.joiners;
    }
    if (joinersHtml) {
      compiledHtml = compiledHtml.replace(/\{\{joiners\}\}/g, joinersHtml);
    } else {
      compiledHtml = compiledHtml.replace(/<!-- ─── JOINERS SECTION HEADER ─── -->[\s\S]*?\{\{joiners\}\}/i, '');
      compiledHtml = compiledHtml.replace(/\{\{joiners\}\}/g, '');
    }
  }

  // Clean up remaining unused placeholders
  compiledHtml = compiledHtml.replace(/\{\{[a-zA-Z0-9_-]+\}\}/g, '');

  return compiledHtml;
}

export function getDefaultTemplateHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{{title}}</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9;">
    <tr>
      <td align="center">
        <table width="800" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 900px; width: 100%;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <img 
                src="https://sep.turbifycdn.com/nrp/image/turbify/newturbifylogo.png" 
                alt="Turbify Logo" 
                style="width: 80px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #0039A7; color: white; padding: 10px 10px 5px 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Monthly Newsletter | {{monthYear}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              <h2 style="color: #0039A7; margin: 0 0 10px; font-size: 20px;">👋 Hello Team,</h2>
              <div style="margin: 0 0 10px; font-size: 16px; text-align: justify">{{intro}}</div>
            </td>
          </tr>

          <!-- Platform Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>Platform Updates</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{platform}}
            </td>
          </tr>

          <!-- Presales Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>Pre-Sales Updates</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{presales}}
            </td>
          </tr>

          <!-- QA Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>QA Updates</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{qa}}
            </td>
          </tr>

          <!-- SRE Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>SRE Updates</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{sre}}
            </td>
          </tr>

          <!-- Enterprise Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>Enterprise Updates</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{enterprise}}
            </td>
          </tr>

          <!-- Cosmos Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>Cosmos Updates</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{cosmos}}
            </td>
          </tr>

          <!-- Activities Section -->
          <tr>
            <td style="padding: 15px;">
              <h3 style="font-size: 18px; color: #0039A7"><center>Team Building Activities & Business</center></h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd;">
              {{activities}}
            </td>
          </tr>

          <!-- Awards Section -->
          <tr>
            <td style="padding: 15px; font-size: 14px;">
              <h2 style="margin: 0 0 20px; color: #0039A7; font-size: 20px; text-align: center;">🏆 Awards & Performer of the Month</h2>
              {{awards}}
            </td>
          </tr>

          <!-- Spotlight Section -->
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd; font-size: 14px;">
              <h2 style="text-align: center; color: #0039A7;">Monthly Spotlight</h2>
              {{spotlight}}
            </td>
          </tr>

          <!-- Birthdays and Joiners Section -->
          <tr>
            <td style="border-bottom: 1px solid #ddd; font-size: 14px; padding: 20px;">
              <h2 style="text-align: center; color: #0039A7;">🎉 New Joiners & Birthdays</h2>
              <h3 style="color: #0039A7; border-bottom: 1px solid #eee; padding-bottom: 5px;">👋 Welcome to the Team!</h3>
              {{joiners}}
              <h3 style="color: #0039A7; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px;">🎂 Happy Birthday To:</h3>
              {{birthdays}}
            </td>
          </tr>

          <!-- Events Section -->
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd; font-size: 14px;">
              <h2 style="color: #0039A7; margin: 0 0 10px;">📅 Upcoming Events</h2>
              <div style="line-height: 1.5;">{{events}}</div>
            </td>
          </tr>

          <!-- Notes Section -->
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #ddd; font-size: 14px;">
              <h2 style="color: #0039A7; margin: 0 0 10px;">📝 Notes</h2>
              <div style="line-height: 1.5;">{{notes}}</div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #0039A7; color: white; padding: 15px; text-align: center;">
              <p style="margin: 0; font-size: 14px;">Let's keep the momentum going — here's to another successful month! 🚀</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
