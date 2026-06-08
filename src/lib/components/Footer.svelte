<script lang="ts">
    import mbaLogo from "$lib/assets/MBA-Logo_neg 1.svg";
</script>

<footer class="footer">
    <div class="footer-content">
        <img src={mbaLogo} alt="MBA Logo" class="footer-logo" />
    </div>
    <div class="footer-navigation">
        <a href="#" class="footer-navigation-link">Rahmenlehrplan.pdf</a>
        <a href="#" class="footer-navigation-link">VMAB-Verordnung</a>
    </div>
    <div class="footer-bottom-navigation">
        <a href="#" class="footer-bottom-navigation-link">Datenschutz</a>
        <a href="#" class="footer-bottom-navigation-link">Impressum</a>
    </div>
</footer>

<style>
    .footer {
        background: var(--color-darkblue);
        padding: 30px;
        height: 450px;
        position: relative;
        margin-top: 200px;
    }

    .footer-navigation {
        display: flex;
        gap: 10px;
        justify-content: center;
        align-items: center;
        position: absolute;
        right: 30px;
        top: 30px;
    }

    .footer-navigation-link {
        color: var(--color-white);
        text-decoration: none;
        font-size: var(--h5-size);
        line-height: var(--h5-line-height);
        font-weight: var(--h5-weight);
        letter-spacing: var(--h5-letter-spacing);
        border: 1px solid var(--color-white);
        background: transparent;
        border-radius: 9999px;
        padding: 6px 15px;
    }

    .footer-bottom-navigation {
        display: flex;
        gap: 10px;
        justify-content: center;
        align-items: center;
        position: absolute;
        bottom: 30px;
        left: 30px;
        right: 30px;
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
</style>
