/* ==========================================================================
   CarbonTrack Detailed Calculator Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Default Coefficients configuration
    const VEHICLE_COEFFICIENTS = {
        car: { petrol: 0.18, diesel: 0.17, cng: 0.12, electric: 0.05, hybrid: 0.09 },
        bus: { petrol: 0.70, diesel: 0.85, cng: 0.60, electric: 0.15, hybrid: 0.40 },
        van: { petrol: 0.24, diesel: 0.22, cng: 0.16, electric: 0.07, hybrid: 0.13 },
        bike: { petrol: 0.06, diesel: 0.00, cng: 0.04, electric: 0.01, hybrid: 0.03 },
        truck: { petrol: 1.00, diesel: 1.20, cng: 0.90, electric: 0.25, hybrid: 0.60 },
        'auto-rickshaw': { petrol: 0.12, diesel: 0.12, cng: 0.09, electric: 0.02, hybrid: 0.06 }
    };

    const ENERGY_COEFFICIENTS = {
        'purchased-grid': { factor: 0.82, unit: 'kWh' },
        'diesel-generator': { factor: 2.68, unit: 'Litres' },
        'coal-power': { factor: 1.00, unit: 'kWh' },
        'natural-gas': { factor: 0.45, unit: 'kWh' },
        'solar-power': { factor: 0.00, unit: 'kWh' },
        'wind-power': { factor: 0.00, unit: 'kWh' }
    };

    const LPG_COEFFICIENTS = {
        'commercial': 2980.00, // kgCO2 per tonne
        'domestic': 2980.00,
        'bulk': 2980.00
    };

    const PAPER_COEFFICIENTS = {
        'standard-a4': 0.005, // kgCO2 per sheet
        'recycled-a4': 0.002,
        'cardboard-kg': 1.50,
        'newspaper-kg': 0.80,
        'office-paper-kg': 1.30
    };

    const TREE_ABSORPTION = {
        neem: 20.00,
        banyan: 22.00,
        peepal: 24.00,
        mango: 18.00,
        teak: 15.00,
        coconut: 10.00
    };

    // DOM Elements
    const vehicleContainer = document.getElementById('vehicle-rows-container');
    const energyContainer = document.getElementById('energy-rows-container');
    const lpgContainer = document.getElementById('lpg-rows-container');
    const paperContainer = document.getElementById('paper-rows-container');
    const treesContainer = document.getElementById('trees-rows-container');

    const btnAddVehicle = document.getElementById('btn-add-vehicle');
    const btnAddEnergy = document.getElementById('btn-add-energy');
    const btnAddLpg = document.getElementById('btn-add-lpg');
    const btnAddPaper = document.getElementById('btn-add-paper');
    const btnAddTree = document.getElementById('btn-add-tree');

    // Toast utility (defined in script.js, fallback if not found)
    const showToastMsg = (msg, type = 'success') => {
        if (typeof showToast === 'function') {
            showToast(msg, type);
        } else {
            console.log(`[Toast ${type}]: ${msg}`);
            // Fallback simple toast
            const container = document.getElementById('toast-container');
            if (container) {
                const toast = document.createElement('div');
                toast.className = `toast toast-${type} show`;
                toast.innerHTML = `<span>${msg}</span>`;
                container.appendChild(toast);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 400);
                }, 3000);
            }
        }
    };

    /* ==========================================
       1. Vehicle Table Logic
       ========================================== */
    function createVehicleRow(type = 'car', fuel = 'petrol', count = 1, distance = 0) {
        const tr = document.createElement('tr');
        const factor = VEHICLE_COEFFICIENTS[type][fuel];

        tr.innerHTML = `
            <td>
                <select class="vehicle-type">
                    <option value="car" ${type === 'car' ? 'selected' : ''}>Car</option>
                    <option value="bus" ${type === 'bus' ? 'selected' : ''}>Bus</option>
                    <option value="van" ${type === 'van' ? 'selected' : ''}>Van</option>
                    <option value="bike" ${type === 'bike' ? 'selected' : ''}>Bike</option>
                    <option value="truck" ${type === 'truck' ? 'selected' : ''}>Truck</option>
                    <option value="auto-rickshaw" ${type === 'auto-rickshaw' ? 'selected' : ''}>Auto Rickshaw</option>
                </select>
            </td>
            <td>
                <select class="fuel-type">
                    <option value="petrol" ${fuel === 'petrol' ? 'selected' : ''}>Petrol</option>
                    <option value="diesel" ${fuel === 'diesel' ? 'selected' : ''}>Diesel</option>
                    <option value="cng" ${fuel === 'cng' ? 'selected' : ''}>CNG</option>
                    <option value="electric" ${fuel === 'electric' ? 'selected' : ''}>Electric</option>
                    <option value="hybrid" ${fuel === 'hybrid' ? 'selected' : ''}>Hybrid</option>
                </select>
            </td>
            <td><input type="number" class="vehicle-count" value="${count}" min="1"></td>
            <td><input type="number" class="vehicle-distance" value="${distance}" min="0"></td>
            <td><input type="number" class="vehicle-factor readonly-input" value="${factor.toFixed(2)}" readonly></td>
            <td class="text-em-day vehicle-day">0.00</td>
            <td class="text-em-month vehicle-month">0.00</td>
            <td class="text-em-year vehicle-year">0.00</td>
            <td class="text-em-year-tons vehicle-year-tons">0.000</td>
            <td>
                <button class="btn-delete-row" title="Delete Row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;

        // Event listener for type or fuel change
        const selType = tr.querySelector('.vehicle-type');
        const selFuel = tr.querySelector('.fuel-type');
        const inpCount = tr.querySelector('.vehicle-count');
        const inpDist = tr.querySelector('.vehicle-distance');
        const inpFactor = tr.querySelector('.vehicle-factor');

        function updateFactor() {
            const t = selType.value;
            const f = selFuel.value;
            
            // Adjust fuel options based on vehicle type (e.g. bikes don't run on diesel in normal context, but let's keep it safe)
            const fact = VEHICLE_COEFFICIENTS[t][f] !== undefined ? VEHICLE_COEFFICIENTS[t][f] : 0;
            inpFactor.value = fact.toFixed(2);
            calculateVehicleRow(tr);
        }

        selType.addEventListener('change', updateFactor);
        selFuel.addEventListener('change', updateFactor);
        inpCount.addEventListener('input', () => calculateVehicleRow(tr));
        inpDist.addEventListener('input', () => calculateVehicleRow(tr));

        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
            tr.remove();
            calculateAll();
            showToastMsg('Vehicle entry deleted.', 'info');
        });

        vehicleContainer.appendChild(tr);
        calculateVehicleRow(tr);
    }

    function calculateVehicleRow(row) {
        const count = parseFloat(row.querySelector('.vehicle-count').value) || 0;
        const distance = parseFloat(row.querySelector('.vehicle-distance').value) || 0;
        const factor = parseFloat(row.querySelector('.vehicle-factor').value) || 0;

        const dayEm = count * distance * factor;
        const monthEm = dayEm * 20; // 20 working days
        const yearEm = dayEm * 240; // 240 working days
        const yearTons = yearEm / 1000;

        row.querySelector('.vehicle-day').textContent = dayEm.toFixed(2);
        row.querySelector('.vehicle-month').textContent = monthEm.toFixed(2);
        row.querySelector('.vehicle-year').textContent = yearEm.toFixed(2);
        row.querySelector('.vehicle-year-tons').textContent = yearTons.toFixed(3);

        calculateSummary();
    }

    /* ==========================================
       2. Energy Table Logic
       ========================================== */
    function createEnergyRow(type = 'purchased-grid', consumption = 0) {
        const tr = document.createElement('tr');
        const config = ENERGY_COEFFICIENTS[type];

        tr.innerHTML = `
            <td>
                <select class="energy-type">
                    <option value="purchased-grid" ${type === 'purchased-grid' ? 'selected' : ''}>Purchased Grid Electricity</option>
                    <option value="diesel-generator" ${type === 'diesel-generator' ? 'selected' : ''}>Diesel Generator</option>
                    <option value="coal-power" ${type === 'coal-power' ? 'selected' : ''}>Coal Power</option>
                    <option value="natural-gas" ${type === 'natural-gas' ? 'selected' : ''}>Natural Gas Power</option>
                    <option value="solar-power" ${type === 'solar-power' ? 'selected' : ''}>Solar Generator</option>
                    <option value="wind-power" ${type === 'wind-power' ? 'selected' : ''}>Wind Generator</option>
                </select>
            </td>
            <td>
                <input type="text" class="energy-source" value="${type === 'purchased-grid' ? 'Grid utility' : 'On-site generator'}">
            </td>
            <td><input type="number" class="energy-consumption" value="${consumption}" min="0"></td>
            <td>
                <select class="energy-unit">
                    <option value="kWh" ${config.unit === 'kWh' ? 'selected' : ''}>kWh</option>
                    <option value="Litres" ${config.unit === 'Litres' ? 'selected' : ''}>Litres</option>
                    <option value="kgCO2" ${config.unit === 'kgCO2' ? 'selected' : ''}>kgCO2</option>
                </select>
            </td>
            <td><input type="number" class="energy-factor readonly-input" value="${config.factor.toFixed(2)}" readonly></td>
            <td>
                <button class="btn-delete-row" title="Delete Row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;

        const selType = tr.querySelector('.energy-type');
        const selUnit = tr.querySelector('.energy-unit');
        const inpSource = tr.querySelector('.energy-source');
        const inpFactor = tr.querySelector('.energy-factor');

        selType.addEventListener('change', () => {
            const config = ENERGY_COEFFICIENTS[selType.value];
            selUnit.value = config.unit;
            inpFactor.value = config.factor.toFixed(2);
            
            // Adjust source text defaults
            if (selType.value === 'purchased-grid') inpSource.value = 'Grid utility';
            else if (selType.value === 'solar-power' || selType.value === 'wind-power') inpSource.value = 'Clean renewable';
            else inpSource.value = 'Generator fuel';
        });

        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
            tr.remove();
            calculateSummary();
            showToastMsg('Energy source entry deleted.', 'info');
        });

        energyContainer.appendChild(tr);
    }

    /* ==========================================
       3. LPG Table Logic
       ========================================== */
    function createLpgRow(type = 'commercial', weight = 0) {
        const tr = document.createElement('tr');
        const factor = LPG_COEFFICIENTS[type];

        tr.innerHTML = `
            <td>
                <select class="lpg-type">
                    <option value="commercial" ${type === 'commercial' ? 'selected' : ''}>Commercial Cylinder</option>
                    <option value="domestic" ${type === 'domestic' ? 'selected' : ''}>Domestic Cylinder</option>
                    <option value="bulk" ${type === 'bulk' ? 'selected' : ''}>Bulk LPG</option>
                </select>
            </td>
            <td><input type="number" class="lpg-weight" value="${weight}" min="0"></td>
            <td><input type="number" class="lpg-factor readonly-input" value="${factor.toFixed(2)}" readonly></td>
            <td>
                <button class="btn-delete-row" title="Delete Row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;

        const selType = tr.querySelector('.lpg-type');
        const inpFactor = tr.querySelector('.lpg-factor');

        selType.addEventListener('change', () => {
            inpFactor.value = LPG_COEFFICIENTS[selType.value].toFixed(2);
        });

        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
            tr.remove();
            calculateSummary();
            showToastMsg('LPG entry deleted.', 'info');
        });

        lpgContainer.appendChild(tr);
    }

    /* ==========================================
       4. Paper Table Logic
       ========================================== */
    function createPaperRow(type = 'standard-a4', qty = 0) {
        const tr = document.createElement('tr');
        const factor = PAPER_COEFFICIENTS[type];

        tr.innerHTML = `
            <td>
                <select class="paper-type">
                    <option value="standard-a4" ${type === 'standard-a4' ? 'selected' : ''}>Standard A4 Sheet (5g)</option>
                    <option value="recycled-a4" ${type === 'recycled-a4' ? 'selected' : ''}>Recycled A4 Sheet (5g)</option>
                    <option value="cardboard-kg" ${type === 'cardboard-kg' ? 'selected' : ''}>Cardboard (kg)</option>
                    <option value="newspaper-kg" ${type === 'newspaper-kg' ? 'selected' : ''}>Newspaper (kg)</option>
                    <option value="office-paper-kg" ${type === 'office-paper-kg' ? 'selected' : ''}>Office Paper (kg)</option>
                </select>
            </td>
            <td><input type="number" class="paper-qty" value="${qty}" min="0"></td>
            <td><input type="number" class="paper-factor readonly-input" value="${factor.toFixed(5)}" readonly></td>
            <td>
                <button class="btn-delete-row" title="Delete Row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;

        const selType = tr.querySelector('.paper-type');
        const inpFactor = tr.querySelector('.paper-factor');

        selType.addEventListener('change', () => {
            const decPoints = selType.value.includes('a4') ? 5 : 2;
            inpFactor.value = PAPER_COEFFICIENTS[selType.value].toFixed(decPoints);
        });

        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
            tr.remove();
            calculateSummary();
            showToastMsg('Paper usage entry deleted.', 'info');
        });

        paperContainer.appendChild(tr);
    }

    /* ==========================================
       5. Green Cover / Trees Table Logic
       ========================================== */
    function createTreeRow(species = 'neem', count = 0) {
        const tr = document.createElement('tr');
        const factor = TREE_ABSORPTION[species];

        tr.innerHTML = `
            <td>
                <select class="tree-species">
                    <option value="neem" ${species === 'neem' ? 'selected' : ''}>Neem Tree</option>
                    <option value="banyan" ${species === 'banyan' ? 'selected' : ''}>Banyan Tree</option>
                    <option value="peepal" ${species === 'peepal' ? 'selected' : ''}>Peepal Tree</option>
                    <option value="mango" ${species === 'mango' ? 'selected' : ''}>Mango Tree</option>
                    <option value="teak" ${species === 'teak' ? 'selected' : ''}>Teak Tree</option>
                    <option value="coconut" ${species === 'coconut' ? 'selected' : ''}>Coconut Tree</option>
                </select>
            </td>
            <td><input type="number" class="tree-count" value="${count}" min="0"></td>
            <td><input type="number" class="tree-factor readonly-input" value="${factor.toFixed(2)}" readonly></td>
            <td>
                <button class="btn-delete-row" title="Delete Row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;

        const selSpecies = tr.querySelector('.tree-species');
        const inpFactor = tr.querySelector('.tree-factor');

        selSpecies.addEventListener('change', () => {
            inpFactor.value = TREE_ABSORPTION[selSpecies.value].toFixed(2);
        });

        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
            tr.remove();
            calculateSummary();
            showToastMsg('Tree entry deleted.', 'info');
        });

        treesContainer.appendChild(tr);
    }

    /* ==========================================
       6. Aggregate Calculations
       ========================================== */
    function calculateAll() {
        // Recalculate vehicles
        const vRows = vehicleContainer.querySelectorAll('tr');
        vRows.forEach(row => calculateVehicleRow(row));

        // Recalculate solar
        calculateSolar();

        // Sync summary
        calculateSummary();
    }

    function calculateSolar() {
        const capacity = parseFloat(document.getElementById('solar-capacity').value) || 0;
        const ef = parseFloat(document.getElementById('solar-ef').value) || 0.792;
        const result = capacity * ef;
        document.getElementById('solar-result').textContent = result.toFixed(2);
        calculateSummary();
    }

    // Calculates all forms and updates the sticky bottom summary counters
    function calculateSummary() {
        let grossKg = 0;
        let offsetKg = 0;

        // 1. Vehicle Annual Emissions (tons conversion in summary logic is yearEm / 1000)
        const vRows = vehicleContainer.querySelectorAll('tr');
        vRows.forEach(row => {
            const count = parseFloat(row.querySelector('.vehicle-count').value) || 0;
            const distance = parseFloat(row.querySelector('.vehicle-distance').value) || 0;
            const factor = parseFloat(row.querySelector('.vehicle-factor').value) || 0;
            const dayEm = count * distance * factor;
            const yearEm = dayEm * 240;
            grossKg += yearEm;
        });

        // 2. Energy Generation/Consumption emissions (Annualized basis)
        const eRows = energyContainer.querySelectorAll('tr');
        eRows.forEach(row => {
            const cons = parseFloat(row.querySelector('.energy-consumption').value) || 0;
            const fact = parseFloat(row.querySelector('.energy-factor').value) || 0;
            grossKg += cons * fact; // kg CO2
        });

        // 3. LPG emissions
        const lRows = lpgContainer.querySelectorAll('tr');
        lRows.forEach(row => {
            const weight = parseFloat(row.querySelector('.lpg-weight').value) || 0;
            const fact = parseFloat(row.querySelector('.lpg-factor').value) || 0;
            grossKg += weight * fact; // weight is in tonnes, fact is 2980, so result is kg CO2
        });

        // 4. Paper usage emissions
        const pRows = paperContainer.querySelectorAll('tr');
        pRows.forEach(row => {
            const qty = parseFloat(row.querySelector('.paper-qty').value) || 0;
            const fact = parseFloat(row.querySelector('.paper-factor').value) || 0;
            grossKg += qty * fact; // kg CO2
        });

        // 5. Solar offset (kg CO2)
        const solarCapacity = parseFloat(document.getElementById('solar-capacity').value) || 0;
        const solarEf = parseFloat(document.getElementById('solar-ef').value) || 0.792;
        offsetKg += solarCapacity * solarEf;

        // 6. Tree offsets (kg CO2 / year)
        const tRows = treesContainer.querySelectorAll('tr');
        tRows.forEach(row => {
            const count = parseFloat(row.querySelector('.tree-count').value) || 0;
            const fact = parseFloat(row.querySelector('.tree-factor').value) || 0;
            offsetKg += count * fact; // kg CO2 / year
        });

        // Convert to tonnes
        const grossTons = grossKg / 1000;
        const offsetsTons = offsetKg / 1000;
        const netTons = Math.max(0, grossTons - offsetsTons);

        // Update Sticky Summary UI Counters
        document.getElementById('summary-gross').innerHTML = `${grossTons.toFixed(2)} <span class="stat-unit">tCO₂e/yr</span>`;
        document.getElementById('summary-offsets').innerHTML = `${offsetsTons.toFixed(2)} <span class="stat-unit">tCO₂e/yr</span>`;
        document.getElementById('summary-net').innerHTML = `${netTons.toFixed(2)} <span class="stat-unit">tCO₂e/yr</span>`;
    }

    /* ==========================================
       7. Button Handlers
       ========================================== */
    btnAddVehicle.addEventListener('click', (e) => {
        e.preventDefault();
        createVehicleRow('car', 'petrol', 1, 0);
        showToastMsg('Added new vehicle row.', 'success');
    });

    btnAddEnergy.addEventListener('click', (e) => {
        e.preventDefault();
        createEnergyRow('purchased-grid', 0);
        showToastMsg('Added new energy consumption row.', 'success');
    });

    btnAddLpg.addEventListener('click', (e) => {
        e.preventDefault();
        createLpgRow('commercial', 0);
        showToastMsg('Added new LPG weight row.', 'success');
    });

    btnAddPaper.addEventListener('click', (e) => {
        e.preventDefault();
        createPaperRow('standard-a4', 0);
        showToastMsg('Added new paper quantity row.', 'success');
    });

    btnAddTree.addEventListener('click', (e) => {
        e.preventDefault();
        createTreeRow('neem', 0);
        showToastMsg('Added new tree plantation row.', 'success');
    });

    document.getElementById('btn-calculate-energy').addEventListener('click', (e) => {
        e.preventDefault();
        calculateSummary();
        showToastMsg('Energy calculations updated.', 'success');
    });

    document.getElementById('btn-reset-energy').addEventListener('click', (e) => {
        e.preventDefault();
        energyContainer.innerHTML = '';
        createEnergyRow('purchased-grid', 0);
        calculateSummary();
        showToastMsg('Energy inputs reset.', 'info');
    });

    document.getElementById('btn-calculate-lpg').addEventListener('click', (e) => {
        e.preventDefault();
        calculateSummary();
        showToastMsg('LPG emissions updated.', 'success');
    });

    document.getElementById('btn-calculate-paper').addEventListener('click', (e) => {
        e.preventDefault();
        calculateSummary();
        showToastMsg('Paper emissions updated.', 'success');
    });

    document.getElementById('btn-calculate-solar').addEventListener('click', (e) => {
        e.preventDefault();
        calculateSolar();
        showToastMsg('Solar clean offsets calculated.', 'success');
    });

    document.getElementById('btn-calculate-trees').addEventListener('click', (e) => {
        e.preventDefault();
        calculateSummary();
        showToastMsg('Tree absorption offsets calculated.', 'success');
    });

    document.getElementById('btn-recalculate-all').addEventListener('click', (e) => {
        e.preventDefault();
        calculateAll();
        showToastMsg('Complete carbon model re-calculated successfully.', 'success');
    });

    /* ==========================================
       8. Exports System (CSV / Excel)
       ========================================== */
    function downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Vehicle Table Exports
    function exportVehicleData(format = 'csv') {
        const rows = [['Vehicle Type', 'Fuel Type', 'Count', 'Avg Distance (km)', 'Emission Factor', 'Emission/Day (kg)', 'Emission/Month (kg)', 'Emission/Year (kg)', 'Emission/Year (tons)']];
        const vRows = vehicleContainer.querySelectorAll('tr');

        if (vRows.length === 0) {
            showToastMsg('No vehicle data available to export.', 'error');
            return;
        }

        vRows.forEach(tr => {
            const type = tr.querySelector('.vehicle-type').value;
            const fuel = tr.querySelector('.fuel-type').value;
            const count = tr.querySelector('.vehicle-count').value;
            const dist = tr.querySelector('.vehicle-distance').value;
            const factor = tr.querySelector('.vehicle-factor').value;
            const day = tr.querySelector('.vehicle-day').textContent;
            const month = tr.querySelector('.vehicle-month').textContent;
            const year = tr.querySelector('.vehicle-year').textContent;
            const tons = tr.querySelector('.vehicle-year-tons').textContent;

            rows.push([type, fuel, count, dist, factor, day, month, year, tons]);
        });

        const csvContent = rows.map(e => e.map(val => `"${val}"`).join(',')).join('\n');
        const filename = `Vehicle_Emissions_Report_${new Date().toISOString().slice(0, 10)}.${format}`;
        downloadCSV(csvContent, filename);
        showToastMsg(`Vehicle emissions exported to ${format.toUpperCase()}.`, 'success');
    }

    document.getElementById('btn-export-vehicle-csv').addEventListener('click', (e) => {
        e.preventDefault();
        exportVehicleData('csv');
    });

    document.getElementById('btn-export-vehicle-excel').addEventListener('click', (e) => {
        e.preventDefault();
        exportVehicleData('xls'); // TSV renamed as xls
    });

    // Summary Report Export
    document.getElementById('btn-export-full-report').addEventListener('click', (e) => {
        e.preventDefault();

        const orgName = document.getElementById('org-name').value || 'Not provided';
        const orgAddress = document.getElementById('org-address').value || 'Not provided';
        const orgEmail = document.getElementById('org-email').value || 'Not provided';
        
        const grossVal = document.getElementById('summary-gross').textContent.trim();
        const offsetVal = document.getElementById('summary-offsets').textContent.trim();
        const netVal = document.getElementById('summary-net').textContent.trim();

        let report = `==================================================\n`;
        report += `CARBONTRACK PLATFORM - ESG SUMMARY ASSESSMENT REPORT\n`;
        report += `Generated on: ${new Date().toLocaleString()}\n`;
        report += `==================================================\n\n`;
        
        report += `ORGANIZATION DETAILS\n`;
        report += `--------------------\n`;
        report += `Name: ${orgName}\n`;
        report += `Address: ${orgAddress}\n`;
        report += `Email: ${orgEmail}\n\n`;

        report += `ANNUAL CARBON footprint FOOTPRINT SUMMARY\n`;
        report += `-----------------------------------------\n`;
        report += `Gross Emissions:   ${grossVal}\n`;
        report += `Carbon Offsets:    ${offsetVal}\n`;
        report += `Net Emissions:     ${netVal}\n\n`;
        
        report += `==================================================\n`;
        report += `Thank you for choosing CarbonTrack to log emissions.\n`;

        const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `CarbonTrack_ESG_Summary_${new Date().toISOString().slice(0, 10)}.txt`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToastMsg('Full summary text report downloaded.', 'success');
    });

    /* ==========================================
       9. Initialization
       ========================================== */
    // Insert initial rows on load
    createVehicleRow('car', 'petrol', 1, 10);
    createEnergyRow('purchased-grid', 12000);
    createLpgRow('commercial', 2.5);
    createPaperRow('standard-a4', 15000);
    createTreeRow('neem', 50);

    // Initial run
    calculateAll();
});
