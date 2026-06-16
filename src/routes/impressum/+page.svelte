<svelte:head>
    <title>Schullehrplan ABU - Impressum</title>
</svelte:head>

<div class="impressum-route mode-grid">
    <section class="topics-content">
        <article class="impressum">
            <div class="content-wrap">
                <h1 class="topic-title">Impressum</h1>

                <section class="impressum-section">
                    <h2 class="section-label">Herausgeberin und Redaktion</h2>
                    <p>
                        Bildungsdirektion Kanton Zürich<br />
                        Mittelschul- und Berufsbildungsamt<br />
                        Ausstellungsstrasse 80, 8090 Zürich<br />
                        <a href="mailto:info@mba.ch">info@mba.ch</a>
                    </p>
                </section>

                <section class="impressum-section">
                    <h2 class="section-label">Autorinnen und Autoren</h2>
                    <p>
                        <strong>Kerngruppe:</strong>
                        Koller Markus, ABZ; Rusch Pascal, BBW; Walther Corinna, BFSU;
                        Andeer Nadine, BFSW; Lindegger Fabian, GBW; Reith Patric,
                        PLAU; Glaus Christof, DLH; Atzenweiler Andreas, LKB.
                    </p>
                    <p>
                        <strong>Teilprojektmitglieder:</strong>
                        Bänziger Mark, BBZ; Vögeli Nina, BSB; Weiss Susanne, BSDPZ;
                        Siddiqui-Hemmi Carolina, BFSH; Sander Tina, BSMG; Weber Daniel,
                        BSR; Santoro Nino, BZLT; Leuenberger Renate, BZZ; Otazo Priscilla,
                        Careum; Florian Schmid, EB; Dörflinger David, Juventus Schule;
                        Heini Christine, SfGZ; Rohrer Natalie, Strickhof; Lutz Natalie,
                        TBZ; Brunner Matthias, WSKVW; Greiner Christian, ZAG; Schoch
                        Andreas, PK ABU.
                    </p>
                </section>

                <section class="impressum-section">
                    <h2 class="section-label">Projektausschuss</h2>
                    <p>
                        Prof. Dr. Markus Zwyssig, MBA; John Coviello, PK ABU;
                        Heinz Schlegel, KRB; Daniel Degen, PHZH
                    </p>
                </section>

                <section class="impressum-section">
                    <h2 class="section-label">Projektleitung</h2>
                    <p>Marianne Glutz</p>
                </section>

                <section class="impressum-section">
                    <h2 class="section-label">Pädagogische Expertise</h2>
                    <p>Daniel Degen, PHZH</p>
                </section>

                <section class="impressum-section">
                    <h2 class="section-label">Gestaltung</h2>
                    <p>Web: PHZH, Büro Kanalz-Weibel; Print: kdmz</p>
                </section>

                <section class="impressum-section">
                    <h2 class="section-label">Ausgabe</h2>
                    <p>1.7.2026, Version 1, 800 Expl. gedruckt</p>
                </section>

                <p class="copyright">© Bildungsdirektion Kanton Zürich</p>
            </div>
        </article>
    </section>
</div>

<style>
    .mode-grid {
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 1fr) minmax(0, 10fr);
        column-gap: var(--grid-gutter);
        margin-top: 180px;
        align-items: start;
    }

    .topics-content {
        grid-column: 3;
        min-width: 0;
        padding-bottom: 4rem;
    }

    .content-wrap {
        margin: 0 33px;
    }

    .impressum-section {
        margin-top: 80px;
    }

    .section-label {
        margin: 0 0 0.35rem;
        font-size: var(--h4-size);
        line-height: var(--h4-line-height);
        font-weight: var(--h4-weight);
        letter-spacing: var(--h4-letter-spacing);
    }

    p + p {
        margin-top: 1.25rem;
    }

    a {
        color: inherit;
    }

    .copyright {
        margin-top: 80px;
        font-family: var(--font-mono);
        font-size: var(--h6-size);
        line-height: var(--h6-line-height);
        font-weight: var(--h6-weight);
        letter-spacing: var(--h6-letter-spacing);
    }
</style>
