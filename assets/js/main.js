// =============================================
// PREMIUM DARK PORTFOLIO - MAIN JS
// STANDARDIZED VERSION - Compatible with aesthetic-portfolio JSON structure
// =============================================

document.addEventListener('DOMContentLoaded', () => initializeApp());

const HTML_ESCAPE = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPE[char]);
}

function safeUrl(value) {
    const url = String(value ?? '').trim();
    if (!url) return '';
    return /^(https?:|mailto:|tel:|#|\/|assets\/)/i.test(url) ? url : '';
}

function externalAttrs(url) {
    return /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

function safeIconClass(value) {
    return String(value ?? '')
        .split(/\s+/)
        .filter(token => /^[a-z0-9_-]+$/i.test(token))
        .join(' ');
}

function renderIcon(className) {
    const safeClass = safeIconClass(className);
    return safeClass ? `<i class="${safeClass}" aria-hidden="true"></i>` : '';
}

function renderLink(url, label, className = '') {
    const href = safeUrl(url);
    if (!href) return '';
    const classes = className ? ` class="${escapeHTML(className)}"` : '';
    return `<a href="${escapeHTML(href)}"${classes}${externalAttrs(href)}>${escapeHTML(label)}</a>`;
}

async function initializeApp() {
    try {
        await Promise.all([
            loadSiteConfig(),
            loadNavigation(),
            loadHero(),
            loadAbout(),
            loadExperience(),
            loadProjects(),
            loadSkills(),
            loadEducation(),
            loadContact(),
            loadFooter()
        ]);
        initializeNavigation();
        initializeScrollEffects();
        initializeBackToTop();
        restoreHashScroll();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function restoreHashScroll() {
    if (!window.location.hash) return;

    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;

    const scrollToTarget = () => target.scrollIntoView({ block: 'start' });
    requestAnimationFrame(() => requestAnimationFrame(scrollToTarget));
    setTimeout(scrollToTarget, 150);
    setTimeout(scrollToTarget, 600);
}

async function loadSiteConfig() {
    try {
        const data = await fetch('data/site-config.json').then(r => r.json());
        const meta = data.meta || data.siteConfig || data;
        document.title = meta.title || 'Portfolio';
        document.querySelector('meta[name="description"]').content = meta.description || '';
        document.querySelector('meta[name="author"]').content = meta.author || '';

        if (meta.keywords) {
            let keywords = document.querySelector('meta[name="keywords"]');
            if (!keywords) {
                keywords = document.createElement('meta');
                keywords.name = 'keywords';
                document.head.appendChild(keywords);
            }
            keywords.content = meta.keywords;
        }
    } catch (error) {
        console.error('Error loading site config:', error);
    }
}

async function loadNavigation() {
    try {
        const data = await fetch('data/navigation.json').then(r => r.json());
        const brand = document.getElementById('nav-brand');
        brand.textContent = data.brand.name;
        brand.href = safeUrl(data.brand.href) || '#home';
        document.getElementById('nav-menu').innerHTML = data.menuItems.map(item =>
            `<li><a href="${escapeHTML(safeUrl(item.href) || '#')}" class="nav-link">${escapeHTML(item.text)}</a></li>`
        ).join('');
    } catch (error) {
        console.error('Error loading navigation:', error);
    }
}

async function loadHero() {
    try {
        const data = await fetch('data/hero.json').then(r => r.json());

        // Support both old and new structure
        const greeting = data.greeting || '';
        const name = data.name || '';
        const title = data.title || '';
        const summary = data.summary || data.tagline || '';
        const description = data.description || '';

        document.getElementById('hero-greeting').textContent = greeting;
        document.getElementById('hero-name').textContent = name;
        document.getElementById('hero-title').textContent = title;
        document.getElementById('hero-tagline').textContent = summary;
        document.getElementById('hero-description').textContent = description || summary;

        // Handle CTA - support both structures
        const ctaElement = document.getElementById('hero-cta');
        if (ctaElement) {
            let buttons = [];
            if (data.cta && data.cta.buttons) {
                // New structure: { buttons: [...] }
                buttons = data.cta.buttons;
            } else if (Array.isArray(data.cta)) {
                // Old structure: [...]
                buttons = data.cta;
            }

            ctaElement.innerHTML = buttons.map(btn =>
                `<a href="${escapeHTML(safeUrl(btn.href) || '#')}" class="btn btn-${escapeHTML(btn.type || 'secondary')}">${escapeHTML(btn.text)}</a>`
            ).join('');
        }

        const socialElement = document.getElementById('hero-social');
        if (socialElement && data.socialLinks) {
            socialElement.innerHTML = data.socialLinks.map(link => {
                const href = safeUrl(link.url);
                if (!href) return '';
                return `<a href="${escapeHTML(href)}"${externalAttrs(href)} class="social-link" aria-label="${escapeHTML(link.platform)}">${renderIcon(link.icon)}</a>`;
            }).join('');
        }

        // Handle stats/highlights - support both
        const statsElement = document.getElementById('hero-stats');
        if (statsElement) {
            const highlights = data.highlights || data.stats || [];
            statsElement.innerHTML = highlights.map(item => {
                // Support both formats
                const number = item.number || item.value || item.text || '';
                const label = item.label || '';
                return `<div class="stat-item"><span class="stat-number">${escapeHTML(number)}</span><span class="stat-label">${escapeHTML(label)}</span></div>`;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading hero:', error);
    }
}

async function loadAbout() {
    try {
        const data = await fetch('data/about.json').then(r => r.json());
        document.getElementById('about-title').textContent = data.sectionTitle;
        document.getElementById('about-content').innerHTML = data.content.map(p => `<p>${escapeHTML(p)}</p>`).join('');
        document.getElementById('about-highlights').innerHTML = data.highlights.map(h =>
            `<div class="highlight-card">${renderIcon(h.icon)}<h3>${escapeHTML(h.title)}</h3><p>${escapeHTML(h.description)}</p></div>`
        ).join('');
    } catch (error) {
        console.error('Error loading about:', error);
    }
}

// NEW: Load work experience (STANDARDIZED)
async function loadExperience() {
    try {
        const data = await fetch('data/experience.json').then(r => r.json());
        const experienceTitle = document.getElementById('experience-title');
        const timeline = document.getElementById('experience-timeline');

        if (experienceTitle) experienceTitle.textContent = data.sectionTitle || 'Professional Experience';
        if (!timeline) return;

        const experiences = data.experiences || [];
        timeline.innerHTML = experiences.map(exp => {
            const initials = (exp.company || '')
                .split(/\s+/)
                .map(word => word[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase();
            const logo = exp.logo
                ? `<img src="${escapeHTML(safeUrl(exp.logo))}" alt="${escapeHTML(exp.logoAlt || `${exp.company} logo`)}" loading="lazy" referrerpolicy="no-referrer">`
                : `<span>${escapeHTML(initials)}</span>`;

            return `
                <article class="experience-item">
                    <div class="experience-marker"></div>
                    <div class="experience-content">
                        <div class="experience-header">
                            <div class="experience-brand">
                                <div class="experience-logo">${logo}</div>
                                <div>
                                    <h3 class="experience-role">${escapeHTML(exp.title)}</h3>
                                    <p class="experience-company">${escapeHTML(exp.company)}</p>
                                </div>
                            </div>
                            <div class="experience-meta">
                                <span>${escapeHTML(exp.period)}</span>
                                ${exp.location ? `<span>${escapeHTML(exp.location)}</span>` : ''}
                            </div>
                        </div>
                        <ul class="experience-list">
                            ${(exp.responsibilities || []).map(item => `<li>${escapeHTML(item)}</li>`).join('')}
                        </ul>
                    </div>
                </article>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading experience:', error);
    }
}

// Load projects (STANDARDIZED - was part of loadWork)
async function loadProjects() {
    try {
        const data = await fetch('data/projects.json').then(r => r.json());
        const workTitle = document.getElementById('work-title');
        if (workTitle) workTitle.textContent = data.sectionTitle || 'Featured Work';

        const workGrid = document.getElementById('work-grid');
        const projects = data.projects || data.items || [];

        if (workGrid && projects.length > 0) {
            workGrid.innerHTML = projects.map(project => {
                // Support both "technologies" and "tags"
                const tags = project.technologies || project.tags || [];
                const repo = project.links?.github || project.github;
                const demo = project.links?.demo || project.demo;
                const live = project.links?.live || project.live;
                const demoIsRepo = demo && demo === repo;
                const liveIsRepo = live && live === repo;
                const actions = [
                    repo ? renderLink(repo, 'View repository', 'work-link') : '',
                    demo && !demoIsRepo ? renderLink(demo, 'Open demo', 'work-link') : '',
                    live && !liveIsRepo && live !== demo ? renderLink(live, 'Live site', 'work-link') : ''
                ].filter(Boolean).join('');

                return `<div class="work-card">
                    <div class="work-image">
                        <img src="${escapeHTML(safeUrl(project.image))}" alt="${escapeHTML(project.title)} project preview" loading="lazy">
                        <div class="work-icon">${renderIcon(project.icon)}</div>
                    </div>
                    <div class="work-content">
                        <p class="work-category">${escapeHTML(project.category)}</p>
                        <h3 class="work-title">${escapeHTML(project.title)}</h3>
                        <p class="work-description">${escapeHTML(project.description)}</p>
                        ${tags.length ? `<div class="work-tags">${tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                        ${actions ? `<div class="work-actions">${actions}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        }

        const activityGrid = document.getElementById('activity-grid');
        const activityProjects = data.activityProjects || [];
        if (activityGrid) {
            activityGrid.innerHTML = activityProjects.map(project => {
                const repo = project.links?.github || project.github;
                const tags = project.technologies || [];
                return `<article class="activity-card">
                    <div>
                        <p class="work-category">${escapeHTML(project.category)}</p>
                        <h3>${escapeHTML(project.title)}</h3>
                        <p>${escapeHTML(project.description)}</p>
                    </div>
                    ${tags.length ? `<div class="work-tags">${tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                    ${repo ? renderLink(repo, 'View repository', 'work-link') : ''}
                </article>`;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadSkills() {
    try {
        const data = await fetch('data/skills.json').then(r => r.json());
        document.getElementById('skills-title').textContent = data.sectionTitle;
        document.getElementById('skills-grid').innerHTML = data.categories.map(cat =>
            `<div class="skill-category">
                <div class="skill-category-header">
                    ${renderIcon(cat.icon)}
                    <h3 class="skill-category-name">${escapeHTML(cat.name || cat.category || cat.title)}</h3>
                </div>
                <div class="skill-list">
                    ${cat.skills.map(skill => `<span class="skill-tag">${escapeHTML(skill)}</span>`).join('')}
                </div>
            </div>`
        ).join('');
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

// NEW: Load education (STANDARDIZED)
async function loadEducation() {
    try {
        const data = await fetch('data/education.json').then(r => r.json());
        const educationTitle = document.getElementById('education-title');
        const educationGrid = document.getElementById('education-grid');
        const certificationsTitle = document.getElementById('certifications-title');
        const certificationsGrid = document.getElementById('certifications-grid');

        if (educationTitle) educationTitle.textContent = data.sectionTitle || 'Education';
        if (certificationsTitle) certificationsTitle.textContent = data.certificationsTitle || 'Certifications';

        if (educationGrid) {
            educationGrid.innerHTML = (data.education || []).map(item => `
                <article class="education-card">
                    <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                    <div>
                        <h3>${escapeHTML(item.degree)}</h3>
                        <p>${escapeHTML(item.institution || item.school)}</p>
                        ${item.description ? `<span>${escapeHTML(item.description)}</span>` : ''}
                    </div>
                </article>
            `).join('');
        }

        if (certificationsGrid) {
            certificationsGrid.innerHTML = (data.certifications || []).map(item => `
                <article class="certification-card">
                    <i class="fas fa-certificate" aria-hidden="true"></i>
                    <div>
                        <h3>${escapeHTML(item.name)}</h3>
                        <p>${escapeHTML(item.issuer)}${item.year ? ` - ${escapeHTML(item.year)}` : ''}</p>
                    </div>
                </article>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading education:', error);
    }
}

async function loadContact() {
    try {
        const data = await fetch('data/contact.json').then(r => r.json());
        document.getElementById('contact-title').textContent = data.sectionTitle;
        document.getElementById('contact-subtitle').textContent = data.subtitle;
        const email = safeUrl(`mailto:${data.email}`);
        const phone = data.phone ? safeUrl(`tel:${data.phone}`) : '';
        document.getElementById('contact-info').innerHTML = `
            <div class="contact-item"><i class="fas fa-envelope" aria-hidden="true"></i> <a href="${escapeHTML(email)}">${escapeHTML(data.email)}</a></div>
            ${phone ? `<div class="contact-item"><i class="fas fa-phone" aria-hidden="true"></i> <a href="${escapeHTML(phone)}">${escapeHTML(data.phone)}</a></div>` : ''}
            <div class="contact-item"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${escapeHTML(data.location)}</div>
            <div class="contact-item"><i class="fas fa-clock" aria-hidden="true"></i> ${escapeHTML(data.availability)}</div>
        `;
        document.getElementById('contact-social').innerHTML = data.socialLinks.map(link => {
            const href = safeUrl(link.url);
            if (!href) return '';
            return `<a href="${escapeHTML(href)}"${externalAttrs(href)} class="social-link" aria-label="${escapeHTML(link.platform)}">${renderIcon(link.icon)}</a>`;
        }).join('');
    } catch (error) {
        console.error('Error loading contact:', error);
    }
}

async function loadFooter() {
    try {
        const data = await fetch('data/footer.json').then(r => r.json());
        document.getElementById('footer-text').textContent = data.text;
        document.getElementById('footer-copyright').textContent = data.copyright;
        document.getElementById('footer-links').innerHTML = data.links.map(link => {
            const href = safeUrl(link.href || link.url);
            if (!href) return '';
            return `<a href="${escapeHTML(href)}"${externalAttrs(href)}>${escapeHTML(link.text)}</a>`;
        }).join('');
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        const setOpen = isOpen => {
            navMenu.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        };
        navToggle.addEventListener('click', () => setOpen(!navMenu.classList.contains('active')));
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => setOpen(false));
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setOpen(false);
        });
    }
}

function initializeScrollEffects() {
    const sections = document.querySelectorAll('section');
    const observerOptions = { threshold: 0.1, rootMargin: '-50px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, observerOptions);
    sections.forEach(section => observer.observe(section));
}

function initializeBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 300);
        });
        backToTop.addEventListener('click', () => {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }
}
