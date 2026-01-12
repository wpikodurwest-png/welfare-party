// നിങ്ങളുടെ Google Sheet CSV ലിങ്ക് ഇവിടെ ചേർക്കുക
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb39w593ytTuXMolBvhPju9GBVFwPtpO80gzI-F8PSWhpVT0bGfm6KYFi3arIDmrqktmmhkfNg0We4/pub?gid=1934154804&single=true&output=csv';

// യൂണിറ്റുകളെ പഞ്ചായത്തുകളുമായി ഗ്രൂപ്പ് ചെയ്യുന്നു
const PANCHAYAT_MAP = {
    "ആമക്കാട്‌": "ആനക്കയം", "ഇരുമ്പുഴി": "ആനക്കയം", "പന്തല്ലൂർ": "ആനക്കയം", "പാപ്പിനിപ്പാറ": "ആനക്കയം", "പെരിമ്പലം": "ആനക്കയം",
    "ഉമ്മത്തൂർ": "കോഡൂർ", "കരീപറമ്പ": "കോഡൂർ", "കോഡൂർ": "കോഡൂർ", "താണിക്കൽ": "കോഡൂർ", "മങ്ങാട്ടുപുലം": "കോഡൂർ", "വടക്കെമണ്ണ": "കോഡൂർ", "വലിയാട്": "കോഡൂർ", "ചോലക്കൽ": "കോഡൂർ",
    "ചെറുപുത്തൂർ": "പുൽപ്പറ്റ", "തൃപ്പനച്ചി": "പുൽപ്പറ്റ","അത്താണിക്കൽ": "പൂക്കോട്ടൂർ",
    "അറവങ്കര": "പൂക്കോട്ടൂർ", "പൂക്കോട്ടൂർ പള്ളിമുക്ക്": "പൂക്കോട്ടൂർ", "പൂക്കോട്ടൂർ ലക്ഷം വീട്": "പൂക്കോട്ടൂർ", "മുണ്ടിതൊടിക": "പൂക്കോട്ടൂർ", "വള്ളുവമ്പ്രം": "പൂക്കോട്ടൂർ", "മാണിക്കംപാറ": "പൂക്കോട്ടൂർ", "ഹാഫ് വള്ളുവമ്പ്രം": "പൂക്കോട്ടൂർ",
    "ഇത്തിൾപറമ്പ്": "മലപ്പുറം", "കാളമ്പാടി": "മലപ്പുറം", "കുന്നുമ്മൽ": "മലപ്പുറം", "കോട്ടപ്പടി": "മലപ്പുറം", "കോൽമണ്ണ": "മലപ്പുറം", "ചീനിത്തോട്": "മലപ്പുറം", "പട്ടർകടവ്": "മലപ്പുറം", "പൈത്തിനിപറമ്പ്‌": "മലപ്പുറം", "മുണ്ടുപറമ്പ്": "മലപ്പുറം", "മേൽമുറി": "മലപ്പുറം", "മൈലപ്പുറം": "മലപ്പുറം", "വലിയങ്ങാടി": "മലപ്പുറം", "ഹാജിയാർ പള്ളി": "മലപ്പുറം",
    "മൊറയൂർ": "മൊറയൂർ", "മോങ്ങം": "മൊറയൂർ", "വാലഞ്ചേരി": "മൊറയൂർ", "അരിമ്പ്ര": "മൊറയൂർ", "ഒഴുകൂർ": "മൊറയൂർ"
};

document.addEventListener('DOMContentLoaded', fetchData);

async function fetchData() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(r => r.trim() !== '').slice(1);

        let panchayats = {};
        let unitsList = [];

        // ഇനിഷ്യലൈസേഷൻ
        Object.values(PANCHAYAT_MAP).forEach(p => {
            if (!panchayats[p]) panchayats[p] = { name: p, target: 0, collected: 0 };
        });

        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 3) {
                const unitName = cols[0].trim();
                const target = parseFloat(cols[1]) || 0;
                const collected = parseFloat(cols[2]) || 0;
                const parentPanchayat = PANCHAYAT_MAP[unitName];
                const percent = target > 0 ? parseFloat(((collected / target) * 100).toFixed(1)) : 0;

                if (parentPanchayat) {
                    panchayats[parentPanchayat].target += target;
                    panchayats[parentPanchayat].collected += collected;
                    
                    unitsList.push({ 
                        name: unitName, panchayat: parentPanchayat, 
                        target, collected, percent 
                    });
                }
            }
        });

        // പഞ്ചായത്ത് ഡാറ്റ ശതമാനം അനുസരിച്ച് സോട്ട് ചെയ്യുന്നു
        const sortedPanchayats = Object.values(panchayats).map(p => ({
            ...p,
            percent: p.target > 0 ? parseFloat(((p.collected / p.target) * 100).toFixed(1)) : 0
        })).sort((a, b) => b.percent - a.percent);

        // യൂണിറ്റ് ഡാറ്റ ശതമാനം അനുസരിച്ച് സോട്ട് ചെയ്യുന്നു
        const sortedUnits = unitsList.sort((a, b) => b.percent - a.percent);

        updateUI(sortedPanchayats, sortedUnits);
    } catch (e) {
        console.error("Data loading failed:", e);
    }
}

function updateUI(panchayatData, unitData) {
    let totalTarget = 0, totalCollected = 0;
    
    // 1. Panchayath Table Update
    const pTable = document.getElementById('panchayat-table-body');
    pTable.innerHTML = '';
    panchayatData.forEach(p => {
        totalTarget += p.target;
        totalCollected += p.collected;
        pTable.innerHTML += `
            <tr class="hover:bg-blue-50">
                <td class="p-4 font-black text-blue-900">${p.name}</td>
                <td class="p-4 text-gray-500 font-bold">₹${p.target.toLocaleString('en-IN')}</td>
                <td class="p-4 font-black text-gray-800">₹${p.collected.toLocaleString('en-IN')}</td>
                <td class="p-4 text-right">
                    <span class="px-3 py-1 rounded-full text-white text-[10px] font-black ${p.percent >= 80 ? 'bg-green-600' : 'bg-orange-500'}">
                        ${p.percent}%
                    </span>
                </td>
            </tr>
        `;
    });

    // 2. Unit Table Update
    const uTable = document.getElementById('unit-table-body');
    uTable.innerHTML = '';
    unitData.forEach(u => {
        uTable.innerHTML += `
            <tr class="hover:bg-gray-50 border-b">
                <td class="p-4 font-bold text-gray-800">${u.name}</td>
                <td class="p-4 text-[10px] text-gray-400 uppercase font-bold">${u.panchayat}</td>
                <td class="p-4 text-gray-500 text-xs">₹${u.target.toLocaleString('en-IN')}</td>
                <td class="p-4 font-black text-blue-700">₹${u.collected.toLocaleString('en-IN')}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end space-x-2">
                        <span class="text-xs font-black text-gray-700">${u.percent}%</span>
                        <div class="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-blue-500 h-full" style="width: ${Math.min(u.percent, 100)}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    // Summary Cards
    document.getElementById('total-collected').innerText = '₹ ' + totalCollected.toLocaleString('en-IN');
    document.getElementById('total-target').innerText = '₹ ' + totalTarget.toLocaleString('en-IN');
    const overallPercent = totalTarget > 0 ? ((totalCollected / totalTarget) * 100).toFixed(2) : 0;
    document.getElementById('total-percentage').innerText = overallPercent + '%';
    document.getElementById('main-progress').style.width = overallPercent + '%';

    // Top & Low Panchayat Indicators
    if (panchayatData.length > 0) {
        document.getElementById('top-panchayat').innerText = panchayatData[0].name;
        document.getElementById('top-panchayat-val').innerText = `${panchayatData[0].percent}% Achievement`;
        
        document.getElementById('low-panchayat').innerText = panchayatData[panchayatData.length - 1].name;
        document.getElementById('low-panchayat-val').innerText = `${panchayatData[panchayatData.length - 1].percent}% Achievement`;
    }

    renderChart(panchayatData);
}

function renderChart(data) {
    const ctx = document.getElementById('panchayatChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(p => p.name),
            datasets: [{
                label: 'Achievement %',
                data: data.map(p => p.percent),
                backgroundColor: '#1e3a8a',
                hoverBackgroundColor: '#2563eb',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false } }
            }
        }
    });
}