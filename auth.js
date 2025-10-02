// Role-based access control
let userRole = 'admin';
let userData = null;

// Get user data from localStorage
try {
  userData = JSON.parse(localStorage.getItem('userData') || '{}');
  userRole = userData.role || 'admin';
} catch (e) {
  userRole = 'admin';
}

const rolePermissions = {
  owner: {
    pages: ['journal', 'template', 'admin', 'dept_forms', 'preview', 'profile', 'awards-dashboard', 'activity-log'],
    sections: ['all']
  },
  admin: {
    pages: ['journal', 'template', 'admin', 'dept_forms', 'preview', 'awards-dashboard', 'activity-log'],
    sections: ['all']
  },
  platform: {
    pages: ['dept_forms'],
    sections: ['platform']
  },
  presales: {
    pages: ['dept_forms'],
    sections: ['presales']
  },
  qa: {
    pages: ['dept_forms'],
    sections: ['qa']
  },
  enterprise: {
    pages: ['dept_forms'],
    sections: ['enterprise']
  },
  sre: {
    pages: ['dept_forms'],
    sections: ['sre']
  }
};

function hasPageAccess(page) {
  return rolePermissions[userRole]?.pages.includes(page) || false;
}

function hasSectionAccess(section) {
  const userSections = rolePermissions[userRole]?.sections || [];
  return userSections.includes('all') || userSections.includes(section);
}

function filterNavigation() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const page = href.replace('.html', '');
      if (!hasPageAccess(page)) {
        link.style.display = 'none';
      }
    }
  });
  
  addProfileDropdown();
}

function addProfileDropdown() {
  const profileBtn = document.querySelector('.bg-center.bg-no-repeat.aspect-square.bg-cover.rounded-full');
  if (!profileBtn || document.getElementById('profile-dropdown')) return;
  
  const dropdown = document.createElement('div');
  dropdown.id = 'profile-dropdown';
  dropdown.className = 'absolute right-0 top-full mt-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg hidden z-50';
  dropdown.style.minWidth = '150px';
  
  const userInfo = userData ? `${userData.firstName} (${userData.role})` : 'User';
  dropdown.innerHTML = `
    <div class="px-4 py-2 border-b border-neutral-700 text-sm text-neutral-300">${userInfo}</div>
    <button onclick="logout()" class="w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700">Logout</button>
  `;
  
  const container = profileBtn.parentElement;
  container.style.position = 'relative';
  container.appendChild(dropdown);
  
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });
  
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });
}

function filterSections() {
  if (userRole === 'owner' || userRole === 'admin') return;
  
  const sections = document.querySelectorAll('.form-section');
  sections.forEach(section => {
    const heading = section.querySelector('h2');
    if (heading) {
      const text = heading.textContent.toLowerCase();
      let sectionType = null;
      
      if (text.includes('platform')) sectionType = 'platform';
      else if (text.includes('pre-sales')) sectionType = 'presales';
      else if (text.includes('qa') || text.includes('quality')) sectionType = 'qa';
      else if (text.includes('enterprise')) sectionType = 'enterprise';
      else if (text.includes('sre') || text.includes('reliability')) sectionType = 'sre';
      
      if (sectionType && !hasSectionAccess(sectionType)) {
        section.style.display = 'none';
      } else if (!sectionType && userRole !== 'owner' && userRole !== 'admin') {
        section.style.display = 'none';
      }
    }
  });
  
  if (userRole !== 'owner' && userRole !== 'admin') {
    addSaveButton();
  }
}

function addSaveButton() {
  if (document.getElementById('team-save-btn')) return;
  
  const saveBtn = document.createElement('button');
  saveBtn.id = 'team-save-btn';
  saveBtn.className = 'fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 z-50';
  saveBtn.innerHTML = 'Save Changes';
  saveBtn.onclick = async () => {
    try {
      await autoSave();
      alert('Changes saved successfully!');
    } catch (error) {
      alert('Failed to save changes');
    }
  };
  document.body.appendChild(saveBtn);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  window.location.href = 'login.html';
}

window.logout = logout;

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  
  filterNavigation();
  setTimeout(filterSections, 1000);
  setTimeout(checkProjectSelection, 500);
});

function checkProjectSelection() {
  const currentProject = localStorage.getItem('currentProject');
  
  // Team users must always select project on login
  if (['platform', 'presales', 'qa', 'enterprise', 'sre'].includes(userRole)) {
    showProjectSelectionModal();
  } else if (!currentProject) {
    // Owner/Admin only see modal if no project selected
    showProjectSelectionModal();
  }
}

async function showProjectSelectionModal() {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();
    
    if (projects.length === 0) {
      // Only owners/admins can create projects
      if (userRole === 'owner' || userRole === 'admin') {
        const createResponse = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Default Newsletter Project',
            description: 'Default project for team collaboration',
            template: 'turbify'
          })
        });
        const result = await createResponse.json();
        if (result.success) {
          localStorage.setItem('currentProject', result.project._id);
        }
      } else {
        // Team users must wait for admin to create projects
        showNoProjectsMessage();
      }
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'project-selection-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4 border border-neutral-700">
        <h3 class="text-xl font-bold text-white mb-4">Select Project</h3>
        <p class="text-neutral-400 mb-4">Choose which newsletter project you want to work on:</p>
        <div class="space-y-2 mb-6">
          ${projects.map(project => `
            <button onclick="selectProjectGlobal('${project._id}')" 
                    class="w-full text-left p-3 bg-neutral-700 hover:bg-neutral-600 rounded border border-neutral-600 text-white">
              <div class="font-medium">${project.name}</div>
              <div class="text-sm text-neutral-400">${project.description || 'No description'}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

function selectProjectGlobal(projectId) {
  localStorage.setItem('currentProject', projectId);
  const modal = document.getElementById('project-selection-modal');
  if (modal) {
    document.body.removeChild(modal);
  }
  location.reload();
}

function showNoProjectsMessage() {
  const modal = document.createElement('div');
  modal.id = 'no-projects-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-neutral-800 rounded-lg p-6 w-full max-w-md mx-4 border border-neutral-700">
      <h3 class="text-xl font-bold text-white mb-4">No Projects Available</h3>
      <p class="text-neutral-400 mb-4">No newsletter projects have been created yet. Please contact your administrator to create a project before you can start working.</p>
      <div class="flex gap-3">
        <button onclick="logout()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
        <button onclick="refreshProjects()" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function refreshProjects() {
  const modal = document.getElementById('no-projects-modal');
  if (modal) {
    document.body.removeChild(modal);
  }
  setTimeout(checkProjectSelection, 100);
}

window.selectProjectGlobal = selectProjectGlobal;
window.refreshProjects = refreshProjects;