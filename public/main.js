document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const API_ENDPOINTS = {
    USERS: '/api/users',
    CALLS: '/api/calls',
    HEALTH: '/api/health'
  };
  
  const CALL_TYPES = {
    INBOUND: 'inbound',
    OUTBOUND: 'outbound',
    MISSED: 'missed',
    ALL: 'all'
  };

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
  const statusIndicator = document.createElement('div');
  
  // Add status indicator to page
  document.querySelector('.container').prepend(statusIndicator);
  statusIndicator.className = 'alert alert-info mb-3';
  statusIndicator.innerHTML = 'Checking API connection...';

  // Set default dates
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  startDateInput.valueAsDate = oneWeekAgo;
  endDateInput.valueAsDate = today;

  // Store application state
  const appState = {
    users: [],
    callData: [],
    currentFilter: CALL_TYPES.ALL,
    isLoading: false
  };

  // Check API health and fetch users on load
  checkApiHealth()
    .then(() => fetchUsers())
    .catch(error => {
      console.error('Startup error:', error);
      statusIndicator.className = 'alert alert-danger mb-3';
      statusIndicator.innerHTML = `<strong>Error:</strong> ${error.message}`;
    });

  // Event listeners
  filterForm.addEventListener('submit', handleFormSubmit);
  selectAllBtn.addEventListener('click', selectAllUsers);
  deselectAllBtn.addEventListener('click', deselectAllUsers);
  filterAll.addEventListener('click', () => filterCalls(CALL_TYPES.ALL));
  filterInbound.addEventListener('click', () => filterCalls(CALL_TYPES.INBOUND));
  filterOutbound.addEventListener('click', () => filterCalls(CALL_TYPES.OUTBOUND));
  filterMissed.addEventListener('click', () => filterCalls(CALL_TYPES.MISSED));

  /**
   * Check API health status
   * @returns {Promise<void>}
   */
  async function checkApiHealth() {
    try {
      const response = await fetch(API_ENDPOINTS.HEALTH);
      const data = await response.json();
      
      if (data.status === 'healthy') {
        statusIndicator.className = 'alert alert-success mb-3';
        statusIndicator.innerHTML = `<strong>API Connected:</strong> Authenticated as ${data.api.user}`;
        setTimeout(() => {
          statusIndicator.style.display = 'none';
        }, 5000);
      } else {
        throw new Error('API connection unhealthy');
      }
    } catch (error) {
      console.error('API health check failed:', error);
      statusIndicator.className = 'alert alert-warning mb-3';
      statusIndicator.innerHTML = '<strong>Warning:</strong> API connection check failed. Some features may not work properly.';
      throw error;
    }
  }

  /**
   * Fetch users from API
   * @returns {Promise<void>}
   */
  async function fetchUsers() {
    try {
      userList.innerHTML = `
        <div class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading users...</span>
          </div>
          <p>Loading users...</p>
        </div>
      `;
      
      const response = await fetch(API_ENDPOINTS.USERS);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        userList.innerHTML = '<p class="text-center">No users found</p>';
        return;
      }
      
      appState.users = data.items;
      renderUserList();
    } catch (error) {
      console.error('Error fetching users:', error);
      userList.innerHTML = `
        <div class="alert alert-danger">
          <strong>Error:</strong> ${error.message}
          <button class="btn btn-sm btn-outline-danger mt-2" onclick="fetchUsers()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Render the user list
   */
  function renderUserList() {
    if (appState.users.length === 0) {
      userList.innerHTML = '<p class="text-center">No users found</p>';
      return;
    }

    userList.innerHTML = appState.users.map(user => `
      <div class="form-check">
        <input class="form-check-input user-checkbox" type="checkbox" value="${user.id}" id="user-${user.id}">
        <label class="form-check-label" for="user-${user.id}">
          ${user.displayName || (user.firstName + ' ' + user.lastName)}
        </label>
      </div>
    `).join('');
  }

  /**
   * Select all users
   */
  function selectAllUsers() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  }

  /**
   * Deselect all users
   */
  function deselectAllUsers() {
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  }

  /**
   * Get selected user IDs
   * @returns {string[]} Array of selected user IDs
   */
  function getSelectedUsers() {
    const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.value);
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const limit = limitInput.value || 100;
    const selectedUsers = getSelectedUsers();
    
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    appState.isLoading = true;
    loading.style.display = 'block';
    callList.innerHTML = '';
    
    try {
      // Format dates properly
      const formattedStartDate = `${startDate}T00:00:00.000Z`;
      const formattedEndDate = `${endDate}T23:59:59.999Z`;
      
      // Fetch call data for each selected user
      const callPromises = selectedUsers.map(userId => 
        fetchUserCalls(userId, formattedStartDate, formattedEndDate, Math.min(limit, 200))
      );
      
      const results = await Promise.all(callPromises);
      
      // Combine all call data
      appState.callData = results.flat().sort((a, b) => 
        new Date(b.time || b.startTime) - new Date(a.time || a.startTime)
      );
      
      renderCallData();
      updateCallStats();
    } catch (error) {
      console.error('Error fetching call data:', error);
      callList.innerHTML = `
        <div class="alert alert-danger">
          <h5>Error fetching call data:</h5>
          <p>${error.message || 'Unknown error'}</p>
          <p>Please check your connection and try again.</p>
        </div>
      `;
    } finally {
      appState.isLoading = false;
      loading.style.display = 'none';
    }
  }

  /**
   * Fetch call data for a specific user
   * @param {string} userId - User ID
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Object[]>} Call data
   */
  async function fetchUserCalls(userId, startDate, endDate, limit) {
    try {
      console.log(`Fetching calls for user ${userId} from ${startDate} to ${endDate}`);
      
      const url = new URL(API_ENDPOINTS.CALLS, window.location.origin);
      url.searchParams.append('userId', userId);
      url.searchParams.append('startDate', startDate);
      url.searchParams.append('endDate', endDate);
      url.searchParams.append('limit', limit);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch call data');
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }
      
      // Add user info to each call record
      const user = appState.users.find(u => u.id === userId);
      const userName = user ? (user.displayName || `${user.firstName} ${user.lastName}`) : 'Unknown User';
      
      return data.items.map(call => ({
        ...call,
        userName
      }));
    } catch (error) {
      console.error(`Error fetching calls for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Render call data
   */
  function renderCallData() {
    if (appState.callData.length === 0) {
      callList.innerHTML = '<p class="text-center text-muted">No call history found for the selected criteria</p>';
      return;
    }

    const filteredCalls = filterCallsByType(appState.callData, appState.currentFilter);
    
    if (filteredCalls.length === 0) {
      callList.innerHTML = '<p class="text-center text-muted">No calls match the selected filter</p>';
      return;
    }

    callList.innerHTML = filteredCalls.map(call => {
      const startTime = new Date(call.time || call.startTime);
      const formattedDate = startTime.toLocaleDateString();
      const formattedTime = startTime.toLocaleTimeString();
      
      let duration = 'N/A';
      if (call.duration) {
        const minutes = Math.floor(call.duration / 60);
        const seconds = call.duration % 60;
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      // Determine call type and class
      const { typeDisplay, typeClass } = getCallTypeInfo(call);
      
      // Extract caller and called info
      const fromNumber = call.from || call.number || call.callerNumber || 'Unknown';
      const toNumber = call.to || call.calledNumber || 'Unknown';
      const callerName = call.name || call.callerName || '';
      
      return `
        <div class="call-item">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="call-type ${typeClass}">${typeDisplay}</span>
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

  /**
   * Get call type display info
   * @param {Object} call - Call record
   * @returns {Object} Call type display information
   */
  function getCallTypeInfo(call) {
    let typeDisplay = 'Unknown';
    let typeClass = '';
    
    if (call.type === 'received' || call.callType === 'in') {
      if (call.disposition === 'missed' || call.type === 'missed') {
        typeDisplay = 'Missed';
        typeClass = 'call-missed';
      } else {
        typeDisplay = 'Inbound';
        typeClass = 'call-inbound';
      }
    } else if (call.type === 'placed' || call.callType === 'out') {
      typeDisplay = 'Outbound';
      typeClass = 'call-outbound';
    }
    
    return { typeDisplay, typeClass };
  }

  /**
   * Filter calls by type
   * @param {Object[]} calls - Call records
   * @param {string} filterType - Filter type
   * @returns {Object[]} Filtered call records
   */
  function filterCallsByType(calls, filterType) {
    if (filterType === CALL_TYPES.ALL) {
      return calls;
    }
    
    return calls.filter(call => {
      const isMissed = call.disposition === 'missed' || call.type === 'missed';
      const isInbound = call.callType === 'in' || call.type === 'received';
      const isOutbound = call.callType === 'out' || call.type === 'placed';
      
      if (filterType === CALL_TYPES.INBOUND) {
        return isInbound && !isMissed;
      } else if (filterType === CALL_TYPES.OUTBOUND) {
        return isOutbound;
      } else if (filterType === CALL_TYPES.MISSED) {
        return isMissed;
      }
      
      return true;
    });
  }

  /**
   * Set call filter
   * @param {string} filterType - Filter type
   */
  function filterCalls(filterType) {
    appState.currentFilter = filterType;
    
    // Update active button
    [filterAll, filterInbound, filterOutbound, filterMissed].forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
    });
    
    const filterMap = {
      [CALL_TYPES.ALL]: filterAll,
      [CALL_TYPES.INBOUND]: filterInbound,
      [CALL_TYPES.OUTBOUND]: filterOutbound,
      [CALL_TYPES.MISSED]: filterMissed
    };
    
    const activeButton = filterMap[filterType];
    if (activeButton) {
      activeButton.classList.remove('btn-outline-primary');
      activeButton.classList.add('active', 'btn-primary');
    }
    
    renderCallData();
  }

  /**
   * Update call statistics
   */
  function updateCallStats() {
    if (appState.callData.length === 0) {
      callStats.innerHTML = '<p>No data available</p>';
      return;
    }

    // Count call types
    const totalCalls = appState.callData.length;
    const inboundCalls = filterCallsByType(appState.callData, CALL_TYPES.INBOUND).length;
    const outboundCalls = filterCallsByType(appState.callData, CALL_TYPES.OUTBOUND).length;
    const missedCalls = filterCallsByType(appState.callData, CALL_TYPES.MISSED).length;
    
    // Calculate total duration
    let totalDuration = 0;
    appState.callData.forEach(call => {
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

  /**
   * Format phone number for display
   * @param {string} phoneStr - Phone number
   * @returns {string} Formatted phone number
   */
  function formatPhoneNumber(phoneStr) {
    if (!phoneStr) return 'Unknown';
    
    // Extract digits
    const digits = phoneStr.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // Return original if not standard format
    return phoneStr;
  }
});