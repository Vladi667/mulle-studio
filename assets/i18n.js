/* ──────────────────────────────────────────────────────────────────────
   Agence Fritz — bilingual (EN/FR) i18n
   • Default language follows the browser; the visitor's choice is remembered.
   • EN is the source in the HTML; FR is applied here before the animations run.
   • Toggle (top-right) reloads with the chosen language so GSAP/SplitText
     re-measure the translated text cleanly.
   ────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* normalize whitespace exactly like the extractor did */
  function norm(s) { return s.replace(/&nbsp;/g, " ").replace(/ /g, " ").replace(/\s+/g, " ").trim(); }

  /* ── FR dictionary: normalized English innerHTML → French innerHTML ── */
  var FR = {};
  /* shared — header / footer / nav */
  FR[`Agency — Geneva`] = `Agence — Genève`;
  FR[`Index`] = `Index`;
  FR[`Index — 06`] = `Index — 06`;
  FR[`Services · what we build`] = `Services · ce que nous créons`;
  FR[`Studio · what to know`] = `Studio · ce qu'il faut savoir`;
  FR[`Marketing<span class="sub">signal placement · 03 packages</span>`] = `Marketing<span class="sub">placement du signal · 03 forfaits</span>`;
  FR[`Brand &amp; Website<span class="sub">identity &amp; interface · 03 packages</span>`] = `Marque &amp; Site web<span class="sub">identité &amp; interface · 03 forfaits</span>`;
  FR[`Growth Ops<span class="sub">AI systems &amp; tracking · 03 plans</span>`] = `Growth Ops<span class="sub">systèmes d'IA &amp; tracking · 03 plans</span>`;
  FR[`About<span class="sub">the studio &amp; the method</span>`] = `À propos<span class="sub">le studio &amp; la méthode</span>`;
  FR[`Work<span class="sub">selected case studies</span>`] = `Travaux<span class="sub">études de cas choisies</span>`;
  FR[`Contact<span class="sub">response &lt; 24 h</span>`] = `Contact<span class="sub">réponse &lt; 24 h</span>`;
  FR[`signal placement · 03 packages`] = `placement du signal · 03 forfaits`;
  FR[`identity &amp; interface · 03 packages`] = `identité &amp; interface · 03 forfaits`;
  FR[`AI systems &amp; tracking · 03 plans`] = `systèmes d'IA &amp; tracking · 03 plans`;
  FR[`the studio &amp; the method`] = `le studio &amp; la méthode`;
  FR[`selected case studies`] = `études de cas choisies`;
  FR[`response &lt; 24 h`] = `réponse &lt; 24 h`;
  FR[`signal placement`] = `placement du signal`;
  FR[`identity &amp; interface`] = `identité &amp; interface`;
  FR[`AI systems &amp; tracking`] = `systèmes d'IA &amp; tracking`;
  FR[`The agency that subtracts. Brand, web &amp; growth systems — machined in Geneva.`] = `L'agence qui soustrait. Marque, web &amp; systèmes de croissance — façonnés à Genève.`;
  FR[`Services`] = `Services`;
  FR[`Get in touch`] = `Nous contacter`;
  FR[`Growth Ops`] = `Growth Ops`;
  FR[`About`] = `À propos`;
  FR[`Work`] = `Travaux`;
  FR[`Contact`] = `Contact`;
  FR[`Marketing`] = `Marketing`;
  FR[`Brand &amp; Website`] = `Marque &amp; Site web`;
  FR[`Start a project`] = `Démarrer un projet`;
  FR[`Response &lt; 24 h`] = `Réponse &lt; 24 h`;
  FR[`Geneva · 46°12′N 6°09′E`] = `Genève · 46°12′N 6°09′E`;
  FR[`<b>Agence Fritz</b> — Geneva, CH`] = `<b>Agence Fritz</b> — Genève, CH`;
  FR[`Set in Geist Mono`] = `Composé en Geist Mono`;
  FR[`Geneva — CH`] = `Genève — CH`;
  FR[`Geneva`] = `Genève`;
  FR[`Est. MMXXI`] = `Depuis MMXXI`;
  FR[`Founded`] = `Fondé`;
  FR[`Studio`] = `Studio`;
  FR[`Disciplines`] = `Disciplines`;
  FR[`See the work`] = `Voir les travaux`;
  FR[`Next`] = `La suite`;

  /* about */
  FR[`A small studio, working <em>above the lake.</em>`] = `Un petit studio, <em>au-dessus du lac.</em>`;
  FR[`Built on the idea that <em>subtraction</em> is the only loudness left.`] = `Fondé sur l'idée que <em>la soustraction</em> est le seul éclat qui reste.`;
  FR[`Four steps. <em>Nothing left to chance.</em>`] = `Quatre étapes. <em>Rien laissé au hasard.</em>`;
  FR[`Three things <em>we believe.</em>`] = `Trois choses <em>que nous croyons.</em>`;
  FR[`We'd rather <em>show you.</em>`] = `Nous préférons <em>vous montrer.</em>`;
  FR[`Conversation`] = `Conversation`;
  FR[`Proposal`] = `Proposition`;
  FR[`Craft`] = `Réalisation`;
  FR[`Hand-off`] = `Remise`;
  FR[`Quiet <em>over loud.</em>`] = `Le calme <em>plutôt que le bruit.</em>`;
  FR[`Fixed <em>over flexible.</em>`] = `Le fixe <em>plutôt que le flexible.</em>`;
  FR[`Restraint <em>over reach.</em>`] = `La retenue <em>plutôt que l'excès.</em>`;
  FR[`04 — About`] = `04 — À propos`;
  FR[`01 — Origin`] = `01 — Origine`;
  FR[`02 — Process`] = `02 — Processus`;
  FR[`03 — Values`] = `03 — Valeurs`;
  FR[`A quiet practice in Geneva — brand, web and growth systems for clients who would rather be felt than seen.`] = `Un studio discret à Genève — marque, web et systèmes de croissance pour des clients qui préfèrent être ressentis que vus.`;
  FR[`A surface should hold weight, then disappear — built for the second look.`] = `Une surface doit avoir du poids, puis disparaître — pensée pour le second regard.`;
  FR[`Price, scope and timeline, all decided before we start.`] = `Prix, périmètre et délais, tout est décidé avant de commencer.`;
  FR[`If it can be removed, we remove it.`] = `Si cela peut être retiré, nous le retirons.`;
  FR[`A free 30-minute call. We listen for the problem, not just the brief.`] = `Un appel gratuit de 30 minutes. Nous écoutons le problème, pas seulement le brief.`;
  FR[`One document — scope, price, timeline — within 24 hours.`] = `Un document — périmètre, prix, délais — sous 24 heures.`;
  FR[`We make. You give honest feedback. Bounded revisions, unbounded care.`] = `Nous créons. Vous donnez un retour honnête. Révisions encadrées, soin sans limite.`;
  FR[`Files, full licence, post-launch support. We stay reachable.`] = `Fichiers, licence complète, suivi après lancement. Nous restons joignables.`;
  FR[`Step`] = `Étape`;

  /* brand-web */
  FR[`One brand. One site. <em>One piece.</em>`] = `Une marque. Un site. <em>Une seule pièce.</em>`;
  FR[`Brand Identity`] = `Identité de marque`;
  FR[`Business Website`] = `Site vitrine`;
  FR[`Commerce Suite`] = `Suite e-commerce`;
  FR[`02 — Brand &amp; Website`] = `02 — Marque &amp; Site web`;
  FR[`Choose your package`] = `Choisissez votre forfait`;
  FR[`Brand and website built apart always look apart. We design identity and the surface it lives on together — the logo, the palette, the site that carries them — so the whole thing arrives at once.`] = `Une marque et un site conçus séparément finissent toujours par se dissocier. Nous concevons l'identité et la surface qui la porte ensemble — le logo, la palette, le site qui les accueille — pour que le tout arrive d'un seul tenant.`;
  FR[`A complete visual identity — logo, palette, typography, and the essential collateral for a coherent presence everywhere.`] = `Une identité visuelle complète — logo, palette, typographie et les supports essentiels pour une présence cohérente partout.`;
  FR[`Brand identity plus the website that carries it — a complete public surface, designed and built as one piece.`] = `L'identité de marque et le site qui la porte — une surface publique complète, conçue et développée d'une seule pièce.`;
  FR[`Identity, site, and a full e-commerce surface. Built for brands selling product, managing inventory, and scaling order volume.`] = `Identité, site et une surface e-commerce complète. Pensée pour les marques qui vendent, gèrent leurs stocks et montent en volume de commandes.`;
  FR[`one-time payment`] = `paiement unique`;
  FR[`<b>Delivered</b> in 14 days`] = `<b>Livré</b> en 14 jours`;
  FR[`<b>Delivered</b> in 28 days`] = `<b>Livré</b> en 28 jours`;
  FR[`<b>Delivered</b> in 45 days`] = `<b>Livré</b> en 45 jours`;
  FR[`3 logo concepts → 1 refined system`] = `3 concepts de logo → 1 système affiné`;
  FR[`Full colour palette &amp; typography`] = `Palette de couleurs &amp; typographie complètes`;
  FR[`Business card &amp; letterhead`] = `Carte de visite &amp; papier à en-tête`;
  FR[`Email signature &amp; social kit`] = `Signature e-mail &amp; kit réseaux sociaux`;
  FR[`Brand guidelines booklet (PDF)`] = `Charte graphique (PDF)`;
  FR[`All source files (AI, Figma, SVG)`] = `Tous les fichiers sources (AI, Figma, SVG)`;
  FR[`Unlimited revision rounds`] = `Cycles de révision illimités`;
  FR[`Full commercial licence`] = `Licence commerciale complète`;
  FR[`Everything in Brand Identity`] = `Tout ce que comprend Identité de marque`;
  FR[`5–7 page editorial website`] = `Site éditorial de 5 à 7 pages`;
  FR[`Custom design — no templates`] = `Design sur mesure — aucun template`;
  FR[`CMS (edit copy yourself)`] = `CMS (modifiez vos textes vous-même)`;
  FR[`Mobile-first, performance-tuned`] = `Mobile-first, optimisé pour la performance`;
  FR[`SEO foundations &amp; analytics`] = `Bases SEO &amp; analytics`;
  FR[`Contact &amp; lead capture forms`] = `Formulaires de contact &amp; de captation de leads`;
  FR[`Hosting setup &amp; deployment`] = `Hébergement &amp; mise en ligne`;
  FR[`30 days post-launch support`] = `30 jours de suivi après lancement`;
  FR[`Everything in Business Website`] = `Tout ce que comprend Site vitrine`;
  FR[`Full e-commerce (Shopify or custom)`] = `E-commerce complet (Shopify ou sur mesure)`;
  FR[`Product pages &amp; collections`] = `Pages produits &amp; collections`;
  FR[`Checkout &amp; payment integration`] = `Tunnel d'achat &amp; intégration des paiements`;
  FR[`Inventory &amp; order management`] = `Gestion des stocks &amp; des commandes`;
  FR[`Email automation (welcome, recovery)`] = `Automatisation e-mail (bienvenue, relance panier)`;
  FR[`Multi-language ready`] = `Prêt pour le multilingue`;
  FR[`60 days post-launch support`] = `60 jours de suivi après lancement`;
  FR[`Package 01`] = `Forfait 01`;
  FR[`Package 02`] = `Forfait 02`;
  FR[`Package 03`] = `Forfait 03`;
  FR[`Identity`] = `Identité`;
  FR[`Featured`] = `En vedette`;
  FR[`Commerce`] = `Commerce`;
  FR[`Most chosen`] = `Le plus choisi`;
  FR[`Range`] = `Fourchette`;
  FR[`Delivery`] = `Livraison`;
  FR[`Revisions`] = `Révisions`;
  FR[`14 — 45 days`] = `14 — 45 jours`;
  FR[`Unlimited`] = `Illimité`;

  /* contact */
  FR[`Start the <em>conversation.</em>`] = `Démarrons la <em>conversation.</em>`;
  FR[`discover the <em>work.</em>`] = `découvrez les <em>travaux.</em>`;
  FR[`Direct`] = `Direct`;
  FR[`Hours`] = `Horaires`;
  FR[`What to expect`] = `À quoi s'attendre`;
  FR[`Or`] = `Ou`;
  FR[`Bring us the idea — the half-formed one is fine. We answer within 24 hours, talk it through on a free call, and send a fixed-price proposal the next day.`] = `Apportez-nous l'idée — même à moitié formée. Nous répondons sous 24 heures, en discutons lors d'un appel gratuit, et envoyons une proposition à prix fixe le lendemain.`;
  FR[`Channel`] = `Canal`;
  FR[`Response`] = `Réponse`;
  FR[`Consultation`] = `Consultation`;
  FR[`Email · Direct`] = `E-mail · Direct`;
  FR[`Free · 30 min`] = `Gratuit · 30 min`;
  FR[`Name <span class="req">*</span>`] = `Nom <span class="req">*</span>`;
  FR[`Email <span class="req">*</span>`] = `E-mail <span class="req">*</span>`;
  FR[`Company`] = `Entreprise`;
  FR[`Discipline of interest`] = `Discipline souhaitée`;
  FR[`Indicative budget`] = `Budget indicatif`;
  FR[`Timeline`] = `Échéance`;
  FR[`A short note <span class="req">*</span>`] = `Quelques mots <span class="req">*</span>`;
  FR[`Website (leave empty)`] = `Site web (laisser vide)`;
  FR[`Choose one — or leave open`] = `Choisissez — ou laissez ouvert`;
  FR[`01 · Marketing`] = `01 · Marketing`;
  FR[`02 · Brand &amp; Website`] = `02 · Marque &amp; Site web`;
  FR[`03 · Growth Ops`] = `03 · Growth Ops`;
  FR[`Multiple disciplines`] = `Plusieurs disciplines`;
  FR[`Something else`] = `Autre chose`;
  FR[`Open`] = `Ouvert`;
  FR[`Under CHF 200`] = `Moins de CHF 200`;
  FR[`Not sure yet`] = `Pas encore sûr`;
  FR[`No rush`] = `Sans urgence`;
  FR[`This month`] = `Ce mois-ci`;
  FR[`Next month`] = `Le mois prochain`;
  FR[`Within 3 months`] = `D'ici 3 mois`;
  FR[`Within 6 months`] = `D'ici 6 mois`;
  FR[`Just exploring`] = `Simple exploration`;
  FR[`Send the note`] = `Envoyer le message`;
  FR[`By sending, you agree to be contacted by <b>Agence Fritz</b>. We never share your details.`] = `En envoyant, vous acceptez d'être contacté par <b>Agence Fritz</b>. Nous ne partageons jamais vos coordonnées.`;

  /* growth-ops */
  FR[`Scale that <em>compounds.</em>`] = `Une croissance qui <em>se cumule.</em>`;
  FR[`Audit`] = `Audit`;
  FR[`Instrument`] = `Instrumenter`;
  FR[`Automate`] = `Automatiser`;
  FR[`Compound`] = `Cumuler`;
  FR[`Signal`] = `Signal`;
  FR[`Enterprise`] = `Enterprise`;
  FR[`How it works`] = `Comment ça marche`;
  FR[`Choose your plan`] = `Choisissez votre plan`;
  FR[`Growth Ops is the quiet machine beneath the brand — a single source of truth, a workforce that runs itself, and a clear next move every week. Built on AI, measured end to end.`] = `Growth Ops, c'est la machine discrète sous la marque — une source unique de vérité, des équipes qui tournent seules, et un cap clair chaque semaine. Bâtie sur l'IA, mesurée de bout en bout.`;
  FR[`The visibility layer. Your single source of truth — dashboards, tracking and a clean data foundation, built and run for you. Not another tool to operate yourself.`] = `La couche de visibilité. Votre source unique de vérité — tableaux de bord, tracking et une base de données propre, construits et pilotés pour vous. Pas un outil de plus à gérer soi-même.`;
  FR[`Visibility plus autonomy. The agents that carry the mechanical work — so the system keeps improving without a hand on the wheel.`] = `La visibilité et l'autonomie. Les agents qui prennent en charge le travail mécanique — pour que le système s'améliore sans main sur le volant.`;
  FR[`The full machine, shaped to your operation. Bespoke agents, integrations and weekly counsel for teams running serious volume.`] = `La machine complète, taillée pour votre organisation. Agents sur mesure, intégrations et conseil hebdomadaire pour les équipes à fort volume.`;
  FR[`per month · cancel anytime`] = `par mois · sans engagement`;
  FR[`per month · 3-month minimum`] = `par mois · minimum 3 mois`;
  FR[`per month · 6-month engagement`] = `par mois · engagement 6 mois`;
  FR[`<b>Live</b> in 14 days`] = `<b>En ligne</b> en 14 jours`;
  FR[`<b>Live</b> in 28 days`] = `<b>En ligne</b> en 28 jours`;
  FR[`<b>Live</b> in 60 days`] = `<b>En ligne</b> en 60 jours`;
  FR[`Unified KPI dashboard (Notion / custom)`] = `Tableau de bord KPI unifié (Notion / sur mesure)`;
  FR[`Web, sales &amp; channel analytics setup`] = `Configuration analytics web, ventes &amp; canaux`;
  FR[`Weekly performance digest (auto-generated)`] = `Synthèse de performance hebdomadaire (auto-générée)`;
  FR[`Monthly intelligence report`] = `Rapport d'intelligence mensuel`;
  FR[`One async strategy call / month`] = `Un appel stratégique asynchrone / mois`;
  FR[`Clean, unified data foundation`] = `Base de données propre et unifiée`;
  FR[`Everything in Signal`] = `Tout ce que comprend Signal`;
  FR[`3 custom AI agents (lead, content, ops)`] = `3 agents IA sur mesure (leads, contenu, ops)`;
  FR[`Lead enrichment &amp; scoring pipeline`] = `Pipeline d'enrichissement &amp; scoring des leads`;
  FR[`Lifecycle &amp; trigger automation`] = `Automatisation du cycle de vie &amp; des déclencheurs`;
  FR[`Internal AI tooling (Slack / inbox)`] = `Outils IA internes (Slack / boîte mail)`;
  FR[`Weekly experiment cadence`] = `Cadence d'expérimentation hebdomadaire`;
  FR[`Bi-weekly strategy call`] = `Appel stratégique bimensuel`;
  FR[`Quarterly system review`] = `Revue trimestrielle du système`;
  FR[`Everything in Compound`] = `Tout ce que comprend Cumuler`;
  FR[`Unlimited custom AI agents`] = `Agents IA sur mesure illimités`;
  FR[`Bespoke integrations (CRM, ERP, ops)`] = `Intégrations sur mesure (CRM, ERP, ops)`;
  FR[`Multi-team dashboards &amp; alerts`] = `Tableaux de bord &amp; alertes multi-équipes`;
  FR[`Dedicated analyst &amp; engineer hours`] = `Heures dédiées d'analyste &amp; d'ingénieur`;
  FR[`Custom integrations &amp; internal tooling`] = `Intégrations sur mesure &amp; outils internes`;
  FR[`Weekly strategy call`] = `Appel stratégique hebdomadaire`;
  FR[`SLA &amp; priority response`] = `SLA &amp; réponse prioritaire`;
  FR[`Most companies still scale on <em>instinct.</em>`] = `La plupart des entreprises se développent encore à <em>l'instinct.</em>`;
  FR[`We map your data — and where value <em>leaks.</em>`] = `Nous cartographions vos données — et où la valeur <em>fuit.</em>`;
  FR[`One dashboard. Every number <em>agrees.</em>`] = `Un seul tableau de bord. Tous les chiffres <em>concordent.</em>`;
  FR[`Agents take the <em>mechanical work.</em>`] = `Les agents prennent le <em>travail mécanique.</em>`;
  FR[`One experiment a week. Advantage that <em>accrues.</em>`] = `Une expérimentation par semaine. Un avantage qui <em>s'accumule.</em>`;
  FR[`Format`] = `Format`;
  FR[`Stack`] = `Stack`;
  FR[`Monthly retainer`] = `Forfait mensuel`;
  FR[`Custom AI agents`] = `Agents IA sur mesure`;

  /* index */
  FR[`Three disciplines. <em>One subtraction.</em>`] = `Trois disciplines. <em>Une seule soustraction.</em>`;
  FR[`A small body of work, <em>shipped slowly.</em>`] = `Un petit corpus de travaux, <em>livré lentement.</em>`;
  FR[`Method`] = `Méthode`;
  FR[`SoYou Cosmetics, Geneva.`] = `SoYou Cosmetics, Genève.`;
  FR[`Sneaker, in motion.`] = `Sneaker, en mouvement.`;
  FR[`02 — Disciplines`] = `02 — Disciplines`;
  FR[`03 — Selected`] = `03 — Sélection`;
  FR[`04 — Method`] = `04 — Méthode`;
  FR[`05 — Contact`] = `05 — Contact`;
  FR[`Website · E-Commerce`] = `Site web · E-Commerce`;
  FR[`Concept · Motion`] = `Concept · Motion`;
  FR[`Brand identity`] = `Identité de marque`;
  FR[`Most agencies add. <em>Fritz subtracts.</em>`] = `La plupart des agences ajoutent. <em>Fritz soustrait.</em>`;
  FR[`A brand is what <em>survives deletion.</em>`] = `Une marque, c'est ce qui <em>survit à la suppression.</em>`;
  FR[`Precision, <em>not decoration.</em>`] = `La précision, <em>pas la décoration.</em>`;
  FR[`Great work <em>explains itself.</em>`] = `Le bon travail <em>parle de lui-même.</em>`;
  FR[`Noise spends. <em>Clarity compounds.</em>`] = `Le bruit coûte. <em>La clarté compose.</em>`;

  /* marketing */
  FR[`Marketing built on <em>position,</em> not noise.`] = `Un marketing fondé sur <em>la position,</em> pas le bruit.`;
  FR[`Generate`] = `Générer`;
  FR[`Test`] = `Tester`;
  FR[`Learn`] = `Apprendre`;
  FR[`01 — Marketing`] = `01 — Marketing`;
  FR[`Most agencies ship two ads a month and hope. We run an engine — studio-grade creative generated at volume, tested across Meta and Google by AI, and sharpened every cycle by what actually converts.`] = `La plupart des agences sortent deux pubs par mois et espèrent. Nous, nous faisons tourner un moteur — des créations de qualité studio produites en volume, testées sur Meta et Google par l'IA, et affinées à chaque cycle par ce qui convertit vraiment.`;
  FR[`The engine, scaled down. On-brand ad creative at a lighter monthly volume — art-directed, studio-made, ready to test. A low-commitment way in.`] = `Le moteur, en version réduite. Des créations publicitaires fidèles à votre marque, en volume mensuel allégé — dirigées artistiquement, faites en studio, prêtes à tester. Une porte d'entrée sans engagement.`;
  FR[`The creative factory. On-brand ad creative at volume — art-directed, studio-made, ready to test. No shoots, no waiting.`] = `La fabrique créative. Des créations publicitaires fidèles à votre marque, en volume — dirigées artistiquement, faites en studio, prêtes à tester. Sans tournage, sans attente.`;
  FR[`The full flywheel. Creative, Meta and Google, all instrumented — generate, test, and put budget behind what converts.`] = `Le volant d'inertie complet. Création, Meta et Google, le tout instrumenté — générer, tester et investir derrière ce qui convertit.`;
  FR[`per month · no minimum`] = `par mois · sans minimum`;
  FR[`<b>Cadence</b> monthly drop`] = `<b>Cadence</b> livraison mensuelle`;
  FR[`<b>Cadence</b> weekly drops`] = `<b>Cadence</b> livraisons hebdomadaires`;
  FR[`<b>Reporting</b> weekly + monthly`] = `<b>Reporting</b> hebdomadaire + mensuel`;
  FR[`8 ad creatives / month (video + still)`] = `8 créations publicitaires / mois (vidéo + image)`;
  FR[`Studio art-directed, on demand`] = `Direction artistique studio, à la demande`;
  FR[`Concepts, scripts &amp; copy included`] = `Concepts, scripts &amp; textes inclus`;
  FR[`On-brand to your identity`] = `Fidèle à votre identité`;
  FR[`Multi-format (Reels, Stories, feed)`] = `Multi-format (Reels, Stories, feed)`;
  FR[`18 ad creatives / month (video + still)`] = `18 créations publicitaires / mois (vidéo + image)`;
  FR[`Monthly creative direction review`] = `Revue mensuelle de direction artistique`;
  FR[`All assets in delivered formats`] = `Tous les fichiers dans les formats livrés`;
  FR[`Everything in Creative Engine`] = `Tout ce que comprend Creative Engine`;
  FR[`Meta &amp; Google campaigns, fully managed`] = `Campagnes Meta &amp; Google, entièrement gérées`;
  FR[`Continuous creative testing`] = `Tests créatifs en continu`;
  FR[`Budget optimisation to winners`] = `Optimisation du budget vers les gagnantes`;
  FR[`Conversion tracking &amp; attribution`] = `Suivi des conversions &amp; attribution`;
  FR[`Weekly performance reporting`] = `Reporting de performance hebdomadaire`;
  FR[`Monthly strategy review`] = `Revue stratégique mensuelle`;
  FR[`Ad spend paid directly to platforms`] = `Budget publicitaire payé directement aux plateformes`;
  FR[`Starter`] = `Starter`;
  FR[`Performance`] = `Performance`;
  FR[`Two ads a month won't move an <em>algorithm.</em>`] = `Deux pubs par mois ne feront pas bouger un <em>algorithme.</em>`;
  FR[`So we generate <em>dozens</em> — on brand, on demand.`] = `Alors nous en générons <em>des dizaines</em> — fidèles à la marque, à la demande.`;
  FR[`Every one, across Meta and Google. <em>Live.</em>`] = `Chacune, sur Meta et Google. <em>En direct.</em>`;
  FR[`The data keeps the <em>winners.</em>`] = `Les données gardent les <em>gagnantes.</em>`;
  FR[`Feed the next batch. <em>Repeat.</em>`] = `On alimente le lot suivant. <em>On recommence.</em>`;
  FR[`Channels`] = `Canaux`;
  FR[`Monthly retainers`] = `Forfaits mensuels`;
  FR[`<b>Creative Engine</b> &amp; <b>Growth Engine</b> run on a 3-month minimum, month-to-month after. · Ad spend is paid directly to the platforms, separate from the fee.`] = `<b>Creative Engine</b> &amp; <b>Growth Engine</b> : minimum 3 mois, puis sans engagement. · Le budget publicitaire est payé directement aux plateformes, en sus des honoraires.`;

  /* our-work */
  FR[`Our work, <em>in detail.</em>`] = `Nos travaux, <em>en détail.</em>`;
  FR[`Want to be the <em>next plate?</em>`] = `Envie d'être le <em>prochain projet ?</em>`;
  FR[`Context`] = `Contexte`;
  FR[`Outcome`] = `Résultat`;
  FR[`SoYou <em>Cosmetics.</em>`] = `SoYou <em>Cosmetics.</em>`;
  FR[`Il Duca, <em>gelateria.</em>`] = `Il Duca, <em>gelateria.</em>`;
  FR[`Restaurant, <em>plated.</em>`] = `Restaurant, <em>dressé.</em>`;
  FR[`Sneaker, <em>in motion.</em>`] = `Sneaker, <em>en mouvement.</em>`;
  FR[`Timepiece, <em>in motion.</em>`] = `Garde-temps, <em>en mouvement.</em>`;
  FR[`05 — Work`] = `05 — Travaux`;
  FR[`A small body of work, shipped slowly — websites, video ads, identities, and the systems behind them. One project at a time, in full.`] = `Un petit corpus de travaux, livré lentement — sites web, pubs vidéo, identités et les systèmes qui les portent. Un projet à la fois, en entier.`;
  FR[`We show work the way we <em>make</em> it.`] = `Nous montrons le travail comme nous le <em>faisons.</em>`;
  FR[`Where the business stood — and the single problem worth solving first.`] = `Où en était l'entreprise — et le seul problème qui méritait d'être résolu en premier.`;
  FR[`The directions explored, the one chosen, and everything removed to get there.`] = `Les pistes explorées, celle retenue, et tout ce qui a été retiré pour y parvenir.`;
  FR[`What the work left behind — measured where it can be, felt where it can't.`] = `Ce que le travail a laissé — mesuré quand c'est possible, ressenti quand ça ne l'est pas.`;
  FR[`Food · Motion`] = `Cuisine · Motion`;
  FR[`Concept · Film`] = `Concept · Film`;
  FR[`Watch · Concept`] = `Montre · Concept`;
  FR[`An e-commerce storefront for a Geneva maker of natural, handmade cosmetics — artisanal soaps, bath rituals and botanical body care — pairing a Swiss-clean shopping surface with on-site card checkout.`] = `Une boutique e-commerce pour une fabricante genevoise de cosmétiques naturels et artisanaux — savons, rituels de bain et soins du corps botaniques — alliant une interface d'achat épurée et un paiement par carte intégré.`;
  FR[`An emblem-led identity for a Lausanne gelateria artigianale — the figure of the duke distilled into a single mark, explored across signage, packaging and the storefront, and carried through a warm Renaissance palette.`] = `Une identité portée par un emblème pour une gelateria artigianale lausannoise — la figure du duc distillée en un seul signe, déclinée sur la signalétique, le packaging et la devanture, et portée par une palette Renaissance chaleureuse.`;
  FR[`A motion concept for a Geneva restaurant — the signature plate revealed in chiaroscuro light, herb-oil and steam suspended in slow motion.`] = `Un concept en motion pour un restaurant genevois — le plat signature révélé en clair-obscur, huile d'herbes et vapeur suspendues au ralenti.`;
  FR[`A concept spot built to stop the scroll — kinetic product storytelling in light, energy and motion, art-directed and finished in-house.`] = `Un spot concept pensé pour stopper le scroll — un storytelling produit cinétique, en lumière, énergie et mouvement, dirigé et finalisé en interne.`;
  FR[`A cinematic spec film for Swiss watchmaking — from the Geneva lake to the wrist, a luxury timepiece revealed in golden light, reflection and slow motion.`] = `Un film cinématographique pour l'horlogerie suisse — du lac de Genève au poignet, un garde-temps de luxe révélé en lumière dorée, reflets et ralenti.`;
  FR[`Scope`] = `Périmètre`;
  FR[`Year`] = `Année`;
  FR[`Status`] = `Statut`;
  FR[`Site · E-Commerce`] = `Site · E-Commerce`;
  FR[`Live`] = `En ligne`;
  FR[`Emblem · System`] = `Emblème · Système`;
  FR[`In craft`] = `En cours`;
  FR[`Concept · Food`] = `Concept · Cuisine`;
  FR[`Concept`] = `Concept`;
  FR[`Film`] = `Film`;
  FR[`In production`] = `En production`;
  FR[`Begin the conversation`] = `Démarrer la conversation`;
  FR[`04 in production`] = `04 en production`;
  FR[`Our work, in detail.`] = `Nos travaux, en détail.`;

  /* buttons / outro / hints / preloader words (caught in QA) */
  FR[`Begin`] = `Commencer`;
  FR[`See all work`] = `Voir tous les travaux`;
  FR[`Back to the surface`] = `Retour à la surface`;
  FR[`Nothing under this surface.`] = `Rien sous cette surface.`;
  FR[`Bring us`] = `Apportez-nous`;
  FR[`the <i class="o-noise">noise</i>.`] = `le <i class="o-noise">bruit</i>.`;
  FR[`Free consultation`] = `Consultation gratuite`;
  FR[`Geneva · CH`] = `Genève · CH`;
  FR[`Move — reveal`] = `Bouger — révéler`;
  FR[`Scroll — begin`] = `Défiler — commencer`;
  FR[`Visit site ↗`] = `Voir le site ↗`;
  FR[`Fritz — About`] = `Fritz — À propos`;
  FR[`Fritz — Brand &amp; Website`] = `Fritz — Marque &amp; Site web`;
  FR[`Fritz — Contact`] = `Fritz — Contact`;
  FR[`Fritz — Growth Ops`] = `Fritz — Growth Ops`;
  FR[`Fritz — Marketing`] = `Fritz — Marketing`;
  FR[`Fritz — Work`] = `Fritz — Travaux`;
  FR[`Fritz — Loading the surface`] = `Fritz — Chargement de la surface`;
  FR[`03 packages`] = `03 forfaits`;
  FR[`Recent`] = `Récent`;
  FR[`Selected`] = `Sélection`;
  FR[`Three readings`] = `Trois lectures`;
  FR[`Brand, web and growth systems, machined in Geneva. We remove everything that isn't the signal — what remains is the brand.`] = `Marque, web et systèmes de croissance, façonnés à Genève. Nous retirons tout ce qui n'est pas le signal — ce qui reste, c'est la marque.`;

  /* ── attribute (placeholder) translations ── */
  var FR_ATTR = {
    "Your full name": "Votre nom complet",
    "you@domain.com": "vous@domaine.com",
    "Optional": "Facultatif",
    "Tell us what you are building, where you are stuck, or what you are dreaming about.": "Dites-nous ce que vous construisez, où vous bloquez, ou ce dont vous rêvez."
  };

  /* ── document.title translations ── */
  var FR_TITLE = {
    "Agence Fritz": "Agence Fritz",
    "About — Agence Fritz": "À propos — Agence Fritz",
    "Marketing — Agence Fritz": "Marketing — Agence Fritz",
    "Brand & Website — Agence Fritz": "Marque & Site web — Agence Fritz",
    "Growth Ops — Agence Fritz": "Growth Ops — Agence Fritz",
    "Work — Agence Fritz": "Travaux — Agence Fritz",
    "Contact — Agence Fritz": "Contact — Agence Fritz",
    "Nothing here — Agence Fritz": "Rien ici — Agence Fritz"
  };

  /* ── language resolution ── */
  function getLang() {
    try { var s = localStorage.getItem("fritz_lang"); if (s === "en" || s === "fr") return s; } catch (e) {}
    var n = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    return n.indexOf("fr") === 0 ? "fr" : "en";
  }
  var lang = getLang();
  document.documentElement.lang = lang;

  /* selectors for translatable elements (parents before children: .lbl before .sub) */
  var SEL = "h1,h2,h3,h4,.eyebrow span,.page-lede,.tag,.index-link span,.m-head," +
    ".m-label > span,.lbl,.pkg-tag,.period,.deliv,.pkg ul li,.pkg-n span,.pkg-n b," +
    ".pkg-badge,.value h4,.value p,.step h3,.step p,.step-n span,.kn-hook,.kn-word," +
    ".kn-line,.mth-hook,.mth-word,.mth-line,.mline,.wk-row-name,.wk-row-type,.wk-row-desc," +
    ".wk-row-specs span,.wk-row-specs b,.wk-vtag,.page-meta span,.page-meta b,.pricing-foot," +
    ".xlink span,label,option,.note,.sf-tag,.sf-h,.sf-col a,.sf-muted,.sf-base span,.peek,.readout > span," +
    ".btn span,.outro-cta .ln,.outro-meta span,.hint span,.wk-visit,.pre-word,.m-foot span," +
    ".eyebrow b,.hero-sub";

  function translate() {
    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var k = norm(els[i].innerHTML);
      if (Object.prototype.hasOwnProperty.call(FR, k)) els[i].innerHTML = FR[k];
    }
    /* standalone .sub (e.g. homepage disciplines) — nav .sub is now French, won't match */
    var subs = document.querySelectorAll(".sub");
    for (var j = 0; j < subs.length; j++) {
      var ks = norm(subs[j].innerHTML);
      if (Object.prototype.hasOwnProperty.call(FR, ks)) subs[j].innerHTML = FR[ks];
    }
    /* placeholders */
    var ph = document.querySelectorAll("[placeholder]");
    for (var p = 0; p < ph.length; p++) {
      var pv = ph[p].getAttribute("placeholder");
      if (FR_ATTR[pv]) ph[p].setAttribute("placeholder", FR_ATTR[pv]);
    }
    /* title */
    var t = norm(document.title);
    if (FR_TITLE[t]) document.title = FR_TITLE[t];
  }

  if (lang === "fr") translate();

  /* ── EN / FR toggle (top-right) ── */
  function buildToggle() {
    var header = document.querySelector('header[role="banner"]') || document.querySelector("header");
    if (!header || document.querySelector(".langtog")) return;
    var tog = document.createElement("div");
    tog.className = "langtog";
    tog.setAttribute("aria-label", "Language");
    ["en", "fr"].forEach(function (L) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = L.toUpperCase();
      if (L === lang) b.className = "on";
      b.setAttribute("aria-pressed", L === lang ? "true" : "false");
      b.addEventListener("click", function () {
        if (L === lang) return;
        try { localStorage.setItem("fritz_lang", L); } catch (e) {}
        location.reload();
      });
      tog.appendChild(b);
    });
    header.appendChild(tog);
  }
  buildToggle();
  document.addEventListener("DOMContentLoaded", buildToggle);
  window.addEventListener("load", buildToggle);
})();
