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

function linkAccessibleName(link, href, fallback = 'Link') {
    const explicitLabel = link?.ariaLabel || link?.accessibleName || link?.label || link?.platform || link?.text;
    if (explicitLabel) return explicitLabel;

    if (/^mailto:/i.test(href)) {
        const email = href.replace(/^mailto:/i, '').split('?')[0];
        return email ? `Email ${email}` : 'Email';
    }

    if (/^tel:/i.test(href)) {
        const phone = href.replace(/^tel:/i, '');
        return phone ? `Call ${phone}` : 'Call';
    }

    if (/^https?:\/\//i.test(href)) {
        try {
            const url = new URL(href);
            return url.hostname.replace(/^www\./i, '') || fallback;
        } catch (error) {
            return fallback;
        }
    }

    return fallback;
}

function renderIconLink(link, className = 'social-link') {
    const href = safeUrl(link?.url || link?.href);
    if (!href) return '';
    const label = linkAccessibleName(link, href, 'Profile link');
    const icon = renderIcon(link?.icon);
    const classes = className ? ` class="${escapeHTML(className)}"` : '';
    return `<a href="${escapeHTML(href)}"${externalAttrs(href)}${classes} aria-label="${escapeHTML(label)}">${icon || escapeHTML(label)}</a>`;
}

function initializeImageFallbacks(root = document) {
    const images = root.matches?.('img') ? [root] : Array.from(root.querySelectorAll('img'));

    images.forEach(img => {
        if (img.dataset.imageFallbackReady === 'true') return;
        img.dataset.imageFallbackReady = 'true';

        img.addEventListener('error', () => {
            const fallback = img.nextElementSibling?.hasAttribute('data-image-fallback') ? img.nextElementSibling : null;
            const hideSelector = img.dataset.hideOnError;

            img.hidden = true;
            img.removeAttribute('src');
            if (fallback) fallback.hidden = false;

            if (hideSelector) {
                const target = img.closest(hideSelector);
                if (target) target.hidden = true;
            }
        }, { once: true });
    });
}

function setHeroImage(photo, media, url, alt) {
    if (!photo || !media) return;

    if (!url) {
        photo.removeAttribute('src');
        media.hidden = true;
        return;
    }

    media.hidden = false;
    photo.hidden = false;
    photo.alt = alt || 'Professional portrait';
    photo.width = 900;
    photo.height = 1124;
    photo.dataset.hideOnError = '.hero-media';
    initializeImageFallbacks(media);
    photo.src = url;
}

async function initializeApp() {
    initializeImageFallbacks(document);

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
    } catch (error) {
        console.error('Error initializing app:', error);
    }

    initializeImageFallbacks(document);
    initializeNavigation();
    initializeScrollEffects();
    initializeBackToTop();
    restoreHashScroll();
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
        const description = document.querySelector('meta[name="description"]');
        const author = document.querySelector('meta[name="author"]');
        if (description) description.content = meta.description || '';
        if (author) author.content = meta.author || '';

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
        const navMenu = document.getElementById('nav-menu');
        if (brand) {
            brand.textContent = data.brand?.name || brand.textContent;
            brand.href = safeUrl(data.brand?.href) || '#home';
        }
        const menuItems = data.menuItems || [];
        if (!navMenu || !menuItems.length) return;
        navMenu.innerHTML = menuItems.map(item =>
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
        const avatarUrl = safeUrl(data.avatarUrl || data.profilePhoto || data.photo);
        const avatarAlt = data.avatarAlt || 'Professional portrait';

        document.getElementById('hero-greeting').textContent = greeting;
        document.getElementById('hero-name').textContent = name;
        document.getElementById('hero-title').textContent = title;
        document.getElementById('hero-tagline').textContent = summary;
        document.getElementById('hero-description').textContent = description || summary;
        const heroPhoto = document.getElementById('hero-photo');
        const heroMedia = document.getElementById('hero-media');
        setHeroImage(heroPhoto, heroMedia, avatarUrl, avatarAlt);

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

            if (buttons.length) {
                ctaElement.innerHTML = buttons.map(btn => {
                    const href = safeUrl(btn.href) || '#';
                    const label = btn.text || 'Learn more';
                    return `<a href="${escapeHTML(href)}" class="btn btn-${escapeHTML(btn.type || 'secondary')}">${escapeHTML(label)}</a>`;
                }).join('');
            }
        }

        const socialElement = document.getElementById('hero-social');
        if (socialElement && data.socialLinks?.length) {
            socialElement.innerHTML = data.socialLinks.map(link => renderIconLink(link)).join('');
        }

        // Handle stats/highlights - support both
        const statsElement = document.getElementById('hero-stats');
        if (statsElement) {
            const highlights = data.highlights || data.stats || [];
            if (!highlights.length) return;
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
        if (data.sectionTitle) document.getElementById('about-title').textContent = data.sectionTitle;
        if (data.content?.length) {
            document.getElementById('about-content').innerHTML = data.content.map(p => `<p>${escapeHTML(p)}</p>`).join('');
        }
        if (data.highlights?.length) {
            document.getElementById('about-highlights').innerHTML = data.highlights.map(h =>
                `<div class="highlight-card">${renderIcon(h.icon)}<p class="highlight-value">${escapeHTML(h.title)}</p><p class="highlight-label">${escapeHTML(h.description)}</p></div>`
            ).join('');
        }
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
        if (!experiences.length) return;
        timeline.innerHTML = experiences.map(exp => {
            const initials = (exp.company || '')
                .split(/\s+/)
                .map(word => word[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase();
            const logoText = initials || 'DE';
            const logoUrl = safeUrl(exp.logo);
            const logo = logoUrl
                ? `<img src="${escapeHTML(logoUrl)}" alt="${escapeHTML(exp.logoAlt || `${exp.company} logo`)}" loading="lazy" referrerpolicy="no-referrer"><span data-image-fallback hidden>${escapeHTML(logoText)}</span>`
                : `<span>${escapeHTML(logoText)}</span>`;

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
        initializeImageFallbacks(timeline);
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
                const highlights = project.highlights || [];
                const metaTags = [
                    project.featured ? 'Featured project' : '',
                    project.status ? `Status: ${project.status}` : '',
                    project.role ? `Role: ${project.role}` : ''
                ].filter(Boolean);
                const repo = project.links?.github || project.github;
                const demo = project.links?.demo || project.demo;
                const live = project.links?.live || project.live;
                const demoIsRepo = demo && demo === repo;
                const liveIsRepo = live && live === repo;
                const imageUrl = safeUrl(project.image);
                const actions = [
                    repo ? renderLink(repo, 'View repository', 'work-link') : '',
                    demo && !demoIsRepo ? renderLink(demo, 'Open demo', 'work-link') : '',
                    live && !liveIsRepo && live !== demo ? renderLink(live, 'Live site', 'work-link') : ''
                ].filter(Boolean).join('');

                return `<article class="work-card">
                    <div class="work-image">
                        ${imageUrl ? `<img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(project.title)} project preview" loading="lazy">` : ''}
                        <div class="work-icon">${renderIcon(project.icon)}</div>
                    </div>
                    <div class="work-content">
                        <p class="work-category">${escapeHTML(project.category)}</p>
                        <h3 class="work-title">${escapeHTML(project.title)}</h3>
                        <p class="work-description">${escapeHTML(project.description)}</p>
                        ${project.longDescription ? `<p class="work-detail">${escapeHTML(project.longDescription)}</p>` : ''}
                        ${metaTags.length ? `<div class="work-meta">${metaTags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                        ${highlights.length ? `<ul class="work-highlights">${highlights.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : ''}
                        ${tags.length ? `<div class="work-tags">${tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
                        ${actions ? `<div class="work-actions">${actions}</div>` : ''}
                    </div>
                </article>`;
            }).join('');
            initializeImageFallbacks(workGrid);
        }

        const activityGrid = document.getElementById('activity-grid');
        const activityProjects = data.activityProjects || [];
        if (activityGrid && activityProjects.length) {
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
        if (data.sectionTitle) document.getElementById('skills-title').textContent = data.sectionTitle;
        if (!data.categories?.length) return;
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

        const education = data.education || [];
        if (educationGrid && education.length) {
            educationGrid.innerHTML = education.map(item => `
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

        const certifications = data.certifications || [];
        if (certificationsGrid && certifications.length) {
            certificationsGrid.innerHTML = certifications.map(item => `
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
        const contactTitle = document.getElementById('contact-title');
        const contactSubtitle = document.getElementById('contact-subtitle');
        const contactInfo = document.getElementById('contact-info');
        const contactSocial = document.getElementById('contact-social');
        if (contactTitle && data.sectionTitle) contactTitle.textContent = data.sectionTitle;
        if (contactSubtitle && data.subtitle) contactSubtitle.textContent = data.subtitle;
        const email = data.email ? safeUrl(`mailto:${data.email}`) : '';
        const phone = data.phone ? safeUrl(`tel:${data.phone}`) : '';
        const contactRows = [
            email ? `<div class="contact-item"><i class="fas fa-envelope" aria-hidden="true"></i> <a href="${escapeHTML(email)}">${escapeHTML(data.email)}</a></div>` : '',
            phone ? `<div class="contact-item"><i class="fas fa-phone" aria-hidden="true"></i> <a href="${escapeHTML(phone)}">${escapeHTML(data.phone)}</a></div>` : '',
            data.location ? `<div class="contact-item"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${escapeHTML(data.location)}</div>` : '',
            data.availability ? `<div class="contact-item"><i class="fas fa-clock" aria-hidden="true"></i> ${escapeHTML(data.availability)}</div>` : ''
        ].filter(Boolean).join('');
        if (contactInfo && contactRows) contactInfo.innerHTML = contactRows;
        if (contactSocial && data.socialLinks?.length) {
            contactSocial.innerHTML = data.socialLinks.map(link => renderIconLink(link)).join('');
        }
    } catch (error) {
        console.error('Error loading contact:', error);
    }
}

async function loadFooter() {
    try {
        const data = await fetch('data/footer.json').then(r => r.json());
        const footerText = document.getElementById('footer-text');
        const footerCopyright = document.getElementById('footer-copyright');
        const footerLinks = document.getElementById('footer-links');
        if (footerText && data.text) footerText.textContent = data.text;
        if (footerCopyright && data.copyright) footerCopyright.textContent = data.copyright;
        if (footerLinks && data.links?.length) {
            footerLinks.innerHTML = data.links.map(link => {
                const href = safeUrl(link.href || link.url);
                if (!href) return '';
                return `<a href="${escapeHTML(href)}"${externalAttrs(href)}>${escapeHTML(link.text)}</a>`;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        const mobileQuery = typeof window.matchMedia === 'function'
            ? window.matchMedia('(max-width: 968px)')
            : null;

        const isMobileMenu = () => Boolean(mobileQuery?.matches);

        const setMenuFocusable = isFocusable => {
            navMenu.querySelectorAll('a[href], button:not([disabled])').forEach(element => {
                if (isFocusable) {
                    if (element.hasAttribute('data-nav-tabindex')) {
                        const previousTabIndex = element.getAttribute('data-nav-tabindex');
                        if (previousTabIndex) {
                            element.setAttribute('tabindex', previousTabIndex);
                        } else {
                            element.removeAttribute('tabindex');
                        }
                        element.removeAttribute('data-nav-tabindex');
                    }
                    return;
                }

                if (!element.hasAttribute('data-nav-tabindex')) {
                    element.setAttribute('data-nav-tabindex', element.getAttribute('tabindex') || '');
                }
                element.setAttribute('tabindex', '-1');
            });
        };

        const syncMenuA11yState = isOpen => {
            const shouldHideFromFocus = isMobileMenu() && !isOpen;

            if (shouldHideFromFocus) {
                navMenu.setAttribute('aria-hidden', 'true');
                navMenu.setAttribute('inert', '');
                navMenu.inert = true;
                setMenuFocusable(false);

                if (navMenu.contains(document.activeElement)) {
                    navToggle.focus();
                }
                return;
            }

            navMenu.removeAttribute('aria-hidden');
            navMenu.removeAttribute('inert');
            navMenu.inert = false;
            setMenuFocusable(true);
        };

        const setOpen = isOpen => {
            navMenu.classList.toggle('active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
            syncMenuA11yState(isOpen);
        };

        setOpen(false);
        navToggle.addEventListener('click', () => setOpen(!navMenu.classList.contains('active')));
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => setOpen(false));
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) setOpen(false);
        });

        if (mobileQuery?.addEventListener) {
            mobileQuery.addEventListener('change', () => setOpen(false));
        } else if (mobileQuery?.addListener) {
            mobileQuery.addListener(() => setOpen(false));
        }
    }
}

function initializeScrollEffects() {
    const sections = document.querySelectorAll('section');
    if (!('IntersectionObserver' in window)) {
        sections.forEach(section => section.classList.add('visible'));
        return;
    }

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
            const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }
}
