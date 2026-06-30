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
    const carMilesInput = document.getElementById('car-miles');
    const vehicleTypeSelect = document.getElementById('vehicle-type');
    const flightsInput = document.getElementById('flights');
    const electricityInput = document.getElementById('electricity');
    const cleanEnergySlider = document.getElementById('clean-energy');
    const cleanEnergyVal = document.getElementById('clean-energy-val');
    const householdMembersInput = document.getElementById('household-members');
    const dietTypeSelect = document.getElementById('diet-type');
    const wasteRecycleSelect = document.getElementById('waste-recycle');
    const recalculateBtn = document.getElementById('recalculate-btn');

    // Output elements
    const scoreNumber = document.getElementById('carbon-score');
    const meterFill = document.getElementById('meter-fill');
    const meterPointer = document.getElementById('meter-pointer');
    const comparisonText = document.getElementById('comparison-text');
    const tipContent = document.querySelector('.tip-content');
    const tipTitle = document.querySelector('.tip-title');

    // Clean Energy Range Display Update
    cleanEnergySlider.addEventListener('input', () => {
        cleanEnergyVal.textContent = `${cleanEnergySlider.value}%`;
        calculateEmissions();
    });

    // EPA emission factors constant values (representative rates)
    const EMISSION_FACTORS = {
        vehicles: {
            gasoline: 0.96, // lbs CO2 per mile (US EPA comb. average SUV/sedan)
            diesel: 1.05,   // lbs CO2 per mile
            hybrid: 0.45,   // lbs CO2 per mile
            electric: 0.15  // lbs CO2 equivalent per mile (grid average charging)
        },
        flight: 550,        // lbs CO2 per average short-medium haul flight
        electricity: {
            kwhRate: 0.15,  // Cost per kWh (National average $0.15)
            co2PerKwh: 0.85 // lbs CO2 per kWh (Grid average)
        },
        diet: {
            'heavy-meat': 3.0,  // Annual Metric Tons CO2e
            'medium-meat': 1.8, // Annual Metric Tons CO2e
            'vegetarian': 1.1,  // Annual Metric Tons CO2e
            'vegan': 0.7        // Annual Metric Tons CO2e
        },
        waste: {
            base: 0.6,      // Annual Metric Tons CO2e base waste per person
            recycleOffset: -0.2 // Deducted Tons if recycling
        }
    };

    const LBS_TO_METRIC_TONS = 2204.62;
    const NATIONAL_AVG = 7.5; // Average Metric Tons per person per year

    function calculateEmissions() {
        // Read values safely
        const carMiles = Math.max(0, parseFloat(carMilesInput.value) || 0);
        const vehicleType = vehicleTypeSelect.value;
        const flights = Math.max(0, parseInt(flightsInput.value) || 0);
        const electricityBill = Math.max(0, parseFloat(electricityInput.value) || 0);
        const cleanEnergyPct = parseFloat(cleanEnergySlider.value) || 0;
        const householdMembers = Math.max(1, parseInt(householdMembersInput.value) || 1);
        const dietType = dietTypeSelect.value;
        const recycleActive = wasteRecycleSelect.value === 'yes';

        // 1. Transportation Carbon
        const annualCarMiles = carMiles * 52;
        const carLbs = annualCarMiles * EMISSION_FACTORS.vehicles[vehicleType];
        const carTons = carLbs / LBS_TO_METRIC_TONS;

        const flightLbs = flights * EMISSION_FACTORS.flight;
        const flightTons = flightLbs / LBS_TO_METRIC_TONS;

        const totalTransportTons = carTons + flightTons;

        // 2. Household Energy Carbon (Shared among household members)
        const annualEnergyBill = electricityBill * 12;
        const annualKwh = annualEnergyBill / EMISSION_FACTORS.electricity.kwhRate;
        const grossElectricityLbs = annualKwh * EMISSION_FACTORS.electricity.co2PerKwh;
        const netElectricityLbs = grossElectricityLbs * (1 - (cleanEnergyPct / 100));
        const energyTonsPerHousehold = netElectricityLbs / LBS_TO_METRIC_TONS;
        const energyTonsPerPerson = energyTonsPerHousehold / householdMembers;

        // 3. Diet & Lifestyle Carbon
        const dietTons = EMISSION_FACTORS.diet[dietType];
        const wasteTons = EMISSION_FACTORS.waste.base + (recycleActive ? EMISSION_FACTORS.waste.recycleOffset : 0);

        // 4. Aggregate Grand Total (Tons CO2e / Year)
        const grandTotalTons = totalTransportTons + energyTonsPerPerson + dietTons + wasteTons;
        const roundedTotal = Math.round(grandTotalTons * 10) / 10;

        // Update score display with a nice visual animation
        animateValue(scoreNumber, parseFloat(scoreNumber.textContent) || 0, roundedTotal, 800);

        // Update Meter scale: Range 0T to 15T maps to 0% to 100%
        const maxScaleTons = 15;
        let scalePercentage = (grandTotalTons / maxScaleTons) * 100;
        scalePercentage = Math.min(100, Math.max(0, scalePercentage)); // Bound between 0-100%

        meterFill.style.width = `${scalePercentage}%`;
        meterPointer.style.left = `${scalePercentage}%`;

        // Update comparison info text
        const diffPercent = Math.round(Math.abs((roundedTotal - NATIONAL_AVG) / NATIONAL_AVG) * 100);
        if (roundedTotal < NATIONAL_AVG) {
            comparisonText.innerHTML = `Your score is <strong>${diffPercent}% below</strong> the national research average (${NATIONAL_AVG} Tons/person).`;
        } else if (roundedTotal > NATIONAL_AVG) {
            comparisonText.innerHTML = `Your score is <strong>${diffPercent}% above</strong> the national research average (${NATIONAL_AVG} Tons/person). Consider offsets.`;
        } else {
            comparisonText.innerHTML = `Your score matches the national research average exactly (${NATIONAL_AVG} Tons/person).`;
        }

        // Tailor Recommendations based on the largest emission categories
        const categories = [
            { name: 'Transportation', value: totalTransportTons, tip: 'Carpooling or choosing public transit can reduce transport emissions. Upgrading to hybrid/EV models reduces mileage impact up to 80%.' },
            { name: 'Household Energy', value: energyTonsPerPerson, tip: 'Increasing your clean renewable share to 50% or installing smart LED thermostats offers immediate carbon reductions.' },
            { name: 'Lifestyle & Diet', value: dietTons + wasteTons, tip: 'Adopting a plant-based diet even 2 days a week saves up to 0.5 Tons of carbon annually. Ensure all plastics and composting are actively recycled.' }
        ];

        // Sort descending to find top emission driver
        categories.sort((a, b) => b.value - a.value);
        tipTitle.textContent = `⚡ Top Opportunity: ${categories[0].name}`;
        tipContent.textContent = categories[0].tip;
    }

    // Smooth value number transitions
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = start + progress * (end - start);
            obj.innerHTML = currentVal.toFixed(1);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Attach listeners on inputs to auto calculate
    const inputListeners = [carMilesInput, vehicleTypeSelect, flightsInput, electricityInput, cleanEnergySlider, householdMembersInput, dietTypeSelect, wasteRecycleSelect];
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
            showToast('Assessment re-calculated successfully.', 'success');
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
});
