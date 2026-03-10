# PACS.008 XML Validator UI

Standalone Angular 21 application for validating, formatting, and exporting ISO 20022 PACS.008 credit transfer messages. It ships with sample messages, local history, and multiple export options to streamline ISO 20022 testing and demos.

## Features
- **Validate PACS.008 XML**: Upload or paste XML (up to 5 MB). Checks required structure (`GrpHdr`, `PmtInf`), header fields, transaction amounts, currency codes, IBAN format + mod‑97 checksum, BIC format (8/11 chars), and cross‑checks `NbOfTxns` / `CtrlSum` against actual transactions.
- **Namespace-safe parsing**: Uses tag-name-only selectors that work with default namespaces; guards against excessive depth (50) and parse errors.
- **Formatter & tools**: Pretty-print, minify, and view stats (elements, attributes, text nodes, depth, size).
- **Samples**: Built-in valid/invalid/warning samples for quick testing.
- **History**: Stores the last 50 validations in `localStorage` with timestamps and quick reload/clear actions.
- **Exports**: Download validation output as JSON, CSV, or HTML report; copy XML to clipboard.
- **UI**: Tabbed experience (Validate, Samples, Format, History) with OnPush change detection for snappy updates.

## Quick start
```bash
npm install        # once
npm start          # serves at http://localhost:4200/
```

## Scripts
- `npm start` – dev server with live reload.
- `npm run build` – production build to `dist/`.
- `npm test` – run unit tests (Vitest via `ng test`).

## Project structure (selected)
- `src/main.ts` – bootstrap.
- `src/app/app.ts` / `app.html` – root component.
- `src/app/components/xml-validator.component.*` – UI, tabs, and interactions.
- `src/app/services/pacs008-validator.service.ts` – core validation rules and cross-checks.
- `src/app/services/xml-formatter.service.ts` – pretty-print/minify/statistics.
- `src/app/services/sample-messages.service.ts` – canned PACS.008 samples.
- `src/app/services/validation-history.service.ts` – localStorage-backed history.
- `src/app/services/export.service.ts` – JSON/CSV/HTML report generation and downloads.

## Validation highlights
- Required: `GrpHdr`, `PmtInf`, `MsgId`, `CreDtTm`, `NbOfTxns`, `CtrlSum`, `PmtInfId`, `PmtMtd`.
- Dates: ISO 8601 with timezone (`YYYY-MM-DDTHH:MM:SS(.fff)Z|±HH:MM`).
- Currency: three uppercase letters; warns if not in bundled ISO‑4217 subset.
- IBAN: format check + mod‑97 checksum (checksum failures downgraded to warning).
- BIC: 8 or 11 alphanumeric characters.
- Consistency: `NbOfTxns` vs actual transactions; `CtrlSum` vs summed `InstdAmt` (tolerance 0.01).

## Notes & limits
- File size capped at 5 MB; depth capped at 50 to avoid UI hangs.
- History uses browser `localStorage` (cleared with the UI or browser data).
- Requires a modern browser (BigInt for IBAN checksum).

## Testing ideas
- Valid/invalid samples already included; add more PACS.008 variants under `SampleMessagesService`.
- Unit tests to extend: timezone offsets, uncommon currencies, checksum failures, CtrlSum mismatches.

## License
Private project (no license specified). Adjust before distribution.
