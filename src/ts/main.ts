import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { destroyParticles, initParticles, ParticleHandle } from './particles';

gsap.registerPlugin(ScrollTrigger);

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const setCurrentYear = () => {
  const yearEl = document.querySelector<HTMLElement>('[data-year]');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
};

const setupNavigation = () => {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Main navigation"]');
  const navLinks = nav ? Array.from(nav.querySelectorAll<HTMLAnchorElement>('.nav-link')) : [];
  const navIndicator = document.createElement('span');
  navIndicator.className = 'nav-indicator';
  nav?.appendChild(navIndicator);

  const headerBar = document.getElementById('nav-bar');
  const mobileToggle = document.getElementById('mobile-nav-toggle') as HTMLButtonElement | null;
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = mobileNav ? Array.from(mobileNav.querySelectorAll<HTMLAnchorElement>('.mobile-nav-link')) : [];

  const getOffset = () => (headerBar ? headerBar.offsetHeight + 24 : 96);

  const moveIndicator = (target: HTMLElement | null) => {
    if (!nav || !target) {
      gsap.to(navIndicator, { opacity: 0, duration: 0.3 });
      return;
    }
    const bounds = target.getBoundingClientRect();
    const parentBounds = nav.getBoundingClientRect();
    const width = bounds.width;
    const x = bounds.left - parentBounds.left;
    gsap.to(navIndicator, {
      width,
      x,
      opacity: 1,
      duration: 0.35,
      ease: 'power3.out'
    });
  };

  const highlightLink = (id: string) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        moveIndicator(link);
      }
    });
  };

  const scrollToHash = (hash: string) => {
    const target = document.querySelector<HTMLElement>(hash);
    if (!target) {
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - getOffset();
    if (reduceMotionQuery.matches) {
      window.scrollTo(0, top);
    } else {
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const toggleMobileNav = (force?: boolean) => {
    if (!mobileNav || !mobileToggle) {
      return;
    }
    const shouldOpen = typeof force === 'boolean' ? force : mobileNav.classList.contains('hidden');
    mobileNav.classList.toggle('hidden', !shouldOpen);
    mobileToggle.setAttribute('aria-expanded', String(shouldOpen));
  };

  mobileToggle?.addEventListener('click', () => {
    toggleMobileNav();
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = link.getAttribute('href');
      if (!href) {
        return;
      }
      scrollToHash(href);
      toggleMobileNav(false);
    });
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = link.getAttribute('href');
      if (!href) {
        return;
      }
      scrollToHash(href);
      toggleMobileNav(false);
    });

    link.addEventListener('mouseenter', () => moveIndicator(link));
  });

  nav?.addEventListener('mouseleave', () => {
    const active = navLinks.find((link) => link.classList.contains('is-active')) ?? null;
    moveIndicator(active ?? null);
  });

  const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          highlightLink(entry.target.id);
        }
      });
    },
    { threshold: 0.55 }
  );
  sections.forEach((section) => observer.observe(section));

  const handleScroll = () => {
    const shouldElevate = window.scrollY > 32;
    headerBar?.classList.toggle('header-scrolled', shouldElevate);
  };
  handleScroll();
  window.addEventListener('scroll', handleScroll);

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', handleScroll);
    navIndicator.remove();
    mobileToggle?.setAttribute('aria-expanded', 'false');
    mobileNav?.classList.add('hidden');
  };
};

const initGsapReveal = () => {
  if (reduceMotionQuery.matches) {
    return;
  }

  const heroElements = gsap.utils.toArray<HTMLElement>('#hero .space-y-8 > *');
  gsap.set(heroElements, { opacity: 0, y: 24 });
  gsap.to(heroElements, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.2
  });

  const cardSelectors = '.value-card, .solution-card, .trust-card';
  const revealSelectors = [cardSelectors, '.spec-grid div'];

  gsap.utils.toArray<HTMLElement>(cardSelectors).forEach((card) => {
    card.classList.add('interactions-disabled');
  });

  revealSelectors.forEach((selector) => {
    gsap.utils.toArray<HTMLElement>(selector).forEach((element) => {
      gsap.set(element, { opacity: 0, y: 20 });
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: 'top 82%',
          once: true
        }
      });

      timeline.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          if (element.matches(cardSelectors)) {
            element.classList.remove('interactions-disabled');
          }
        }
      });
    });
  });
};

const initHoverEffects = () => {
  if (reduceMotionQuery.matches) {
    return;
  }

  const cards = document.querySelectorAll<HTMLElement>('.value-card, .solution-card, .trust-card');
  cards.forEach((card) => {
    const hoverTween = gsap.to(card, {
      y: -8,
      boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      borderColor: 'rgba(167,139,250,0.5)',
      duration: 0.35,
      paused: true,
      ease: 'power3.out'
    });

    card.addEventListener('mouseenter', () => hoverTween.play());
    card.addEventListener('mouseleave', () => hoverTween.reverse());
    card.addEventListener('focusin', () => hoverTween.play());
    card.addEventListener('focusout', () => hoverTween.reverse());
  });

  const primaryButtons = document.querySelectorAll<HTMLElement>('.btn-primary');
  primaryButtons.forEach((button) => {
    const hoverTween = gsap.to(button, {
      scale: 1.04,
      boxShadow: '0 0 32px rgba(167,139,250,0.4)',
      duration: 0.2,
      paused: true,
      ease: 'power3.out'
    });
    button.addEventListener('mouseenter', () => hoverTween.play());
    button.addEventListener('mouseleave', () => hoverTween.reverse());
    button.addEventListener('focusin', () => hoverTween.play());
    button.addEventListener('focusout', () => hoverTween.reverse());
  });
};

const setupToast = () => {
  const toast = document.getElementById('toast');
  const toastClose = toast?.querySelector<HTMLButtonElement>('.toast-close');
  let toastTimeout: number | null = null;

  const hideToast = () => {
    if (!toast) {
      return;
    }
    toast.dataset.visible = 'false';
    toast.setAttribute('aria-hidden', 'true');
    toast.classList.add('hidden');
    if (toastTimeout) {
      window.clearTimeout(toastTimeout);
      toastTimeout = null;
    }
  };

  const showToast = () => {
    if (!toast) {
      return;
    }
    toast.classList.remove('hidden');
    toast.dataset.visible = 'true';
    toast.setAttribute('aria-hidden', 'false');
    if (toastTimeout) {
      window.clearTimeout(toastTimeout);
    }
    toastTimeout = window.setTimeout(() => hideToast(), 4000);
  };

  toastClose?.addEventListener('click', hideToast);

  return { showToast, hideToast };
};

const setupContactForm = (toastFns: { showToast: () => void }) => {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = form.querySelector<HTMLButtonElement>('button[type=\"submit\"]');
    submitButton?.setAttribute('disabled', 'true');

    const formData = new FormData(form);
    const payload = {
      name: (formData.get('name') as string) ?? '',
      company: (formData.get('company') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      message: (formData.get('message') as string) ?? ''
    };

    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const data = (await response.json()) as { success: boolean; error?: string };
        if (!response.ok || !data.success) {
          throw new Error(data.error ?? 'Unable to send message. Please try again later.');
        }
        toastFns.showToast();
        form.reset();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unexpected error. Try again.';
        window.alert(message);
      })
      .finally(() => {
        submitButton?.removeAttribute('disabled');
      });
  });
};

const initParticlesModule = () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#hero-canvas');
  const heroSection = document.getElementById('hero');
  if (!canvas || !heroSection) {
    return () => undefined;
  }

  const controller: ParticleHandle = initParticles({
    canvas,
    themeColors: {
      particle: 'rgba(255, 255, 255, 0.92)',
      accent: 'rgba(167, 139, 250, 0.68)'
    },
    mapleLeafCount: 0,
    density: 240
  });
  controller.init();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target !== heroSection) {
        return;
      }
      if (entry.isIntersecting) {
        controller.resume();
      } else {
        controller.pause();
      }
    });
  }, { threshold: 0.1 });
  observer.observe(heroSection);

  const handleVisibility = () => {
    if (document.hidden) {
      controller.pause();
    } else if (!reduceMotionQuery.matches) {
      controller.resume();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', handleVisibility);
    destroyParticles(controller);
  };
};

const bootstrap = () => {
  setCurrentYear();
  const teardownNav = setupNavigation();
  initGsapReveal();
  initHoverEffects();

  const toastFns = setupToast();
  setupContactForm(toastFns);
  const teardownParticles = initParticlesModule();

  window.addEventListener('beforeunload', () => {
    teardownNav();
    teardownParticles();
  }, { once: true });
};

document.addEventListener('DOMContentLoaded', bootstrap);
