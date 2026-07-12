/* ==========================================================================
   CarbonTrack Interactive Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. Sticky Header & Active Nav Scroll Link
       ========================================== */
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    const handleScroll = () => {
        // Sticky Header effect
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger initial execution


    /* ==========================================
       2. Responsive Mobile Navigation Menu
       ========================================== */
    const hamburger = document.getElementById('hamburger-toggle');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const menuLinks = document.querySelectorAll('.nav-menu a, .nav-btn-login-mobile');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });


    /* ==========================================
       3. Scroll Reveal Observer
       ========================================== */
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Stop observing after anim triggers
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });


    /* ==========================================
       4. Real-time Carbon Calculator Widget Logic
       ========================================== */
    // Input elements
    const dieselInput = document.getElementById('diesel-consumption');
    const petrolInput = document.getElementById('petrol-consumption');
    const lpgInput = document.getElementById('lpg-consumption');
    const refrigerantInput = document.getElementById('refrigerant-leakage');
    const electricityInput = document.getElementById('electricity-consumption');
    const waterInput = document.getElementById('water-consumption');
    const paperInput = document.getElementById('paper-usage');
    const wasteInput = document.getElementById('waste-generated');
    const travelInput = document.getElementById('business-travel');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const sectorInput = document.getElementById('organization-sector');
    const mitigationSlider = document.getElementById('solar-mitigation-slider');
    const mitigationValLabel = document.getElementById('solar-slider-val');
    const savingsBadge = document.getElementById('savings-badge');

    // Output elements
    const scoreNumber = document.getElementById('carbon-score');
    const scope1ValEl = document.getElementById('scope1-val');
    const scope2ValEl = document.getElementById('scope2-val');
    const scope3ValEl = document.getElementById('scope3-val');
    const scope1Bar = document.getElementById('scope1-bar');
    const scope2Bar = document.getElementById('scope2-bar');
    const scope3Bar = document.getElementById('scope3-bar');
    const targetValEl = document.getElementById('target-val');
    const insightTextEl = document.getElementById('insight-text');

    // Emission factors (Representative GWP rates converted to tonnes)
    const EMISSION_FACTORS = {
        diesel: 2.68,
        petrol: 2.30,
        lpg: 2.98,
        refrigerant: 1818,
        electricity: 0.82,
        water: 0.34,
        paper: 1.30,
        waste: 0.48,
        travel: 0.1496
    };

    // Peer benchmarks configuration
    const PEER_BENCHMARKS = {
        'tech-office': { name: 'Tech Office', val: 35.00 },
        'university': { name: 'University Campus', val: 120.00 },
        'manufacturing': { name: 'Manufacturing', val: 450.00 },
        'retail': { name: 'Retail Store', val: 25.00 }
    };

    function calculateEmissions() {
        // Read values safely
        const diesel = Math.max(0, parseFloat(dieselInput.value) || 0);
        const petrol = Math.max(0, parseFloat(petrolInput.value) || 0);
        const lpg = Math.max(0, parseFloat(lpgInput.value) || 0);
        const refrigerant = Math.max(0, parseFloat(refrigerantInput.value) || 0);
        const originalElectricity = Math.max(0, parseFloat(electricityInput.value) || 0);
        const water = Math.max(0, parseFloat(waterInput.value) || 0);
        const paper = Math.max(0, parseFloat(paperInput.value) || 0);
        const waste = Math.max(0, parseFloat(wasteInput.value) || 0);
        const travel = Math.max(0, parseFloat(travelInput.value) || 0);

        // Apply mitigation slider (Solar shift)
        const mitigationPct = mitigationSlider ? parseFloat(mitigationSlider.value) || 0 : 0;
        if (mitigationValLabel) {
            mitigationValLabel.textContent = `${mitigationPct}%`;
        }

        const electricity = originalElectricity * (1 - (mitigationPct / 100));
        const savingsTons = ((originalElectricity - electricity) * EMISSION_FACTORS.electricity) / 1000;
        if (savingsBadge) {
            savingsBadge.textContent = `Saved: ${savingsTons.toFixed(2)} t`;
            savingsBadge.style.display = savingsTons > 0 ? 'inline-block' : 'none';
        }

        // Scope 1: Direct emissions
        const scope1Kg = (diesel * EMISSION_FACTORS.diesel) +
                          (petrol * EMISSION_FACTORS.petrol) +
                          (lpg * EMISSION_FACTORS.lpg) +
                          (refrigerant * EMISSION_FACTORS.refrigerant);
        const scope1Tons = scope1Kg / 1000;

        // Scope 2: Indirect energy emissions
        const scope2Kg = electricity * EMISSION_FACTORS.electricity;
        const scope2Tons = scope2Kg / 1000;

        // Scope 3: Value chain emissions
        const scope3Kg = (water * EMISSION_FACTORS.water) +
                          (paper * EMISSION_FACTORS.paper) +
                          (waste * EMISSION_FACTORS.waste) +
                          (travel * EMISSION_FACTORS.travel);
        const scope3Tons = scope3Kg / 1000;

        // Grand Total
        const totalTons = scope1Tons + scope2Tons + scope3Tons;

        // Animate grand total
        const prevScore = parseFloat(scoreNumber.textContent) || 0;
        animateValue(scoreNumber, prevScore, totalTons, 800, 2, '');

        // Update Scope values and animate them
        const s1Prev = parseFloat(scope1ValEl.textContent) || 0;
        animateValue(scope1ValEl, s1Prev, scope1Tons, 800, 2, ' t');

        const s2Prev = parseFloat(scope2ValEl.textContent) || 0;
        animateValue(scope2ValEl, s2Prev, scope2Tons, 800, 2, ' t');

        const s3Prev = parseFloat(scope3ValEl.textContent) || 0;
        animateValue(scope3ValEl, s3Prev, scope3Tons, 800, 2, ' t');

        // Update bar widths based on percentage share
        if (totalTons > 0) {
            const s1Pct = Math.min(100, Math.max(0, (scope1Tons / totalTons) * 100));
            const s2Pct = Math.min(100, Math.max(0, (scope2Tons / totalTons) * 100));
            const s3Pct = Math.min(100, Math.max(0, (scope3Tons / totalTons) * 100));

            scope1Bar.style.width = `${s1Pct}%`;
            scope2Bar.style.width = `${s2Pct}%`;
            scope3Bar.style.width = `${s3Pct}%`;
        } else {
            scope1Bar.style.width = '0%';
            scope2Bar.style.width = '0%';
            scope3Bar.style.width = '0%';
        }

        // Update 30% reduction target
        const targetTons = totalTons * 0.70;
        targetValEl.textContent = `${targetTons.toFixed(2)} tCO₂e`;

        // Update AI Insight dynamically based on highest scope share
        const categories = [
            { name: 'Scope 1 (Direct Emissions)', value: scope1Tons, desc: 'fuels and refrigerants' },
            { name: 'Scope 2 (Purchased Energy)', value: scope2Tons, desc: 'electricity consumption' },
            { name: 'Scope 3 (Value Chain)', value: scope3Tons, desc: 'water, paper, waste, and travel' }
        ];

        categories.sort((a, b) => b.value - a.value);
        if (totalTons > 0) {
            const topPct = Math.round((categories[0].value / totalTons) * 100);
            if (categories[0].name.includes('Scope 2')) {
                insightTextEl.innerHTML = `Electricity consumption contributes <strong>${topPct}%</strong> of your emissions. Prioritise reduction initiatives here for maximum impact.`;
            } else {
                insightTextEl.innerHTML = `${categories[0].name} contributes <strong>${topPct}%</strong> of your emissions. Prioritise reduction initiatives in ${categories[0].desc} for maximum impact.`;
            }
        } else {
            insightTextEl.innerHTML = `Enter operational values to see dynamically generated AI insights.`;
        }
    }

    // Smooth value number transitions
    function animateValue(obj, start, end, duration, decimals = 2, suffix = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = start + progress * (end - start);
            obj.innerHTML = currentVal.toFixed(decimals) + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Attach listeners on inputs to auto calculate
    const inputListeners = [dieselInput, petrolInput, lpgInput, refrigerantInput, electricityInput, waterInput, paperInput, wasteInput, travelInput, sectorInput, mitigationSlider];
    inputListeners.forEach(input => {
        if(input) {
            input.addEventListener('change', calculateEmissions);
            input.addEventListener('input', calculateEmissions);
        }
    });

    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            calculateEmissions();
            showToast('Carbon Inventory model re-calculated successfully.', 'success');
        });
    }

    // Run initial calculation
    calculateEmissions();


    /* ==========================================
       5. Interactive Methodology Steps
       ========================================== */
    const timelineSteps = document.querySelectorAll('.timeline-step');
    const detailTitle = document.getElementById('detail-title');
    const detailDesc = document.getElementById('detail-desc');

    const stepDetails = {
        '1': {
            title: 'Data Collection Deep-Dive',
            desc: 'Our engine ingests localized consumption variables. Users log parameters like transport miles, household utility statistics, flight counts, and nutrition. High security standards guarantee data is processed locally.'
        },
        '2': {
            title: 'Emission Calculation Factors',
            desc: 'The mathematical processor maps user data against national conversion datasets. It multiplies mileage by vehicle weight coefficients, converts home energy expenses into energy units (kWh), and estimates waste offsets based on regional averages.'
        },
        '3': {
            title: 'Statistical Breakdown & Benchmarks',
            desc: 'Calculated outputs are categorized into Scope 1 (Direct emissions like driving fuel), Scope 2 (Indirect emissions from utilities), and Scope 3 (Lifestyle commodities). We compare your annual profile against global carbon targets.'
        },
        '4': {
            title: 'Actionable Sustainability Plans',
            desc: 'Based on your carbon footprint, our algorithm maps custom sustainability benchmarks. Recommendations range from simple diet changes to investing in domestic energy assets, showing you exactly how much CO2e you save with each action.'
        }
    };

    timelineSteps.forEach(step => {
        step.addEventListener('click', () => {
            // Remove active status
            timelineSteps.forEach(s => s.classList.remove('active'));
            // Add active status to clicked step
            step.classList.add('active');

            // Retrieve content
            const stepNum = step.getAttribute('data-step');
            const data = stepDetails[stepNum];

            if(data) {
                // Animate change beautifully
                detailTitle.style.opacity = 0;
                detailDesc.style.opacity = 0;

                setTimeout(() => {
                    detailTitle.textContent = data.title;
                    detailDesc.textContent = data.desc;
                    detailTitle.style.opacity = 1;
                    detailDesc.style.opacity = 1;
                }, 200);
            }
        });
    });


    /* ==========================================
       6. Form Validations, Google Sign-in & Toast Alerts
       ========================================== */
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('btn-google-login');
    const toastContainer = document.getElementById('toast-container');
    
    // Modal controls
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    function showModal(title, message) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalOverlay.classList.add('active');
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }

    // Click outside modal to close
    modalOverlay.addEventListener('click', (e) => {
        if(e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(text);

        toastContainer.appendChild(toast);

        // Show transition
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Hide transition & remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 4000);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (email && password) {
                if (password.length < 6) {
                    showToast('Password must be at least 6 characters long.', 'error');
                    return;
                }
                
                // Simulate Login
                showModal('Access Granted', `Hello! You have successfully signed in as ${email}. Your profile tracking settings have been loaded.`);
                loginForm.reset();
            }
        });
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Simulate Google OAuth
            showModal('Google Login Connected', 'Successfully authenticated via Google services. Welcome to CarbonTrack!');
        });
    }

    /* ==========================================
       7. Dark/Light Theme Toggle
       ========================================== */
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (isDark) {
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
                showToast('Dark theme activated.', 'info');
            } else {
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
                showToast('Light theme activated.', 'info');
            }
        });
    }

    /* ==========================================
       8. ESG Audit Export Simulator
       ========================================== */
    const exportEsgBtn = document.getElementById('export-esg-btn');
    const auditModalOverlay = document.getElementById('audit-modal-overlay');
    const auditLoader = document.getElementById('audit-loader');
    const auditSuccessLayout = document.getElementById('audit-success-layout');
    const loaderStatus = document.getElementById('loader-status');
    
    const btnModalPrint = document.getElementById('btn-modal-print');
    const btnModalClose = document.getElementById('btn-modal-close');

    const auditModalTotal = document.getElementById('audit-modal-total');
    const auditModalBenchmark = document.getElementById('audit-modal-benchmark');
    const auditModalIndex = document.getElementById('audit-modal-index');

    if (exportEsgBtn) {
        exportEsgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Set values from current state
            const totalEmissions = document.getElementById('carbon-score').textContent;
            const sectorVal = sectorInput ? sectorInput.value : 'tech-office';
            const benchmarkObj = PEER_BENCHMARKS[sectorVal];
            
            const totalNum = parseFloat(totalEmissions) || 0;
            const diffPct = Math.round(Math.abs((totalNum - benchmarkObj.val) / benchmarkObj.val) * 100);
            const indexText = totalNum < benchmarkObj.val ? `${diffPct}% below standard` : `${diffPct}% above standard`;

            if (auditModalTotal) auditModalTotal.textContent = `${totalNum.toFixed(2)} tCO₂e`;
            if (auditModalBenchmark) auditModalBenchmark.textContent = `${benchmarkObj.name} (${benchmarkObj.val.toFixed(2)} t)`;
            if (auditModalIndex) {
                auditModalIndex.textContent = indexText;
                auditModalIndex.style.color = totalNum < benchmarkObj.val ? '#10b981' : '#ef4444';
            }

            // Show modal and start loading simulation
            if (auditModalOverlay) {
                auditModalOverlay.style.display = 'flex';
                auditModalOverlay.style.opacity = '1';
            }
            if (auditLoader) auditLoader.style.display = 'block';
            if (auditSuccessLayout) auditSuccessLayout.style.display = 'none';

            // Sequence messages
            const statuses = [
                'Connecting to GHG Protocol factors API...',
                'Parsing Scope 1 diesel, petrol, and lpg direct activity fields...',
                'Parsing Scope 2 utilities grid values with solar mitigation offsets...',
                'Assembling Scope 3 value chain ledger (water, paper, waste, and travels)...',
                'Generating ISO 14064-1 compliance ledger document...'
            ];

            let stepIdx = 0;
            const statusInterval = setInterval(() => {
                if (stepIdx < statuses.length) {
                    if (loaderStatus) loaderStatus.textContent = statuses[stepIdx];
                    stepIdx++;
                } else {
                    clearInterval(statusInterval);
                    if (auditLoader) auditLoader.style.display = 'none';
                    if (auditSuccessLayout) auditSuccessLayout.style.display = 'block';
                    showToast('ESG Audit Report prepared successfully.', 'success');
                }
            }, 500);
        });
    }

    if (btnModalClose) {
        btnModalClose.addEventListener('click', () => {
            if (auditModalOverlay) {
                auditModalOverlay.style.opacity = '0';
                setTimeout(() => {
                    auditModalOverlay.style.display = 'none';
                }, 300);
            }
        });
    }

    if (btnModalPrint) {
        btnModalPrint.addEventListener('click', () => {
            window.print();
        });
    }

    /* ==========================================
       9. Interactive SVG Trend Chart Hover Effects
       ========================================== */
    const trendChartWrapper = document.querySelector('.trend-chart-wrapper');
    if (trendChartWrapper) {
        // Create tooltip, guide line, and data dot elements dynamically
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        trendChartWrapper.appendChild(tooltip);

        const guideLine = document.createElement('div');
        guideLine.className = 'chart-guide-line';
        trendChartWrapper.appendChild(guideLine);

        const dataDot = document.createElement('div');
        dataDot.className = 'chart-data-dot';
        trendChartWrapper.appendChild(dataDot);

        // Simulated monthly emissions data matching the SVG spline curve peaks
        const monthlyData = [
            { name: 'Jan', val: 78 },
            { name: 'Feb', val: 75 },
            { name: 'Mar', val: 85 },
            { name: 'Apr', val: 71 },
            { name: 'May', val: 68 },
            { name: 'Jun', val: 70 },
            { name: 'Jul', val: 65 },
            { name: 'Aug', val: 63 },
            { name: 'Sep', val: 68 },
            { name: 'Oct', val: 65 },
            { name: 'Nov', val: 58 },
            { name: 'Dec', val: 53 }
        ];

        // Monthly coordinates inside the 500px coordinate system of viewBox
        const monthXPoints = [0, 45, 90, 135, 180, 225, 270, 315, 360, 405, 450, 500];
        // Corresponding Y points (from SVG path) mapped to height (viewBox height is 180)
        const monthYPoints = [65, 72, 55, 85, 92, 88, 100, 105, 95, 98, 110, 120];

        trendChartWrapper.addEventListener('mousemove', (e) => {
            const rect = trendChartWrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; // pixel x position
            const width = rect.width;
            
            // Map pixel x to viewBox coordinates (0 to 500)
            const viewBoxX = (mouseX / width) * 500;
            
            // Find the index of the closest month point
            let closestIdx = 0;
            let minDiff = Infinity;
            for (let i = 0; i < monthXPoints.length; i++) {
                const diff = Math.abs(viewBoxX - monthXPoints[i]);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIdx = i;
                }
            }

            // Map closest point back to pixel coordinates for placing elements
            const dotPixelX = (monthXPoints[closestIdx] / 500) * width;
            const dotPixelY = (monthYPoints[closestIdx] / 180) * rect.height;

            // Show guide elements
            guideLine.style.display = 'block';
            guideLine.style.left = `${dotPixelX}px`;

            dataDot.style.display = 'block';
            dataDot.style.left = `${dotPixelX - 5}px`;
            dataDot.style.top = `${dotPixelY - 5}px`;

            tooltip.style.display = 'block';
            tooltip.style.left = `${dotPixelX}px`;
            tooltip.style.top = `${dotPixelY}px`;
            tooltip.textContent = `${monthlyData[closestIdx].name}: ${monthlyData[closestIdx].val} tCO₂e`;
        });

        trendChartWrapper.addEventListener('mouseleave', () => {
            guideLine.style.display = 'none';
            dataDot.style.display = 'none';
            tooltip.style.display = 'none';
        });
    }
});
