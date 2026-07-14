import { BrandLogo } from "../BrandLogo"
import { HeroCheckIcon } from "./HeroCheckIcon"
import { LandingIcon } from "./LandingIcon"
import { useTranslation } from "../../i18n/LanguageContext"

export function AuthLandingSections() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  const whyCards = [
    { icon: "mind", title: t("authLanding.why1Title"), text: t("authLanding.why1Text") },
    { icon: "chart", title: t("authLanding.why2Title"), text: t("authLanding.why2Text") },
    { icon: "connection", title: t("authLanding.why3Title"), text: t("authLanding.why3Text") },
  ]

  const steps = [
    t("authLanding.step1"),
    t("authLanding.step2"),
    t("authLanding.step3"),
    t("authLanding.step4"),
  ]

  const audiences = [
    { icon: "athlete", label: t("authLanding.audienceAthlete") },
    { icon: "coach", label: t("authLanding.audienceCoach") },
    { icon: "psychologist", label: t("authLanding.audiencePsychologist") },
    { icon: "club", label: t("authLanding.audienceClub") },
  ]

  return (
    <div className="auth-landing__below">
      <section className="auth-landing__section" id="landing-why">
        <div className="auth-landing__section-inner">
          <h2 className="auth-landing__section-title">{t("authLanding.whyTitle")}</h2>
          <div className="auth-landing__why-grid">
            {whyCards.map((card) => (
              <article key={card.title} className="auth-landing__feature-card">
                <span className="auth-landing__feature-icon" aria-hidden>
                  <LandingIcon name={card.icon} size={24} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-landing__section auth-landing__section--subtle" id="landing-how">
        <div className="auth-landing__section-inner">
          <h2 className="auth-landing__section-title">{t("authLanding.howTitle")}</h2>
          <ol className="auth-landing__timeline">
            {steps.map((label, index) => (
              <li key={label} className="auth-landing__timeline-step">
                <span className="auth-landing__timeline-num">{index + 1}</span>
                <span className="auth-landing__timeline-label">{label}</span>
                {index < steps.length - 1 && (
                  <span className="auth-landing__timeline-arrow" aria-hidden>
                    ↓
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="auth-landing__section" id="landing-audience">
        <div className="auth-landing__section-inner">
          <h2 className="auth-landing__section-title">{t("authLanding.designedTitle")}</h2>
          <div className="auth-landing__audience-grid">
            {audiences.map((item) => (
              <article key={item.label} className="auth-landing__audience-card">
                <LandingIcon name={item.icon} size={26} />
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="auth-landing__footer">
        <div className="auth-landing__section-inner auth-landing__footer-inner">
          <BrandLogo variant="compact" className="auth-landing__footer-logo" />
          <p className="auth-landing__copyright">
            {t("authLanding.copyright", { year })}
          </p>
          <p id="landing-privacy" className="auth-landing__privacy-note">
            {t("privacy.athleteData")}
          </p>
          <nav className="auth-landing__footer-nav" aria-label="Footer">
            <a href="#landing-privacy">{t("authLanding.footerPrivacy")}</a>
            <a href="mailto:hola@zonamental.com">{t("authLanding.footerContact")}</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function AuthHeroContent() {
  const { t } = useTranslation()

  const valueProps = [
    t("authLanding.value1"),
    t("authLanding.value2"),
    t("authLanding.value3"),
    t("authLanding.value4"),
  ]

  return (
    <div className="auth-landing__hero-content">
      <BrandLogo variant="hero-dark" className="auth-landing__hero-logo" />
      <h1 className="auth-landing__headline">
        <span>{t("authLanding.headlineLine1")}</span>
        <span className="auth-landing__headline-accent">{t("authLanding.headlineLine2")}</span>
      </h1>
      <p className="auth-landing__supporting">{t("authLanding.supporting")}</p>
      <ul className="auth-landing__values">
        {valueProps.map((item) => (
          <li key={item}>
            <HeroCheckIcon size={15} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="auth-landing__hero-actions">
        <button
          type="button"
          className="auth-landing__cta auth-landing__cta--discover"
          onClick={() => scrollToId("landing-why")}
        >
          {t("authLanding.ctaDiscoverBrand")}
        </button>
      </div>
    </div>
  )
}

export { scrollToId }
