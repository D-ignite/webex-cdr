document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const filterForm = document.getElementById('filterForm');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const limitInput = document.getElementById('limit');
  const userList = document.getElementById('userList');
  const callList = document.getElementById('callList');
  const callStats = document.getElementById('callStats');
  const loading = document.getElementById('loading');
  const selectAllBtn = document.getElementById('selectAllUsers');
  const deselectAllBtn = document.getElementById('deselectAllUsers');
  const filterAll = document.getElementById('filterAll');
  const filterInbound = document.getElementById('filterInbound');
  const filterOutbound = document.getElementById('filterOutbound');
  const filterMissed = document.getElementById('filterMissed');

  // Set default dates
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 7); // Default to last 7 days
  
  startDateInput.valueAsDate = yesterday;
  endDateInput.valueAsDate = today;

  // Store users and call data
  let users = [];
  let callData = [];
  let currentFilter = 'all';

  // Fetch users
  fetchUsers();

  // Event listeners
  filterForm.addEventListener('submit', handleFormSubmit);
  selectAllBtn.addEventListener('click', selectAllUsers);
  deselectAllBtn.addEventListener('click', deselectAllUsers);
  filterAll.addEventListener('click', () => filterCalls('all'));
  filterInbound.addEventListener('click', () => filterCalls('inbound'));
  filterOutbound.addEventListener('click', () => filterCalls('outbound'));
  filterMissed.addEventListener('click', () => filterCalls('missed'));

  // Functions
  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.error) {
        userList.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        return;
      }
      
      users = data.items || [];
      renderUserList();
    } catch (error) {
      userList.innerHTML = `<div class="alert alert-danger">Failed to fetch users: ${error.message}</div>`;
    }
  }

  function renderUserList() {
    if (users.length === 0) {
      userList.innerHTML = '<p>No users found</p>';
      return;
    }

    userList.innerHTML = users.map(user => `
      <div class="form-check">
        <input class="form-check-input user-checkbox" type="checkbox" value="${user.id}" id="user-${user.id}">
        <label class="form-check-label" for="user-${user.id}">
          ${user.displayName || user.firstName + ' ' + user.lastName}
        </label>
      </div>
    `).join('');
  }

  function selectAllUsers() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  }

  function deselectAllUsers() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  }

  function getSelectedUsers() {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.value);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const limit = limitInput.value;
    const selectedUsers = getSelectedUsers();
    
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    // If no users selected, show warning
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    // Set loading state
    loading.style.display = 'block';
    callList.innerHTML = '';
    
    try {
      // Fetch call data for each selected user
      const callPromises = selectedUsers.map(userId => 
        fetchUserCalls(userId, startDate, endDate, Math.min(limit, 100))
      );
      
      const results = await Promise.all(callPromises);
      
      // Combine all call data
      callData = results.flat().sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
      
      renderCallData();
      updateCallStats();
    } catch (error) {
      console.error('Error details:', error);
      callList.innerHTML = `<div class="alert alert-danger">
        <h5>Error fetching call data:</h5>
        <p>${error.message || 'Unknown error'}</p>
        <p>Check the console for more details or try again with different parameters.</p>
      </div>`;
    } finally {
      loading.style.display = 'none';
    }
  }

  async function fetchUserCalls(userId, startDate, endDate, limit) {
    try {
      // Format dates according to ISO 8601
      const formattedStartDate = `${startDate}T00:00:00.000Z`;
      const formattedEndDate = `${endDate}T23:59:59.999Z`;
      console.log(`Fetching calls for user ${userId} from ${formattedStartDate} to ${formattedEndDate}`);
      
      const response = await fetch(`/api/cdr?userId=${userId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&limit=${limit}`);
      const data = await response.json();
      
      if (data.error) {
        console.error(`Error for user ${userId}:`, data.error);
        throw new Error(data.error);
      }
      
      return (data.items || []).map(call => {
        // Add user info to the call data
        const user = users.find(u => u.id === userId);
        return {
          ...call,
          userName: user ? (user.displayName || `${user.firstName} ${user.lastName}`) : 'Unknown User'
        };
      });
    } catch (error) {
      console.error(`Error fetching calls for user ${userId}:`, error);
      throw error;
    }
  }

  function renderCallData() {
    if (callData.length === 0) {
      callList.innerHTML = '<p class="text-center text-muted">No call history found for the selected criteria</p>';
      return;
    }

    const filteredCalls = filterCallsByType(callData, currentFilter);
    
    if (filteredCalls.length === 0) {
      callList.innerHTML = '<p class="text-center text-muted">No calls match the selected filter</p>';
      return;
    }

    callList.innerHTML = filteredCalls.map(call => {
      // Handle the new telephony API format
      const startTime = new Date(call.time || call.startTime);
      const formattedDate = startTime.toLocaleDateString();
      const formattedTime = startTime.toLocaleTimeString();
      
      let duration = 'N/A';
      if (call.duration) {
        const minutes = Math.floor(call.duration / 60);
        const seconds = call.duration % 60;
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      let callType = 'Unknown';
      let typeClass = '';
      
      // Map the telephony API call types to our internal types
      if (call.type === 'received' || call.callType === 'in') {
        callType = 'Inbound';
        typeClass = 'call-inbound';
      } else if (call.type === 'placed' || call.callType === 'out') {
        callType = 'Outbound';
        typeClass = 'call-outbound';
      } else if (call.type === 'missed') {
        callType = 'Inbound (Missed)';
        typeClass = 'call-missed';
      }
      
      // Also check the disposition field from the old API format
      if (call.disposition === 'missed') {
        callType = 'Inbound (Missed)';
        typeClass = 'call-missed';
      }

      // Extract caller and called info based on API format
      const fromNumber = call.from || call.number || call.callerNumber || 'Unknown';
      const toNumber = call.to || call.calledNumber || 'Unknown';
      const callerName = call.name || call.callerName || '';
      
      return `
        <div class="call-item">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="call-type ${typeClass}">${callType}</span>
              <span class="call-time">${formattedDate} ${formattedTime}</span>
              <span class="call-duration ms-2">Duration: ${duration}</span>
            </div>
            <div class="text-end">
              <small>User: ${call.userName}</small>
            </div>
          </div>
          <div class="mt-1">
            <div><small>From: ${formatPhoneNumber(fromNumber)} ${callerName ? `(${callerName})` : ''}</small></div>
            <div><small>To: ${formatPhoneNumber(toNumber)}</small></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function filterCallsByType(calls, filterType) {
    if (filterType === 'all') {
      return calls;
    }
    
    return calls.filter(call => {
      // Support both old and new API formats
      if (filterType === 'inbound') {
        return (call.callType === 'in' || call.type === 'received') && 
               call.disposition !== 'missed' && 
               call.type !== 'missed';
      } else if (filterType === 'outbound') {
        return call.callType === 'out' || call.type === 'placed';
      } else if (filterType === 'missed') {
        return call.disposition === 'missed' || call.type === 'missed';
      }
      return true;
    });
  }

  function filterCalls(filterType) {
    currentFilter = filterType;
    
    // Update active button
    [filterAll, filterInbound, filterOutbound, filterMissed].forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
    });
    
    const activeButton = document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
    activeButton.classList.remove('btn-outline-primary');
    activeButton.classList.add('active', 'btn-primary');
    
    renderCallData();
  }

  function updateCallStats() {
    if (callData.length === 0) {
      callStats.innerHTML = '<p>No data available</p>';
      return;
    }

    const totalCalls = callData.length;
    // Use same logic as filterCallsByType, supporting both API formats
    const inboundCalls = callData.filter(call => 
      (call.callType === 'in' || call.type === 'received') && 
      call.disposition !== 'missed' && 
      call.type !== 'missed'
    ).length;
    const outboundCalls = callData.filter(call => 
      call.callType === 'out' || call.type === 'placed'
    ).length;
    const missedCalls = callData.filter(call => 
      call.disposition === 'missed' || call.type === 'missed'
    ).length;
    
    // Calculate total duration
    let totalDuration = 0;
    callData.forEach(call => {
      if (call.duration) {
        totalDuration += call.duration;
      }
    });
    
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const seconds = totalDuration % 60;
    
    const formattedDuration = `${hours}h ${minutes}m ${seconds}s`;

    callStats.innerHTML = `
      <div class="mb-3">
        <div class="fw-bold">Total Calls: ${totalCalls}</div>
        <div>Inbound: ${inboundCalls}</div>
        <div>Outbound: ${outboundCalls}</div>
        <div>Missed: ${missedCalls}</div>
      </div>
      <div>
        <div class="fw-bold">Total Talk Time</div>
        <div>${formattedDuration}</div>
      </div>
    `;
  }

  function formatPhoneNumber(phoneStr) {
    if (!phoneStr) return '';
    
    // Extract just the digits
    const digits = phoneStr.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // If not a standard format, return original
    return phoneStr;
  }
});