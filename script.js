const TARGET_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb39w593ytTuXMolBvhPju9GBVFwPtpO80gzI-F8PSWhpVT0bGfm6KYFi3arIDmrqktmmhkfNg0We4/pub?gid=1934154804&single=true&output=csv';
const DAILY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb39w593ytTuXMolBvhPju9GBVFwPtpO80gzI-F8PSWhpVT0bGfm6KYFi3arIDmrqktmmhkfNg0We4/pub?gid=311568616&single=true&output=csv';

const PANCHAYAT_MAP = {
    "ആമക്കാട്‌": "ആനക്കയം", "ഇരുമ്പുഴി": "ആനക്കയം", "പന്തല്ലൂർ": "ആനക്കയം", "പാപ്പിനിപ്പാറ": "ആനക്കയം", "പെരിമ്പലം": "ആനക്കയം",
    "ഉമ്മത്തൂർ": "കോഡൂർ", "കരീപറമ്പ": "കോഡൂർ", "കോഡൂർ": "കോഡൂർ", "താണിക്കൽ": "കോഡൂർ", "മങ്ങാട്ടുപുലം": "കോഡൂർ", "വടക്കെമണ്ണ": "കോഡൂർ", "വലിയാട്": "കോഡൂർ", "ചോലക്കൽ": "കോഡൂർ",
    "ചെറുപുത്തൂർ": "പുൽപ്പറ്റ", "തൃപ്പനച്ചി": "പുൽപ്പറ്റ", "അത്താണിക്കൽ": "പൂക്കോട്ടൂർ",
    "അറവങ്കര": "പൂക്കോട്ടൂർ", "പൂക്കോട്ടൂർ പള്ളിമുക്ക്": "പൂക്കോട്ടൂർ", "പൂക്കോട്ടൂർ ലക്ഷം വീട്": "പൂക്കോട്ടൂർ", "മുണ്ടിതൊടിക": "പൂക്കോട്ടൂർ", "വള്ളുവമ്പ്രം": "പൂക്കോട്ടൂർ", "മാണിക്കംപാറ": "പൂക്കോട്ടൂർ", "ഹാഫ് വള്ളുവമ്പ്രം": "പൂക്കോട്ടൂർ",
    "ഇത്തിൾപറമ്പ്": "മലപ്പുറം", "കാളമ്പാടി": "മലപ്പുറം","കുന്നുമ്മൽ": "മലപ്പുറം", "കോട്ടപ്പടി": "മലപ്പുറം","ചീനിത്തോട്": "മലപ്പുറം", "പട്ടർകടവ്": "മലപ്പുറം", "പൈത്തിനിപറമ്പ്‌": "മലപ്പുറം", "മുണ്ടുപറമ്പ്": "മലപ്പുറം", "മേൽമുറി": "മലപ്പുറം", "മൈലപ്പുറം" : "മലപ്പുറം", "വലിയങ്ങാടി": "മലപ്പുറം", "ഹാജിയാർ പള്ളി": "മലപ്പുറം",
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
    const sortedPan = Object.values(panData).map(p => ({
        ...p, percent: p.target > 0 ? ((p.coll/p.target)*100).toFixed(1) : 0
    })).sort((a,b) => b.percent - a.percent);

    const sortedUnits = Object.values(unitData).map(u => ({
        ...u, percent: u.target > 0 ? ((u.coll/u.target)*100).toFixed(1) : 0
    })).sort((a,b) => b.percent - a.percent);

    let tTarget = sortedPan.reduce((a, b) => a + b.target, 0);
    let tColl = sortedPan.reduce((a, b) => a + b.coll, 0);
    let overallPercent = tTarget > 0 ? ((tColl/tTarget)*100).toFixed(1) : 0;

    // Update Overall Stats
    document.getElementById('total-collected').innerText = '₹ ' + tColl.toLocaleString('en-IN');
    document.getElementById('total-target').innerText = '₹ ' + tTarget.toLocaleString('en-IN');
    document.getElementById('total-percentage').innerText = overallPercent + '%';
    document.getElementById('main-progress').style.width = overallPercent + '%';

    // Tiles
    const setTile = (id, barId, data) => {
        if(!data) return;
        document.getElementById(id).innerText = data.name;
        document.getElementById(barId).style.width = Math.min(data.percent, 100) + '%';
    };
    setTile('top-panchayat', 'top-pan-bar', sortedPan[0]);
    setTile('top-unit', 'top-unit-bar', sortedUnits[0]);
    setTile('low-unit', 'low-unit-bar', sortedUnits[sortedUnits.length-1]);
    setTile('low-panchayat', 'low-pan-bar', sortedPan[sortedPan.length-1]);

    // Re-render Panchayat Table
    document.getElementById('panchayat-table-body').innerHTML = sortedPan.map(p => `
        <tr>
            <td class="p-3 font-bold text-blue-900">${p.name}</td>
            <td class="p-3">₹${p.target.toLocaleString()}</td>
            <td class="p-3 font-black text-gray-800">₹${p.coll.toLocaleString()}</td>
            <td class="p-3 text-right">
                <span class="px-2 py-0.5 rounded text-white text-[9px] font-black ${p.percent >= 80 ? 'bg-green-600' : 'bg-orange-500'}">${p.percent}%</span>
            </td>
        </tr>
    `).join('');

    // Unit Table with Larger Collection Text
    document.getElementById('unit-table-body').innerHTML = sortedUnits.map((u, i) => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="toggleRow('hist-${i}')">
            <td class="p-4">
                <div class="font-black text-gray-800 text-sm">${u.name}</div>
                <div class="unit-collection-amt mt-1">₹${u.coll.toLocaleString()}</div>
                <div class="flex gap-3 mt-1 text-[10px] font-bold text-gray-500">
                    <span class="bg-orange-50 px-1.5 rounded">സ്ക്വാഡ്: ${u.sT}</span>
                    <span class="bg-green-50 px-1.5 rounded">വീട്: ${u.hT}</span>
                </div>
            </td>
            <td class="p-4 text-right">
                <div class="font-black text-lg ${u.percent >= 80 ? 'text-green-600' : 'text-orange-600'}">${u.percent}%</div>
                <div class="text-[9px] text-gray-400 font-bold">Target: ₹${u.target.toLocaleString()}</div>
                <div class="w-20 ml-auto bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div class="h-full ${u.percent >= 80 ? 'bg-green-500' : 'bg-orange-500'}" style="width: ${Math.min(u.percent, 100)}%"></div>
                </div>
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
                            ${u.history.map(h => `<tr><td class="p-2 border-t">${h.date}</td><td class="p-2 border-t font-bold">₹${h.amt}</td><td class="p-2 border-t">${h.squad}</td><td class="p-2 border-t">${h.house}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
    `).join('');

    renderChart(sortedPan);
}

function toggleRow(id) { document.getElementById(id).classList.toggle('hidden'); }

function renderChart(data) {
    const ctx = document.getElementById('panchayatChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(p => p.name),
            datasets: [{ label: '%', data: data.map(p => p.percent), backgroundColor: '#1e3a8a', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}
