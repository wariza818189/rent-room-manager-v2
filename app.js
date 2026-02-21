// ============================================================
//  RENT ROOM MANAGER — app.js
//  Data saved to localStorage (this device only)
// ============================================================

const STORAGE_KEY = "rent-room-manager-data";

// Status config
const STATUS = {
  paid:    { bg: "#d1fae5", color: "#065f46", label: "✅ Paid" },
  unpaid:  { bg: "#fee2e2", color: "#991b1b", label: "❌ Unpaid" },
  partial: { bg: "#fef9c3", color: "#92400e", label: "⚠️ Partial" },
};

// App state
let rooms        = [];
let currentView  = "dashboard";
let editingRoom  = null;
let viewingRoom  = null;
let searchVal    = "";
let filterVal    = "all";

// ===== DATA HELPERS =====

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    rooms = saved ? JSON.parse(saved) : [];
  } catch (e) {
    rooms = [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch (e) {
    alert("Error saving data!");
  }
}

function newRoom() {
  return {
    id:           Date.now().toString(),
    doorNumber:   "",
    tenantName:   "",
    phone:        "",
    moveInDate:   "",
    deposit:      "",
    monthlyRent:  "",
    dueDay:       "1",
    electricPrev: "",
    electricCurr: "",
    electricRate: "5",
    waterAmount:  "",
    otherFees:    "",
    otherLabel:   "",
    status:       "unpaid",
    notes:        "",
    lastUpdated:  "",
  };
}

// ===== CALCULATIONS =====

function calcUnits(prev, curr) {
  const p = parseFloat(prev) || 0;
  const c = parseFloat(curr) || 0;
  return c > p ? c - p : 0;
}

function calcElectric(r) {
  return (calcUnits(r.electricPrev, r.electricCurr) * (parseFloat(r.electricRate) || 0)).toFixed(2);
}

function calcTotal(r) {
  return (
    (parseFloat(r.monthlyRent)  || 0) +
    (parseFloat(calcElectric(r)) || 0) +
    (parseFloat(r.waterAmount)  || 0) +
    (parseFloat(r.otherFees)    || 0)
  ).toFixed(2);
}

// ===== NAVIGATION =====

function goTo(view) {
  currentView = view;
  render();
  window.scrollTo(0, 0);
  document.getElementById("backBtn").style.display =
    view !== "dashboard" ? "inline-block" : "none";
}

// ===== RENDER ROUTER =====

function render() {
  const el = document.getElementById("content");
  if      (currentView === "dashboard") renderDashboard(el);
  else if (currentView === "form")      renderForm(el);
  else if (currentView === "detail")    renderDetail(el);
}

// ===== DASHBOARD =====

function renderDashboard(el) {
  const totalRent = rooms.reduce((s, r) => s + (parseFloat(r.monthlyRent) || 0), 0);
  const paid      = rooms.filter(r => r.status === "paid").length;
  const unpaid    = rooms.filter(r => r.status === "unpaid").length;

  const filtered = rooms.filter(r => {
    const ms = r.doorNumber.includes(searchVal) ||
               r.tenantName.toLowerCase().includes(searchVal.toLowerCase());
    const mf = filterVal === "all" || r.status === filterVal;
    return ms && mf;
  });

  el.innerHTML = `
    <!-- Summary -->
    <div class="summary-grid">
      <div class="summary-card" style="border-left:4px solid #3b82f6">
        <div class="s-icon">🚪</div>
        <div class="s-val" style="color:#3b82f6">${rooms.length}</div>
        <div class="s-label">Total Rooms</div>
      </div>
      <div class="summary-card" style="border-left:4px solid #10b981">
        <div class="s-icon">✅</div>
        <div class="s-val" style="color:#10b981">${paid}</div>
        <div class="s-label">Paid</div>
      </div>
      <div class="summary-card" style="border-left:4px solid #ef4444">
        <div class="s-icon">❌</div>
        <div class="s-val" style="color:#ef4444">${unpaid}</div>
        <div class="s-label">Unpaid</div>
      </div>
      <div class="summary-card" style="border-left:4px solid #f59e0b">
        <div class="s-icon">💰</div>
        <div class="s-val" style="color:#f59e0b">฿${totalRent.toLocaleString()}</div>
        <div class="s-label">Rent / mo</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <input class="inp" style="flex:1;min-width:140px" placeholder="🔍 Search room / tenant..."
        value="${searchVal}" oninput="app.onSearch(this.value)" />
      <select class="inp" style="width:130px" onchange="app.onFilter(this.value)">
        <option value="all"     ${filterVal==="all"     ? "selected" : ""}>All Status</option>
        <option value="paid"    ${filterVal==="paid"    ? "selected" : ""}>✅ Paid</option>
        <option value="unpaid"  ${filterVal==="unpaid"  ? "selected" : ""}>❌ Unpaid</option>
        <option value="partial" ${filterVal==="partial" ? "selected" : ""}>⚠️ Partial</option>
      </select>
      <button class="btn btn-gold" onclick="app.openNew()">+ Add Room</button>
    </div>

    <!-- Room Cards -->
    ${filtered.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🏠</div>
        No rooms yet.<br>
        Tap <strong style="color:#f59e0b">+ Add Room</strong> to get started!
      </div>
    ` : `
      <div class="room-grid">
        ${filtered.map(r => {
          const st = STATUS[r.status] || STATUS.unpaid;
          return `
            <div class="room-card" onclick="app.openDetail('${r.id}')">
              <div style="position:absolute;top:10px;right:10px">
                <span class="badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
              </div>
              <div style="font-size:26px;font-weight:bold;color:#f59e0b">#${r.doorNumber || "?"}</div>
              <div style="font-size:14px;color:#e2e8f0;margin-top:2px">
                ${r.tenantName || '<span style="color:#475569">No tenant</span>'}
              </div>
              <div style="font-size:12px;color:#94a3b8;margin-top:6px">📞 ${r.phone || "-"}</div>
              <div style="margin-top:10px;border-top:1px solid #334155;padding-top:10px;
                          display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;color:#64748b">Total Due</span>
                <span style="font-size:15px;font-weight:bold;color:#f59e0b">
                  ฿${parseFloat(calcTotal(r)).toLocaleString()}
                </span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `}
  `;
}

// ===== FORM =====

function renderForm(el) {
  const r      = editingRoom;
  const isEdit = !!rooms.find(x => x.id === r.id);
  const elec   = calcElectric(r);
  const units  = calcUnits(r.electricPrev, r.electricCurr);
  const total  = calcTotal(r);

  el.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 16px;color:#f59e0b;font-size:17px">
        ${isEdit ? "✏️ Edit Room" : "➕ Add New Room"}
      </h2>

      <!-- Room Info -->
      <div class="section-title">🚪 Room Info</div>
      <div class="row2">
        <div class="field">
          <label>Door / Room No. *</label>
          <input class="inp" placeholder="e.g. 101" value="${r.doorNumber}"
            oninput="app.update('doorNumber', this.value)" />
        </div>
        <div class="field">
          <label>Payment Due Day</label>
          <input class="inp" placeholder="e.g. 5" value="${r.dueDay}"
            oninput="app.update('dueDay', this.value)" />
        </div>
      </div>

      <!-- Tenant Info -->
      <div class="section-title">👤 Tenant Info</div>
      <div class="row2">
        <div class="field">
          <label>Tenant Name</label>
          <input class="inp" placeholder="Full name" value="${r.tenantName}"
            oninput="app.update('tenantName', this.value)" />
        </div>
        <div class="field">
          <label>Phone Number</label>
          <input class="inp" placeholder="Phone" value="${r.phone}"
            oninput="app.update('phone', this.value)" />
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label>Move-in Date</label>
          <input type="date" class="inp" value="${r.moveInDate}"
            onchange="app.update('moveInDate', this.value)" />
        </div>
        <div class="field">
          <label>Deposit (฿)</label>
          <input class="inp" placeholder="0.00" value="${r.deposit}"
            oninput="app.update('deposit', this.value)" />
        </div>
      </div>

      <!-- Rent & Fees -->
      <div class="section-title">💰 Rent & Fees</div>
      <div class="row2">
        <div class="field">
          <label>Monthly Rent (฿)</label>
          <input class="inp" placeholder="0.00" value="${r.monthlyRent}"
            oninput="app.update('monthlyRent', this.value)" />
        </div>
        <div class="field">
          <label>Water Amount (฿)</label>
          <input class="inp" placeholder="0.00" value="${r.waterAmount}"
            oninput="app.update('waterAmount', this.value)" />
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label>Other Fee Label</label>
          <input class="inp" placeholder="e.g. Internet" value="${r.otherLabel}"
            oninput="app.update('otherLabel', this.value)" />
        </div>
        <div class="field">
          <label>Other Fee (฿)</label>
          <input class="inp" placeholder="0.00" value="${r.otherFees}"
            oninput="app.update('otherFees', this.value)" />
        </div>
      </div>

      <!-- Electric -->
      <div class="section-title">⚡ Electric Meter</div>
      <div class="row2">
        <div class="field">
          <label>Previous Reading</label>
          <input class="inp" placeholder="0" value="${r.electricPrev}"
            oninput="app.update('electricPrev', this.value)" />
        </div>
        <div class="field">
          <label>Current Reading</label>
          <input class="inp" placeholder="0" value="${r.electricCurr}"
            oninput="app.update('electricCurr', this.value)" />
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label>Rate per Unit (฿)</label>
          <input class="inp" placeholder="5" value="${r.electricRate}"
            oninput="app.update('electricRate', this.value)" />
        </div>
        <div class="field">
          <label>Electric Cost (Auto)</label>
          <div class="auto-field" id="elecDisplay">
            ฿${elec} <span>(${units} units)</span>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="section-title">📋 Status & Notes</div>
      <div class="row2">
        <div class="field">
          <label>Payment Status</label>
          <select class="inp" onchange="app.update('status', this.value)">
            <option value="unpaid"  ${r.status==="unpaid"  ? "selected":""}>❌ Unpaid</option>
            <option value="paid"    ${r.status==="paid"    ? "selected":""}>✅ Paid</option>
            <option value="partial" ${r.status==="partial" ? "selected":""}>⚠️ Partial</option>
          </select>
        </div>
        <div class="field">
          <label>Total This Month</label>
          <div class="auto-field" id="totalDisplay" style="font-size:17px">
            ฿${parseFloat(total).toLocaleString()}
          </div>
        </div>
      </div>
      <div class="field">
        <label>Notes / Remarks</label>
        <textarea class="inp" placeholder="Any notes..."
          oninput="app.update('notes', this.value)">${r.notes}</textarea>
      </div>

      <!-- Buttons -->
      <div class="btn-row">
        <button class="btn btn-gray"  onclick="app.goBack()">Cancel</button>
        <button class="btn btn-gold"  onclick="app.handleSave()">💾 Save Room</button>
      </div>
    </div>
  `;
}

// ===== DETAIL VIEW =====

function renderDetail(el) {
  const r  = viewingRoom;
  if (!r) return;
  const st    = STATUS[r.status] || STATUS.unpaid;
  const total = calcTotal(r);
  const units = calcUnits(r.electricPrev, r.electricCurr);
  const elec  = calcElectric(r);

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
                  margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:30px;font-weight:bold;color:#f59e0b">Room #${r.doorNumber}</div>
          <div style="font-size:16px;color:#e2e8f0">${r.tenantName || "No tenant"}</div>
          <span class="badge" style="background:${st.bg};color:${st.color};margin-top:6px">
            ${st.label}
          </span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-blue" onclick="app.openEdit('${r.id}')">✏️ Edit</button>
          <button class="btn btn-red"  onclick="app.handleDelete('${r.id}')">🗑️</button>
        </div>
      </div>

      <div class="info-grid">
        ${ic("📞 Phone",        r.phone || "-")}
        ${ic("📅 Move-in",      r.moveInDate || "-")}
        ${ic("📅 Due Day",      "Day " + r.dueDay + " of month")}
        ${ic("💎 Deposit",      "฿" + parseFloat(r.deposit  || 0).toLocaleString())}
        ${ic("🏠 Monthly Rent", "฿" + parseFloat(r.monthlyRent || 0).toLocaleString())}
        ${ic("💧 Water",        "฿" + parseFloat(r.waterAmount || 0).toLocaleString())}
        ${ic("⚡ Meter",        (r.electricPrev||0) + " → " + (r.electricCurr||0) + " (" + units + " units)")}
        ${ic("⚡ Elec Cost",    "฿" + parseFloat(elec).toLocaleString() + " @ ฿" + r.electricRate + "/unit")}
        ${r.otherFees ? ic("📦 " + (r.otherLabel || "Other"), "฿" + parseFloat(r.otherFees).toLocaleString()) : ""}
        ${ic("🕐 Updated",      r.lastUpdated || "-")}
      </div>

      <div class="total-box">
        <span class="total-label">💰 Total Due This Month</span>
        <span class="total-val">฿${parseFloat(total).toLocaleString()}</span>
      </div>

      ${r.notes ? `
        <div class="notes-box">
          <div class="notes-box-label">📝 NOTES</div>
          <div class="notes-box-text">${r.notes}</div>
        </div>
      ` : ""}
    </div>
  `;
}

// Info card helper
function ic(label, value) {
  return `
    <div class="info-card">
      <div class="info-label">${label}</div>
      <div class="info-val">${value}</div>
    </div>
  `;
}

// ===== APP ACTIONS (exposed globally) =====

const app = {

  openNew() {
    editingRoom = newRoom();
    goTo("form");
  },

  openEdit(id) {
    editingRoom = { ...rooms.find(r => r.id === id) };
    goTo("form");
  },

  openDetail(id) {
    viewingRoom = rooms.find(r => r.id === id);
    goTo("detail");
  },

  goBack() {
    goTo("dashboard");
  },

  onSearch(val) {
    searchVal = val;
    render();
  },

  onFilter(val) {
    filterVal = val;
    render();
  },

  // Live update field + recalculate totals
  update(field, value) {
    editingRoom[field] = value;

    // Update electric display
    const elecEl = document.getElementById("elecDisplay");
    if (elecEl) {
      const elec  = calcElectric(editingRoom);
      const units = calcUnits(editingRoom.electricPrev, editingRoom.electricCurr);
      elecEl.innerHTML = `฿${elec} <span>(${units} units)</span>`;
    }

    // Update total display
    const totalEl = document.getElementById("totalDisplay");
    if (totalEl) {
      const total = calcTotal(editingRoom);
      totalEl.textContent = "฿" + parseFloat(total).toLocaleString();
    }
  },

  handleSave() {
    if (!editingRoom.doorNumber.trim()) {
      alert("Please enter a Door / Room Number!");
      return;
    }
    editingRoom.lastUpdated = new Date().toLocaleDateString();

    const exists = rooms.find(r => r.id === editingRoom.id);
    if (exists) {
      rooms = rooms.map(r => r.id === editingRoom.id ? editingRoom : r);
    } else {
      rooms.push(editingRoom);
    }

    saveData();
    goTo("dashboard");
  },

  handleDelete(id) {
    if (!confirm("Delete this room? This cannot be undone.")) return;
    rooms = rooms.filter(r => r.id !== id);
    saveData();
    goTo("dashboard");
  },
};

// ===== INIT =====

(function init() {
  loadData();
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
  render();
})();
