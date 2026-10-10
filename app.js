/**
 * LebensHelper Alltagsbegleitung – Serge Raoul Foadjo Fotso
 * Wuppertal · Solingen · Remscheid & Umgebung
 * Interaktive Funktionen & Bedienungshilfen
 */

/* ==========================================================================
   0. ZENTRALE EINSTELLUNGEN
   --------------------------------------------------------------------------
   Alle Kontaktdaten und gesetzlichen Beträge stehen NUR hier.
   Änderungen an dieser Stelle wirken sich auf die ganze Seite aus.
   ========================================================================== */
const KONTAKT = {
  name: 'LebensHelper Alltagsbegleitung',
  inhaber: 'Serge Raoul Foadjo Fotso',
  strasse: 'Schönebecker Straße 44',
  plz: '42283',
  ort: 'Wuppertal',
  land: 'Deutschland',
  telefon: '+49 177 2642539',
  email: 'lebenshelper@gmail.com',
  gebiete: 'Wuppertal, Solingen, Remscheid & Umgebung'
};

/*  Gesetzliche Beträge der Pflegeversicherung.
 *  Quelle: Seniorenbrief „Finanzierung – So zahlt Ihre Pflegekasse“
 *  (eigene Unterlage des Inhabers), übernommen im Oktober 2026.
 *
 *  Diese Beträge ändern sich bei jeder Pflegereform – meist zum 1. Januar.
 *  Zum Aktualisieren genügt es, die Zahlen hier zu ändern und `stand`
 *  neu zu setzen; die ganze Seite übernimmt die Werte automatisch.
 */
const PFLEGE_BETRAEGE = {
  stand: 'Oktober 2026',

  // § 45b SGB XI – Entlastungsbetrag, monatlich, bereits ab Pflegegrad 1
  entlastungMonat: 131,

  // §§ 39 + 42 SGB XI – Verhinderungs- und Kurzzeitpflege sind seit der
  // Reform zu einem gemeinsamen Jahresbudget zusammengefasst (ab PG 2).
  // Keine sechsmonatige Vorpflegezeit mehr, flexibel einsetzbar.
  weitereMittelJahr: 3539,
  weitereMittelMonat: 294.90,
  weitereMittelLabel: 'Gemeinsames Jahresbudget (Verhinderungs- & Kurzzeitpflege)'
};

/* Deutsches Zahlenformat. Cent werden nur gezeigt, wenn es welche gibt:
   131 € · 294,90 € · 3.539 € */
function euro(betrag) {
  const hatCent = Math.round(betrag * 100) % 100 !== 0;
  return betrag.toLocaleString('de-DE', {
    minimumFractionDigits: hatCent ? 2 : 0,
    maximumFractionDigits: 2
  }) + ' €';
}

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. Bedienungshilfen (Schriftgröße & Kontrast)
     ========================================================================== */
  const body = document.body;
  const btnFontDecrease = document.getElementById('font-decrease-btn');
  const btnFontReset = document.getElementById('font-reset-btn');
  const btnFontIncrease = document.getElementById('font-increase-btn');
  const btnContrast = document.getElementById('contrast-toggle-btn');

  let currentFontSizeLevel = 0; // 0: Standard, 1: groß, 2: sehr groß

  function updateFontSize() {
    body.classList.remove('font-large', 'font-xlarge');
    if (currentFontSizeLevel === 1) {
      body.classList.add('font-large');
    } else if (currentFontSizeLevel >= 2) {
      body.classList.add('font-xlarge');
    }
    // Einstellung merken, damit sie beim nächsten Besuch erhalten bleibt
    try {
      localStorage.setItem('lh-fontsize', String(currentFontSizeLevel));
    } catch (e) { /* z. B. privates Fenster – kein Problem */ }
  }

  // Gespeicherte Einstellungen wiederherstellen
  try {
    const savedSize = localStorage.getItem('lh-fontsize');
    if (savedSize !== null) {
      currentFontSizeLevel = parseInt(savedSize, 10) || 0;
      updateFontSize();
    }
    if (localStorage.getItem('lh-contrast') === '1') {
      body.classList.add('high-contrast');
      if (btnContrast) btnContrast.setAttribute('aria-pressed', 'true');
    }
  } catch (e) { /* Speicher nicht verfügbar – Seite funktioniert trotzdem */ }

  if (btnFontIncrease) {
    btnFontIncrease.addEventListener('click', () => {
      if (currentFontSizeLevel < 2) {
        currentFontSizeLevel++;
        updateFontSize();
      }
    });
  }

  if (btnFontDecrease) {
    btnFontDecrease.addEventListener('click', () => {
      if (currentFontSizeLevel > 0) {
        currentFontSizeLevel--;
        updateFontSize();
      }
    });
  }

  if (btnFontReset) {
    btnFontReset.addEventListener('click', () => {
      currentFontSizeLevel = 0;
      updateFontSize();
    });
  }

  if (btnContrast) {
    btnContrast.addEventListener('click', () => {
      body.classList.toggle('high-contrast');
      const isHighContrast = body.classList.contains('high-contrast');
      btnContrast.setAttribute('aria-pressed', String(isHighContrast));
      try {
        localStorage.setItem('lh-contrast', isHighContrast ? '1' : '0');
      } catch (e) { /* ignorieren */ }
    });
  }

  /* ==========================================================================
     2. Mobile Navigation
     ========================================================================== */
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-navigation');

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
      mainNav.classList.toggle('nav-active');
      const isExpanded = mainNav.classList.contains('nav-active');
      mobileToggle.setAttribute('aria-expanded', String(isExpanded));
      mobileToggle.setAttribute('aria-label', isExpanded ? 'Menü schließen' : 'Menü öffnen');
    });

    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('nav-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.setAttribute('aria-label', 'Menü öffnen');
      });
    });
  }

  /* ==========================================================================
     2b. Seitenmodus – jede Sektion ist eine eigene Seite
     --------------------------------------------------------------------------
     Ein Klick auf einen Menüpunkt blendet die anderen Bereiche aus und zeigt
     nur den gewählten an. Es wird nicht mehr gescrollt.

     Der Modus wird erst durch JavaScript aktiviert (Klasse `js-pages`). Ist
     JavaScript deaktiviert, bleibt die Seite eine durchgehende Langseite und
     ist vollständig lesbar – kein Inhalt geht verloren.
     ========================================================================== */
  const pageSections = Array.from(document.querySelectorAll('[data-page]'));

  const SEITEN_TITEL = {
    'hero': 'LebensHelper | Ihre Alltagsbegleitung in Wuppertal, Solingen & Remscheid',
    'leistungen': 'Unsere Leistungen | LebensHelper',
    'pflegekasse': 'Finanzierung & Pflegekasse | LebensHelper',
    'rechner': 'Budget-Rechner | LebensHelper',
    'ueber-uns': 'Über uns | LebensHelper',
    'faq': 'Häufige Fragen | LebensHelper',
    'kontakt': 'Kontakt & Erstberatung | LebensHelper'
  };

  if (pageSections.length) {
    body.classList.add('js-pages');

    const STARTSEITE = 'hero';
    const seitenNamen = pageSections
      .map(s => s.dataset.page)
      .filter((name, i, alle) => alle.indexOf(name) === i);

    function zeigeSeite(name, scrollNachOben) {
      if (seitenNamen.indexOf(name) === -1) name = STARTSEITE;

      pageSections.forEach(sec => {
        const aktiv = sec.dataset.page === name;
        sec.classList.toggle('page-active', aktiv);
        sec.hidden = !aktiv; // blendet den Bereich auch für Screenreader aus
      });

      // Aktiven Menüpunkt markieren
      document.querySelectorAll('.nav-link').forEach(link => {
        const ziel = (link.getAttribute('href') || '').replace('#', '');
        if (ziel === name) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      if (SEITEN_TITEL[name]) document.title = SEITEN_TITEL[name];

      if (scrollNachOben !== false) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }

      // Fokus auf die Überschrift der neuen Seite setzen, damit Screenreader
      // und Tastaturnutzer merken, dass sich der Inhalt geändert hat.
      const aktiveSektion = pageSections.filter(s => s.dataset.page === name)[0];
      if (aktiveSektion) {
        const ueberschrift = aktiveSektion.querySelector('h1, h2');
        if (ueberschrift) {
          ueberschrift.setAttribute('tabindex', '-1');
          ueberschrift.focus({ preventScroll: true });
        }
      }
    }

    // Jeder interne Link, der auf eine Seite zeigt, wechselt die Seite
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const ziel = link.getAttribute('href').slice(1);
      if (!ziel || seitenNamen.indexOf(ziel) === -1) return;

      e.preventDefault();
      if (window.location.hash !== '#' + ziel) {
        window.location.hash = ziel; // löst hashchange aus
      } else {
        zeigeSeite(ziel);
      }
    });

    // Vor- und Zurück-Taste des Browsers funktionieren weiterhin
    window.addEventListener('hashchange', () => {
      zeigeSeite(window.location.hash.replace('#', ''));
    });

    // Startzustand herstellen (z. B. beim Aufruf von …/#kontakt)
    zeigeSeite(window.location.hash.replace('#', ''), false);
  }

  /* ==========================================================================
     3. Budget-Rechner der Pflegekasse
     ========================================================================== */
  const pgButtons = document.querySelectorAll('.pg-btn');
  const resultMonthlyEntlastung = document.getElementById('calc-monthly-entlastung');
  const resultMonthlySub = document.getElementById('calc-monthly-sub');
  const resultVerhinderung = document.getElementById('calc-verhinderung');
  const resultVerhinderungSub = document.getElementById('calc-verhinderung-sub');
  const resultTotalBudget = document.getElementById('calc-total-budget');
  const calcApplyBtn = document.getElementById('calc-apply-btn');
  const formPflegegradSelect = document.getElementById('client-pflegegrad');
  const calcStand = document.getElementById('calc-stand');

  // Beträge aus der zentralen Konfiguration in die Seite schreiben
  const entlastungJahr = PFLEGE_BETRAEGE.entlastungMonat * 12;
  const elEntlastungAmount = document.getElementById('entlastung-amount');
  const elEntlastungYear = document.getElementById('entlastung-amount-year');
  if (elEntlastungAmount) elEntlastungAmount.textContent = euro(PFLEGE_BETRAEGE.entlastungMonat);
  if (elEntlastungYear) elEntlastungYear.textContent = euro(entlastungJahr);
  if (calcStand) calcStand.textContent = PFLEGE_BETRAEGE.stand;

  let selectedGrade = '1';

  function renderCalculator(grade) {
    if (!resultMonthlyEntlastung) return;

    // Das gemeinsame Budget aus Verhinderungs- und Kurzzeitpflege gibt es
    // erst ab Pflegegrad 2. Der Entlastungsbetrag steht allen zu.
    const hatWeitereMittel = parseInt(grade, 10) >= 2;

    resultMonthlyEntlastung.textContent = euro(PFLEGE_BETRAEGE.entlastungMonat);
    if (resultMonthlySub) {
      resultMonthlySub.textContent = 'Jeden Monat – ' + euro(entlastungJahr) + ' im Jahr';
    }

    if (hatWeitereMittel) {
      resultVerhinderung.textContent = euro(PFLEGE_BETRAEGE.weitereMittelMonat);
      resultVerhinderungSub.textContent =
        'Aus ' + euro(PFLEGE_BETRAEGE.weitereMittelJahr) + ' im Jahr · '
        + PFLEGE_BETRAEGE.weitereMittelLabel;
      resultTotalBudget.textContent =
        euro(PFLEGE_BETRAEGE.entlastungMonat + PFLEGE_BETRAEGE.weitereMittelMonat);
    } else {
      resultVerhinderung.textContent = '–';
      resultVerhinderungSub.textContent = 'Erst ab Pflegegrad 2 verfügbar';
      resultTotalBudget.textContent = euro(PFLEGE_BETRAEGE.entlastungMonat);
    }
  }

  pgButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pgButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      selectedGrade = btn.getAttribute('data-grade');
      renderCalculator(selectedGrade);
    });
  });

  renderCalculator(selectedGrade);

  if (calcApplyBtn && formPflegegradSelect) {
    calcApplyBtn.addEventListener('click', () => {
      formPflegegradSelect.value = selectedGrade;
    });
  }

  /* ==========================================================================
     4. FAQ-Akkordeon
     ========================================================================== */
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.accordion-item').forEach(otherItem => {
        otherItem.classList.remove('open');
        const otherHeader = otherItem.querySelector('.accordion-header');
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ==========================================================================
     5. Kontaktformular
     --------------------------------------------------------------------------
     Die Seite hat keinen Server. Damit keine Anfrage verloren geht, wird aus
     den Eingaben eine fertige E-Mail an KONTAKT.email erzeugt und im
     E-Mail-Programm des Besuchers geöffnet. Der Besucher muss sie dort noch
     absenden – darauf weist die Bestätigung ausdrücklich hin.

     Wenn die Seite später bei einem Hoster liegt, kann hier stattdessen ein
     echter Formular-Dienst eingebunden werden (z. B. Formspree oder das
     Formular-Modul des Hosters).
     ========================================================================== */
  const form = document.getElementById('consultation-form');
  const successMessage = document.getElementById('form-success-message');
  const resetBtn = document.getElementById('reset-form-btn');

  if (form) {
    const inputName = document.getElementById('client-name');
    const inputPhone = document.getElementById('client-phone');
    const inputEmail = document.getElementById('client-email');
    const inputCity = document.getElementById('client-city');
    const inputMessage = document.getElementById('client-message');
    const privacyAgreement = document.getElementById('privacy-agreement');

    function validateField(input) {
      const formGroup = input.closest('.form-group');
      const isValid = input.value.trim() !== '';
      formGroup.classList.toggle('has-error', !isValid);
      return isValid;
    }

    // Fehlermarkierung verschwindet, sobald der Besucher tippt
    [inputName, inputPhone, inputCity].forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
          input.closest('.form-group').classList.remove('has-error');
        }
      });
    });

    if (privacyAgreement) {
      privacyAgreement.addEventListener('change', () => {
        if (privacyAgreement.checked) {
          privacyAgreement.closest('.form-group').classList.remove('has-error');
        }
      });
    }

    function buildMailto() {
      const gewaehlteLeistungen = Array.from(
        form.querySelectorAll('input[name="services"]:checked')
      ).map(cb => cb.value);

      const pgSelect = document.getElementById('client-pflegegrad');
      const pgText = pgSelect ? pgSelect.options[pgSelect.selectedIndex].text : '';

      const zeilen = [
        'Anfrage für eine kostenfreie Erstberatung',
        '',
        'Name: ' + inputName.value.trim(),
        'Telefon: ' + inputPhone.value.trim(),
        'E-Mail: ' + (inputEmail.value.trim() || '–'),
        'PLZ / Wohnort: ' + inputCity.value.trim(),
        'Pflegegrad: ' + pgText,
        '',
        'Gewünschte Unterstützung:',
        gewaehlteLeistungen.length
          ? gewaehlteLeistungen.map(s => '- ' + s).join('\n')
          : '- (keine Auswahl getroffen)',
        '',
        'Nachricht:',
        inputMessage.value.trim() || '–',
        '',
        'Gesendet über alltagsbegleitunglebenshelper.com'
      ];

      const betreff = 'Anfrage Erstberatung – ' + inputName.value.trim();

      return 'mailto:' + KONTAKT.email +
        '?subject=' + encodeURIComponent(betreff) +
        '&body=' + encodeURIComponent(zeilen.join('\n'));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const isNameValid = validateField(inputName);
      const isPhoneValid = validateField(inputPhone);
      const isCityValid = validateField(inputCity);

      const isPrivacyValid = privacyAgreement.checked;
      privacyAgreement.closest('.form-group').classList.toggle('has-error', !isPrivacyValid);

      if (isNameValid && isPhoneValid && isCityValid && isPrivacyValid) {
        window.location.href = buildMailto();

        form.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Zum ersten Fehler springen, damit er nicht übersehen wird
        const firstError = form.querySelector('.has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        form.style.display = 'block';
        successMessage.style.display = 'none';
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

});
