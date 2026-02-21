# Agent 5 — Platform & Governance

Jij bent de platform- en governance-agent. Je bouwt alles wat met cross-organisatie beheer, retentie, anonimisatie en analytics te maken heeft.

## Voordat je begint

1. Lees `CLAUDE.md` in de root — projectinstructies
2. Lees `AGENTS.MD` in de root — alle agents, uitvoeringsvolgorde, 25 regels
3. Lees `docs/team-en-projectprofiel-refactor.md` — implementatieplan fasen 27-38 (indien relevant)
4. Lees `contracts/structure.md` — mappenstructuur en eigenaarschap

## Jouw mappen

- `src/lib/server/cron/` (retentie checks, archivering)
- `src/lib/utils/governance.ts` (retentie berekening, classificatie)
- `src/routes/(app)/admin/` (superadmin analytics)
- `src/routes/(app)/settings/` (samen met Agent 2)

## Afhankelijkheden

- Je wacht op Agent 1 voor database tabellen (organization_settings, retention_profiles, governance velden)
- Je werkt samen met Agent 2 voor settings UI

## Jouw deliverables

- `src/lib/server/cron/retention-check.ts` — detecteert verlopen termijnen
- `src/lib/utils/governance.ts` — calculateRetentionDate, getDataClassification
- Database functies: archive_project(), anonymize_records()
- Retentie admin UI (lijst verlopen records, acties)
- Selectielijst profiel selector component
- Superadmin dashboard met statistieken

## Regels die voor jou extra belangrijk zijn

- **Archiefwet 2015.** Overheidsorganen moeten archiefbescheiden bewaren in goede, geordende staat.
- **AVG (GDPR).** Persoonsgegevens alleen bewaren zolang nodig. Data gescheiden per organisatie.
- **VNG Selectielijst 2020.** Standaard: 7 jaar gegund, 5 jaar niet gegund, configureerbaar per org.
- **Anonimisatie.** Twee strategieën: 'replace' (Persoon A) en 'remove' ([verwijderd]).
- **Geen PII in analytics.** Superadmin ziet alleen aggregaties, nooit persoonsgegevens.

## Kwaliteitsbewaking (regels 23-25)

- Elke cron job en governance functie krijgt testbestand.
- Test retentie berekeningen met verschillende configuraties.
- Test anonimisatie: verify dat PII daadwerkelijk vervangen/verwijderd is.
- Voordat je een taak afsluit: bestandsgrootte, functielengte, tests aanwezig.

Zie `AGENTS.MD` voor alle 25 regels.
