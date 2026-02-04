const TARGET_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb39w593ytTuXMolBvhPju9GBVFwPtpO80gzI-F8PSWhpVT0bGfm6KYFi3arIDmrqktmmhkfNg0We4/pub?gid=1934154804&single=true&output=csv';
const DAILY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb39w593ytTuXMolBvhPju9GBVFwPtpO80gzI-F8PSWhpVT0bGfm6KYFi3arIDmrqktmmhkfNg0We4/pub?gid=311568616&single=true&output=csv';

const PANCHAYAT_MAP = {
    "ആമക്കാട്": "ആനക്കയം", "ഇരുമ്പുഴി": "ആനക്കയം", "പന്തല്ലൂർ": "ആനക്കയം", "പാപ്പിനിപ്പാറ": "ആനക്കയം", "പെരിമ്പലം": "ആനക്കയം",
    "ഉമ്മത്തൂർ": "കോഡൂർ", "കരീപറമ്പ": "കോഡൂർ", "കോഡൂർ": "കോഡൂർ", "താണിക്കൽ": "കോഡൂർ", "മങ്ങാട്ടുപുലം": "കോഡൂർ", "വടക്കെമണ്ണ": "കോഡൂർ", "വലിയാട്": "കോഡൂർ", "ചോലക്കൽ": "കോഡൂർ",
    "ചെറുപുത്തൂർ": "പുൽപ്പറ്റ", "തൃപ്പനച്ചി": "പുൽപ്പറ്റ", "അത്താണിക്കൽ": "പൂക്കോട്ടൂർ",
    "അറവങ്കര": "പൂക്കോട്ടൂർ", "പൂക്കോട്ടൂർ പള്ളിമുക്ക്": "പൂക്കോട്ടൂർ", "പൂക്കോട്ടൂർ ലക്ഷം വീട്": "പൂക്കോട്ടൂർ", "മുണ്ടിതൊടിക": "പൂക്കോട്ടൂർ", "വള്ളുവമ്പ്രം": "പൂക്കോട്ടൂർ", "മേലേമുക്ക്": "പൂക്കോട്ടൂർ", "ഹാഫ് വള്ളുവമ്പ്രം": "പൂക്കോട്ടൂർ",
    "ഇത്തിൾപറമ്പ്": "മലപ്പുറം", "കാളമ്പാടി": "മലപ്പുറം","കുന്നുമ്മൽ": "മലപ്പുറം", "കോട്ടപ്പടി": "മലപ്പുറം","ചീനിത്തോട്": "മലപ്പുറം", "പട്ടർകടവ്": "മലപ്പുറം", "പൈത്തിനിപറമ്പ്‌": "മലപ്പുറം", "മുണ്ടുപറമ്പ്": "മലപ്പുറം", "അതികാരത്തൊടി(മേൽമുറി)": "മലപ്പുറം", "മൈലപ്പുറം" : "മലപ്പുറം", "വലിയങ്ങാടി": "മലപ്പുറം", "ഹാജിയാർ പള്ളി": "മലപ്പുറം",
    "മൊറയൂർ": "മൊറയൂർ", "മോങ്ങം": "മൊറയൂർ", "വാലഞ്ചേരി": "മൊറയൂർ", "അരിമ്പ്ര": "മൊറയൂർ", "ഒഴുകൂർ": "മൊറയൂർ"
};

document.addEventListener('DOMContentLoaded', fetchData);

async function fetchData() {
    try {
        const [targetRes, dailyRes] = await Promise.all([ fetch(TARGET_SHEET_URL), fetch(DAILY_SHEET_URL) ]);
        const targetRows = (await targetRes.text()).split('\n').slice(1);
        const dailyRows = (await dailyRes.text()).split('\n').slice(1);

        let units = {};
        let panchayats = {};

        targetRows.forEach(row => {
            const cols = row.split(',').map(c => c.trim());
            if (!cols[0]) return;
            const name = cols[0], target = parseFloat(cols[1]) || 0, pName = PANCHAYAT_MAP[name] || "Other";
            units[name] = { name, target, coll: 0, history: [], sT: 0, hT: 0 };
            if (!panchayats[pName]) panchayats[pName] = { name: pName, target: 0, coll: 0 };
            panchayats[pName].target += target;
        });

        dailyRows.forEach(row => {
            const cols = row.split(',').map(c => c.trim());
            const name = cols[0], amt = parseFloat(cols[1]) || 0, date = cols[2], squad = parseInt(cols[3])||0, house = parseInt(cols[4])||0;
            if (units[name]) {
                units[name].coll += amt; units[name].sT += squad; units[name].hT += house;
                units[name].history.push({ date, amt, squad, house });
                const pName = PANCHAYAT_MAP[name];
                if(panchayats[pName]) panchayats[pName].coll += amt;
            }
        });
        updateUI(panchayats, units);
    } catch (e) { console.error(e); }
}

function updateUI(panData, unitData) {
    // Dropdown selector value
    const sortValue = document.getElementById('sort-selector').value;

    // Process & Sort Panchayats
  
    let sortedPan = Object.values(panData).map(p => ({
        ...p, percent: p.target > 0 ? parseFloat(((p.coll/p.target)*100).toFixed(1)) : 0
    }));

    if (sortValue === 'percent-desc') sortedPan.sort((a, b) => b.percent - a.percent);
    else if (sortValue === 'percent-asc') sortedPan.sort((a, b) => a.percent - b.percent);
    else if (sortValue === 'amount-desc') sortedPan.sort((a, b) => b.coll - a.coll);
    else if (sortValue === 'amount-asc') sortedPan.sort((a, b) => a.coll - b.coll);
  

    // Process & Sort Units
    let sortedUnits = Object.values(unitData).map(u => ({
        ...u, percent: u.target > 0 ? parseFloat(((u.coll/u.target)*100).toFixed(1)) : 0
    }));

    if (sortValue.includes('amount')) {
        sortedUnits.sort((a, b) => sortValue === 'amount-desc' ? b.coll - a.coll : a.coll - b.coll);
    } else {
        sortedUnits.sort((a, b) => sortValue === 'percent-desc' ? b.percent - a.percent : a.percent - b.percent);
    }

    // Overall Stats
    let tTarget = sortedPan.reduce((a, b) => a + b.target, 0);
    let tColl = sortedPan.reduce((a, b) => a + b.coll, 0);
    let overallPercent = tTarget > 0 ? ((tColl/tTarget)*100).toFixed(1) : 0;

    document.getElementById('total-collected').innerText = '₹ ' + tColl.toLocaleString('en-IN');
    document.getElementById('total-target').innerText = '₹ ' + tTarget.toLocaleString('en-IN');
    document.getElementById('total-percentage').innerText = overallPercent + '%';
    document.getElementById('main-progress').style.width = overallPercent + '%';

    // Render Panchayat Table
    document.getElementById('panchayat-table-body').innerHTML = sortedPan.map((p, index) => {
        const unitsInPan = sortedUnits.filter(u => PANCHAYAT_MAP[u.name] === p.name);
        return `
            <tr class="hover:bg-gray-50 cursor-pointer border-b transition-all" onclick="toggleRow('pan-units-${index}')">
                <td class="p-3">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span class="font-bold text-blue-900 text-sm md:text-base">${p.name}</span>
                    </div>
                </td>
                <td class="p-3 text-xs md:text-sm text-gray-500 font-medium">₹${p.target.toLocaleString()}</td>
                <td class="p-3 font-bold text-gray-800 text-sm md:text-base">₹${p.coll.toLocaleString()}</td>
                <td class="p-3 text-right">
                    <span class="px-2 py-1 rounded text-[10px] md:text-xs font-bold ${getStatusColor(p.percent)}">
                        ${p.percent}%
                    </span>
                </td>
            </tr>
            <tr id="pan-units-${index}" class="hidden bg-blue-50/50">
                <td colspan="4" class="p-0">
                    <div class="overflow-x-auto">
                        <table class="w-full border-l-4 border-blue-900">
                            <thead class="bg-gray-100 text-gray-600 uppercase text-[10px]">
                                <tr>
                                    <th class="py-2 pl-8 text-left font-semibold">Unit</th>
                                    <th class="py-2 text-left font-semibold">Target</th>
                                    <th class="py-2 text-left font-semibold">Collected</th>
                                    <th class="py-2 text-right pr-4 font-semibold">Ach %</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${unitsInPan.map(u => `
                                    <tr class="hover:bg-white transition-colors">
                                        <td class="py-2 pl-8 text-gray-700 text-xs md:text-sm font-medium">${u.name}</td>
                                        <td class="py-2 text-gray-500 text-xs">₹${u.target.toLocaleString()}</td>
                                        <td class="py-2 font-bold text-blue-800 text-xs md:text-sm">₹${u.coll.toLocaleString()}</td>
                                        <td class="py-2 text-right pr-4">
                                            <span class="px-2 py-0.5 rounded text-[9px] md:text-xs font-bold ${getStatusColor(u.percent)}">
                                                ${u.percent}%
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Render Bottom Unit Table with History
    document.getElementById('unit-table-body').innerHTML = sortedUnits.map((u, i) => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="toggleRow('hist-${i}')">
            <td class="p-4">
                <div class="font-black text-gray-800 text-sm">${u.name}</div>
                <div class="text-blue-900 font-bold text-base mt-1">₹${u.coll.toLocaleString()}</div>
                <div class="flex gap-3 mt-1 text-[10px] font-bold text-gray-500">
                    <span class="bg-orange-50 px-1.5 rounded text-orange-700">സ്ക്വാഡ്: ${u.sT}</span>
                    <span class="bg-green-50 px-1.5 rounded text-green-700">വീട്: ${u.hT}</span>
                </div>
            </td>
            <td class="p-4 text-right">
                <div class="font-black text-lg ${u.percent >= 80 ? 'text-green-600' : 'text-orange-600'}">${u.percent}%</div>
                <div class="text-[9px] text-gray-400 font-bold">Target: ₹${u.target.toLocaleString()}</div>
            </td>
        </tr>
        <tr id="hist-${i}" class="hidden bg-gray-50">
            <td colspan="2" class="p-3">
                <div class="bg-white border rounded shadow-sm">
                    <table class="w-full text-[10px] text-center">
                        <thead class="bg-gray-100 font-bold">
                            <tr><th class="p-2">തീയതി</th><th class="p-2">തുക</th><th class="p-2">സ്കോഡ്</th><th class="p-2">വീട്</th></tr>
                        </thead>
                        <tbody>
                            ${u.history.map(h => `<tr><td class="p-2 border-t">${h.date}</td><td class="p-2 border-t font-bold text-blue-800">₹${h.amt}</td><td class="p-2 border-t">${h.squad}</td><td class="p-2 border-t">${h.house}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    `).join('');

    renderChart(sortedPan);
}

function toggleRow(id) { document.getElementById(id).classList.toggle('hidden'); }

function renderChart(data, isAmountSort = false) {
    const ctx = document.getElementById('panchayatChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();

    // നിറം തീരുമാനിക്കുന്നു: Amount ആണെങ്കിൽ പച്ച, അല്ലെങ്കിൽ നേവി ബ്ലൂ
    const colorTop = isAmountSort ? '#16a34a' : '#1e3a8a'; // Green vs Navy
    const colorBottom = isAmountSort ? '#4ade80' : '#60a5fa'; // Light Green vs Light Blue

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(p => p.name),
            datasets: [{
                label: isAmountSort ? 'Amount' : '%',
                data: data.map(p => isAmountSort ? p.coll : p.percent),
                backgroundColor: gradient,
                borderRadius: 5,
                borderWidth: 0,
                barPercentage: 0.6
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { 
                y: { 
                    display: false, 
                    beginAtZero: true,
                    // Amount കാണിക്കുമ്പോൾ മുകളിൽ സ്പേസ് കിട്ടാൻ max സെറ്റ് ചെയ്യുന്നില്ല
                    grace: '15%' 
                },
                x: {
                    display: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: colorTop,
                        font: { weight: 'bold', size: 10 }
                    }
                }
            },
            animation: {
                onComplete: function() {
                    let chartInstance = this, ctx = chartInstance.ctx;
                    ctx.font = "bold 12px sans-serif"; 
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillStyle = colorTop;

                    this.data.datasets.forEach(function(dataset, i) {
                        let meta = chartInstance.getDatasetMeta(i);
                        meta.data.forEach(function(bar, index) {
                            let label;
                            if (isAmountSort) {
                                // തുക ലക്ഷം/ആയിരം രൂപയിൽ ചുരുക്കി കാണിക്കാൻ (ഉദാ: 1.2L അല്ലെങ്കിൽ 50K)
                                let amt = data[index].coll;
                                label = '₹' + (amt >= 100000 ? (amt/100000).toFixed(1) + 'L' : (amt/1000).toFixed(0) + 'K');
                            } else {
                                label = data[index].percent + '%';
                            }
                            ctx.fillText(label, bar.x, bar.y - 8);
                        });
                    });
                }
            }
        }
    });
}

function getStatusColor(percent) {
    if (percent <= 10) return 'bg-red-600 text-white';
    if (percent <= 25) return 'bg-orange-500 text-white';
    if (percent <= 50) return 'bg-yellow-400 text-black';
    if (percent <= 75) return 'bg-lime-400 text-black';
    if (percent <= 90) return 'bg-green-400 text-white';
    return 'bg-green-800 text-white';
}
