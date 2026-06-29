<script lang="ts">
    import mbaLogo from "$lib/assets/MBA-Logo_neg 1.svg";
    import linkArrow from "$lib/assets/link-arrow.svg";
</script>

<footer id="site-footer" class="footer">
    <div class="footer-content">
        <img src={mbaLogo} alt="MBA Logo" class="footer-logo" />
    </div>
    <div class="footer-navigation">
        <a
            class="footer-navigation-link"
            href="/uploads/5_SLP_Einleitung_allg.Teil_20260512.pdf"
            target="_blank"
            rel="noopener noreferrer">Schullehrplan.pdf</a
        >
        <a
            class="footer-navigation-link footer-navigation-link-with-icon"
            href="https://bzz.ch/app/uploads/2024/11/Verordnung-des-SBFI-ueber-Mindestvorschriften-fuer-die-Allgemeinbildung-in-der-beruflichen-Grundbildung.pdf"
            target="_blank"
            rel="noopener noreferrer"
        >
            VMAB-Verordnung
            <img src={linkArrow} alt="" class="footer-navigation-link-icon" />
        </a>
    </div>
    <div class="footer-bottom-navigation">
        <span class="footer-bottom-navigation-link">Datenschutz</span>
        <a class="footer-bottom-navigation-link" href="/impressum">Impressum</a>
    </div>
</footer>

<style>
    .footer {
        background: var(--color-darkblue);
        padding: calc(30 * var(--u));
        height: calc(450 * var(--u));
        position: relative;
        margin-top: 0;
    }

    .footer-navigation {
        display: flex;
        gap: calc(10 * var(--u));
        justify-content: center;
        align-items: center;
        position: absolute;
        right: calc(30 * var(--u));
        top: calc(30 * var(--u));
    }

    .footer-navigation-link {
        color: var(--color-white);
        text-decoration: none;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        border: calc(1 * var(--u)) solid var(--color-white);
        background: transparent;
        border-radius: 9999px;
        padding: calc(6 * var(--u)) calc(15 * var(--u));
        transition:
            background-color 120ms ease,
            color 120ms ease;
    }

    .footer-navigation-link:hover {
        background: var(--color-white);
        color: var(--color-black);
    }

    .footer-navigation-link:hover .footer-navigation-link-icon {
        filter: invert(1);
    }

    .footer-navigation-link-with-icon {
        display: inline-flex;
        align-items: center;
        gap: calc(8 * var(--u));
        padding-right: calc(10 * var(--u));
    }

    .footer-navigation-link-icon {
        width: calc(24 * var(--u));
        height: calc(24 * var(--u));
        display: block;
        flex-shrink: 0;
        transform: translateY(calc(1 * var(--u)));
    }

    .footer-bottom-navigation {
        display: flex;
        gap: calc(10 * var(--u));
        justify-content: flex-end;
        align-items: center;
        position: absolute;
        bottom: calc(30 * var(--u));
        right: calc(30 * var(--u));
    }

    .footer-bottom-navigation-link {
        color: var(--color-white);
        text-decoration: none;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
    }

    .footer-bottom-navigation-link:hover {
        text-decoration: underline;
    }
</style>
